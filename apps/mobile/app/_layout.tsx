import { tokens } from '@apex/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n/provider';

export default function RootLayout() {
  return (
    <I18nProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.color.bg },
          }}
        />
      </SafeAreaProvider>
    </I18nProvider>
  );
}
