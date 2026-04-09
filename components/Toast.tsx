import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onHide: (id: string) => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const [slideAnim] = useState(new Animated.Value(300));

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();

    if (message.duration && message.duration > 0) {
      const timer = setTimeout(() => {
        handleHide();
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleHide = () => {
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start(() => {
      onHide(message.id);
    });
  };

  const getColors = () => {
    switch (message.type) {
      case 'error':
        return {
          bgColor: '#FEE2E2',
          textColor: '#991B1B',
          iconColor: '#DC2626',
          icon: 'alert-circle',
        };
      case 'success':
        return {
          bgColor: '#DCFCE7',
          textColor: '#166534',
          iconColor: '#16A34A',
          icon: 'check-circle',
        };
      case 'warning':
        return {
          bgColor: '#FEF3C7',
          textColor: '#92400E',
          iconColor: '#FBBF24',
          icon: 'alert',
        };
      case 'info':
      default:
        return {
          bgColor: '#DBEAFE',
          textColor: '#0C4A6E',
          iconColor: '#0EA5E9',
          icon: 'information',
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: colors.bgColor }]}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={colors.icon as any}
            size={24}
            color={colors.iconColor}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: colors.textColor }]}>
            {message.message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleHide}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
