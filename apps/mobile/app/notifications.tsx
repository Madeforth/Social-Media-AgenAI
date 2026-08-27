import { tokens } from '@apex/ui';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, ScreenTitle } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { markAllNotificationsRead, markNotificationRead, useNotifications } from '@/lib/data';

export default function NotificationsScreen() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const copy = dictionary.notificationsScreen;
  const { data: notifications, loading, refetch } = useNotifications();

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    refetch();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    refetch();
  }

  const hasUnread = notifications.some((notification) => !notification.read_at);

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
      {hasUnread ? (
        <Button label={copy.markAllRead} onPress={() => void handleMarkAllRead()} />
      ) : null}

      {!loading && notifications.length === 0 ? (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        notifications.map((notification) => {
          const postId =
            notification.payload && typeof notification.payload.post_id === 'string'
              ? notification.payload.post_id
              : null;
          return (
            <Pressable
              key={notification.id}
              style={styles.row}
              onPress={() => postId && router.push(`/posts/${postId}`)}
            >
              <View style={styles.rowBody}>
                <Text style={styles.type}>{copy.type[notification.type]}</Text>
                <Text style={notification.read_at ? styles.titleRead : styles.title}>
                  {notification.title}
                </Text>
                {notification.body ? <Text style={styles.body}>{notification.body}</Text> : null}
              </View>
              {!notification.read_at ? (
                <Button
                  label={copy.markRead}
                  onPress={() => void handleMarkRead(notification.id)}
                />
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.space.md, gap: tokens.space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
  rowBody: { flex: 1, gap: 2 },
  type: {
    color: tokens.color.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { color: tokens.color.textPrimary, fontSize: tokens.fontSize.sm },
  titleRead: { color: tokens.color.textSecondary, fontSize: tokens.fontSize.sm },
  body: { color: tokens.color.textMuted, fontSize: tokens.fontSize.xs },
});
