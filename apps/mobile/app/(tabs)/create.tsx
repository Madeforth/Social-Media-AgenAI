import { tokens } from '@apex/ui';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SparkIcon } from '@/components/icons';
import { Button, Card, EmptyState, ScreenTitle, SectionHeader } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { useBrandGuidelines } from '@/lib/data';

type Mode = 'ai_suggestion' | 'custom_brief';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { dictionary } = useI18n();
  const copy = dictionary.create;
  const [mode, setMode] = useState<Mode>('ai_suggestion');
  const guidelines = useBrandGuidelines();
  const pillars = guidelines.data?.content_pillars ?? [];
  const modes: Array<{ id: Mode; title: string; description: string }> = [
    {
      id: 'ai_suggestion',
      title: copy.aiSuggestionTitle,
      description: copy.aiSuggestionDescription,
    },
    {
      id: 'custom_brief',
      title: copy.customBriefTitle,
      description: copy.customBriefDescription,
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title={copy.title} subtitle={copy.subtitle} />

      <View style={styles.modes}>
        {modes.map((option) => {
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
        <SectionHeader title={copy.contentPillar} />
        <Card>
          {pillars.length > 0 ? (
            pillars.map((pillar, index) => (
              <View key={pillar.key} style={[styles.pillarRow, index > 0 && styles.rowDivider]}>
                <View style={styles.pillarBody}>
                  <Text style={styles.pillarName}>{pillar.name}</Text>
                  <Text style={styles.pillarDescription}>{pillar.description}</Text>
                </View>
                <Text style={styles.pillarShare}>{Math.round(pillar.target_share * 100)}%</Text>
              </View>
            ))
          ) : (
            <EmptyState title={copy.noPillarsTitle} description={copy.noPillarsDescription} />
          )}
        </Card>
        <Text style={styles.hint}>{copy.balanceHint}</Text>
      </View>

      <Button label={copy.generate} variant="primary" disabled />
      <Text style={styles.footnote}>{copy.disabledNotice}</Text>
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
