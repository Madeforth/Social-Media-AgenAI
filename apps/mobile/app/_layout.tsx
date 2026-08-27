import { tokens } from '@apex/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/provider';
import { I18nProvider } from '@/i18n/provider';

function Navigation() {
  const { session, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.color.bg },
      }}
    >
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="posts/[postId]" />
        <Stack.Screen name="brand-brain" />
        <Stack.Screen name="assets" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="connect-instagram" />
        <Stack.Screen name="connect-gemini" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Navigation />
        </SafeAreaProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
