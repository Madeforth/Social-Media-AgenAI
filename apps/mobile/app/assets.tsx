import { tokens } from '@apex/ui';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ScreenTitle } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { useBrandAssets } from '@/lib/data';

export default function AssetsScreen() {
  const { dictionary } = useI18n();
  const copy = dictionary.assetsScreen;
  const { data: assets, loading } = useBrandAssets();

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

      {!loading && assets.length === 0 ? (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <View style={styles.grid}>
          {assets.map((asset) => (
            <View key={asset.id} style={styles.tile}>
              <Text style={styles.name} numberOfLines={1}>
                {asset.name}
              </Text>
              <Text style={styles.type}>{asset.asset_type}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.space.md, gap: tokens.space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  tile: {
    width: '48%',
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    gap: 4,
  },
  name: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm },
  type: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
});
