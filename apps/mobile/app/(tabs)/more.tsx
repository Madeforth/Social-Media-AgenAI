import { MOCK_BRAND, MOCK_BRAND_ASSETS, MOCK_BRAND_GUIDELINES } from '@apex/mocks';
import { tokens } from '@apex/ui';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronRightIcon } from '@/components/icons';
import { Card, ScreenTitle, SectionHeader } from '@/components/ui';

interface Entry {
  title: string;
  detail: string;
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();

  const brandBrain: Entry[] = [
    {
      title: 'Brand Brain',
      detail: `${MOCK_BRAND_GUIDELINES.content_pillars.length} content pillars defined`,
    },
    { title: 'Assets', detail: `${MOCK_BRAND_ASSETS.length} assets` },
  ];

  const settings: Entry[] = [
    { title: 'Instagram', detail: 'Not connected' },
    { title: 'Notifications', detail: 'Not configured' },
    { title: 'Account', detail: MOCK_BRAND.name },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title="More" />

      <View style={styles.section}>
        <SectionHeader title="Brand" />
        <Card>
          {brandBrain.map((entry, index) => (
            <Row key={entry.title} entry={entry} divided={index > 0} />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Settings" />
        <Card>
          {settings.map((entry, index) => (
            <Row key={entry.title} entry={entry} divided={index > 0} />
          ))}
        </Card>
      </View>

      <Text style={styles.note}>
        These screens are navigation placeholders. They are wired to Supabase in a later milestone.
      </Text>
    </ScrollView>
  );
}

function Row({ entry, divided }: { entry: Entry; divided: boolean }) {
  return (
    <View style={[styles.row, divided && styles.rowDivider]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{entry.title}</Text>
        <Text style={styles.rowDetail}>{entry.detail}</Text>
      </View>
      <ChevronRightIcon color={tokens.color.textMuted} size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md, gap: tokens.space.lg },
  section: { gap: tokens.space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.color.border },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.base },
  rowDetail: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  note: {
    color: tokens.color.textMuted,
    fontSize: tokens.fontSize.xs,
    lineHeight: 17,
    textAlign: 'center',
  },
});
