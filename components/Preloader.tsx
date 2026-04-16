import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Easing,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
// const myLogo = require('../assets/images/logo_uzisha.png');

const Preloader = () => {
  // Valeurs d'animation
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoPulse = useRef(new Animated.Value(1)).current; // Pour la respiration

  const nameFade = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(15)).current;

  const tagFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Séquence d'entrée
    Animated.sequence([
      // Apparition Logo
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      // Apparition Nom
      Animated.parallel([
        Animated.timing(nameFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(nameSlide, { toValue: 0, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      ]),
      // Apparition Tagline + Début chargement
      Animated.parallel([
        Animated.timing(tagFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(progressAnim, {
          toValue: width * 0.75,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
      ]),
    ]).start();

    // 2. Animation de respiration infinie (Boucle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.absoluteOverlay}>
      <StatusBar barStyle="light-content" />

      <View style={styles.centerContainer}>
        
        {/* LOGO ANIMÉ (Scale combine l'entrée et la respiration) */}
        {/* <Animated.View style={{
          opacity: logoFade,
          transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
          marginBottom: 10
        }}>
          <Image source={myLogo} style={styles.logoImage} resizeMode="contain" />
        </Animated.View> */}

        {/* NOM UZISHA */}
        <Animated.View style={{
          opacity: nameFade,
          transform: [{ translateY: nameSlide }]
        }}>
          <Text style={styles.brandName}>UZISHA</Text>
        </Animated.View>

        {/* TAGLINE */}
        <Animated.View style={[styles.taglineWrapper, { opacity: tagFade }]}>
          <View style={styles.dot} />
          <Text style={styles.tagline}>L'IMMOBILIER DE DEMAIN</Text>
          <View style={styles.dot} />
        </Animated.View>

        {/* LOADER DESIGN */}
        <View style={styles.loaderWrapper}>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, { width: progressAnim }]}>
              <LinearGradient
                colors={['#0891B2', '#22D3EE', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.loadingText, { opacity: tagFade }]}>
            Chargement de l'univers...
          </Animated.Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 UZISHA • PREMIUM REAL ESTATE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617', // Midnight Blue Profond
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  brandName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 12,
    textAlign: 'center',
    // Effet de lueur externe
    textShadowColor: 'rgba(34, 211, 238, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  tagline: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 4,
    marginHorizontal: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#06B6D4',
  },
  loaderWrapper: {
    width: width * 0.65,
    marginTop: 60,
    alignItems: 'center',
  },
  track: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

export default Preloader;