import { Tabs, useRouter } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  Vibration
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { NetworkProvider } from '@/contexts/NetworkContext';

const { width } = Dimensions.get('window');

/**
 * --- CONFIGURATION GÉOMÉTRIQUE & TYPES ---
 */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;
const FAB_SIZE = 64;
const ICON_SIZE = 24;

interface TabItem {
  label: string;
  icon: (props: { color: string; focused: boolean }) => React.ReactNode;
  badge?: number;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  isDark: boolean;
}

/**
 * --- COMPOSANT DE NAVIGATION PERSONNALISÉ ---
 * Ce composant remplace la barre par défaut d'Expo Router
 */
const EliteDiamondTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  isDark
}) => {

  if (!state || !state.routes) return null;
  const { scrollX, screenWidth } = useTheme(); // Récupère le scrollX animé
  const accentColor = '#06B6D4'; // Indigo Signature
  const bgColor = isDark ? '#0F172A' : '#2f6caa49';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const router = useRouter();
  const tabBackground = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: ['#020617', '#1a1a1a', '#450a0a'], // Couleurs TECH, LUXURY, SPORT
    extrapolate: 'clamp',
  });
  const diamondColor = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: ['#06B6D4', '#d4af37', '#ef4444'], // Couleurs primaires
  });
  // Animations
  const fabAnim = useRef(new Animated.Value(0)).current;
  const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);
  const handleFabPress = () => {
    Vibration.vibrate(10);

    // On réinitialise avant de lancer pour pouvoir cliquer plusieurs fois
    fabAnim.setValue(0);

    Animated.spring(fabAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true, // <--- CHANGÉ À TRUE
    }).start(() => {
      // Optionnel : revenir à 0 doucement ou brutalement
      Animated.timing(fabAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // Navigation (Correction de la virgule et de la syntaxe)
    router.push('/bookings');
    console.log("Elite Action Triggered");
  };

  const fabScale = fabAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.85, 1],
  });

  const fabRotate = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '225deg'],
  });

  // Séparation des routes pour le bouton central
  const routes = state.routes;
  // Filter out hidden routes (href: null) and routes without tabBarIcon
  const visibleRoutes = routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options?.href !== null && options?.tabBarIcon;
  });

  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2, 4);
  const dynamicColor = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: ['#06B6D4', '#d4af37', '#ef4444'], // TECH, LUXURY, SPORT
    extrapolate: 'clamp',
  })
  const renderTabItem = (route: any, index: number) => {
    const { options } = descriptors[route.key];

    if (!options || !options.tabBarIcon) return null;

    const isFocused = state.index === routes.findIndex((r: any) => r.key === route.key);
    const activeColor = isFocused ? dynamicColor : (isDark ? '#64748B' : '#94A3B8');
    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={styles.tabButton}
      >
        {/* ASTUCE : On anime le background de ce conteneur plutôt que la couleur de l'icône.
         C'est beaucoup plus performant et ça évite le crash setNativeProps.
      */}
        <Animated.View style={[
          styles.iconContainer,
          {
            // On change le fond au scroll uniquement pour l'élément focus
            backgroundColor: isFocused
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)')
              : 'transparent'
          }
        ]}>

          {/* On utilise le tabBarIcon normal ici. 
           Pour éviter le crash, on passe une couleur fixe SI l'icône n'est pas focus,
           et 'white' si elle l'est.
        */}
          {options.tabBarIcon({
            color: isFocused ? '#FFF' : (isDark ? '#64748B' : '#94A3B8'),
            focused: isFocused
          })}

          {options.tabBarBadge && (
            <Animated.View style={[
              styles.badgeContainer,
              { backgroundColor: isFocused ? dynamicColor : dynamicColor } // <--- MODIFIÉ
            ]}>
              <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.Text style={[
          styles.label,
          {
            // On garde une couleur de texte stable pour éviter les scintillements
            color: activeColor as any, opacity: isFocused ? 1 : 0.6
          }, // <--- MODIFIÉ

        ]}>
          {options.title}
        </Animated.Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.barContainer}>
      {/* STRUCTURE DE FOND */}
      <Animated.View style={[styles.mainBar, { backgroundColor: bgColor, borderTopColor: 'transparent' }]}>

        {/* SECTION GAUCHE */}
        <View style={styles.tabSection}>
          {leftRoutes.map((route: any, index: number) => renderTabItem(route, index))}
        </View>

        {/* ESPACE VIDE POUR LE DIAMANT */}
        <View style={styles.fabGap} />

        {/* SECTION DROITE */}
        <View style={styles.tabSection}>
          {rightRoutes.map((route: any, index: number) => renderTabItem(route, index))}
        </View>
      </Animated.View>

      {/* LE BOUTON DIAMANT FLOTTANT */}
      {/* LE BOUTON DIAMANT FLOTTANT */}
      <Animated.View style={[
        styles.fabWrapper,
        {
          transform: [{ scale: fabScale }] // Utilise le driver natif
        }
      ]}>
        <Pressable onPress={handleFabPress}>
          <Animated.View style={[
            styles.diamondShape,
            {
              backgroundColor: dynamicColor, // Attention: l'animation de couleur n'est PAS native
              transform: [
                { rotate: '45deg' }, // Rotation de base
                { rotate: fabRotate } // Rotation animée (doit être gérée avec précaution)
              ]
            }
          ]}>
            <View style={styles.iconFix}>
              <MaterialCommunityIcons name="plus" size={32} color="white" />
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

/**
 * --- LAYOUT PRINCIPAL EXPO ROUTER ---
 */
export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <NetworkProvider>
      <Tabs
        tabBar={(props) => <EliteDiamondTabBar {...props} isDark={isDark} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="view-dashboard-outline" size={ICON_SIZE} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: 'Recherche',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="map-marker-radius-outline" size={ICON_SIZE} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="messaging"
          options={{
            title: 'Messages',
            tabBarBadge: 5,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chat-processing-outline" size={ICON_SIZE} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="tune" size={ICON_SIZE} color={color} />
            ),
          }}
        />
      </Tabs>
    </NetworkProvider>
  );
}

/**
 * --- STYLES ÉLITE ---
 */
const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: TAB_BAR_HEIGHT + 30,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  mainBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    width: '100%',
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 25 : 5,
  },
  tabSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fabGap: {
    width: FAB_SIZE + 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
    paddingTop: 10,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 14,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  /* FAB DIAMOND STYLES */
  fabWrapper: {
    position: 'absolute',
    top: 0,
    left: width / 2 - FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondShape: {
    width: FAB_SIZE - 6,
    height: FAB_SIZE - 6,
    borderRadius: 18,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconFix: {
    transform: [{ rotate: '-45deg' }],
  },
  glow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: -1,
  },
});