import type { PostStatus } from '@apex/types';
import { POST_STATUS_PRESENTATION, tokens } from '@apex/ui';
import { StyleSheet, Text, View } from 'react-native';

export function StatusChip({ status }: { status: PostStatus }) {
  const { label, tint, surface } = POST_STATUS_PRESENTATION[status];
  return (
    <View style={[styles.chip, { backgroundColor: surface }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: tokens.fontWeight.medium },
});
