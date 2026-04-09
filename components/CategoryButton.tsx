import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ViewStyle,
  Animated,
} from 'react-native';
import Colors from '@/constants/Colors';
import { Category } from '@/constants/PropertyCategories';

interface CategoryButtonProps {
  category: Category;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  isSelected = false,
  onPress,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.containerSelected,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        <View
          style={[
            styles.iconContainer,
            isSelected && { 
              backgroundColor: category.color,
              borderColor: 'rgba(255, 255, 255, 0.4)',
              shadowOpacity: 0.25,
              elevation: 6,
            },
          ]}
        >
          <Text style={styles.icon}>{category.icon}</Text>
        </View>
        <Text style={[styles.name, isSelected && styles.nameSelected]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      opacity: 0.65,
      paddingVertical: 8,
    },
    containerSelected: {
      opacity: 1,
    },
    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: 16,
      backgroundColor: isDark 
        ? 'rgba(30, 41, 59, 0.8)' 
        : 'rgba(241, 245, 249, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1.5,
      borderColor: isDark 
        ? 'rgba(148, 163, 184, 0.2)' 
        : 'rgba(226, 232, 240, 0.6)',
    },
    icon: {
      fontSize: 30,
    },
    name: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : Colors.gray600,
      textAlign: 'center',
      marginTop: 6,
    },
    nameSelected: {
      color: isDark ? Colors.dark.text : '#0F172A',
      fontWeight: '700',
    },
  });
