import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeBridge } from '../services/NativeBridge';
import { colors, spacing } from '../theme';

/**
 * SettingsScreen — dual-auth core layer.
 * Mode 1 (BYOK): explicit field for a personal OpenAI/Anthropic/DeepSeek key,
 * stored securely via Android Keystore.
 * Mode 2 (Managed Premium): OAuth login (GitHub/Google) synced to a gateway.
 */

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'deepseek'>('openai');
  const [saved, setSaved] = useState(false);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    await NativeBridge.storeSecret('USER_AI_KEY', apiKey.trim());
    setSaved(true);
    setApiKey('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Text style={styles.sectionTitle}>Mode 1 — BYOK (No Login)</Text>
      <Text style={styles.helper}>
        Your API key is encrypted with the Android Keystore and never leaves this device.
      </Text>

      <View style={styles.providerRow}>
        {(['openai', 'anthropic', 'deepseek'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.providerChip, provider === option && styles.providerChipActive]}
            onPress={() => setProvider(option)}
          >
            <Text
              style={[styles.providerText, provider === option && styles.providerTextActive]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="sk-…"
        placeholderTextColor={colors.textMuted}
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <TouchableOpacity style={styles.saveBtn} onPress={saveKey}>
        <Text style={styles.saveText}>Save Key</Text>
      </TouchableOpacity>
      {saved && <Text style={styles.savedText}>Key saved securely.</Text>}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Mode 2 — Managed Premium (Login Sync)</Text>
      <Text style={styles.helper}>
        Sign in to sync limits and premium cloud model routing via the gateway.
      </Text>
      <TouchableOpacity style={styles.oauthBtn}>
        <Text style={styles.oauthText}>Continue with GitHub</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.oauthBtn}>
        <Text style={styles.oauthText}>Continue with Google</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  back: { color: colors.accent, fontSize: 16 },
  title: { color: colors.textBright, fontSize: 20, fontWeight: '700' },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  helper: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  providerRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  providerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border
  },
  providerChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  providerText: { color: colors.text, fontSize: 13, textTransform: 'capitalize' },
  providerTextActive: { color: colors.textBright },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  saveText: { color: colors.textBright, fontWeight: '700' },
  savedText: { color: colors.success, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  oauthBtn: {
    backgroundColor: colors.bgPanel,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  oauthText: { color: colors.text, fontWeight: '600' }
});
