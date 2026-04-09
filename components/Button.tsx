import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  useColorScheme,
  Animated,
} from 'react-native';
import Colors from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  loading = false,
  icon,
  fullWidth = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const styles = getStyles(isDark);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
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

  const getButtonStyle = () => {
    const sizeKey = `button${size}` as keyof typeof styles;
    const baseStyle: any[] = [styles.button, styles[sizeKey]];
    
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
    }

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }

    if (fullWidth) {
      baseStyle.push({ width: '100%' });
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const sizeKey = `text${size}` as keyof typeof styles;
    const baseStyle: any[] = [styles.text, styles[sizeKey]];

    switch (variant) {
      case 'outline':
        baseStyle.push({ color: Colors.primary });
        break;
      case 'ghost':
        baseStyle.push({ color: Colors.primary });
        break;
      default:
        baseStyle.push({ color: Colors.white });
    }

    if (disabled || loading) {
      baseStyle.push({ opacity: 0.6 });
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          {icon}
          <Text style={getTextStyle()}>
            {loading ? 'Chargement...' : title}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    button: {
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    buttonPrimary: {
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOpacity: 0.25,
      elevation: 5,
    },
    buttonSecondary: {
      backgroundColor: Colors.secondary,
      shadowColor: Colors.secondary,
      shadowOpacity: 0.15,
      elevation: 4,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      borderColor: Colors.primary,
      shadowOpacity: 0,
    },
    buttonGhost: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonSmall: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      minHeight: 36,
    },
    buttonMedium: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      minHeight: 48,
    },
    buttonLarge: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      minHeight: 56,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    text: {
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    textSmall: {
      fontSize: 12,
    },
    textMedium: {
      fontSize: 15,
    },
    textLarge: {
      fontSize: 17,
    },
  });
