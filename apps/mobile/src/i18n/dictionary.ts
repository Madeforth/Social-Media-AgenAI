import type { PostStatus, VisualFormat } from '@apex/types';

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

export function hasLocale(value: string | null): value is Locale {
  return value !== null && (locales as readonly string[]).includes(value);
}

export interface MobileDictionary {
  tabs: {
    home: string;
    create: string;
    calendar: string;
    library: string;
    more: string;
  };
  common: {
    loading: string;
    error: string;
    notFound: string;
    notGeneratedYet: string;
  };
  status: Record<PostStatus, string>;
  visualFormat: Record<VisualFormat, string>;
  creativePreview: { awaitingGeneration: string };
  home: {
    loading: string;
    loadErrorTitle: string;
    loadErrorDescription: string;
    thisWeek: string;
    postsPlanned: (count: number) => string;
    ready: string;
    scheduled: string;
    published: string;
    readyForApproval: (count: number) => string;
    review: string;
    edit: string;
    approvalEmptyTitle: string;
    approvalEmptyDescription: string;
    upcoming: string;
    viewCalendar: string;
    notScheduled: string;
    upcomingEmptyTitle: string;
    upcomingEmptyDescription: string;
  };
  create: {
    title: string;
    subtitle: string;
    aiSuggestionTitle: string;
    aiSuggestionDescription: string;
    customBriefTitle: string;
    customBriefDescription: string;
    briefLabel: string;
    briefPlaceholder: string;
    contentPillar: string;
    noPillarsTitle: string;
    noPillarsDescription: string;
    balanceHint: string;
    generate: string;
    generating: string;
    errors: { quota: string; not_configured: string; network: string; failed: string };
  };
  calendar: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  library: {
    title: string;
    postCount: (count: number) => string;
    emptyTitle: string;
    emptyDescription: string;
  };
  more: {
    title: string;
    brand: string;
    brandBrain: string;
    notDefinedYet: string;
    pillarCount: (count: number) => string;
    assets: string;
    noAssetsYet: string;
    assetCount: (count: number) => string;
    settings: string;
    instagram: string;
    notConnected: string;
    connectedAs: (username: string) => string;
    gemini: string;
    geminiConnected: string;
    geminiNotConnected: string;
    notifications: string;
    unreadCount: (count: number) => string;
    noUnread: string;
    account: string;
    language: string;
    languageDescription: string;
    turkish: string;
    english: string;
    signOut: string;
    createBrand: string;
    createBrandDescription: string;
    brandNameLabel: string;
    brandNamePlaceholder: string;
    editBrandNameLabel: string;
    editBrandDescriptionLabel: string;
    save: string;
  };
  postDetail: {
    loadingDescription: string;
    loadErrorTitle: string;
    loadErrorDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
    headline: string;
    caption: string;
    callToAction: string;
    hashtags: string;
    creativeDirection: string;
    aiGenerated: string;
    editedByYou: string;
    revise: string;
    approve: string;
    regenerate: string;
    revisionNoteLabel: string;
    revisionNotePlaceholder: string;
    edit: string;
    save: string;
    cancel: string;
    hashtagsHint: string;
    generateImage: string;
    regenerateImage: string;
    publishNow: string;
    syncMetrics: string;
    scheduleTitle: string;
    scheduleDateLabel: string;
    scheduleDatePlaceholder: string;
    scheduleButton: string;
    rescheduleButton: string;
    publishAt: string;
    notScheduled: string;
    genErrors: { quota: string; not_configured: string; network: string; failed: string };
    imageErrors: { quota: string; not_configured: string; network: string; failed: string };
    publishError: string;
  };
  signIn: {
    title: string;
    subtitle: string;
    continueWithGoogle: string;
  };
  instagramConnect: {
    title: string;
    description: string;
    accountNameLabel: string;
    externalIdLabel: string;
    externalIdHint: string;
    accessTokenLabel: string;
    accessTokenHint: string;
    submit: string;
    connectedBanner: string;
    errorBanner: string;
  };
  geminiConnect: {
    title: string;
    description: string;
    apiKeyLabel: string;
    apiKeyHint: string;
    submit: string;
    connectedBanner: string;
    errorBanner: string;
  };
  notificationsScreen: {
    title: string;
    markAllRead: string;
    markRead: string;
    emptyTitle: string;
    emptyDescription: string;
    type: Record<'APPROVAL_REQUIRED' | 'PUBLISH_SUCCEEDED' | 'PUBLISH_FAILED', string>;
  };
  brandBrainEdit: {
    title: string;
    missionLabel: string;
    visionLabel: string;
    positioningLabel: string;
    targetAudienceLabel: string;
    contentPillarsLabel: string;
    contentPillarsHint: string;
    toneAttributesLabel: string;
    toneDoLabel: string;
    toneDontLabel: string;
    paletteLabel: string;
    typographyLabel: string;
    visualAvoidLabel: string;
    copyDoLabel: string;
    copyDontLabel: string;
    forbiddenClaimsLabel: string;
    listHint: string;
    save: string;
  };
  assetsScreen: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
  };
}
