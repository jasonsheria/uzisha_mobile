# 🏠 eMobilier - Application Immobilière Mobile

Une application mobile complète (iOS/Android) pour la recherche et la gestion de propriétés immobilières, utilisant **Expo** et **React Native TypeScript**.

## ✨ Fonctionnalités Principales

### 🔑 Authentification & Onboarding
- **Page d'Onboarding**: Carousel interactif présentant l'application (4 écrans)
- **Connexion & Inscription**: Formulaires avec validation
- **Gestion de session**: Hook `useAuth` pour tout l'état utilisateur

### 🏘️ Caractéristiques Principales

#### 1. **Accueil (Home)**
- Recherche en temps réel
- Catégories de propriétés (Maisons, Appartements, Parcelles, Hôtels, Restaurants, Salles de fête)
- Propriétés en vedette
- Filtrage par catégorie
- Statistiques de la plateforme

#### 2. **Recherche Avancée**
- Filtrage par type de propriété
- Plage de prix
- Résultats en direct
- État vide avec suggestions

#### 3. **Favoris**
- Sauvegarde des propriétés préférées
- Gestion des favoris
- État vide intuitif

#### 4. **Réservations**
- Listing des réservations pour l'utilisateur
- Statuts (Confirmée, En attente, Annulée)
- Informations de réservation détaillées
- Historique

#### 5. **Profil Utilisateur**
- Informations du profil
- Statistiques (réservations, favoris, note)
- Menu de paramètres
- Déconnexion

#### 6. **Détails de la Propriété**
- Image pleine res
- Description complète
- Équipements
- Informations du propriétaire
- Action de réservation et favoris

## 📱 Structure du Projet

```
emobilier/
├── app/
│   ├── _layout.tsx                 # Layout racine principal
│   ├── (auth)/                     # Stack d'authentification
│   │   ├── _layout.tsx
│   │   ├── onboarding.tsx          # Page d'onboarding
│   │   ├── login.tsx               # Connexion
│   │   └── signup.tsx              # Inscription
│   ├── (tabs)/                     # Navigation par onglets
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Accueil
│   │   ├── search.tsx              # Recherche avancée
│   │   ├── favorites.tsx           # Favoris
│   │   ├── bookings.tsx            # Réservations
│   │   └── profile.tsx             # Profil utilisateur
│   └── property/
│       └── [id].tsx                # Détails de propriété
│
├── components/                     # Composants réutilisables
│   ├── Button.tsx                  # Bouton customisé
│   ├── SearchBar.tsx               # Barre de recherche
│   ├── PropertyCard.tsx            # Carte de propriété
│   ├── CategoryButton.tsx          # Bouton de catégorie
│   ├── Header.tsx                  # En-tête
│   ├── OnboardingCarousel.tsx      # Carousel d'onboarding
│   ├── EditScreenInfo.tsx          # Original
│   ├── ExternalLink.tsx            # Original
│   ├── StyledText.tsx              # Original
│   ├── Themed.tsx                  # Original
│   ├── useClientOnlyValue.ts       # Original
│   ├── useColorScheme.ts           # Original
│   └── ...                         # Autres composants
│
├── constants/
│   ├── Colors.ts                   # Palette de couleurs complète
│   └── PropertyCategories.ts       # Catégories de propriétés
│
├── hooks/
│   └── useAuth.ts                  # Hook pour l'authentification
│
├── types/
│   └── index.ts                    # Types TypeScript (Property, User, etc.)
│
├── utils/
│   └── (utilitaires)               # Fonctions utilitaires
│
├── assets/
│   ├── fonts/                      # Fonts personnalisées
│   └── images/                     # Images
│
├── app.json                        # Configuration Expo
├── package.json                    # Dépendances
├── tsconfig.json                   # Configuration TypeScript
└── expo-env.d.ts                  # Types Expo
```

## 🎨 Système de Design

### Couleurs Primaires
- **Primary**: `#2563EB` (Bleu)
- **Secondary**: `#F59E0B` (Ambre)
- **Accent**: `#10B981` (Vert)

### Catégories
- 🏠 **Maisons** - Bleu
- 🏢 **Appartements** - Violet
- 📍 **Parcelles** - Rose
- 🏨 **Hôtels** - Orange
- 🍽️ **Restaurants** - Rouge
- 🎉 **Salles de fête** - Cyan

### Support Dark Mode
- Tous les composants supportent le mode sombre
- Utilisation de `useColorScheme()` de React Native

## 🚀 Installation & Configuration

### Prérequis
- Node.js 16+
- Expo CLI
- iOS Simulator ou Android Emulator

### Étapes d'Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur Expo
npm start

# 3. Lancer sur iOS/Android
# iOS:
npm run ios
# Android:
npm run android
# Web:
npm run web
```

## 📦 Dépendances Principales

```json
{
  "expo": "~55.0.4",
  "expo-router": "~55.0.3",
  "react-native": "0.83.2",
  "react": "19.2.0",
  "typescript": "~5.9.2",
  "@react-navigation/native": "^7.1.28",
  "react-native-reanimated": "4.2.1",
  "react-native-screens": "~4.23.0"
}
```

## 🎯 Flux de Navigation

### Premier Lancement (avec Onboarding)
```
Splash Screen → Onboarding (4 écrans) → Login/Signup → Home (Tabs)
```

### Utilisateur Existant
```
Splash Screen → Login/Signup → Home (Tabs)
```

### Navigation Principale (Onglets)
```
Home ↔ Search ↔ Favorites ↔ Bookings ↔ Profile
```

## 💻 Composants Réutilisables

### Button
```tsx
<Button
  title="Réserver"
  onPress={handlePress}
  variant="primary" | "secondary" | "outline" | "ghost"
  size="small" | "medium" | "large"
  fullWidth
  loading
/>
```

### SearchBar
```tsx
<SearchBar
  placeholder="Chercher..."
  onSearch={handleSearch}
  icon={<Icon />}
/>
```

### PropertyCard
```tsx
<PropertyCard
  property={property}
  onPress={handlePress}
/>
```

### CategoryButton
```tsx
<CategoryButton
  category={category}
  isSelected={selected}
  onPress={handlePress}
/>
```

## 🔄 État de l'Authentification

Utiliser le hook `useAuth()`:

```tsx
const { user, loading, isFirstTime, login, signup, logout, completeOnboarding } = useAuth();
```

## 🎬 Prochaines Étapes

1. **Backend API**
   - Intégrer une API réelle (Node.js, Python, etc.)
   - Authentification JWT
   - Gestion des réservations

2. **Fonctionnalités Avancées**
   - Paiements (Stripe, PayPal)
   - Notifications Push
   - Chat en temps réel
   - Critiques et notes
   - Partage social

3. **Optimisations**
   - Caching des données
   - Pagination
   - Compression d'images
   - Offline mode

4. **Testing**
   - Tests unitaires
   - Tests d'intégration
   - Tests E2E

## 📝 Notes de Mise à Jour

- Version: 1.0.0
- TypeScript: ✅
- Dark Mode: ✅
- Responsive Design: ✅
- Expo Router: ✅

---

**Créé avec ❤️ pour l'immobilier africain**
