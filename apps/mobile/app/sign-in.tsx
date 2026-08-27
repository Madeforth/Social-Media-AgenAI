import { tokens } from '@apex/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/provider';
import { ApexMarkIcon, GoogleIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n/provider';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { dictionary } = useI18n();
  const { signInWithGoogle } = useAuth();
  const copy = dictionary.signIn;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <View style={styles.mark}>
          <ApexMarkIcon size={28} color={tokens.color.accent} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <View style={styles.buttonRow}>
          <GoogleIcon size={18} />
          <Button label={copy.continueWithGoogle} variant="primary" onPress={signInWithGoogle} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.space.sm,
  },
  title: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    textAlign: 'center',
  },
  subtitle: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.sm,
    textAlign: 'center',
    marginBottom: tokens.space.md,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.sm,
  },
});
