import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#12131a' },
        headerTintColor: '#ffffff',
        contentStyle: { backgroundColor: '#12131a' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="goals" options={{ title: 'Metas' }} />
    </Stack>
  );
}