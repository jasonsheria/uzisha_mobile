import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  ScrollView, // Ajouté
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const SCREENS = [
  {
    id: '1',
    title: 'Trouvez votre\nbien parfait',
    description: 'Explorez des propriétés exceptionnelles à Goma et partout en RDC, adaptées à votre budget.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6199f7ea8f?w=1200',
    colors: ['#020617', '#0891B2'],
  },
  {
    id: '2',
    title: 'Réservez en\nun instant',
    description: 'Une visite physique ou une nuit d’hôtel ? Payez en ligne ou réservez en quelques clics.',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
    colors: ['#020617', '#6D28D9'],
  },
  {
    id: '3',
    title: 'Commandez votre\nrepas favori',
    description: 'Faites-vous livrer les meilleurs plats des restaurants locaux directement chez vous.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    colors: ['#020617', '#BE185D'],
  },
  {
    id: '4',
    title: 'Bienvenue chez\nUzisha App',
    description: 'Rejoignez la plus grande communauté immobilière et lifestyle du pays.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    colors: ['#020617', '#D97706'],
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null); // Référence pour le scroll
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fonction pour aller à la page suivante ou finir
  const handleNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* BACKGROUND IMAGES LAYER */}
      {SCREENS.map((screen, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });

        return (
          <Animated.Image
            key={`img-${screen.id}`}
            source={{ uri: screen.image }}
            style={[StyleSheet.absoluteFill, { opacity }]}
            resizeMode="cover"
          />
        );
      })}

      <LinearGradient
        colors={['transparent', 'rgba(2,6,23,0.3)', 'rgba(2,6,23,0.95)', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.ScrollView
        ref={scrollViewRef} // Liaison de la référence
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false, 
            listener: (event: any) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              if(index !== currentIndex) setCurrentIndex(index);
            }
          }
        )}
        scrollEventThrottle={16}
      >
        {SCREENS.map((screen, index) => (
          <View key={screen.id} style={styles.slide}>
            <SafeAreaView style={styles.contentContainer}>
              <View style={styles.spacer} />
              <Animated.View style={[styles.textWrapper, {
                opacity: scrollX.interpolate({
                  inputRange: [(index - 0.5) * width, index * width, (index + 0.5) * width],
                  outputRange: [0, 1, 0],
                }),
                transform: [{
                  translateY: scrollX.interpolate({
                    inputRange: [(index - 0.5) * width, index * width, (index + 0.5) * width],
                    outputRange: [20, 0, 20],
                  })
                }]
              }]}>
                <Text style={styles.title}>{screen.title}</Text>
                <Text style={styles.description}>{screen.description}</Text>
              </Animated.View>
            </SafeAreaView>
          </View>
        ))}
      </Animated.ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SCREENS.map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View 
                key={index} 
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: SCREENS[currentIndex].colors[1] }]} 
              />
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>

          {/* Correction ici : handleNext au lieu de handleFinish */}
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient
              colors={SCREENS[currentIndex].colors as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === SCREENS.length - 1 ? "Commencer" : "Suivant"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  slide: { width: width, height: height },
  contentContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'flex-end', paddingBottom: 180 },
  spacer: { flex: 1 },
  textWrapper: { alignItems: 'flex-start' },
  title: { fontSize: 42, fontWeight: '900', color: '#FFF', lineHeight: 50, letterSpacing: -1, marginBottom: 20 },
  description: { fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 28, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 30, paddingBottom: 50 },
  pagination: { flexDirection: 'row', marginBottom: 40 },
  dot: { height: 6, borderRadius: 3, marginRight: 8 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 20, gap: 8 },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});