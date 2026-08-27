import { tokens } from '@apex/ui';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button, Field, ScreenTitle } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { updateBrandGuidelines, useBrandGuidelines, useCurrentBrand } from '@/lib/data';

const lines = (values: string[] | undefined) => (values ?? []).join('\n');

export default function BrandBrainScreen() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const copy = dictionary.brandBrainEdit;
  const brand = useCurrentBrand();
  const guidelines = useBrandGuidelines();

  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [positioning, setPositioning] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentPillarsRaw, setContentPillarsRaw] = useState('');
  const [toneAttributes, setToneAttributes] = useState('');
  const [toneDo, setToneDo] = useState('');
  const [toneDont, setToneDont] = useState('');
  const [palette, setPalette] = useState('');
  const [typography, setTypography] = useState('');
  const [visualAvoid, setVisualAvoid] = useState('');
  const [copyDo, setCopyDo] = useState('');
  const [copyDont, setCopyDont] = useState('');
  const [forbiddenClaims, setForbiddenClaims] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!guidelines.data) return;
    setMission(guidelines.data.mission ?? '');
    setVision(guidelines.data.vision ?? '');
    setPositioning(guidelines.data.positioning ?? '');
    setTargetAudience(guidelines.data.target_audience ?? '');
    setContentPillarsRaw(
      guidelines.data.content_pillars
        .map(
          (pillar) =>
            `${pillar.name} | ${pillar.description} | ${Math.round(pillar.target_share * 100)}`,
        )
        .join('\n'),
    );
    setToneAttributes(lines(guidelines.data.tone_of_voice?.attributes));
    setToneDo(lines(guidelines.data.tone_of_voice?.do));
    setToneDont(lines(guidelines.data.tone_of_voice?.dont));
    setPalette(lines(guidelines.data.visual_rules?.palette));
    setTypography(lines(guidelines.data.visual_rules?.typography));
    setVisualAvoid(lines(guidelines.data.visual_rules?.avoid));
    setCopyDo(lines(guidelines.data.copy_rules?.do));
    setCopyDont(lines(guidelines.data.copy_rules?.dont));
    setForbiddenClaims(lines(guidelines.data.forbidden_claims));
  }, [guidelines.data]);

  async function handleSave() {
    if (!brand.data) return;
    setSaving(true);
    await updateBrandGuidelines(brand.data.id, {
      mission,
      vision,
      positioning,
      targetAudience,
      toneAttributes: toneAttributes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      toneDo: toneDo
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      toneDont: toneDont
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      palette: palette
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      typography: typography
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      visualAvoid: visualAvoid
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      copyDo: copyDo
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      copyDont: copyDont
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      forbiddenClaims: forbiddenClaims
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      contentPillarsRaw,
    });
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: copy.title,
          headerStyle: { backgroundColor: tokens.color.surface },
          headerTintColor: tokens.color.textPrimary,
        }}
      />
      <ScreenTitle title={copy.title} />
      <Field label={copy.missionLabel} value={mission} onChangeText={setMission} multiline />
      <Field label={copy.visionLabel} value={vision} onChangeText={setVision} multiline />
      <Field
        label={copy.positioningLabel}
        value={positioning}
        onChangeText={setPositioning}
        multiline
      />
      <Field
        label={copy.targetAudienceLabel}
        value={targetAudience}
        onChangeText={setTargetAudience}
        multiline
      />
      <Field
        label={copy.contentPillarsLabel}
        hint={copy.contentPillarsHint}
        value={contentPillarsRaw}
        onChangeText={setContentPillarsRaw}
        multiline
      />
      <Field
        label={copy.toneAttributesLabel}
        hint={copy.listHint}
        value={toneAttributes}
        onChangeText={setToneAttributes}
        multiline
      />
      <Field
        label={copy.toneDoLabel}
        hint={copy.listHint}
        value={toneDo}
        onChangeText={setToneDo}
        multiline
      />
      <Field
        label={copy.toneDontLabel}
        hint={copy.listHint}
        value={toneDont}
        onChangeText={setToneDont}
        multiline
      />
      <Field
        label={copy.paletteLabel}
        hint={copy.listHint}
        value={palette}
        onChangeText={setPalette}
        multiline
      />
      <Field
        label={copy.typographyLabel}
        hint={copy.listHint}
        value={typography}
        onChangeText={setTypography}
        multiline
      />
      <Field
        label={copy.visualAvoidLabel}
        hint={copy.listHint}
        value={visualAvoid}
        onChangeText={setVisualAvoid}
        multiline
      />
      <Field
        label={copy.copyDoLabel}
        hint={copy.listHint}
        value={copyDo}
        onChangeText={setCopyDo}
        multiline
      />
      <Field
        label={copy.copyDontLabel}
        hint={copy.listHint}
        value={copyDont}
        onChangeText={setCopyDont}
        multiline
      />
      <Field
        label={copy.forbiddenClaimsLabel}
        hint={copy.listHint}
        value={forbiddenClaims}
        onChangeText={setForbiddenClaims}
        multiline
      />
      <Button
        label={copy.save}
        variant="primary"
        disabled={!brand.data || saving}
        onPress={() => void handleSave()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.space.md, gap: tokens.space.md, paddingBottom: tokens.space['2xl'] },
});
