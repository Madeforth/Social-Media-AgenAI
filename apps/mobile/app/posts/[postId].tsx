import { tokens } from '@apex/ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/provider';
import { CreativePreview } from '@/components/creative-preview';
import { StatusChip } from '@/components/status-chip';
import { Banner, Button, Card, EmptyState, Field } from '@/components/ui';
import type { Locale, MobileDictionary } from '@/i18n/dictionary';
import { useI18n } from '@/i18n/provider';
import {
  approvePost,
  editPostVersion,
  generateImage,
  generatePost,
  getPostImageUrl,
  publishPost,
  requestRevision,
  schedulePost,
  syncMetrics,
  usePost,
} from '@/lib/data';

/** The immersive review screen: visual first, details below, actions pinned. */
export default function PostDetailScreen() {
  const { locale, dictionary } = useI18n();
  const copy = dictionary.postDetail;
  const { session } = useAuth();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { data: post, loading, error, refetch } = usePost(postId ?? '');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [genErrorCode, setGenErrorCode] = useState<string | null>(null);
  const [imageErrorCode, setImageErrorCode] = useState<string | null>(null);
  const [publishFailed, setPublishFailed] = useState(false);

  useEffect(() => {
    if (!post?.version.image_storage_path) {
      setImageUrl(null);
      return;
    }
    let active = true;
    getPostImageUrl(post.version.image_storage_path).then((url) => {
      if (active) setImageUrl(url);
    });
    return () => {
      active = false;
    };
  }, [post?.version.image_storage_path]);

  useEffect(() => {
    if (post?.scheduled_at) setScheduleInput(post.scheduled_at.slice(0, 16).replace('T', ' '));
  }, [post?.scheduled_at]);

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

  const canApprove = post.status === 'READY' || post.status === 'REVISION';
  const canRequestRevision = post.status === 'READY';
  const canSchedule = post.status === 'APPROVED' || post.status === 'SCHEDULED';
  const canPublish = post.status === 'APPROVED' || post.status === 'SCHEDULED';

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    try {
      await action();
      refetch();
    } finally {
      setBusy(null);
    }
  }

  function startEdit() {
    setEditHeadline(post!.version.headline);
    setEditCaption(post!.version.caption);
    setEditCta(post!.version.cta);
    setEditHashtags(post!.version.hashtags.join(' '));
    setEditing(true);
  }

  async function handleSaveEdit() {
    setBusy('edit');
    await editPostVersion(post!.id, post!.current_version_id, {
      headline: editHeadline.trim(),
      caption: editCaption.trim(),
      cta: editCta.trim(),
      hashtags: editHashtags
        .split(/[\n ]+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setBusy(null);
    setEditing(false);
    refetch();
  }

  async function handleRegenerate() {
    setBusy('regenerate');
    setGenErrorCode(null);
    const result = await generatePost(session, post!.brand_id, {
      postId: post!.id,
      brief: revisionNote.trim() || undefined,
    });
    setBusy(null);
    if (result.errorCode) setGenErrorCode(result.errorCode);
    else {
      setRevisionNote('');
      refetch();
    }
  }

  async function handleGenerateImage() {
    setBusy('image');
    setImageErrorCode(null);
    const result = await generateImage(session, post!.id);
    setBusy(null);
    if (result.errorCode) setImageErrorCode(result.errorCode);
    else refetch();
  }

  async function handleSchedule() {
    const iso = new Date(scheduleInput.replace(' ', 'T')).toISOString();
    if (Number.isNaN(new Date(iso).getTime())) return;
    await run('schedule', () => schedulePost(post!.id, iso));
  }

  async function handlePublish() {
    setBusy('publish');
    setPublishFailed(false);
    const result = await publishPost(session, post!.id);
    setBusy(null);
    if (!result.ok) setPublishFailed(true);
    else refetch();
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
          <CreativePreview post={post} imageUrl={imageUrl} />
        </View>

        <View style={styles.metaRow}>
          <StatusChip status={post.status} />
          <Text style={styles.meta}>
            {post.content_pillar}
            {post.visual_format ? ` · ${dictionary.visualFormat[post.visual_format]}` : ''} · v
            {post.version.version_number}
          </Text>
        </View>

        {genErrorCode ? (
          <Banner
            tone="error"
            text={
              copy.genErrors[genErrorCode as keyof typeof copy.genErrors] ?? copy.genErrors.failed
            }
          />
        ) : null}
        {imageErrorCode ? (
          <Banner
            tone="error"
            text={
              copy.imageErrors[imageErrorCode as keyof typeof copy.imageErrors] ??
              copy.imageErrors.failed
            }
          />
        ) : null}
        {publishFailed ? <Banner tone="error" text={copy.publishError} /> : null}

        <Card style={styles.actionsCard}>
          <Field
            label={copy.revisionNoteLabel}
            placeholder={copy.revisionNotePlaceholder}
            value={revisionNote}
            onChangeText={setRevisionNote}
            multiline
          />
          <Button
            label={copy.regenerate}
            disabled={busy !== null}
            onPress={() => void handleRegenerate()}
          />
        </Card>

        {editing ? (
          <Card style={styles.actionsCard}>
            <Field label={copy.headline} value={editHeadline} onChangeText={setEditHeadline} />
            <Field
              label={copy.caption}
              value={editCaption}
              onChangeText={setEditCaption}
              multiline
            />
            <Field label={copy.callToAction} value={editCta} onChangeText={setEditCta} />
            <Field
              label={copy.hashtags}
              hint={copy.hashtagsHint}
              value={editHashtags}
              onChangeText={setEditHashtags}
              multiline
            />
            <View style={styles.row}>
              <Button
                label={copy.cancel}
                style={styles.flexButton}
                onPress={() => setEditing(false)}
              />
              <Button
                label={copy.save}
                variant="primary"
                style={styles.flexButton}
                disabled={busy !== null}
                onPress={() => void handleSaveEdit()}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Field2
              label={copy.headline}
              value={post.version.headline}
              locale={locale}
              dictionary={dictionary}
            />
            <Field2
              label={copy.caption}
              value={post.version.caption}
              locale={locale}
              dictionary={dictionary}
            />
            <Field2
              label={copy.callToAction}
              value={post.version.cta}
              locale={locale}
              dictionary={dictionary}
            />
            <Field2
              label={copy.hashtags}
              value={post.version.hashtags.join(' ')}
              locale={locale}
              dictionary={dictionary}
            />
            <Field2
              label={copy.creativeDirection}
              value={post.version.creative_direction}
              locale={locale}
              dictionary={dictionary}
              last
            />
          </Card>
        )}

        <Text style={styles.generated}>
          {post.version.created_by === 'AI' ? copy.aiGenerated : copy.editedByYou}
        </Text>

        <Card style={styles.actionsCard}>
          <Button
            label={imageUrl ? copy.regenerateImage : copy.generateImage}
            disabled={busy !== null}
            onPress={() => void handleGenerateImage()}
          />
        </Card>

        {canSchedule ? (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionLabel}>{copy.scheduleTitle}</Text>
            <Text style={styles.meta}>
              {post.scheduled_at
                ? `${copy.publishAt}: ${new Date(post.scheduled_at).toLocaleString(
                    locale === 'tr' ? 'tr-TR' : 'en-GB',
                  )}`
                : copy.notScheduled}
            </Text>
            <Field
              label={copy.scheduleDateLabel}
              placeholder={copy.scheduleDatePlaceholder}
              value={scheduleInput}
              onChangeText={setScheduleInput}
            />
            <Button
              label={post.status === 'SCHEDULED' ? copy.rescheduleButton : copy.scheduleButton}
              variant="primary"
              disabled={busy !== null || !scheduleInput.trim()}
              onPress={() => void handleSchedule()}
            />
          </Card>
        ) : null}

        {post.status === 'PUBLISHED' ? (
          <Button
            label={copy.syncMetrics}
            disabled={busy !== null}
            onPress={() => void run('sync', () => syncMetrics(session, post.id))}
          />
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        {canRequestRevision ? (
          <Button
            label={copy.revise}
            style={styles.flexButton}
            disabled={busy !== null}
            onPress={() => void run('revise', () => requestRevision(post.id))}
          />
        ) : null}
        {!editing ? (
          <Button label={copy.edit} style={styles.flexButton} onPress={startEdit} />
        ) : null}
        {canApprove ? (
          <Button
            label={copy.approve}
            variant="primary"
            style={styles.flexButton}
            disabled={busy !== null}
            onPress={() => void run('approve', () => approvePost(post.id))}
          />
        ) : null}
        {canPublish ? (
          <Button
            label={copy.publishNow}
            variant="primary"
            style={styles.flexButton}
            disabled={busy !== null}
            onPress={() => void handlePublish()}
          />
        ) : null}
      </View>
    </View>
  );
}

function Field2({
  label,
  value,
  locale,
  dictionary,
  last = false,
}: {
  label: string;
  value: string;
  locale: Locale;
  dictionary: MobileDictionary;
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <Text style={styles.fieldLabel}>
        {label.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-GB')}
      </Text>
      <Text style={value ? styles.fieldValue : styles.fieldEmpty}>
        {value || dictionary.common.notGeneratedYet}
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
  actionsCard: { padding: tokens.space.md, gap: tokens.space.sm },
  sectionLabel: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  row: { flexDirection: 'row', gap: tokens.space.sm },
  field: { padding: tokens.space.md, gap: 6 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: tokens.color.border },
  fieldLabel: { color: tokens.color.textMuted, fontSize: 10, letterSpacing: 1.2 },
  fieldValue: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm, lineHeight: 20 },
  fieldEmpty: { color: tokens.color.textMuted, fontSize: tokens.fontSize.sm },
  generated: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
  flexButton: { flex: 1, minWidth: 100 },
});
