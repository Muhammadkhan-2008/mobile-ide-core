import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../theme';

/**
 * EditorContainer — CodeMirror 6 context layer hosted in a WebView (the
 * "web-hybrid" path from the spec, since Monaco/CodeMirror do not run natively
 * in React Native). Exposes a postMessage bridge for content, git-diff
 * decorations, and AI streaming patches.
 */

interface EditorContainerProps {
  filePath: string;
  initialContent: string;
  onContentChange: (content: string) => void;
}

const EDITOR_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #1e1e1e; }
  .cm-editor { height: 100%; font-size: 14px; }
  .cm-gutters { background: #1e1e1e; color: #858585; }
  .cm-activeLine { background: rgba(255,255,255,0.04); }
  .diff-add { background: rgba(35,134,54,0.35); }
  .diff-del { background: rgba(248,81,73,0.35); }
</style>
</head>
<body>
<script src="https://esm.sh/codemirror@6.0.1"></script>
<script src="https://esm.sh/@codemirror/state@6.4.1"></script>
<script src="https://esm.sh/@codemirror/view@6.26.3"></script>
<script src="https://esm.sh/@codemirror/language@6.10.2"></script>
<script src="https://esm.sh/@codemirror/commands@6.6.0"></script>
<script src="https://esm.sh/@codemirror/lang-javascript@6.2.2"></script>
<script src="https://esm.sh/@codemirror/lang-python@6.1.6"></script>
<script src="https://esm.sh/@codemirror/lang-cpp@6.0.2"></script>
<script src="https://esm.sh/@codemirror/lang-html@6.4.9"></script>
<script src="https://esm.sh/@codemirror/lang-css@6.2.1"></script>
<script src="https://esm.sh/@codemirror/lang-json@6.0.1"></script>
<script src="https://esm.sh/@codemirror/lang-markdown@6.2.5"></script>
<script type="module">
  import { EditorView, basicSetup } from 'https://esm.sh/codemirror@6.0.1';
  import { EditorState } from 'https://esm.sh/@codemirror/state@6.4.1';
  import { javascript } from 'https://esm.sh/@codemirror/lang-javascript@6.2.2';
  import { python } from 'https://esm.sh/@codemirror/lang-python@6.1.6';
  import { cpp } from 'https://esm.sh/@codemirror/lang-cpp@6.0.2';
  import { html } from 'https://esm.sh/@codemirror/lang-html@6.4.9';
  import { css } from 'https://esm.sh/@codemirror/lang-css@6.2.1';
  import { json } from 'https://esm.sh/@codemirror/lang-json@6.0.1';
  import { markdown } from 'https://esm.sh/@codemirror/lang-markdown@6.2.5';
  import { Decoration, ViewPlugin } from 'https://esm.sh/@codemirror/view@6.26.3';

  function languageFor(path) {
    const ext = (path.split('.').pop() || '').toLowerCase();
    if (['js','jsx','ts','tsx','mjs','cjs'].includes(ext)) return javascript({ jsx: true, typescript: ext.startsWith('ts') });
    if (ext === 'py') return python();
    if (['c','cpp','h','hpp','cc'].includes(ext)) return cpp();
    if (['html','htm'].includes(ext)) return html();
    if (ext === 'css') return css();
    if (ext === 'json') return json();
    if (['md','markdown'].includes(ext)) return markdown();
    return [];
  }

  let view = null;
  let currentPath = '';

  function setContent(path, content) {
    currentPath = path;
    const state = EditorState.create({ doc: content, extensions: [basicSetup, languageFor(path)] });
    if (view) view.destroy();
    view = new EditorView({ state, parent: document.body });
  }

  // Git-diff decorations: apply green/red line backgrounds.
  function applyDiff(decorations) {
    if (!view) return;
    const marks = decorations.map(d => {
      const line = view.state.doc.line(d.line);
      const cls = d.type === 'add' ? 'diff-add' : 'diff-del';
      return Decoration.line({ class: cls }).range(line.from);
    });
    // Rebuild state with a diff decoration extension (simplified: full re-set).
    const state = view.state;
    const diffExt = ViewPlugin.fromClass(class {}, { decorations: v => Decoration.set(marks) });
    view.setState(EditorState.create({ doc: state.doc, extensions: [basicSetup, languageFor(currentPath), diffExt] }));
  }

  // AI streaming: insert text at the cursor.
  function insertText(text) {
    if (!view) return;
    view.dispatch({ changes: { from: view.state.selection.main.head, insert: text } });
    view.focus();
  }

  window.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'setContent') setContent(msg.path, msg.content);
    else if (msg.type === 'applyDiff') applyDiff(msg.decorations);
    else if (msg.type === 'insertText') insertText(msg.text);
  });

  // Report content changes back to React Native.
  window.reportContent = () => {
    if (!view) return '';
    return view.state.doc.toString();
  };
</script>
</body>
</html>`;

export function EditorContainer({ filePath, initialContent, onContentChange }: EditorContainerProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const postMessage = (payload: object) => {
    webViewRef.current?.injectJavaScript(
      `window.postMessage(${JSON.stringify(JSON.stringify(payload))}, '*'); true;`
    );
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentChange') onContentChange(data.content);
    } catch {
      // Ignore non-JSON messages.
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator style={styles.loader} color={colors.accent} />}
      <WebView
        ref={webViewRef}
        source={{ html: EDITOR_HTML }}
        originWhitelist={['*']}
        onLoadEnd={() => {
          setLoading(false);
          postMessage({ type: 'setContent', path: filePath, content: initialContent });
        }}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' }
});
