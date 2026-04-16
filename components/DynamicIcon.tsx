import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface DynamicIconProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size: number;
  style?: any;
}

export const DynamicIcon = ({ name, size, style }: DynamicIconProps) => {
  const { dynamicColor } = useTheme();
  const [currentColor, setCurrentColor] = useState<string>('#06B6D4');

  // Correction du nom
  const safeName = (name as string) === 'shield-house' ? 'home-shield' : name;

  useEffect(() => {
    // On écoute les changements de la valeur animée en temps réel
    // Cela évite d'utiliser Animated.Text ou setNativeProps directement
    const listenerId = (dynamicColor as any).addListener((state: { value: string }) => {
      if (state.value) {
        setCurrentColor(state.value);
      }
    });

    return () => {
      (dynamicColor as any).removeListener(listenerId);
    };
  }, [dynamicColor]);

  return (
    <MaterialCommunityIcons
      name={safeName as any}
      size={size}
      color={currentColor} // On utilise l'état local synchronisé
      style={style}
    />
  );
};