import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * CommandBar — the touch accessory deck rendered above the virtual keyboard.
 * Single-tap insertion of brackets, special characters, Tab, undo/redo, and a
 * direct AI sidebar trigger.
 */

interface CommandBarProps {
  onInsert: (text: string) => void;
  onTab: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAiTrigger: () => void;
}

const SYMBOLS = ['{', '}', '(', ')', '[', ']', ';', '/', '\\', '<', '>', '_', '=', '"', "'", '`'];

export function CommandBar({ onInsert, onTab, onUndo, onRedo, onAiTrigger }: CommandBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SYMBOLS.map((symbol) => (
          <TouchableOpacity key={symbol} style={styles.key} onPress={() => onInsert(symbol)}>
            <Text style={styles.keyText}>{symbol}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.key, styles.actionKey]} onPress={onTab}>
          <Text style={styles.keyText}>Tab</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.key, styles.actionKey]} onPress={onUndo}>
          <Text style={styles.keyText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.key, styles.actionKey]} onPress={onRedo}>
          <Text style={styles.keyText}>Redo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.key, styles.aiKey]} onPress={onAiTrigger}>
          <Text style={styles.aiKeyText}>AI</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm
  },
  row: { paddingHorizontal: spacing.sm, gap: spacing.xs, alignItems: 'center' },
  key: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: { color: colors.text, fontSize: 15 },
  actionKey: { backgroundColor: colors.bgActivity },
  aiKey: { backgroundColor: colors.ai },
  aiKeyText: { color: colors.textBright, fontSize: 13, fontWeight: '700' }
});
