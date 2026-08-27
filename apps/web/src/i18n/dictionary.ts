import type { BrandAssetType, NotificationType, PostStatus, VisualFormat } from '@apex/types';

export interface Dictionary {
  meta: {
    dashboard: string;
    create: string;
    calendar: string;
    library: string;
    brandBrain: string;
    assets: string;
    analytics: string;
    inbox: string;
    settings: string;
    postFallback: string;
    rootDescription: string;
  };
  nav: {
    primaryNavigation: string;
    dashboard: string;
    createWithAi: string;
    calendar: string;
    contentLibrary: string;
    brandBrain: string;
    assets: string;
    analytics: string;
    inbox: string;
    settings: string;
  };
  topbar: {
    notifications: string;
  };
  sidebar: {
    noBrandYet: string;
    changeBrand: string;
    createOneInSettings: string;
  };
  status: Record<PostStatus, string>;
  visualFormat: Record<VisualFormat, string>;
  assetType: Record<BrandAssetType, string>;
  dashboard: {
    title: string;
    subtitle: string;
    postUnitSingular: string;
    postUnitPlural: string;
    stats: {
      plannedThisWeek: string;
      readyToApprove: string;
      scheduled: string;
      published: string;
      thisMonth: string;
    };
    createCard: {
      badge: string;
      heading: string;
      description: string;
      createButton: string;
      customBrief: string;
    };
    upcoming: {
      title: string;
      viewCalendar: string;
      emptyTitle: string;
      emptyDescription: string;
      notScheduled: string;
    };
    approval: {
      title: string;
      viewAll: string;
      review: string;
      edit: string;
      emptyTitle: string;
      emptyDescription: string;
    };
    performance: {
      title: string;
      emptyTitle: string;
      emptyDescription: string;
      connectInstagram: string;
    };
  };
  create: {
    title: string;
    description: string;
    modes: {
      aiSuggestion: { title: string; description: string };
      customBrief: { title: string; description: string };
    };
    brief: {
      title: string;
      whatShouldThisBeAbout: string;
      optional: string;
      placeholder: string;
      aiDecidesDescription: string;
    };
    fields: {
      contentPillar: string;
      noneDefinedYet: string;
      letAiDecide: string;
      visualFormat: string;
      publishDate: string;
      language: string;
    };
    languages: { english: string; turkish: string };
    disabledNotice: string;
    generateButton: string;
    generatingButton: string;
    errors: {
      quota: string;
      not_configured: string;
      network: string;
      failed: string;
    };
  };
  calendar: {
    title: string;
    description: (monthYear: string) => string;
    weekdays: [string, string, string, string, string, string, string];
    emptyMessage: string;
  };
  library: {
    title: string;
    description: string;
    all: (count: number) => string;
    emptyNoStatusTitle: string;
    emptyNoStatusDescription: string;
    emptyFilteredTitle: string;
    emptyFilteredDescription: string;
    createWithAi: string;
  };
  postDetail: {
    breadcrumbContentLibrary: string;
    notGeneratedYet: string;
    regenerate: string;
    edit: string;
    approve: string;
    requestRevision: string;
    uiAssetNotice: string;
    generateImage: string;
    regenerateImage: string;
    imageErrors: { quota: string; not_configured: string; network: string; failed: string };
    genErrors: { quota: string; not_configured: string; network: string; failed: string };
    revisionNoteLabel: string;
    revisionNotePlaceholder: string;
    publishNow: string;
    publishErrorBanner: string;
    syncMetrics: string;
    strategy: {
      title: string;
      objective: string;
      contentPillar: string;
      creativeDirection: string;
    };
    copy: {
      title: string;
      headline: string;
      supportingCopy: string;
      caption: string;
      callToAction: string;
      hashtags: string;
    };
    schedule: {
      title: string;
      publishAt: string;
      notScheduled: string;
      platform: string;
      instagram: string;
      account: string;
      connect: string;
      scheduleButton: string;
      rescheduleButton: string;
    };
  };
  brandBrain: {
    title: string;
    description: (brandName: string) => string;
    yourBrand: string;
    emptyTitle: string;
    emptyDescription: string;
    edit: string;
    positioning: {
      title: string;
      mission: string;
      vision: string;
      positioning: string;
      targetAudience: string;
      notDefined: string;
    };
    contentPillars: { title: string; emptyTitle: string; emptyDescription: string };
    voiceAndCopy: {
      title: string;
      toneAttributes: string;
      always: string;
      never: string;
      nothingDefined: string;
    };
    visualRules: { title: string; palette: string; typography: string; avoid: string };
    forbiddenClaims: { title: string; notice: string; claims: string };
    editForm: {
      title: string;
      save: string;
      cancel: string;
      listHint: string;
      pillarsHint: string;
      fields: {
        mission: string;
        vision: string;
        positioning: string;
        targetAudience: string;
        toneAttributes: string;
        toneDo: string;
        toneDont: string;
        palette: string;
        typography: string;
        composition: string;
        visualAvoid: string;
        copyLanguage: string;
        readingLevel: string;
        copyDo: string;
        copyDont: string;
        forbiddenClaims: string;
        contentPillars: string;
      };
    };
  };
  assets: {
    title: string;
    description: string;
    uploadAsset: string;
    trustedNotice: string;
    emptyTitle: string;
    emptyDescription: string;
    uploadForm: { name: string; type: string; file: string; submit: string };
    remove: string;
    removeConfirm: string;
  };
  analytics: {
    title: string;
    description: string;
    metrics: { impressions: string; reach: string; engagement: string; profileVisits: string };
    noAccountConnected: string;
    notYetSynced: string;
    connectTitle: string;
    connectDescription: string;
    goToIntegrations: string;
    noSyncTitle: string;
    noSyncDescription: string;
  };
  settings: {
    title: string;
    description: string;
    integrations: {
      title: string;
      instagram: {
        title: string;
        description: string;
        connect: string;
        connected: (username: string) => string;
        formAccountName: string;
        formExternalId: string;
        formExternalIdHint: string;
        formAccessToken: string;
        formAccessTokenHint: string;
        formSubmit: string;
        connectedBanner: string;
        errorBanner: string;
      };
      gemini: { title: string; description: string; serverSide: string };
    };
    brand: {
      title: string;
      noDescriptionYet: string;
      manage: string;
      addBrand: string;
      createFirstBrand: string;
      multiBrandNotice: string;
      newBrand: string;
      brandNameLabel: string;
      brandNamePlaceholder: string;
    };
    account: {
      title: string;
      signedInAs: string;
      signOut: string;
    };
    notifications: {
      title: string;
      approvalRequired: { title: string; description: string };
      publishFailures: { title: string; description: string };
      notConfigured: string;
    };
  };
  inbox: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  localeSwitcher: {
    label: string;
    tr: string;
    en: string;
    switchToTurkish: string;
    switchToEnglish: string;
  };
  creativePreview: {
    label: (headline: string) => string;
    emptyLabel: string;
    awaitingGeneration: string;
  };
  notFound: {
    title: string;
    description: string;
    backToDashboard: string;
  };
  notificationsPage: {
    title: string;
    description: string;
    markAllRead: string;
    markRead: string;
    emptyTitle: string;
    emptyDescription: string;
    type: Record<NotificationType, string>;
  };
  signIn: {
    title: string;
    subtitle: string;
    continueWithGoogle: string;
  };
}
