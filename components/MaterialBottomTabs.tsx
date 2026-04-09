import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// --- TYPES ---
interface TabItem {
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MaterialBottomTabsProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  onFabPress?: () => void;
  fabIcon?: React.ReactNode;
  isDark?: boolean;
}

const TAB_BAR_HEIGHT = 70;
const FAB_SIZE = 62;

export const MaterialBottomTabs: React.FC<MaterialBottomTabsProps> = ({
  tabs,
  activeIndex,
  onTabPress,
  onFabPress,
  fabIcon,
  isDark = true,
}) => {
  const accentColor = '#06B6D4';
  const animation = useRef(new Animated.Value(0)).current;

  const handleFabPress = () => {
    Animated.spring(animation, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start(() => animation.setValue(0));
    onFabPress?.();
  };

  const scale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.82, 1],
  });

  const leftTabs = tabs.slice(0, Math.ceil(tabs.length / 2));
  const rightTabs = tabs.slice(Math.ceil(tabs.length / 2));

  const renderTab = (tab: TabItem, index: number, realIndex: number) => {
    const isActive = activeIndex === realIndex;
    return (
      <Pressable
        key={`tab-${realIndex}`}
        onPress={() => onTabPress(realIndex)}
        style={styles.tab}
      >
        <View style={[
          styles.iconWrapper, 
          isActive && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.05)' }
        ]}>
          <View style={{ opacity: isActive ? 1 : 0.4 }}>
            {tab.icon}
          </View>
          {tab.badge !== undefined && tab.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.label, 
          { color: isActive ? accentColor : (isDark ? '#64748B' : '#94A3B8') }
        ]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.tabsBar, 
        { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }
      ]}>
        <View style={styles.section}>{leftTabs.map((t: TabItem, i: number) => renderTab(t, i, i))}</View>
        
        <View style={styles.fabSpace} />
        
        <View style={styles.section}>
          {rightTabs.map((t: TabItem, i: number) => renderTab(t, i, i + leftTabs.length))}
        </View>
      </View>

      {/* FAB Central Flottant */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale }] }]}>
        <Pressable onPress={handleFabPress} style={styles.fabPressable}>
          <View style={[styles.fabDiamond, { backgroundColor: accentColor }]}>
            <View style={styles.iconRotate}>
              {fabIcon || <Text style={styles.plus}>+</Text>}
            </View>
          </View>
          {/* Ombre portée personnalisée */}
          <View style={[styles.glow, { backgroundColor: accentColor }]} />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: TAB_BAR_HEIGHT + 25,
    justifyContent: 'flex-end',
  },
  tabsBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    width: '100%',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fabSpace: { width: FAB_SIZE + 10 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 65 },
  iconWrapper: {
    width: 42,
    height: 30,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  fabContainer: {
    position: 'absolute',
    top: 0,
    left: width / 2 - FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 99,
  },
  fabPressable: { alignItems: 'center', justifyContent: 'center' },
  fabDiamond: {
    width: FAB_SIZE - 8,
    height: FAB_SIZE - 8,
    borderRadius: 18,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  iconRotate: { transform: [{ rotate: '-45deg' }] },
  glow: {
    position: 'absolute',
    bottom: -10,
    width: 30,
    height: 15,
    borderRadius: 10,
    opacity: 0.4,
    zIndex: -1,
  },
  plus: { fontSize: 32, color: '#FFF', fontWeight: '300' }
});