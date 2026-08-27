import { tokens } from '@apex/ui';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  style,
}: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) =>
        // Flattened, not an array: <Link asChild> renders this through <Slot>,
        // which cannot merge an array of styles onto the cloned child.
        StyleSheet.flatten([
          styles.button,
          primary ? styles.buttonPrimary : styles.buttonSecondary,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
          style,
        ])
      }
    >
      <Text style={[styles.buttonLabel, primary ? styles.buttonLabelPrimary : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{description}</Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenTitle}>
      <Text style={styles.screenTitleText}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.sm,
  },
  sectionTitle: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
  },
  button: {
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space.md,
  },
  buttonPrimary: { backgroundColor: tokens.color.accent },
  buttonSecondary: {
    backgroundColor: tokens.color.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
  },
  buttonPressed: { opacity: 0.75 },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
  },
  buttonLabelPrimary: { color: '#04252b' },
  empty: {
    paddingVertical: tokens.space['2xl'],
    paddingHorizontal: tokens.space.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
  },
  emptyBody: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.sm,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  screenTitle: { marginBottom: tokens.space.lg },
  screenTitleText: {
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.semibold,
  },
  screenSubtitle: {
    color: tokens.color.textSecondary,
    fontSize: tokens.fontSize.sm,
    marginTop: 4,
    lineHeight: 20,
  },
});
