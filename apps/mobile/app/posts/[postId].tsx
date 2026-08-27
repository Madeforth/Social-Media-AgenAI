import { tokens } from '@apex/ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreativePreview } from '@/components/creative-preview';
import { StatusChip } from '@/components/status-chip';
import { Button, Card, EmptyState } from '@/components/ui';
import type { Locale } from '@/i18n/dictionary';
import { useI18n } from '@/i18n/provider';
import { usePost } from '@/lib/data';

/** The immersive review screen: visual first, details below, actions pinned. */
export default function PostDetailScreen() {
  const { locale, dictionary } = useI18n();
  const copy = dictionary.postDetail;
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { data: post, loading, error } = usePost(postId ?? '');

  if (loading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: dictionary.common.loading }} />
        <EmptyState title={dictionary.common.loading} description={copy.loadingDescription} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: dictionary.common.error }} />
        <EmptyState title={copy.loadErrorTitle} description={copy.loadErrorDescription} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: dictionary.common.notFound }} />
        <EmptyState title={copy.notFoundTitle} description={copy.notFoundDescription} />
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
            {post.visual_format ? ` · ${dictionary.visualFormat[post.visual_format]}` : ''} · v
            {post.version.version_number}
          </Text>
        </View>

        <Card style={styles.card}>
          <Field
            label={copy.headline}
            value={post.version.headline}
            emptyLabel={dictionary.common.notGeneratedYet}
            locale={locale}
          />
          <Field
            label={copy.caption}
            value={post.version.caption}
            emptyLabel={dictionary.common.notGeneratedYet}
            locale={locale}
          />
          <Field
            label={copy.callToAction}
            value={post.version.cta}
            emptyLabel={dictionary.common.notGeneratedYet}
            locale={locale}
          />
          <Field
            label={copy.hashtags}
            value={post.version.hashtags.join(' ')}
            emptyLabel={dictionary.common.notGeneratedYet}
            locale={locale}
          />
          <Field
            label={copy.creativeDirection}
            value={post.version.creative_direction}
            emptyLabel={dictionary.common.notGeneratedYet}
            locale={locale}
            last
          />
        </Card>

        <Text style={styles.generated}>
          {post.version.created_by === 'AI' ? copy.aiGenerated : copy.editedByYou}
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <Button label={copy.revise} style={styles.flexButton} />
        <Button label={copy.approve} variant="primary" style={styles.flexButton} />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  emptyLabel,
  locale,
  last = false,
}: {
  label: string;
  value: string;
  emptyLabel: string;
  locale: Locale;
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <Text style={styles.fieldLabel}>
        {label.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-GB')}
      </Text>
      <Text style={value ? styles.fieldValue : styles.fieldEmpty}>{value || emptyLabel}</Text>
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
