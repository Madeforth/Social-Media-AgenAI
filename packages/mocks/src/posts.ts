import type { Post, PostVersion } from '@apex/types';

import { MOCK_BRAND } from './brands';
import { fromNow } from './time';

/** A post joined with the version currently shown to the user. */
export interface MockPost extends Post {
  version: PostVersion;
}

interface Draft {
  id: string;
  status: Post['status'];
  content_pillar: string;
  objective: string;
  concept_title: string;
  visual_format: Post['visual_format'];
  ui_asset_required: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  headline: string;
  supporting_copy: string;
  caption: string;
  cta: string;
  hashtags: string[];
  creative_direction: string;
  version_number: number;
  created_by: PostVersion['created_by'];
}

const DRAFTS: Draft[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    status: 'READY',
    content_pillar: 'Community',
    objective: 'Grow the rider community',
    concept_title: 'Find your circle',
    visual_format: 'CINEMATIC_LIFESTYLE',
    ui_asset_required: false,
    scheduled_at: null,
    published_at: null,
    created_at: fromNow({ hours: -2 }),
    headline: 'Find your people. Ride your road.',
    supporting_copy: 'The best roads are the ones you share.',
    caption:
      'The best roads are the ones we ride together. Find your circle. Share the journey. Make every mile count.',
    cta: 'Join your circle today.',
    hashtags: ['#ApexFlow', '#RideTogether', '#FindYourCircle'],
    creative_direction:
      'Wide cinematic frame at dusk, single rider on a mountain pass, headline set large in the upper third.',
    version_number: 3,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    status: 'READY',
    content_pillar: 'Product',
    objective: 'Explain the ride summary',
    concept_title: 'Every ride, decoded',
    visual_format: 'PRODUCT_UI',
    ui_asset_required: true,
    scheduled_at: null,
    published_at: null,
    created_at: fromNow({ hours: -5 }),
    headline: 'Every ride. Every detail.',
    supporting_copy: 'Your ride summary, the moment you stop.',
    caption:
      'Lean angle, pace, elevation, route. Every ride tells a story — this one writes it down for you.',
    cta: 'Open your last ride.',
    hashtags: ['#ApexFlow', '#RideData'],
    creative_direction:
      'Place the supplied product screenshot on a dark surface at a slight angle. Do not redraw the interface.',
    version_number: 2,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555503',
    status: 'SCHEDULED',
    content_pillar: 'Brand',
    objective: 'Reinforce the brand point of view',
    concept_title: 'Beyond the numbers',
    visual_format: 'EDITORIAL_TYPOGRAPHY',
    ui_asset_required: false,
    scheduled_at: fromNow({ days: 2, hours: 11 }),
    published_at: null,
    created_at: fromNow({ days: -1 }),
    headline: 'Ride beyond the numbers.',
    supporting_copy: 'Data is the map. The ride is the point.',
    caption: 'Data is the map. The ride is still the point.',
    cta: 'Read the manifesto.',
    hashtags: ['#ApexFlow', '#RideYourRoad'],
    creative_direction: 'Condensed editorial type, near-black ground, one thin cyan rule.',
    version_number: 1,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555504',
    status: 'SCHEDULED',
    content_pillar: 'Education',
    objective: 'Teach a practical skill',
    concept_title: 'Reading a wet corner',
    visual_format: 'EDUCATIONAL_CAROUSEL',
    ui_asset_required: false,
    scheduled_at: fromNow({ days: 4, hours: 10 }),
    published_at: null,
    created_at: fromNow({ days: -1, hours: -4 }),
    headline: 'Four things to read before a wet corner.',
    supporting_copy: 'Surface, camber, line, throttle.',
    caption: 'Surface. Camber. Line. Throttle. Read them in that order and the corner reads back.',
    cta: 'Save this for the next ride.',
    hashtags: ['#ApexFlow', '#RiderSkills'],
    creative_direction: 'Four-card carousel, one idea per card, heavy negative space.',
    version_number: 1,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555505',
    status: 'DRAFT',
    content_pillar: 'Community',
    objective: 'Invite riders to submit routes',
    concept_title: 'Route of the month',
    visual_format: 'RIDER_COMMUNITY',
    ui_asset_required: false,
    scheduled_at: null,
    published_at: null,
    created_at: fromNow({ days: -2 }),
    headline: 'Show us your road.',
    supporting_copy: 'One route. One story. Every month.',
    caption: 'Send us the road you keep going back to, and tell us why.',
    cta: 'Submit your route.',
    hashtags: ['#ApexFlow', '#RouteOfTheMonth'],
    creative_direction: 'Rider-submitted photography treatment, generous margin for the headline.',
    version_number: 1,
    created_by: 'USER',
  },
  {
    id: '55555555-5555-4555-8555-555555555506',
    status: 'REVISION',
    content_pillar: 'Product',
    objective: 'Introduce the ride log',
    concept_title: 'The log writes itself',
    visual_format: 'PRODUCT_UI',
    ui_asset_required: true,
    scheduled_at: null,
    published_at: null,
    created_at: fromNow({ days: -3 }),
    headline: 'Your log, written for you.',
    supporting_copy: 'Stop the bike. The entry is already there.',
    caption: 'Stop the bike and the entry is already written.',
    cta: 'See your log.',
    hashtags: ['#ApexFlow'],
    creative_direction: 'Tighter crop on the supplied screenshot; headline needs more contrast.',
    version_number: 2,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555507',
    status: 'GENERATING',
    content_pillar: 'Brand',
    objective: 'Seasonal teaser',
    concept_title: 'Late season',
    visual_format: null,
    ui_asset_required: false,
    scheduled_at: null,
    published_at: null,
    created_at: fromNow({ hours: -1 }),
    headline: '',
    supporting_copy: '',
    caption: '',
    cta: '',
    hashtags: [],
    creative_direction: '',
    version_number: 1,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555508',
    status: 'PUBLISHED',
    content_pillar: 'Community',
    objective: 'Celebrate a rider milestone',
    concept_title: 'One thousand',
    visual_format: 'ACHIEVEMENT_BADGE',
    ui_asset_required: false,
    scheduled_at: fromNow({ days: -6, hours: 10 }),
    published_at: fromNow({ days: -6, hours: 10 }),
    created_at: fromNow({ days: -8 }),
    headline: 'One thousand kilometres.',
    supporting_copy: 'Earned one corner at a time.',
    caption: 'A thousand kilometres, earned one corner at a time.',
    cta: 'Check your badges.',
    hashtags: ['#ApexFlow', '#RiderMilestone'],
    creative_direction: 'Badge centred on a deep field, minimal supporting type.',
    version_number: 1,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555509',
    status: 'PUBLISHED',
    content_pillar: 'Education',
    objective: 'Pre-ride routine',
    concept_title: 'Two minutes before you go',
    visual_format: 'EDUCATIONAL_CAROUSEL',
    ui_asset_required: false,
    scheduled_at: fromNow({ days: -13, hours: 10 }),
    published_at: fromNow({ days: -13, hours: 10 }),
    created_at: fromNow({ days: -15 }),
    headline: 'Two minutes before you go.',
    supporting_copy: 'Tyres, levers, lights, load.',
    caption: 'Tyres. Levers. Lights. Load. Two minutes now, or an hour on the roadside later.',
    cta: 'Save the checklist.',
    hashtags: ['#ApexFlow', '#RiderSkills'],
    creative_direction: 'Four-card carousel with a single icon per card.',
    version_number: 1,
    created_by: 'AI',
  },
  {
    id: '55555555-5555-4555-8555-555555555510',
    status: 'FAILED',
    content_pillar: 'Product',
    objective: 'Feature announcement',
    concept_title: 'Route sync',
    visual_format: 'PRODUCT_UI',
    ui_asset_required: true,
    scheduled_at: fromNow({ days: -2, hours: 9 }),
    published_at: null,
    created_at: fromNow({ days: -4 }),
    headline: 'Your routes, everywhere.',
    supporting_copy: 'Plan on the desk. Ride from the bars.',
    caption: 'Plan it at the desk. Ride it from the bars.',
    cta: 'Turn on sync.',
    hashtags: ['#ApexFlow'],
    creative_direction: 'Two supplied screenshots side by side on a dark ground.',
    version_number: 1,
    created_by: 'AI',
  },
];

