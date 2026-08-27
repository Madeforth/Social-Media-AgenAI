import { tokens } from '@apex/ui';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { useAuth } from '@/auth/provider';
import { Banner, Button, Field, ScreenTitle } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { connectInstagram, useCurrentBrand } from '@/lib/data';

export default function ConnectInstagramScreen() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const copy = dictionary.instagramConnect;
  const { session } = useAuth();
  const brand = useCurrentBrand();

  const [accountName, setAccountName] = useState('');
  const [externalAccountId, setExternalAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit() {
    if (!brand.data || submitting) return;
    setSubmitting(true);
    setError(false);
    const result = await connectInstagram(
      session,
      brand.data.id,
      accountName.trim(),
      externalAccountId.trim(),
      accessToken.trim(),
    );
    setSubmitting(false);
    if (result.ok) router.back();
    else setError(true);
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
      <ScreenTitle title={copy.title} subtitle={copy.description} />
      {error ? <Banner tone="error" text={copy.errorBanner} /> : null}
      <Field label={copy.accountNameLabel} value={accountName} onChangeText={setAccountName} />
      <Field
        label={copy.externalIdLabel}
        hint={copy.externalIdHint}
        value={externalAccountId}
        onChangeText={setExternalAccountId}
      />
      <Field
        label={copy.accessTokenLabel}
        hint={copy.accessTokenHint}
        value={accessToken}
        onChangeText={setAccessToken}
        secureTextEntry
      />
      <Button
        label={copy.submit}
        variant="primary"
        disabled={!brand.data || submitting}
        onPress={() => void handleSubmit()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.space.md, gap: tokens.space.md },
});
