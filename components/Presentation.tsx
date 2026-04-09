import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    Dimensions,
    Animated,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    StatusBar,
    ScrollView,
    FlatList,
    ImageBackground,
    Vibration,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BOUTIQUE, Property, PropertyType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
// --- CONFIGURATION ET CONSTANTES ---
const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.85;
const ITEM_SPACING = (width - ITEM_WIDTH) / 2;
const CARD_HEIGHT = height * 0.65;
const retouch = require('../assets/images/retouch.jpg');

// --- TYPES & DONNÉES (MARKETING DATA) ---
const THEMES = {
    TECH: { primary: '#0ea5e9', secondary: '#020617', accent: '#38bdf8', label: 'E-COMMERCE' },
    LUXURY: { primary: '#d4af37', secondary: '#1a1a1a', accent: '#f1e3a0', label: 'IMMOBILIER' },
    SPORT: { primary: '#ef4444', secondary: '#450a0a', accent: '#f87171', label: 'EQUIPEMENT' },
    //   AUTRES THÈMES POSSIBLES :
    MODE: { primary: '#ec4899', secondary: '#3f025e', accent: '#f472b6', label: 'MODE' },
    ART: { primary: '#8b5cf6', secondary: '#2a0a4e', accent: '#c084fc', label: 'ART' },
    VOITURES: { primary: '#10b981', secondary: '#064e3b', accent: '#6ee7b7', label: 'VOITURES' },
    NOURRITURE: { primary: '#f59e0b', secondary: '#4b1d0c', accent: '#fdba74', label: 'NOURRITURE' },
    NATURE: { primary: '#22c55e', secondary: '#064e3b', accent: '#86efac', label: 'NATURE' },
    MOUNTAIN: { primary: '#3b82f6', secondary: '#1e40af', accent: '#93c5fd', label: 'MONTAGNE' },
    TECHNOLOGIE: { primary: '#0ea5e9', secondary: '#020617', accent: '#38bdf8', label: 'TECHNOLOGIE' },
    AVENTURE: { primary: '#f97316', secondary: '#7c2d12', accent: '#fdba74', label: 'AVENTURE' },
    CINEMA: { primary: '#8b5cf6', secondary: '#2a0a4e', accent: '#c084fc', label: 'CINEMA' },
};
// Defenir dabord le format de la boutique pour les données de présentation
export interface BoutiquePresentation {
    id: string;
    name: string;
    description: string;
    image: string;
    Territoire?: string;
    Ville?: string;
    province?: string;
    userId?: string;
}



const DATA = [
    {
        id: '1',
        title: 'Vente dans les magazin Uzisha Tech',
        brand: 'Uzisha Tech',
        category: 'Electronique',
        price: 'Tous les prix',
        rating: 4.9,
        reviews: 128,
        image: retouch,
        theme: THEMES.TECH,
        specs: [{ icon: 'cpu-64-bit', val: 'A17 Pro' }, { icon: 'camera', val: '48MP' }, { icon: 'battery', val: '29h' }],
        isRare: true,
    },
    {
        id: '2',
        title: 'Appartement, Maison, Prendre en location ou à vendre',
        brand: 'e-Mobilier',
        category: 'Résidentiel',
        price: 'Tout les prix',
        rating: 5.0,
        reviews: 42,
        image: require('../assets/images/ulistrator.jpg'),
        theme: THEMES.LUXURY,
        specs: [{ icon: 'bed-double', val: ' Ch.' }, { icon: 'pool', val: 'Privée' }, { icon: 'shield-home', val: 'Sécurisé' }],
        isRare: false,
    },
    {
        id: '3',
        title: 'Faites vos commandes et Achats en toute sécurité',
        brand: 'Commande & Achat',
        category: 'Mode',
        price: 'Tous les prix',
        rating: 4.8,
        reviews: 850,
        image: require('../assets/images/ulist.jpg'),
        theme: THEMES.SPORT,
        specs: [{ icon: 'run', val: 'Confort' }, { icon: 'leaf', val: 'Bio' }, { icon: 'star-circle', val: 'Édition' }],
        isRare: true,
    },

];

