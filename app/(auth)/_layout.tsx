import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { hasCompletedOnboarding, loading } = useAuth();

  useEffect(() => {
    if (!loading && hasCompletedOnboarding) {
      router.replace('/(tabs)');
    }
  }, [loading, hasCompletedOnboarding]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="onboarding"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
