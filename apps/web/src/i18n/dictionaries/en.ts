import type { Dictionary } from '../dictionary';

export const en: Dictionary = {
  meta: {
    dashboard: 'Dashboard',
    create: 'Create with AI',
    calendar: 'Calendar',
    library: 'Content Library',
    brandBrain: 'Brand Brain',
    assets: 'Assets',
    analytics: 'Analytics',
    inbox: 'Inbox',
    settings: 'Settings',
    postFallback: 'Post',
    rootDescription: 'AI-native social media operating system.',
  },
  nav: {
    primaryNavigation: 'Primary navigation',
    dashboard: 'Dashboard',
    createWithAi: 'Create with AI',
    calendar: 'Calendar',
    contentLibrary: 'Content Library',
    brandBrain: 'Brand Brain',
    assets: 'Assets',
    analytics: 'Analytics',
    inbox: 'Inbox',
    settings: 'Settings',
  },
  topbar: {
    notConnected: 'Not connected to Supabase',
    notifications: 'Notifications',
  },
  sidebar: {
    noBrandYet: 'No brand yet',
    changeBrand: 'Change brand',
    createOneInSettings: 'Create one in Settings',
  },
  status: {
    DRAFT: 'Draft',
    GENERATING: 'Generating',
    READY: 'Ready',
    REVISION: 'Revision',
    APPROVED: 'Approved',
    SCHEDULED: 'Scheduled',
    PUBLISHING: 'Publishing',
    PUBLISHED: 'Published',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  },
  visualFormat: {
    PRODUCT_UI: 'Product UI',
    CINEMATIC_LIFESTYLE: 'Cinematic lifestyle',
    RIDER_COMMUNITY: 'Rider community',
    EDITORIAL_TYPOGRAPHY: 'Editorial typography',
    DATA_VISUALIZATION: 'Data visualization',
    EDUCATIONAL_CAROUSEL: 'Educational carousel',
    ACHIEVEMENT_BADGE: 'Achievement badge',
    TEASER_LAUNCH: 'Teaser / launch',
    MANIFESTO: 'Manifesto',
    SEASONAL: 'Seasonal',
  },
  assetType: {
    LOGO: 'Logo',
    PRODUCT_UI: 'Product UI',
    PRODUCT_IMAGE: 'Product image',
    BADGE: 'Badge',
    LIFESTYLE: 'Lifestyle',
    STYLE_REFERENCE: 'Style reference',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: "Here's what's happening with your content.",
    postUnitSingular: 'post',
    postUnitPlural: 'posts',
    stats: {
      plannedThisWeek: 'Planned this week',
      readyToApprove: 'Ready to approve',
      scheduled: 'Scheduled',
      published: 'Published',
      thisMonth: 'this month',
    },
    createCard: {
      badge: 'Create with AI',
      heading: 'Let AI create engaging content for your audience',
      description: 'Tell the AI what you need, or let it decide what the brand should say next.',
      createButton: 'Create with AI',
      customBrief: 'Custom brief',
    },
    upcoming: {
      title: 'Upcoming posts',
      viewCalendar: 'View calendar',
      emptyTitle: 'Nothing scheduled',
      emptyDescription: 'Approved posts appear here once they have a publish time.',
      notScheduled: 'Not scheduled',
    },
    approval: {
      title: 'Ready for approval',
      viewAll: 'View all',
      review: 'Review',
      edit: 'Edit',
      emptyTitle: 'Approval queue is clear',
      emptyDescription: 'Generated posts land here for review before they can be scheduled.',
    },
    performance: {
      title: 'Performance overview',
      emptyTitle: 'No performance data yet',
      emptyDescription:
        'Connect an Instagram account to pull impressions, reach and profile visits into this panel.',
      connectInstagram: 'Connect Instagram',
    },
  },
  create: {
    title: 'Create with AI',
    description:
      'You should never have to write a long prompt. Pick a mode and the brand does the rest.',
    modes: {
      aiSuggestion: {
        title: 'AI suggestion',
        description:
          'The AI reads the brand, the recent history and the pillar balance, then decides.',
      },
      customBrief: {
        title: 'Custom brief',
        description: 'Describe the idea in your own words and let the AI shape it.',
      },
    },
    brief: {
      title: 'Brief',
      whatShouldThisBeAbout: 'What should this post be about?',
      optional: 'Optional',
      placeholder: 'Describe the idea in your own words.',
      aiDecidesDescription:
        'The AI will pick the objective, the content pillar and the creative format from the Brand Brain and the recent content history.',
    },
    fields: {
      contentPillar: 'Content pillar',
      noneDefinedYet: 'None defined yet',
      letAiDecide: 'Let the AI decide',
      visualFormat: 'Visual format',
      publishDate: 'Publish date',
      language: 'Language',
    },
    languages: { english: 'English', turkish: 'Türkçe' },
    disabledNotice:
      'Generation is wired up in a later milestone — the form is disabled until the Gemini Edge Function exists.',
    generateButton: 'Generate content',
  },
  calendar: {
    title: 'Calendar',
    description: (monthYear) => `${monthYear} · scheduled and published content`,
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    emptyMessage:
      'Nothing is scheduled yet. Approved posts appear on this grid once they have a publish time.',
  },
  library: {
    title: 'Content Library',
    description: 'Every post for this brand, newest first.',
    all: (count) => `All (${count})`,
    emptyNoStatusTitle: 'No posts yet',
    emptyNoStatusDescription:
      'Generated and drafted posts appear here once the workspace is connected to Supabase.',
    emptyFilteredTitle: 'No posts with this status',
    emptyFilteredDescription: 'Try a different filter, or generate something new.',
    createWithAi: 'Create with AI',
  },
  postDetail: {
    breadcrumbContentLibrary: 'Content Library',
    notGeneratedYet: 'Not generated yet',
    regenerate: 'Regenerate',
    edit: 'Edit',
    approve: 'Approve',
    uiAssetNotice:
      'This concept uses a real product screenshot. The asset is placed as supplied and is never redrawn.',
    strategy: {
      title: 'Strategy',
      objective: 'Objective',
      contentPillar: 'Content pillar',
      creativeDirection: 'Creative direction',
    },
    copy: {
      title: 'Copy',
      headline: 'Headline',
      supportingCopy: 'Supporting copy',
      caption: 'Caption',
      callToAction: 'Call to action',
      hashtags: 'Hashtags',
    },
    schedule: {
      title: 'Schedule',
      publishAt: 'Publish at',
      notScheduled: 'Not scheduled',
      platform: 'Platform',
      instagram: 'Instagram',
      account: 'Account',
      connect: 'Connect',
    },
  },
  brandBrain: {
    title: 'Brand Brain',
    description: (brandName) => `Everything the AI knows about ${brandName}.`,
    yourBrand: 'your brand',
    emptyTitle: 'No brand defined yet',
    emptyDescription:
      'Mission, positioning, tone, visual rules and content pillars are entered here. The AI reads all of it before it writes anything.',
    edit: 'Edit',
    positioning: {
      title: 'Positioning',
      mission: 'Mission',
      vision: 'Vision',
      positioning: 'Positioning',
      targetAudience: 'Target audience',
      notDefined: 'Not defined yet — the AI works better once this is filled in.',
    },
    contentPillars: {
      title: 'Content pillars',
      emptyTitle: 'No content pillars yet',
      emptyDescription:
        'Pillars keep the AI from drifting into one format. Define a few and the strategy layer balances between them.',
    },
    voiceAndCopy: {
      title: 'Voice and copy rules',
      toneAttributes: 'Tone attributes',
      always: 'Always',
      never: 'Never',
      nothingDefined: 'Nothing defined yet.',
    },
    visualRules: {
      title: 'Visual rules',
      palette: 'Palette',
      typography: 'Typography',
      avoid: 'Avoid',
    },
    forbiddenClaims: {
      title: 'Forbidden claims',
      notice: 'The AI is told never to state these, whatever the brief says.',
      claims: 'Claims',
    },
  },
  assets: {
    title: 'Asset Library',
    description: 'Logos, product screenshots, badges and reference imagery the AI may use.',
    uploadAsset: 'Upload asset',
    trustedNotice:
      'Product UI screenshots are treated as trusted assets. The AI may place one inside a composition, but it never redraws or invents product interface.',
    emptyTitle: 'No assets yet',
    emptyDescription:
      'Upload a logo, product screenshots and reference imagery. Files are stored in a private Supabase bucket; only the path is kept in the database.',
  },
  analytics: {
    title: 'Analytics',
    description: 'Performance for published content, pulled from Instagram.',
    metrics: {
      impressions: 'Impressions',
      reach: 'Reach',
      engagement: 'Engagement',
      profileVisits: 'Profile visits',
    },
    noAccountConnected: 'No account connected',
    connectTitle: 'Connect Instagram to see performance',
    connectDescription:
      'Once an account is connected, published posts start reporting impressions, reach, engagement and profile visits here.',
    goToIntegrations: 'Go to integrations',
  },
  settings: {
    title: 'Settings',
    description: 'Integrations, notifications and account.',
    integrations: {
      title: 'Integrations',
      instagram: {
        title: 'Instagram',
        description:
          'Publishing and metrics run through the Meta Graph API. Tokens are stored server-side and never reach this browser.',
        connect: 'Connect',
      },
      gemini: {
        title: 'Gemini',
        description:
          'Configured as a Supabase secret. The key is only ever read inside an Edge Function.',
        serverSide: 'Server-side',
      },
    },
    brand: {
      title: 'Brand',
      noDescriptionYet: 'No description yet.',
      manage: 'Manage',
      addBrand: 'Add a brand',
      createFirstBrand: 'Create your first brand',
      multiBrandNotice: 'The data model is multi-brand from the start.',
      newBrand: 'New brand',
    },
    notifications: {
      title: 'Notifications',
      approvalRequired: {
        title: 'Approval required',
        description: 'Push a notification when a generated post is waiting for review.',
      },
      publishFailures: {
        title: 'Publish failures',
        description: 'Alert when a scheduled post fails to publish.',
      },
      notConfigured: 'Not configured',
    },
  },
  inbox: {
    title: 'Inbox',
    description: 'Comments and direct messages, in one place.',
    emptyTitle: 'Inbox is not part of V1',
    emptyDescription:
      'The navigation slot and the data model are reserved so this can be switched on without a migration.',
  },
  localeSwitcher: {
    label: 'Language',
    tr: 'TR',
    en: 'EN',
    switchToTurkish: 'Switch to Turkish',
    switchToEnglish: 'Switch to English',
  },
  creativePreview: {
    label: (headline) => `Creative preview: ${headline}`,
    emptyLabel: 'Creative preview placeholder, no visual generated yet',
    awaitingGeneration: 'Awaiting generation',
  },
  notFound: {
    title: 'This page does not exist',
    description: 'The link may be stale, or the post it pointed at was removed.',
    backToDashboard: 'Back to dashboard',
  },
};
