import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 0,
    title: 'FINDORA',
    subtitle: 'Dream House',
    description: 'Find your next space, feel at home\nWhere comfort meets convenience',
    icon: '🏠',
    color: '#87CEEB',
    isWelcome: true,
  },
  {
    id: 1,
    title: 'Trouvez votre bien parfait',
    description: 'Explorez des milliers de propriétés parmi les meilleures annonces immobilières',
    icon: '🏠',
    color: '#3B82F6',
  },
  {
    id: 2,
    title: 'Réservez facilement',
    description: 'Réservez votre propriété en quelques clics et gérez vos réservations',
    icon: '📅',
    color: '#8B5CF6',
  },
  {
    id: 3,
    title: 'Profitez d\'offres spéciales',
    description: 'Accédez à des réductions exclusives et à des offres limitées',
    icon: '✨',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
    scrollX.setValue(contentOffsetX);
  };

  const handleStartApp = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    handleStartApp();
  };

  const goToNextSlide = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      handleStartApp();
    }
  };

  // Animation parallax pour les icônes
  const getIconAnimValue = (slideIndex: number) => {
    return scrollX.interpolate({
      inputRange: [(slideIndex - 1) * width, slideIndex * width, (slideIndex + 1) * width],
      outputRange: [50, 0, -50],
      extrapolate: 'clamp',
    });
  };

  // Animation parallax pour le texte
  const getTextOpacity = (slideIndex: number) => {
    return scrollX.interpolate({
      inputRange: [(slideIndex - 0.5) * width, slideIndex * width, (slideIndex + 0.5) * width],
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#FFFFFF' }]}>
      {/* Skip Button - Hide on welcome slide */}
      {currentIndex > 0 && currentIndex < ONBOARDING_SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Ignorer</Text>
        </TouchableOpacity>
      )}

      {/* Carousel Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            {slide.isWelcome ? (
              // Welcome Slide - Special Design
              <>
                <View style={[styles.welcomeIllustration, { backgroundColor: slide.color }]}>
                  <Text style={styles.welcomeIcon}>{slide.icon}</Text>
                </View>
                <View style={styles.welcomeContentContainer}>
                  <Text style={styles.welcomeTitle}>{slide.title}</Text>
                  <Text style={styles.welcomeSubtitle}>{slide.subtitle}</Text>
                  <Text style={[styles.description, { marginTop: 16 }]}>{slide.description}</Text>
                </View>
              </>
            ) : (
              // Regular Slides
              <>
                <View style={[styles.illustrationContainer, { backgroundColor: slide.color }]}>
                  <Text style={styles.icon}>{slide.icon}</Text>
                </View>
                <View style={styles.contentContainer}>
                  <Text style={styles.title}>{slide.title}</Text>
                  <Text style={styles.description}>{slide.description}</Text>
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Indicators */}
      <View style={styles.indicatorContainer}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentIndex ? Colors.primary : Colors.gray300,
                width: index === currentIndex ? 32 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom Actions */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={goToNextSlide}
        >
          <Text style={styles.buttonText}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional spacing */}
      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : '#FFFFFF',
    },
    skipButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary,
    },
    carousel: {
      flex: 1,
    },
    slide: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    illustrationContainer: {
      width: 280,
      height: 280,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    icon: {
      fontSize: 100,
    },
    welcomeIcon: {
      fontSize: 120,
    },
    welcomeIllustration: {
      width: 300,
      height: 300,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    welcomeContentContainer: {
      alignItems: 'center',
      marginTop: 32,
    },
    welcomeTitle: {
      fontSize: 42,
      fontWeight: '900',
      color: isDark ? Colors.dark.text : Colors.light.text,
      letterSpacing: 1,
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 18,
      color: isDark ? Colors.dark.text + '99' : Colors.light.text + '99',
      fontWeight: '500',
      marginBottom: 8,
    },
    contentContainer: {
      alignItems: 'center',
      marginVertical: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? Colors.dark.text : Colors.light.text,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 16,
      color: isDark ? Colors.dark.text + 'CC' : Colors.light.text + 'CC',
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: '500',
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 20,
    },
    indicator: {
      borderRadius: 4,
      height: 8,
    },
    buttonContainer: {
      paddingHorizontal: 24,
      gap: 12,
    },
    button: {
      paddingVertical: 16,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    primaryButton: {
      backgroundColor: Colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
  });
