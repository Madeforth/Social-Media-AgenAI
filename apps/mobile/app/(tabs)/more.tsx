import { tokens } from '@apex/ui';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/provider';
import { ChevronRightIcon } from '@/components/icons';
import { Button, Card, ScreenTitle, SectionHeader } from '@/components/ui';
import type { Locale } from '@/i18n/dictionary';
import { useI18n } from '@/i18n/provider';
import {
  createOrganizationAndBrand,
  useBrandAssets,
  useBrandGuidelines,
  useCurrentBrand,
} from '@/lib/data';

interface Entry {
  title: string;
  detail: string;
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { locale, dictionary, setLocale } = useI18n();
  const copy = dictionary.more;
  const { session, signOut } = useAuth();
  const brand = useCurrentBrand();
  const guidelines = useBrandGuidelines();
  const assets = useBrandAssets();
  const [brandName, setBrandName] = useState('');
  const [creating, setCreating] = useState(false);

  const pillarCount = guidelines.data?.content_pillars.length ?? 0;

  const brandEntries: Entry[] = [
    {
      title: copy.brandBrain,
      detail: pillarCount === 0 ? copy.notDefinedYet : copy.pillarCount(pillarCount),
    },
    {
      title: copy.assets,
      detail: assets.data.length === 0 ? copy.noAssetsYet : copy.assetCount(assets.data.length),
    },
  ];

  const settingsEntries: Entry[] = [
    { title: copy.instagram, detail: copy.notConnected },
    { title: copy.notifications, detail: copy.notConfigured },
  ];

  async function handleCreateBrand() {
    if (!session || !brandName.trim() || creating) return;
    setCreating(true);
    const { error } = await createOrganizationAndBrand(brandName.trim(), session.user.id);
    setCreating(false);
    if (!error) setBrandName('');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + tokens.space.md, paddingBottom: tokens.space['2xl'] },
      ]}
    >
      <ScreenTitle title={copy.title} />

      <View style={styles.section}>
        <SectionHeader title={copy.brand} />
        <Card>
          {brandEntries.map((entry, index) => (
            <Row key={entry.title} entry={entry} divided={index > 0} />
          ))}
        </Card>
        {!brand.loading && !brand.data ? (
          <Card style={styles.languageCard}>
            <Text style={styles.languageDescription}>{copy.createBrandDescription}</Text>
            <TextInput
              value={brandName}
              onChangeText={setBrandName}
              placeholder={copy.brandNamePlaceholder}
              placeholderTextColor={tokens.color.textMuted}
              accessibilityLabel={copy.brandNameLabel}
              style={styles.textInput}
            />
            <Button
              label={copy.createBrand}
              variant="primary"
              disabled={!brandName.trim() || creating}
              onPress={handleCreateBrand}
            />
          </Card>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title={copy.settings} />
        <Card>
          {settingsEntries.map((entry, index) => (
            <Row key={entry.title} entry={entry} divided={index > 0} />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={copy.language} />
        <Card style={styles.languageCard}>
          <Text style={styles.languageDescription}>{copy.languageDescription}</Text>
          <View style={styles.languageOptions}>
            <LanguageOption
              locale="tr"
              label={copy.turkish}
              selected={locale === 'tr'}
              onSelect={setLocale}
            />
            <LanguageOption
              locale="en"
              label={copy.english}
              selected={locale === 'en'}
              onSelect={setLocale}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={copy.account} />
        <Card style={styles.languageCard}>
          <Text style={styles.languageDescription}>{session?.user.email ?? ''}</Text>
          <Button label={copy.signOut} onPress={() => void signOut()} />
        </Card>
      </View>
    </ScrollView>
  );
}

function LanguageOption({
  locale,
  label,
  selected,
  onSelect,
}: {
  locale: Locale;
  label: string;
  selected: boolean;
  onSelect: (locale: Locale) => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(locale)}
      style={({ pressed }) => [
        styles.languageOption,
        selected && styles.languageOptionSelected,
        pressed && styles.languageOptionPressed,
      ]}
    >
      <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function Row({ entry, divided }: { entry: Entry; divided: boolean }) {
  return (
    <View style={[styles.row, divided && styles.rowDivider]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{entry.title}</Text>
        <Text style={styles.rowDetail}>{entry.detail}</Text>
      </View>
      <ChevronRightIcon color={tokens.color.textMuted} size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { paddingHorizontal: tokens.space.md, gap: tokens.space.lg },
  section: { gap: tokens.space.sm },
  languageCard: { padding: tokens.space.md, gap: tokens.space.sm },
  textInput: {
    height: 44,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surfaceRaised,
    paddingHorizontal: tokens.space.md,
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
  },
  languageDescription: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  languageOptions: { flexDirection: 'row', gap: tokens.space.sm },
  languageOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surfaceRaised,
  },
  languageOptionSelected: {
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
  },
  languageOptionPressed: { opacity: 0.75 },
  languageLabel: { color: tokens.color.textSecondary, fontSize: tokens.fontSize.sm },
  languageLabelSelected: { color: tokens.color.accent, fontWeight: tokens.fontWeight.medium },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.color.border },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.base },
  rowDetail: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
});
