import { tokens } from '@apex/ui';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

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

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  multiline?: boolean;
}

/** A labeled text input, single or multi-line, matching the app's field styling. */
export function Field({ label, hint, multiline, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <TextInput
        placeholderTextColor={tokens.color.textMuted}
        multiline={multiline}
        style={StyleSheet.flatten([
          styles.input,
          multiline && styles.inputMultiline,
          style as object,
        ])}
        {...props}
      />
    </View>
  );
}

export function Banner({ tone, text }: { tone: 'accent' | 'error'; text: string }) {
  return (
    <View style={[styles.banner, tone === 'error' ? styles.bannerError : styles.bannerAccent]}>
      <Text style={tone === 'error' ? styles.bannerTextError : styles.bannerTextAccent}>
        {text}
      </Text>
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
  field: { gap: 6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fieldLabel: {
    color: tokens.color.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fieldHint: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
  input: {
    minHeight: 44,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surfaceRaised,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    color: tokens.color.textPrimary,
    fontSize: tokens.fontSize.base,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  banner: { borderRadius: tokens.radius.md, borderWidth: 1, padding: tokens.space.sm },
  bannerAccent: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  bannerError: { borderColor: '#7f1d1d', backgroundColor: '#2c0b0b' },
  bannerTextAccent: { color: tokens.color.accent, fontSize: tokens.fontSize.xs },
  bannerTextError: { color: '#fca5a5', fontSize: tokens.fontSize.xs },
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
