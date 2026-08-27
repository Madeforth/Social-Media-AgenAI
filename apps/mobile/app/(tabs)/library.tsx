import { MOCK_NOW, MOCK_POSTS } from '@apex/mocks';
import { tokens } from '@apex/ui';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreativePreview } from '@/components/creative-preview';
import { StatusChip } from '@/components/status-chip';
import { Card, ScreenTitle } from '@/components/ui';
import { formatRelative } from '@/lib/format';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title="Library" subtitle={`${MOCK_POSTS.length} posts for this brand.`} />

      <View style={styles.grid}>
        {MOCK_POSTS.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} asChild>
            <Pressable style={styles.cell}>
              <Card>
                <View style={styles.preview}>
                  <CreativePreview post={post} compact />
                </View>
                <View style={styles.body}>
                  <Text style={styles.headline} numberOfLines={2}>
                    {post.version.headline || post.concept_title}
                  </Text>
                  <StatusChip status={post.status} />
                  <Text style={styles.meta}>{formatRelative(post.created_at, MOCK_NOW)}</Text>
                </View>
              </Card>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  cell: { width: '48.5%' },
  preview: { height: 150 },
  body: { padding: tokens.space.sm, gap: 6 },
  headline: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm, lineHeight: 18 },
  meta: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
});
