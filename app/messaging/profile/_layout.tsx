import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="[agentId]"
        options={{
          title: 'Profil Agent',
        }}
      />
    </Stack>
  );
}