// --- COMPOSANTS ATOMIQUES (UI/UX) ---

const CustomStatusBar = ({ backgroundColor, ...props }: any) => (
    <View style={[styles.statusBar, { backgroundColor }]}>
        <SafeAreaView>
            <StatusBar translucent backgroundColor={backgroundColor} {...props} />
        </SafeAreaView>
    </View>
);

const GlassButton = ({ icon, onPress, style }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.glassBtnContainer, style]}>
        <BlurView intensity={30} tint="light" style={styles.glassBtnBlur}>
            <MaterialCommunityIcons name={icon} size={22} color="#FFF" />
        </BlurView>
    </TouchableOpacity>
);

const Badge = ({ text, icon, color }: any) => (
    <View style={[styles.badgeContainer, { borderColor: color }]}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
);

// --- COMPOSANT PRINCIPAL (600+ Lignes en structure logique) ---

export default function ProfessionalAppDesign({ shouldReset }: { shouldReset: boolean }) {
    const { scrollX } = useTheme(); // On récupère le scrollX du contexte global
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<any>(null);
    useEffect(() => {
        if (shouldReset) {
            setActiveIndex(0); // On force le retour à la première image
        }
    }, [shouldReset]);
    // Moteur d'interpolation pour le background global
    const backgroundColor = scrollX.interpolate({
        inputRange: DATA.map((_, i) => i * width),
        outputRange: DATA.map(item => item.theme.secondary),
        extrapolate: 'clamp'
    });

    const accentColor = scrollX.interpolate({
        inputRange: DATA.map((_, i) => i * width),
        outputRange: DATA.map(item => item.theme.primary),
        extrapolate: 'clamp'
    });

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false } // Indispensable pour l'interpolation de couleurs
    );

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
            if (Platform.OS === 'ios') Vibration.vibrate();;
        }
    }).current;

    // --- RENDER FUNCTIONS ---

    const renderBackgrounds = () => {
        return DATA.map((item, index) => {
            const opacity = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [0, 0.4, 0],
                extrapolate: 'clamp'
            });

            return (
                <Animated.Image
                    key={`bg-${item.id}`}
                    source={item.image}
                    style={[StyleSheet.absoluteFillObject, { opacity }]}
                    blurRadius={20}
                />
            );
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <GlassButton icon="menu" />
            <View style={styles.logoBox}>
                <Animated.Text style={[styles.logoTitle, { color: '#FFF' }]}>
                    UZISHA <Text style={{ fontWeight: '300', color: '#0ea5e9' }}>App</Text>
                </Animated.Text>
            </View>
            <GlassButton icon="shopping-outline" />
        </View>
    );

    const renderItem = ({ item, index }: any) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [50, 0, 50],
        });

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
        });

        return (
            <View style={styles.cardWrapper}>
                <Animated.View style={[styles.mainCard, { transform: [{ translateY }, { scale }], opacity }]}>

                    {/* Image de la boutique/produit avec dégradé interne */}
                    <ImageBackground source={item.image} style={styles.cardImage} imageStyle={{ borderRadius: 5 }}>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.9)']}
                            style={styles.cardGradient}
                        />

                        {/* Badges Marketing Flottants */}
                        <View style={styles.cardBadges}>
                            {item.isRare && <Badge text="RARE" icon="diamond" color="#F59E0B" />}
                            <Badge text="VÉRIFIÉ" icon="check-decagram" color="#0ea5e9" />
                        </View>

                        {/* Infos de base sur l'image */}
                        <View style={styles.cardBaseInfo}>
                            <Text style={styles.itemCategory}>{item.category.toUpperCase()}</Text>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                        </View>
                    </ImageBackground>

                    {/* Section Bento (Stats techniques) */}
                    <BlurView intensity={80} tint="dark" style={styles.bentoSection}>
                        <View style={styles.bentoGrid}>
                            {item.specs.map((spec: any, i: number) => (
                                <View key={i} style={styles.bentoItem}>
                                    <MaterialCommunityIcons name={spec.icon} size={18} color={item.theme.primary} />
                                    <Text style={styles.bentoVal}>{spec.val}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        {/* Footer de la carte : Prix & Action */}
                        <View style={styles.cardFooter}>
                            <View>
                                <Text style={styles.priceLabel}>Prix Final</Text>
                                <View style={styles.priceRow}>
                                    <Text style={[styles.currency, { color: item.theme.primary }]}>$</Text>
                                    <Text style={styles.priceValue}>{item.price}</Text>
                                </View>
                            </View>

                            <TouchableOpacity activeOpacity={0.8}>
                                <LinearGradient
                                    colors={[item.theme.primary, item.theme.accent]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.actionBtn}
                                >
                                    <MaterialCommunityIcons name="arrow-right" size={24} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        );
    };

    const renderBottomContent = () => {
        const item = DATA[currentIndex];
        return (
            <Animated.View style={styles.footerInfo}>
                <View style={styles.footerHeader}>
                    <Text style={styles.footerBrand}>{item.brand}</Text>
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>{item.rating} ({item.reviews} avis)</Text>
                    </View>
                </View>
                <Text style={styles.footerDesc}>
                    Découvrez une expérience d'achat immersive. Chaque boutique est vérifiée par nos experts pour garantir la qualité et l'authenticité.
                </Text>

                {/* Barre de progression marketing */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, { width: '75%', backgroundColor: accentColor }]} />
                    </View>
                    <Text style={styles.progressText}>75% des stocks vendus</Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <Animated.View style={[{ backgroundColor }]}>
            {renderBackgrounds()}

            <SafeAreaView>
                {renderHeader()}

                <View style={styles.scrollArea}>
                    <Animated.FlatList
                        ref={flatListRef} // 3. Attachement de la ref
                        data={DATA}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={width}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                        contentContainerStyle={styles.flatlistContent}
                    />
                </View>

                {renderBottomContent()}

                {/* Pagination Dots Animés */}
                <View style={styles.paginationRow}>
                    {/* Remplace ton DATA.map pour les dots par ceci */}
                    {DATA.map((_, i) => {
                        const scaleX = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [1, 2.5, 1], // On joue sur l'échelle au lieu de la largeur brute
                            extrapolate: 'clamp'
                        });

                        const opacity = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: 'clamp'
                        });

                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: '#FFF',
                                        opacity,
                                        transform: [{ scaleX }] // Utilise transform au lieu de width
                                    }
                                ]}
                            />
                        );
                    })}
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

