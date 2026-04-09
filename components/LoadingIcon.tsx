import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, View, ActivityIndicator } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

interface LoadingIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const LoadingIcon: React.FC<LoadingIconProps> = ({
  size = 20,
  color,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const defaultColor = color || (isDark ? Colors.light.text : Colors.dark.text);

  return (
    <ActivityIndicator
      size={size}
      color={defaultColor}
      style={[styles.container, style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingIcon;
