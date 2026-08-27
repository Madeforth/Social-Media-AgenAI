import { tokens } from '@apex/ui';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreativePreview } from '@/components/creative-preview';
import { ApexMarkIcon, ChevronRightIcon, ClockIcon } from '@/components/icons';
import { StatusChip } from '@/components/status-chip';
import { Button, Card, EmptyState, SectionHeader } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { approvalQueue, summarise, upcoming, useCurrentBrand, usePosts } from '@/lib/data';
import { formatDayOfMonth, formatTime, formatWeekday } from '@/lib/format';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { locale, dictionary } = useI18n();
  const copy = dictionary.home;
  const brand = useCurrentBrand();
  const posts = usePosts();

  const summary = summarise(posts.data);
  const approvals = approvalQueue(posts.data);
  const scheduled = upcoming(posts.data);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <ApexMarkIcon color={tokens.color.accent} size={20} />
          <Text style={styles.brandName}>{brand.data?.name ?? 'Apex Social AI'}</Text>
        </View>
      </View>

      {posts.loading ? (
        <Card>
          <Text style={styles.stateText}>{copy.loading}</Text>
        </Card>
      ) : posts.error ? (
        <Card>
          <EmptyState title={copy.loadErrorTitle} description={copy.loadErrorDescription} />
        </Card>
      ) : (
        <>
          <Card style={styles.weekCard}>
            <Text style={styles.weekLabel}>{copy.thisWeek}</Text>
            <View style={styles.weekRow}>
              <Text style={styles.weekValue}>{summary.plannedThisWeek}</Text>
              <Text style={styles.weekUnit}>{copy.postsPlanned(summary.plannedThisWeek)}</Text>
            </View>
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>{summary.readyToApprove}</Text>
                <Text style={styles.weekStatLabel}>{copy.ready}</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>{summary.scheduled}</Text>
                <Text style={styles.weekStatLabel}>{copy.scheduled}</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStat}>
                <Text style={styles.weekStatValue}>{summary.publishedThisMonth}</Text>
                <Text style={styles.weekStatLabel}>{copy.published}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <SectionHeader title={copy.readyForApproval(approvals.length)} />
            {approvals.length > 0 ? (
              approvals.map((post) => (
                <Card key={post.id} style={styles.approvalCard}>
                  <View style={styles.approvalPreview}>
                    <CreativePreview post={post} />
                  </View>
                  <View style={styles.approvalBody}>
                    <Text style={styles.approvalPillar}>{post.content_pillar}</Text>
                    <Text style={styles.approvalHeadline}>{post.version.headline}</Text>
                    <View style={styles.approvalActions}>
                      <Link href={`/posts/${post.id}`} asChild>
                        <Button label={copy.review} variant="primary" style={styles.flexButton} />
                      </Link>
                      <Link href={`/posts/${post.id}`} asChild>
                        <Button label={copy.edit} style={styles.flexButton} />
                      </Link>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card>
                <EmptyState
                  title={copy.approvalEmptyTitle}
                  description={copy.approvalEmptyDescription}
                />
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={copy.upcoming}
              action={
                <Link href="/calendar" asChild>
                  <Pressable style={styles.linkRow}>
                    <Text style={styles.linkText}>{copy.viewCalendar}</Text>
                    <ChevronRightIcon color={tokens.color.textSecondary} size={14} />
                  </Pressable>
                </Link>
              }
            />
            <Card>
              {scheduled.length > 0 ? (
                scheduled.map((post, index) => (
                  <Link key={post.id} href={`/posts/${post.id}`} asChild>
                    <Pressable
                      style={StyleSheet.flatten([
                        styles.upcomingRow,
                        index > 0 && styles.rowDivider,
                      ])}
                    >
                      <View style={styles.upcomingDate}>
                        <Text style={styles.upcomingWeekday}>
                          {post.scheduled_at ? formatWeekday(post.scheduled_at, locale) : '—'}
                        </Text>
                        <Text style={styles.upcomingDay}>
                          {post.scheduled_at ? formatDayOfMonth(post.scheduled_at, locale) : '--'}
                        </Text>
                      </View>
                      <View style={styles.upcomingBody}>
                        <Text style={styles.upcomingHeadline} numberOfLines={2}>
                          {post.version.headline || post.concept_title}
                        </Text>
                        <View style={styles.upcomingMeta}>
                          <ClockIcon color={tokens.color.textMuted} size={13} />
                          <Text style={styles.upcomingTime}>
                            {post.scheduled_at
                              ? formatTime(post.scheduled_at, locale)
                              : copy.notScheduled}
                          </Text>
                        </View>
                      </View>
                      <StatusChip status={post.status} />
                    </Pressable>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title={copy.upcomingEmptyTitle}
                  description={copy.upcomingEmptyDescription}
                />
              )}
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md, gap: tokens.space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  brandName: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  stateText: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.sm,
    padding: tokens.space.lg,
    textAlign: 'center',
  },
  weekCard: { padding: tokens.space.lg },
  weekLabel: { color: tokens.color.textSecondary, fontSize: tokens.fontSize.sm },
  weekRow: { flexDirection: 'row', alignItems: 'baseline', gap: tokens.space.sm, marginTop: 6 },
  weekValue: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.semibold,
  },
  weekUnit: { color: tokens.color.textMuted, fontSize: tokens.fontSize.sm },
  weekStats: {
    flexDirection: 'row',
    marginTop: tokens.space.lg,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingTop: tokens.space.md,
  },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatDivider: { width: 1, backgroundColor: tokens.color.border },
  weekStatValue: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  weekStatLabel: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs, marginTop: 2 },
  section: { gap: tokens.space.sm },
  approvalCard: { marginBottom: tokens.space.sm },
  approvalPreview: { height: 190 },
  approvalBody: { padding: tokens.space.md, gap: 4 },
  approvalPillar: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  approvalHeadline: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
  },
  approvalActions: { flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.sm },
  flexButton: { flex: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: tokens.color.textSecondary, fontSize: tokens.fontSize.xs },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.color.border },
  upcomingDate: { width: 34, alignItems: 'center' },
  upcomingWeekday: { color: tokens.color.textMuted, fontSize: 10, letterSpacing: 1 },
  upcomingDay: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  upcomingBody: { flex: 1, gap: 4 },
  upcomingHeadline: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upcomingTime: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
});
