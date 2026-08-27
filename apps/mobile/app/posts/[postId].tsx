import { MOCK_NOW, findMockPost } from '@apex/mocks';
import { tokens, VISUAL_FORMAT_LABELS } from '@apex/ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreativePreview } from '@/components/creative-preview';
import { StatusChip } from '@/components/status-chip';
import { Button, Card, EmptyState } from '@/components/ui';
import { formatRelative } from '@/lib/format';

/** The immersive review screen: visual first, details below, actions pinned. */
export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = findMockPost(postId ?? '');

  if (!post) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
        <EmptyState title="Post not found" description="It may have been removed." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: post.concept_title,
          headerStyle: { backgroundColor: tokens.color.surface },
          headerTintColor: tokens.color.textPrimary,
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <CreativePreview post={post} />
        </View>

        <View style={styles.metaRow}>
          <StatusChip status={post.status} />
          <Text style={styles.meta}>
            {post.content_pillar}
            {post.visual_format ? ` · ${VISUAL_FORMAT_LABELS[post.visual_format]}` : ''} · v
            {post.version.version_number}
          </Text>
        </View>

        <Card style={styles.card}>
          <Field label="Headline" value={post.version.headline} />
          <Field label="Caption" value={post.version.caption} />
          <Field label="Call to action" value={post.version.cta} />
          <Field label="Hashtags" value={post.version.hashtags.join(' ')} />
          <Field label="Creative direction" value={post.version.creative_direction} last />
        </Card>

        <Text style={styles.generated}>
          {post.version.created_by === 'AI' ? 'AI generated' : 'Edited'}{' '}
          {formatRelative(post.version.created_at, MOCK_NOW)}
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <Button label="Revise" style={styles.flexButton} />
        <Button label="Approve" variant="primary" style={styles.flexButton} />
      </View>
    </View>
  );
}

function Field({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <Text style={value ? styles.fieldValue : styles.fieldEmpty}>
        {value || 'Not generated yet'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.space.md, gap: tokens.space.md },
  preview: { height: 380 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, flexWrap: 'wrap' },
  meta: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  card: {},
  field: { padding: tokens.space.md, gap: 6 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: tokens.color.border },
  fieldLabel: { color: tokens.color.textMuted, fontSize: 10, letterSpacing: 1.2 },
  fieldValue: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm, lineHeight: 20 },
  fieldEmpty: { color: tokens.color.textMuted, fontSize: tokens.fontSize.sm },
  generated: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
  flexButton: { flex: 1 },
});
