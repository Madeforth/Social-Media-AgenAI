import { tokens } from '@apex/ui';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreativePreview } from '@/components/creative-preview';
import { StatusChip } from '@/components/status-chip';
import { Card, EmptyState, ScreenTitle } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { usePosts } from '@/lib/data';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { dictionary } = useI18n();
  const copy = dictionary.library;
  const { data: posts } = usePosts();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title={copy.title} subtitle={copy.postCount(posts.length)} />

      {posts.length === 0 ? (
        <Card>
          <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
        </Card>
      ) : null}

      <View style={styles.grid}>
        {posts.map((post) => (
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
});
