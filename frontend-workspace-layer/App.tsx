import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FileTreeExplorer } from './components/FileTreeExplorer';
import { EditorContainer } from './components/EditorContainer';
import { TerminalPanel } from './components/TerminalPanel';
import { CommandBar } from './components/CommandBar';
import { AiSidebar } from './components/AiSidebar';
import { SettingsScreen } from './components/SettingsScreen';
import { ShortcutsScreen } from './components/ShortcutsScreen';
import { GitDiffDecorator, DiffHunk } from './components/GitDiffDecorator';
import { PromptContext } from './services/AiAgentEngine';
import { NativeFileSystem } from './services/FileSystemBridge';
import { colors, spacing } from './theme';

type Screen = 'welcome' | 'workspace' | 'settings' | 'shortcuts';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [workspacePath, setWorkspacePath] = useState<string>('');
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [showAi, setShowAi] = useState(false);
  const [hunks, setHunks] = useState<DiffHunk[]>([]);

  const openWorkspace = (path: string) => {
    setWorkspacePath(path);
    setScreen('workspace');
  };

  const openFile = async (path: string) => {
    const content = await NativeFileSystem.readFile(path);
    setActiveFilePath(path);
    setFileContent(content);
  };

  const aiContext: PromptContext = {
    activeFilePath,
    cursorLineOffset: 0,
    selectedText: '',
    surroundingWorkspaceFilesTree: []
  };

  const applyPatch = (text: string) => {
    setFileContent((prev) => prev + '\n' + text);
    setHunks((prev) => [
      ...prev,
      { id: `hunk-${Date.now()}`, line: 1, type: 'add', content: text.slice(0, 80) }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {screen === 'welcome' && (
        <WelcomeScreen
          onOpenWorkspace={openWorkspace}
          onCloneGit={() => openWorkspace('/storage/emulated/0/projects')}
          onCreateWorkspace={() => openWorkspace('/storage/emulated/0/projects/untitled')}
          onConnectSsh={() => openWorkspace('/storage/emulated/0/projects')}
          onOpenSettings={() => setScreen('settings')}
          onOpenShortcuts={() => setScreen('shortcuts')}
        />
      )}

      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('welcome')} />}

      {screen === 'shortcuts' && <ShortcutsScreen onBack={() => setScreen('welcome')} />}

      {screen === 'workspace' && (
        <View style={styles.workspace}>
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {workspacePath.split('/').pop() || 'Workspace'}
            </Text>
            <View style={styles.topBarActions}>
              <TouchableOpacity style={styles.topBarBtn} onPress={() => setScreen('shortcuts')}>
                <Text style={styles.topBarBtnText}>Shortcuts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBarBtn} onPress={() => setShowAi((prev) => !prev)}>
                <Text style={styles.topBarBtnText}>Copilot</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainRow}>
            <View style={styles.sidebar}>
              <FileTreeExplorer rootPath={workspacePath} onOpenFile={openFile} />
            </View>
            <View style={styles.editorArea}>
              <EditorContainer
                filePath={activeFilePath || 'untitled'}
                initialContent={fileContent}
                onContentChange={setFileContent}
              />
              {hunks.length > 0 && (
                <GitDiffDecorator
                  hunks={hunks}
                  onAccept={(id) => setHunks((prev) => prev.filter((h) => h.id !== id))}
                  onReject={(id) => setHunks((prev) => prev.filter((h) => h.id !== id))}
                />
              )}
              <View style={styles.terminal}>
                <TerminalPanel workspacePath={workspacePath} onCommandOutput={() => {}} />
              </View>
            </View>
          </View>

          <CommandBar
            onInsert={(text) => setFileContent((prev) => prev + text)}
            onTab={() => setFileContent((prev) => prev + '  ')}
            onUndo={() => {}}
            onRedo={() => {}}
            onAiTrigger={() => setShowAi((prev) => !prev)}
          />
        </View>
      )}

      {showAi && (
        <View style={styles.aiOverlay}>
          <AiSidebar
            context={aiContext}
            workspacePath={workspacePath}
            onApplyPatch={applyPatch}
            onClose={() => setShowAi(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  workspace: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgActivity,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  topBarTitle: { color: colors.textBright, fontSize: 14, fontWeight: '600', flex: 1 },
  topBarActions: { flexDirection: 'row', gap: spacing.sm },
  topBarBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.bgInput
  },
  topBarBtnText: { color: colors.text, fontSize: 12 },
  mainRow: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 160, borderRightWidth: 1, borderRightColor: colors.border },
  editorArea: { flex: 1 },
  terminal: { height: 180, borderTopWidth: 1, borderTopColor: colors.border },
  aiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgSidebar
  }
});
