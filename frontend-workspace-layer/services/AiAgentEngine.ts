import { NativeBridge } from './NativeBridge';

/**
 * AiAgentEngine — intelligent multi-file context aggregator for inline
 * streaming mutations (Cursor Ctrl+K style) and full multi-turn Copilot-style
 * chat. BYOK: the API key is read from the Android Keystore at call time and
 * never stored in JS memory.
 */

export interface PromptContext {
  activeFilePath: string;
  cursorLineOffset: number;
  selectedText: string;
  surroundingWorkspaceFilesTree: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProviderConfig {
  baseUrl: string;
  model: string;
  label: string;
}

export type ProviderKey = 'openai' | 'anthropic' | 'deepseek';

export const PROVIDERS: Record<ProviderKey, AiProviderConfig> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', label: 'OpenAI' },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    label: 'Claude'
  },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', label: 'DeepSeek' }
};

export type StreamChunk =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export class AgenticCodeStreamer {
  private provider: AiProviderConfig;

  constructor(providerKey: ProviderKey = 'openai', customBaseUrl?: string) {
    const base = PROVIDERS[providerKey] ?? PROVIDERS.openai;
    this.provider = {
      ...base,
      baseUrl: customBaseUrl || base.baseUrl
    };
  }

  private assemblePrompt(context: PromptContext, userInstruction: string): string {
    return [
      'You are an elite coding agent.',
      `Active File: ${context.activeFilePath}`,
      `Line Offset: ${context.cursorLineOffset}`,
      `Workspace Structure: ${JSON.stringify(context.surroundingWorkspaceFilesTree)}`,
      `Selected Target Block: ${context.selectedText}`,
      '',
      `Instruction: ${userInstruction}`,
      'Output only raw updated code modifications inside exact markers. Do not add conversational text.'
    ].join('\n');
  }

  /** Shared streaming request. Reads the BYOK key and streams SSE deltas. */
  private async streamRequest(
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const dynamicApiKey = await NativeBridge.getSecret('USER_AI_KEY');
    if (!dynamicApiKey) {
      onChunk({ type: 'error', message: 'No API key configured. Add one in Settings (BYOK).' });
      return;
    }

    try {
      const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dynamicApiKey}`
        },
        body: JSON.stringify({
          model: this.provider.model,
          messages,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        onChunk({ type: 'error', message: `Request failed: ${response.status}` });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            onChunk({ type: 'done' });
            return;
          }
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) onChunk({ type: 'delta', text: delta });
          } catch {
            // Ignore malformed keep-alive lines.
          }
        }
      }

      onChunk({ type: 'done' });
    } catch (error) {
      onChunk({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }

  /** Inline generation (Ctrl+K style) — single-turn, patch-oriented. */
  public async streamInlineGeneration(
    context: PromptContext,
    userInstruction: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const messages: ChatMessage[] = [
      { role: 'user', content: this.assemblePrompt(context, userInstruction) }
    ];
    return this.streamRequest(messages, onChunk);
  }

  /** Multi-turn Copilot-style chat. */
  public async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    return this.streamRequest(messages, onChunk);
  }

  /** Non-streaming convenience wrapper used by the AI error-telemetry fixer. */
  public async fixCompileError(
    context: PromptContext,
    errorOutput: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const instruction = `The following command failed with this error. Produce a minimal code patch to fix it:\n\n${errorOutput}`;
    return this.streamInlineGeneration(context, instruction, onChunk);
  }
}

/** Extract fenced code blocks from an assistant response for diff preview. */
export function extractCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const regex = /```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}
