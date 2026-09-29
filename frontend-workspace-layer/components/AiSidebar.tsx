import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AgenticCodeStreamer,
  PromptContext,
  StreamChunk,
  ChatMessage,
  ProviderKey,
  PROVIDERS,
  extractCodeBlocks
} from '../services/AiAgentEngine';
import { colors, spacing } from '../theme';

/**
 * AiSidebar — full-page Copilot-style chat panel (mirrors the VS Code Copilot
 * Chat experience): model selector, new-chat, suggested prompts, streaming
 * responses, code-diff preview with Apply/Discard, and persistent history.
 */

interface AiSidebarProps {
  context: PromptContext;
  workspacePath: string;
  onApplyPatch: (text: string) => void;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'Explain this file',
  'Fix errors in this code',
  'Write unit tests',
  'Refactor this function',
  'Add error handling',
  'Optimize performance'
];

export function AiSidebar({ context, workspacePath, onApplyPatch, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [provider, setProvider] = useState<ProviderKey>('openai');
  const [pendingPatch, setPendingPatch] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const historyKey = `ai_history_${workspacePath}`;

  useEffect(() => {
    AsyncStorage.getItem(historyKey)
      .then((raw) => {
        if (raw) setMessages(JSON.parse(raw) as Message[]);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [historyKey]);

  useEffect(() => {
    if (historyLoaded && messages.length > 0) {
      AsyncStorage.setItem(historyKey, JSON.stringify(messages)).catch(() => {});
    }
  }, [messages, historyKey, historyLoaded]);

  const clearChat = () => {
    setMessages([]);
    setPendingPatch(null);
    AsyncStorage.removeItem(historyKey).catch(() => {});
  };

  const send = async (override?: string) => {
    const instruction = (override ?? input).trim();
    if (!instruction || streaming) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: instruction }];
    setMessages(nextMessages);
    setInput('');
    setPendingPatch(null);
    setStreaming(true);

    const chatHistory: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a coding assistant embedded in a mobile IDE. Active file: ${context.activeFilePath}. Provide concise, actionable help. When you propose code changes, wrap them in fenced code blocks.`
      },
      ...nextMessages.map((m) => ({ role: m.role, content: m.content }))
    ];

    const streamer = new AgenticCodeStreamer(provider);
    let assistantText = '';

    await streamer.streamChat(chatHistory, (chunk: StreamChunk) => {
      if (chunk.type === 'delta') {
        assistantText += chunk.text;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: assistantText };
          return next;
        });
      } else if (chunk.type === 'done') {
        const blocks = extractCodeBlocks(assistantText);
        if (blocks.length > 0) setPendingPatch(blocks.join('\n\n'));
        setStreaming(false);
      } else if (chunk.type === 'error') {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: `Error: ${chunk.message}` };
          return next;
        });
        setStreaming(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AI</Text>
          </View>
          <Text style={styles.title}>Copilot</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={clearChat}>
            <Text style={styles.headerBtnText}>New chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Text style={styles.headerBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Model selector */}
      <View style={styles.modelRow}>
        {(Object.keys(PROVIDERS) as ProviderKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.modelChip, provider === key && styles.modelChipActive]}
            onPress={() => setProvider(key)}
          >
            <Text style={[styles.modelText, provider === key && styles.modelTextActive]}>
              {PROVIDERS[key].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && !streaming && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>How can I help you code today?</Text>
            <Text style={styles.welcomeSub}>
              Ask questions, get explanations, or request code changes. Responses stream inline.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.suggestionChip}
                  onPress={() => send(prompt)}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={styles.bubbleText}>{message.content || '…'}</Text>
          </View>
        ))}

        {streaming && (
          <View style={styles.streamingRow}>
            <ActivityIndicator size="small" color={colors.ai} />
            <Text style={styles.streamingText}>Generating…</Text>
          </View>
        )}

        {pendingPatch && !streaming && (
          <View style={styles.patchCard}>
            <Text style={styles.patchTitle}>Proposed change</Text>
            <View style={styles.patchBody}>
              <Text style={styles.patchCode} numberOfLines={12}>
                {pendingPatch}
              </Text>
            </View>
            <View style={styles.patchActions}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  onApplyPatch(pendingPatch);
                  setPendingPatch(null);
                }}
              >
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={() => setPendingPatch(null)}>
                <Text style={styles.discardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask Copilot or type / for commands…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, streaming && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={streaming}
        >
          <Text style={styles.sendText}>{streaming ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSidebar },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.ai,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: { color: colors.textBright, fontSize: 11, fontWeight: '800' },
  title: { color: colors.textBright, fontSize: 16, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.bgInput
  },
  headerBtnText: { color: colors.text, fontSize: 13 },
  modelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modelChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border
  },
  modelChipActive: { backgroundColor: colors.ai, borderColor: colors.ai },
  modelText: { color: colors.text, fontSize: 13 },
  modelTextActive: { color: colors.textBright, fontWeight: '600' },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.md },
  welcome: { paddingVertical: spacing.xl },
  welcomeTitle: { color: colors.textBright, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  welcomeSub: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg, lineHeight: 20 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border
  },
  suggestionText: { color: colors.text, fontSize: 13 },
  bubble: { borderRadius: 10, padding: spacing.md, maxWidth: '88%' },
  userBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: colors.bgInput, alignSelf: 'flex-start' },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  streamingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streamingText: { color: colors.textMuted, fontSize: 13 },
  patchCard: {
    borderWidth: 1,
    borderColor: colors.ai,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.bgPanel
  },
  patchTitle: {
    color: colors.textBright,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  patchBody: { padding: spacing.md, backgroundColor: colors.bg },
  patchCode: { color: colors.text, fontSize: 12, fontFamily: 'monospace' },
  patchActions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  applyBtn: {
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  applyText: { color: colors.textBright, fontWeight: '700', fontSize: 13 },
  discardBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  discardText: { color: colors.text, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    minHeight: 44,
    maxHeight: 140
  },
  sendBtn: {
    backgroundColor: colors.ai,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center'
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: colors.textBright, fontWeight: '700' }
});