// --- STYLES SYSTEM (DÉSIGN PREMIUM) ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBar: {
        // height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 80,
        height: 60,
    },
    logoBox: {
        alignItems: 'center',
    },
    logoTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 4,
    },
    glassBtnContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glassBtnBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollArea: {
        height: CARD_HEIGHT + 100,
        justifyContent: 'center',
        marginTop: 0,
        paddingBottom: 0,
    },
    flatlistContent: {
        paddingHorizontal: 0,
    },
    cardWrapper: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCard: {
        width: ITEM_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 20 },
        // shadowOpacity: 0.4,
        // shadowRadius: 30,
        // elevation: 15,
        overflow: 'hidden',
    },
    cardImage: {
        flex: 3,
        padding: 20,
        justifyContent: 'space-between',
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
    },
    cardBaseInfo: {
        marginBottom: 5,
    },
    itemCategory: {
        color: '#0ea5e9',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    itemTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 5,
    },
    bentoSection: {
        flex: 1,
        padding: 10,
    },
    bentoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    bentoItem: {
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 8,
        borderRadius: 12,
    },
    bentoVal: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: 16,
        fontWeight: '900',
    },
    priceValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        marginLeft: 4,
    },
    actionBtn: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerInfo: {
        paddingHorizontal: 30,
        marginTop: 20,
    },
    footerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    footerBrand: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginLeft: 5,
    },
    footerDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 22,
    },
    progressContainer: {
        marginTop: 20,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        marginTop: 8,
        textAlign: 'right',
        fontWeight: '700',
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        opacity: 0.5,
    },
});