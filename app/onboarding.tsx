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
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const SCREENS = [
  {
    id: '1',
    title: 'Uzisha\nEn Ligne',
    description: 'Transformez votre commerce. Boutique, restaurant ou agence : devenez visible partout, instantanément.',
    image: require('../assets/images/first (2).jpg'),
    colors: ['#06B6D4', '#0284C7'],
  },
  {
    id: '2',
    title: 'Réservez en\nUn Instant',
    description: 'Immobilier ou hôtellerie. Planifiez vos visites ou réservez votre séjour en quelques clics sécurisés.',
    image: require('../assets/images/second.jpg'),
    colors: ['#8B5CF6', '#6D28D9'],
  },
  {
    id: '3',
    title: 'Le Goût du\nPrivilège',
    description: 'Les meilleures tables de la ville livrées chez vous avec une expérience de service inégalée.',
    image: require('../assets/images/third.jpg'),
    colors: ['#F43F5E', '#BE185D'],
  },
  {
    id: '4',
    title: 'Rejoignez\nL’Élite',
    description: 'La plus grande communauté de commerçants et d’investisseurs immobiliers vous attend.',
    image: require('../assets/images/wenze.png'),
    colors: ['#F59E0B', '#D97706'],
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

      {/* BACKGROUND LAYER - CENTRAGE ABSOLU MATHÉMATIQUE */}
      <View style={StyleSheet.absoluteFill}>
        {SCREENS.map((screen, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={`img-container-${screen.id}`}
              style={[
                StyleSheet.absoluteFill,
                { 
                  opacity, 
                  justifyContent: 'center', // Centre verticalement
                  alignItems: 'center',     // Centre horizontalement
                  backgroundColor: '#020617' 
                }
              ]}
            >
              <Animated.Image
                source={screen.image}
                style={[styles.clip]}
                resizeMode="cover"   // L'image reste entière et centrée
              />
            </Animated.View>
          );
        })}
      </View>

      {/* GRADIENT OVERLAY */}
      <LinearGradient
        colors={['transparent', 'rgba(2,6,23,0.4)', 'rgba(2,6,23,0.9)', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      {/* CONTENT LAYER */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: true, 
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
              <Animated.View style={[styles.textWrapper, {
                 opacity: scrollX.interpolate({
                  inputRange: [(index - 0.4) * width, index * width, (index + 0.4) * width],
                  outputRange: [0, 1, 0],
                }),
                transform: [{
                  translateY: scrollX.interpolate({
                    inputRange: [(index - 0.4) * width, index * width, (index + 0.4) * width],
                    outputRange: [40, 0, -40],
                  })
                }]
              }]}>
                <Text style={styles.title}>{screen.title}</Text>
                <View style={[styles.titleLine, { backgroundColor: screen.colors[0] }]} />
                <Text style={styles.description}>{screen.description}</Text>
              </Animated.View>
            </SafeAreaView>
          </View>
        ))}
      </Animated.ScrollView>

      {/* FOOTER FIXED */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SCREENS.map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 32, 8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View 
                key={index} 
                style={[styles.dot, { 
                  width: dotWidth, 
                  backgroundColor: currentIndex === index ? SCREENS[currentIndex].colors[0] : 'rgba(255,255,255,0.2)' 
                }]} 
              />
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>PASSER</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={SCREENS[currentIndex].colors as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === SCREENS.length - 1 ? "EXPLORER" : "SUIVANT"}
              </Text>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons 
                  name={currentIndex === SCREENS.length - 1 ? "rocket-launch" : "arrow-right"} 
                  size={20} 
                  color="#FFF" 
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  clip : {

    width : '100%',
    height : 800
  },
  slide: { width: width, height: height },
  contentContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'flex-end', paddingBottom: 220 },
  textWrapper: { alignItems: 'flex-start' },
  title: { fontSize: 44, fontWeight: '900', color: '#FFF', lineHeight: 48, letterSpacing: -2, fontStyle: 'italic' },
  titleLine: { height: 5, width: 60, marginTop: 10, marginBottom: 20, borderRadius: 5 },
  description: { fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 24, fontWeight: '400' },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 30, paddingBottom: 60 },
  pagination: { flexDirection: 'row', marginBottom: 35, alignItems: 'center' },
  dot: { height: 6, borderRadius: 10, marginRight: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingLeft: 25, paddingRight: 8, paddingVertical: 8, borderRadius: 40, gap: 12 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  iconCircle: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
});