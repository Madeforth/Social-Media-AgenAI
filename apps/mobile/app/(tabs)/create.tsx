import { MOCK_BRAND_GUIDELINES } from '@apex/mocks';
import { tokens } from '@apex/ui';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SparkIcon } from '@/components/icons';
import { Button, Card, ScreenTitle, SectionHeader } from '@/components/ui';

type Mode = 'ai_suggestion' | 'custom_brief';

const MODES: Array<{ id: Mode; title: string; description: string }> = [
  {
    id: 'ai_suggestion',
    title: 'AI suggestion',
    description: 'Let the AI decide what the brand should say next.',
  },
  {
    id: 'custom_brief',
    title: 'Custom brief',
    description: 'Describe the idea in your own words.',
  },
];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('ai_suggestion');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle
        title="What do you want to create?"
        subtitle="Choose an option to get started."
      />

      <View style={styles.modes}>
        {MODES.map((option) => {
          const active = option.id === mode;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(option.id)}
              style={[styles.mode, active && styles.modeActive]}
            >
              <SparkIcon
                color={active ? tokens.color.accent : tokens.color.textSecondary}
                size={18}
              />
              <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                {option.title}
              </Text>
              <Text style={styles.modeDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Content pillar" />
        <Card>
          {MOCK_BRAND_GUIDELINES.content_pillars.map((pillar, index) => (
            <View key={pillar.key} style={[styles.pillarRow, index > 0 && styles.rowDivider]}>
              <View style={styles.pillarBody}>
                <Text style={styles.pillarName}>{pillar.name}</Text>
                <Text style={styles.pillarDescription}>{pillar.description}</Text>
              </View>
              <Text style={styles.pillarShare}>{Math.round(pillar.target_share * 100)}%</Text>
            </View>
          ))}
        </Card>
        <Text style={styles.hint}>
          Leave everything unset and the AI picks the pillar from the recent balance.
        </Text>
      </View>

      <Button label="Generate content" variant="primary" disabled />
      <Text style={styles.footnote}>
        Generation is wired up in a later milestone, once the Gemini Edge Function exists.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md, gap: tokens.space.lg },
  modes: { flexDirection: 'row', gap: tokens.space.sm },
  mode: {
    flex: 1,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    gap: 6,
  },
  modeActive: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  modeTitle: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  modeTitleActive: { color: tokens.color.accent },
  modeDescription: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.xs,
    lineHeight: 17,
  },
  section: { gap: tokens.space.sm },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.color.border },
  pillarBody: { flex: 1, gap: 2 },
  pillarName: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm },
  pillarDescription: { color: tokens.color.textSecondary, fontSize: tokens.fontSize.xs },
  pillarShare: { color: tokens.color.accent, fontSize: tokens.fontSize.xs },
  hint: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs, lineHeight: 17 },
  footnote: {
    color: tokens.color.textMuted,
    fontSize: tokens.fontSize.xs,
    textAlign: 'center',
    lineHeight: 17,
  },
});
