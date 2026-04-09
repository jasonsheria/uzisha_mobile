import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function AdminIndex() {
  useEffect(() => {
    // Rediriger automatiquement vers la page articles
    router.replace('/(admin)/articles');
  }, []);

  return null;
}
