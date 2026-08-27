import { tokens } from '@apex/ui';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>APEX SOCIAL AI</Text>
        <Text style={styles.title}>Workspace bootstrapped</Text>
        <Text style={styles.body}>
          Monorepo, design tokens and shared domain types are in place. Product screens land in the
          next milestone.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    justifyContent: 'center',
    padding: tokens.space.lg,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
  },
  eyebrow: {
    color: tokens.color.accent,
    fontSize: tokens.fontSize.xs,
    letterSpacing: 2,
  },
  title: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.semibold,
    marginTop: tokens.space.sm,
  },
  body: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.base,
    lineHeight: 22,
    marginTop: tokens.space.sm,
  },
});
