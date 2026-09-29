import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { TerminalSessionManager } from '../services/TerminalSessionManager';
import { colors } from '../theme';

/**
 * TerminalPanel — xterm.js instance hosted in a WebView, bridged to the native
 * PTY stream loop via TerminalSessionManager.
 */

interface TerminalPanelProps {
  workspacePath: string;
  onCommandOutput: (output: string) => void;
}

const TERMINAL_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://esm.sh/xterm@5.3.0/css/xterm.css">
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #1e1e1e; }
  #terminal { height: 100%; padding: 8px; }
</style>
</head>
<body>
<div id="terminal"></div>
<script src="https://esm.sh/xterm@5.3.0"></script>
<script>
  const term = new Terminal({ theme: { background: '#1e1e1e', foreground: '#cccccc', cursor: '#ffffff' }, cursorBlink: true, fontSize: 13 });
  term.open(document.getElementById('terminal'));

  term.onData((data) => {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'input', data }));
  });

  window.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'output') term.write(msg.data);
  });
</script>
</body>
</html>`;

export function TerminalPanel({ workspacePath, onCommandOutput }: TerminalPanelProps) {
  const webViewRef = useRef<WebView>(null);
  const sessionRef = useRef<TerminalSessionManager | null>(null);

  useEffect(() => {
    const session = new TerminalSessionManager();
    sessionRef.current = session;

    session.onData((data) => {
      webViewRef.current?.injectJavaScript(
        `window.postMessage(${JSON.stringify(JSON.stringify({ type: 'output', data }))}, '*'); true;`
      );
      onCommandOutput(data);
    });

    session.initializeActiveSession(workspacePath);

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [workspacePath]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'input') {
        sessionRef.current?.write(data.data);
      }
    } catch {
      // Ignore.
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: TERMINAL_HTML }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  webview: { flex: 1 }
});
