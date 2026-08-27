import type { PostWithVersion } from '@apex/types';
import { tokens, VISUAL_FORMAT_LABELS } from '@apex/ui';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

/**
 * Stand-in for the generated creative, matching the web placeholder: no image
 * exists yet, so the headline is set as typography over a deterministic ground.
 */
const GROUNDS = ['#0b2a33', '#241a12', '#101d33', '#1a1030'];

function groundFor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return GROUNDS[hash % GROUNDS.length]!;
}

interface Props {
  post: PostWithVersion;
  style?: ViewStyle;
  compact?: boolean;
}

export function CreativePreview({ post, style, compact = false }: Props) {
  const headline = post.version.headline;
  return (
    <View style={[styles.frame, { backgroundColor: groundFor(post.id) }, style]}>
      <Text
        style={[
          styles.headline,
          compact && styles.headlineCompact,
          !headline && styles.placeholder,
        ]}
        numberOfLines={compact ? 3 : 4}
      >
        {headline || 'Awaiting generation'}
      </Text>
      {!compact && post.visual_format ? (
        <Text style={styles.format}>{VISUAL_FORMAT_LABELS[post.visual_format]}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    justifyContent: 'space-between',
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  headline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    textTransform: 'uppercase',
    lineHeight: 26,
  },
  headlineCompact: { fontSize: tokens.fontSize.xs, lineHeight: 15 },
  placeholder: { color: 'rgba(255,255,255,0.35)' },
  format: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
