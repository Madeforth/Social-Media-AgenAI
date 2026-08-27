import { MOCK_POSTS, type MockPost } from '@apex/mocks';
import { POST_STATUS_PRESENTATION, tokens } from '@apex/ui';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusChip } from '@/components/status-chip';
import { Card, EmptyState, ScreenTitle } from '@/components/ui';
import { formatDayMonth, formatTime, formatWeekday } from '@/lib/format';

/** Mobile shows a compact agenda rather than a month grid — a 7×6 grid of tap
 *  targets does not survive a phone width at a usable size. */
function agendaPosts(): MockPost[] {
  return MOCK_POSTS.filter((post) => post.scheduled_at ?? post.published_at).sort((a, b) =>
    (a.scheduled_at ?? a.published_at ?? '').localeCompare(b.scheduled_at ?? b.published_at ?? ''),
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const posts = agendaPosts();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title="Calendar" subtitle="Scheduled and published content." />

      {posts.length > 0 ? (
        <Card>
          {posts.map((post, index) => {
            const at = post.scheduled_at ?? post.published_at ?? '';
            const { tint } = POST_STATUS_PRESENTATION[post.status];
            return (
              <Link key={post.id} href={`/posts/${post.id}`} asChild>
                <Pressable style={StyleSheet.flatten([styles.row, index > 0 && styles.rowDivider])}>
                  <View style={[styles.rail, { backgroundColor: tint }]} />
                  <View style={styles.body}>
                    <Text style={styles.date}>
                      {formatWeekday(at)} {formatDayMonth(at)} · {formatTime(at)}
                    </Text>
                    <Text style={styles.headline} numberOfLines={2}>
                      {post.version.headline || post.concept_title}
                    </Text>
                    <StatusChip status={post.status} />
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="Nothing on the calendar"
            description="Approved posts appear here once they have a publish time."
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md },
  row: { flexDirection: 'row', gap: tokens.space.md, padding: tokens.space.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.color.border },
  rail: { width: 3, borderRadius: 2 },
  body: { flex: 1, gap: 6 },
  date: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  headline: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.base },
});
