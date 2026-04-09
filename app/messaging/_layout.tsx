import { Stack } from 'expo-router';
import React from 'react';

export default function MessagingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
        }}
      />
      <Stack.Screen
        name="[agentId]"
        options={{
          title: 'Messagerie',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profil Agent',
        }}
      />
    </Stack>
  );
}
