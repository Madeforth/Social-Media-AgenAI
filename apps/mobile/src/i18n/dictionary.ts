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
    contentPillar: string;
    noPillarsTitle: string;
    noPillarsDescription: string;
    balanceHint: string;
    generate: string;
    disabledNotice: string;
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
    notifications: string;
    notConfigured: string;
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
  };
  signIn: {
    title: string;
    subtitle: string;
    continueWithGoogle: string;
  };
}
