import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * GitDiffDecorator — renders green/red line decorations for streamed code
 * modifications and surfaces Accept/Reject popups for each hunk.
 */

export interface DiffHunk {
  id: string;
  line: number;
  type: 'add' | 'delete';
  content: string;
}

interface GitDiffDecoratorProps {
  hunks: DiffHunk[];
  onAccept: (hunkId: string) => void;
  onReject: (hunkId: string) => void;
}

export function GitDiffDecorator({ hunks, onAccept, onReject }: GitDiffDecoratorProps) {
  const [activeHunk, setActiveHunk] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {hunks.map((hunk) => (
        <TouchableOpacity
          key={hunk.id}
          style={[styles.hunk, hunk.type === 'add' ? styles.add : styles.delete]}
          onPress={() => setActiveHunk(activeHunk === hunk.id ? null : hunk.id)}
        >
          <Text style={styles.lineNumber}>{hunk.line}</Text>
          <Text style={styles.content} numberOfLines={1}>
            {hunk.content}
          </Text>

          {activeHunk === hunk.id && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(hunk.id)}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(hunk.id)}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.sm },
  hunk: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 6,
    marginBottom: spacing.xs
  },
  add: { backgroundColor: colors.diffAdd },
  delete: { backgroundColor: colors.diffDelete },
  lineNumber: { color: colors.textMuted, width: 32, fontSize: 12 },
  content: { color: colors.text, fontSize: 13, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  acceptBtn: { backgroundColor: colors.success, borderRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  acceptText: { color: colors.textBright, fontSize: 12, fontWeight: '600' },
  rejectBtn: { backgroundColor: colors.error, borderRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  rejectText: { color: colors.textBright, fontSize: 12, fontWeight: '600' }
});
