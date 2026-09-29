import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme';

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

interface WelcomeScreenProps {
  onOpenWorkspace: (path: string) => void;
  onCloneGit: (url: string) => void;
  onCreateWorkspace: (name: string) => void;
  onConnectSsh: (host: string) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

const KEYBOARD_LAYOUTS = ['QWERTY', 'AZERTY', 'QWERTZ', 'Dvorak', 'Colemak'];

export function WelcomeScreen(props: WelcomeScreenProps) {
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [gitUrl, setGitUrl] = useState('');
  const [layout, setLayout] = useState('QWERTY');

  useEffect(() => {
    AsyncStorage.getItem('recent_projects')
      .then((raw) => {
        if (raw) setRecent(JSON.parse(raw) as RecentProject[]);
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mobile IDE</Text>
      <Text style={styles.subtitle}>Touch-first development, anywhere.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.action}
          onPress={() => props.onCreateWorkspace('untitled')}
        >
          <Text style={styles.actionText}>New Workspace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => props.onCloneGit(gitUrl || '')}>
          <Text style={styles.actionText}>Clone from Git URL</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="https://github.com/user/repo.git"
          placeholderTextColor={colors.textMuted}
          value={gitUrl}
          onChangeText={setGitUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.action} onPress={() => props.onConnectSsh('')}>
          <Text style={styles.actionText}>Connect via SSH</Text>
        </TouchableOpacity>
      </View>

      {recent.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          {recent.map((project) => (
            <TouchableOpacity
              key={project.path}
              style={styles.action}
              onPress={() => props.onOpenWorkspace(project.path)}
            >
              <Text style={styles.actionText}>{project.name}</Text>
              <Text style={styles.actionSubtext}>{project.path}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keyboard Layout</Text>
        <View style={styles.layoutRow}>
          {KEYBOARD_LAYOUTS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.layoutChip, layout === option && styles.layoutChipActive]}
              onPress={() => setLayout(option)}
            >
              <Text
                style={[
                  styles.layoutChipText,
                  layout === option && styles.layoutChipTextActive
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footerLinks}>
        <TouchableOpacity style={styles.settingsLink} onPress={props.onOpenSettings}>
          <Text style={styles.settingsLinkText}>Settings (BYOK API keys, auth)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsLink} onPress={props.onOpenShortcuts}>
          <Text style={styles.settingsLinkText}>Keyboard Shortcuts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  title: { color: colors.textBright, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  action: {
    backgroundColor: colors.bgPanel,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  actionText: { color: colors.text, fontSize: 15 },
  actionSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm
  },
  layoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  layoutChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border
  },
  layoutChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  layoutChipText: { color: colors.text, fontSize: 13 },
  layoutChipTextActive: { color: colors.textBright },
  footerLinks: { marginTop: spacing.lg, gap: spacing.sm },
  settingsLink: { alignItems: 'center' },
  settingsLinkText: { color: colors.accent, fontSize: 14 }
});
