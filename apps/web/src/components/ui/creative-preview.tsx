import type { PostWithVersion } from '@apex/types';
import type { Dictionary } from '@/i18n/dictionary';
import { cn } from '@/lib/cn';

/**
 * Stand-in for the generated creative. No image has been generated yet, so this
 * renders the headline as typography over a deterministic gradient rather than
 * showing a stock photograph that would misrepresent the output.
 */
const GRADIENTS = [
  'linear-gradient(135deg, #0b2a33 0%, #071018 55%, #0a1c26 100%)',
  'linear-gradient(150deg, #241a12 0%, #0d0a08 55%, #1d1410 100%)',
  'linear-gradient(160deg, #101d33 0%, #070a12 60%, #131a2c 100%)',
  'linear-gradient(140deg, #1a1030 0%, #0a0714 55%, #150e28 100%)',
];

function gradientFor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return GRADIENTS[hash % GRADIENTS.length]!;
}

interface CreativePreviewProps {
  post: PostWithVersion;
  labels: Pick<Dictionary, 'visualFormat' | 'creativePreview'>;
  className?: string;
  /** `feed` is the 4:5 Instagram ratio; `wide` suits list rows and hero panels. */
  ratio?: 'feed' | 'square' | 'wide';
  size?: 'sm' | 'md' | 'lg';
  /** A signed URL into the private `generated-images` bucket, when one exists. */
  imageUrl?: string | null;
}

const RATIOS = {
  feed: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
} as const;

const HEADLINE_SIZES = {
  sm: 'text-[11px] leading-snug',
  md: 'text-base leading-tight',
  lg: 'text-3xl leading-[1.05]',
} as const;

export function CreativePreview({
  post,
  labels,
  className,
  ratio = 'feed',
  size = 'md',
  imageUrl,
}: CreativePreviewProps) {
  const headline = post.version.headline;

  if (imageUrl) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-border-subtle bg-surface-raised',
          RATIOS[ratio],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL, not a Next image domain */}
        <img
          src={imageUrl}
          alt={headline || labels.creativePreview.emptyLabel}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-border-subtle',
        RATIOS[ratio],
        className,
      )}
      style={{ backgroundImage: gradientFor(post.id) }}
      role="img"
      aria-label={
        headline ? labels.creativePreview.label(headline) : labels.creativePreview.emptyLabel
      }
    >
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {headline ? (
          <p
            className={cn(
              'font-semibold uppercase tracking-tight text-white/90',
              HEADLINE_SIZES[size],
            )}
          >
            {headline}
          </p>
        ) : (
          <p className={cn('text-white/35', HEADLINE_SIZES[size])}>
            {labels.creativePreview.awaitingGeneration}
          </p>
        )}
        {size !== 'sm' && post.visual_format ? (
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
            {labels.visualFormat[post.visual_format]}
          </p>
        ) : null}
      </div>
    </div>
  );
}
