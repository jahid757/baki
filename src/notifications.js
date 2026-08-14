import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('due-alerts', {
      name: 'Due alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function sendDueAlert(shopName, dueAmount, level, currency) {
  const title = level === 'danger' ? `High due at ${shopName}` : `Due getting close at ${shopName}`;
  const body = `Your due is now ${currency}${dueAmount.toFixed(2)}.`;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, channelId: 'due-alerts' },
      trigger: null, // fire immediately
    });
  } catch (e) {
    // Permission denied or unavailable — fail silently, app still works
  }
}