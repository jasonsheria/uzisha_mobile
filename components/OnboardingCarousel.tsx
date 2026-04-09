import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
  ViewStyle,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { Button } from './Button';

export interface OnboardingScreen {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface OnboardingCarouselProps {
  screens: OnboardingScreen[];
  onComplete: () => void;
  style?: ViewStyle;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  screens,
  onComplete,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentIndex * width,
      animated: true,
    });
  }, [currentIndex, width]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const isLastScreen = currentIndex === screens.length - 1;

  return (
    <View style={[styles.container, style]}>
      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => (
          <View
            key={screen.id}
            style={[styles.slide, { width }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: screen.color }]}>
              <Text style={styles.icon}>{screen.icon}</Text>
            </View>
            <Text style={styles.title}>{screen.title}</Text>
            <Text style={styles.description}>{screen.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicators */}
      <View style={styles.indicators}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentIndex ? Colors.primary : Colors.gray300,
                width: index === currentIndex ? 28 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button
          title={isLastScreen ? 'Commencer' : 'Suivant'}
          onPress={goToNext}
          variant="primary"
          fullWidth
          size="large"
        />
      </View>

      {/* Skip Button */}
      {!isLastScreen && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
        >
          <Text style={styles.skipText}>Ignorer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.white,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : Colors.black,
      textAlign: 'center',
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      color: Colors.gray600,
      textAlign: 'center',
      lineHeight: 22,
    },
    indicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      gap: 6,
    },
    indicator: {
      height: 8,
      borderRadius: 4,
    },
    actions: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    skipButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    skipText: {
      color: Colors.gray600,
      fontSize: 14,
      fontWeight: '600',
    },
  });