function toMockPost(draft: Draft): MockPost {
  const versionId = draft.id.replace('5555-4555-8555', '6666-4666-8666');
  return {
    id: draft.id,
    brand_id: MOCK_BRAND.id,
    strategy_id: null,
    status: draft.status,
    content_pillar: draft.content_pillar,
    objective: draft.objective,
    concept_title: draft.concept_title,
    visual_format: draft.visual_format,
    ui_asset_required: draft.ui_asset_required,
    current_version_id: versionId,
    scheduled_at: draft.scheduled_at,
    published_at: draft.published_at,
    instagram_post_id: null,
    created_at: draft.created_at,
    updated_at: draft.created_at,
    version: {
      id: versionId,
      post_id: draft.id,
      version_number: draft.version_number,
      headline: draft.headline,
      supporting_copy: draft.supporting_copy,
      caption: draft.caption,
      cta: draft.cta,
      hashtags: draft.hashtags,
      creative_direction: draft.creative_direction,
      generation_prompt: '',
      image_storage_path: null,
      created_by: draft.created_by,
      model_name: draft.created_by === 'AI' ? 'gemini-2.5-pro' : null,
      model_metadata: null,
      created_at: draft.created_at,
    },
  };
}

export const MOCK_POSTS: MockPost[] = DRAFTS.map(toMockPost);

export function findMockPost(id: string): MockPost | undefined {
  return MOCK_POSTS.find((post) => post.id === id);
}

/** Earlier versions of a post, newest first. Only the current version is real data. */
export function mockVersionHistory(post: MockPost): PostVersion[] {
  return Array.from({ length: post.version.version_number }, (_, index) => {
    const versionNumber = post.version.version_number - index;
    if (versionNumber === post.version.version_number) {
      return post.version;
    }
    return {
      ...post.version,
      id: `${post.version.id}-v${versionNumber}`,
      version_number: versionNumber,
      created_at: new Date(
        new Date(post.version.created_at).getTime() - index * 45 * 60 * 1000,
      ).toISOString(),
    };
  });
}
