import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * ShortcutsScreen — reference for keyboard shortcuts and touch gestures.
 * Mirrors the VS Code keybinding surface adapted for a touch-first device.
 */

interface ShortcutsScreenProps {
  onBack: () => void;
}

interface Shortcut {
  keys: string;
  action: string;
}

const EDITOR_SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl + S', action: 'Save file' },
  { keys: 'Ctrl + K', action: 'AI inline edit (Cursor style)' },
  { keys: 'Ctrl + Shift + P', action: 'Command palette' },
  { keys: 'Ctrl + `', action: 'Toggle terminal' },
  { keys: 'Ctrl + B', action: 'Toggle file explorer' },
  { keys: 'Ctrl + /', action: 'Toggle line comment' },
  { keys: 'Ctrl + Z / Ctrl + Y', action: 'Undo / Redo' },
  { keys: 'Ctrl + F', action: 'Find in file' },
  { keys: 'Ctrl + Shift + F', action: 'Find in workspace' },
  { keys: 'Alt + ↑ / ↓', action: 'Move line up / down' },
  { keys: 'Ctrl + D', action: 'Select next occurrence' }
];

const TERMINAL_SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl + C', action: 'Interrupt running command' },
  { keys: 'Ctrl + L', action: 'Clear terminal' },
  { keys: 'Tab', action: 'Autocomplete' },
  { keys: '↑ / ↓', action: 'Command history' }
];

const TOUCH_GESTURES: Shortcut[] = [
  { keys: 'Swipe from left edge', action: 'Open file explorer' },
  { keys: 'Swipe from right edge', action: 'Open AI Copilot' },
  { keys: 'Long-press symbol', action: 'Insert special character' },
  { keys: 'Pinch', action: 'Zoom editor font' },
  { keys: 'Double-tap line', action: 'Select word' }
];

export function ShortcutsScreen({ onBack }: ShortcutsScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Keyboard Shortcuts</Text>
      </View>

      <Section title="Editor" items={EDITOR_SHORTCUTS} />
      <Section title="Terminal" items={TERMINAL_SHORTCUTS} />
      <Section title="Touch Gestures" items={TOUCH_GESTURES} />
    </ScrollView>
  );
}

function Section({ title, items }: { title: string; items: Shortcut[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.keys + item.action} style={styles.row}>
          <Text style={styles.keys}>{item.keys}</Text>
          <Text style={styles.action}>{item.action}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl
  },
  back: { color: colors.accent, fontSize: 16 },
  title: { color: colors.textBright, fontSize: 20, fontWeight: '700' },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  keys: {
    color: colors.textBright,
    fontSize: 13,
    fontFamily: 'monospace',
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden'
  },
  action: { color: colors.text, fontSize: 14, flex: 1, textAlign: 'right', marginLeft: spacing.md }
});
