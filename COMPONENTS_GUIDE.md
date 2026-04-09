# 📘 Guide d'Utilisation - Components Material Design

Ce document explique comment utiliser les nouveaux components Material Design ajoutés à l'application eMobilier.

---

## 🋙 LoadingIcon - Icône d'Attente Animée

Un spinner rotatif professionnel pour afficher l'état de chargement.

### Utilisation Simple

```tsx
import { LoadingIcon } from '@/components';

export default function MyComponent() {
  return (
    <LoadingIcon 
      size={24} 
      color="#2563EB" 
    />
  );
}
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|------------|
| `size` | number | 20 | Taille du spinner en pixels |
| `color` | string | Auto (theme) | Couleur de l'icône |
| `style` | ViewStyle | - | Styles React Native personnalisés |

### Exemples

```tsx
// Mode sombre
<LoadingIcon size={32} color="#F1F5F9" />

// Mode clair
<LoadingIcon size={32} color="#1F2937" />

// Dans un header
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <Text>Recherche en cours</Text>
  <LoadingIcon size={20} />
</View>
```

---

## 🎨 Icons - Bibliothèque d'Icônes Material Design

Galerie complète d'icônes SVG pour utilisation dans l'application.

### Icônes Disponibles

```tsx
import {
  HomeIcon,       // Maison
  SearchIcon,     // Loupe
  HeartIcon,      // Cœur
  CalendarIcon,   // Calendrier
  UserIcon,       // Utilisateur
  PlusIcon,       // Plus
  MenuIcon,       // Menu hamburger
  CheckIcon,      // Validation
  XIcon,          // Fermer
  StarIcon,       // Étoile
  MapPinIcon,     // Localisation
  PhoneIcon,      // Téléphone
  MailIcon,       // Email
} from '@/components';
```

### Utilisation Simple

```tsx
import { HomeIcon } from '@/components';

export default function HomeButton() {
  return (
    <Pressable onPress={() => console.log('Home')}>
      <HomeIcon size={24} color="#2563EB" />
    </Pressable>
  );
}
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|------------|
| `size` | number | 24 | Taille de l'icône |
| `color` | string | '#000' | Couleur de l'icône |
| `style` | ViewStyle | - | Styles personnalisés |

### Exemples d'Utilisation

```tsx
// Icône Simple
<SearchIcon size={20} color={isDark ? 'white' : 'black'} />

// Icône dans un bouton
<Pressable style={styles.button}>
  <PlusIcon size={24} color="white" />
</Pressable>

// Icône avec label
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <MapPinIcon size={20} color={Colors.primary} />
  <Text>Localisation</Text>
</View>

// Icône active/inactive
<HeartIcon 
  size={24} 
  color={isFavorite ? '#DC2626' : '#D1D5DB'} 
/>
```

---

## 🗂️ MaterialBottomTabs - Navigation Inférieure

Composant Material Design pour la navigation par onglets avec FAB animé central.

### Concepts Clés

✅ **Onglets (Tabs)**: 5 sections de navigation
✅ **Bouton FAB**: Floating Action Button animé au centre
✅ **Badges**: Notifications sur les onglets
✅ **Animations**: Rotation 360° du FAB
✅ **Thèmes**: Support complet dark/light

### Utilisation Complète

```tsx
import { MaterialBottomTabs } from '@/components';
import { HomeIcon, SearchIcon, HeartIcon, CalendarIcon, UserIcon, PlusIcon } from '@/components';

export default function NavigationTab() {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = [
    { label: 'Accueil', icon: <HomeIcon size={24} color="#2563EB" /> },
    { label: 'Recherche', icon: <SearchIcon size={24} color="#2563EB" /> },
    { label: 'Favoris', icon: <HeartIcon size={24} color="#2563EB" />, badge: 3 },
    { label: 'Réservations', icon: <CalendarIcon size={24} color="#2563EB" />, badge: 1 },
    { label: 'Profil', icon: <UserIcon size={24} color="#2563EB" /> },
  ];

  return (
    <MaterialBottomTabs
      tabs={tabs}
      activeIndex={activeIndex}
      onTabPress={(index) => setActiveIndex(index)}
      onFabPress={() => console.log('Nouvelle propriété')}
      fabIcon={<PlusIcon size={28} color="white" />}
    />
  );
}
```

### Props

| Prop | Type | Requis | Description |
|------|------|--------|------------|
| `tabs` | TabItem[] | ✅ | Tableau des onglets |
| `activeIndex` | number | ✅ | Index de l'onglet actif |
| `onTabPress` | (index: number) => void | ✅ | Callback au clic d'onglet |
| `onFabPress` | () => void | - | Callback au clic FAB |
| `fabIcon` | React.ReactNode | - | Icône personnalisée du FAB |

### Structure TabItem

```tsx
interface TabItem {
  label: string;           // Texte du label
  icon: React.ReactNode;   // Composant icône
  badge?: number;          // Nombre de notifications (optionnel)
}
```

### Exemples

```tsx
// Avec badges de notification
const tabs = [
  { 
    label: 'Messages', 
    icon: <MailIcon />, 
    badge: 5  // Affiche "5" sur le badge
  },
  { 
    label: 'Réservations', 
    icon: <CalendarIcon />, 
    badge: 12  // Affiche "99+" si > 99
  },
];

// Gérer le FAB
<MaterialBottomTabs
  ...props
  onFabPress={() => {
    // Naviguer vers la page de création
    router.push('/property/create');
  }}
/>
```

---

## 🎯 Header Amélioré - Barre Supérieure

Composant Header avec support pour loading icon, menu, et thème.

### Utilisation Simple

```tsx
import { Header } from '@/components';

export default function HomePage() {
  return (
    <Header 
      title="Accueil"
      subtitle="Trouvez votre propriété idéale"
    />
  );
}
```

### Utilisation Complète

```tsx
import { Header, LoadingIcon } from '@/components';
import { MenuIcon } from '@/components';

export default function SearchPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Header
      title="Recherche"
      subtitle="Résultats: 24 propriétés"
      isLoading={isLoading}
      showMenu={true}
      onMenuPress={() => console.log('Menu ouvert')}
      rightComponent={
        <Pressable onPress={() => setIsLoading(!isLoading)}>
          <FilterIcon size={24} color={Colors.primary} />
        </Pressable>
      }
    />
  );
}
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|------------|
| `title` | string | ✅ | Titre du header |
| `subtitle` | string | - | Sous-titre optionnel |
| `isLoading` | boolean | false | Affiche l'icon de chargement |
| `showMenu` | boolean | false | Affiche le bouton menu |
| `onMenuPress` | () => void | - | Callback du menu |
| `rightComponent` | ReactNode | - | Composant personnalisé à droite |
| `style` | ViewStyle | - | Styles personnalisés |

---

## 🎬 Intégration Complète - Exemple Réel

Voici un exemple complet montrant comment utiliser tous les composants ensemble:

```tsx
import React, { useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import { 
  Header, 
  PropertyCard, 
  LoadingIcon,
  MaterialBottomTabs,
  HomeIcon,
  SearchIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
  PlusIcon,
} from '@/components';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState(3);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const tabs = [
    { label: 'Accueil', icon: <HomeIcon size={24} /> },
    { label: 'Recherche', icon: <SearchIcon size={24} /> },
    { label: 'Favoris', icon: <HeartIcon size={24} />, badge: favorites },
    { label: 'Réservations', icon: <CalendarIcon size={24} /> },
    { label: 'Profil', icon: <UserIcon size={24} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Header avec loading icon */}
      <Header
        title="Accueil"
        isLoading={isLoading}
        showMenu={true}
        onMenuPress={() => console.log('Menu')}
      />

      {/* Contenu principal */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {isLoading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <LoadingIcon size={32} color={Colors.primary} />
            <Text style={{ marginTop: 16, color: Colors.gray500 }}>
              Recherche en cours...
            </Text>
          </View>
        ) : (
          <>
            <PropertyCard
              id="1"
              title="Villa Moderne"
              location="Yaoundé"
              price={45000000}
              type="house"
              image="https://..."
              rating={4.5}
              reviews={128}
            />
            {/* Plus de propriétés... */}
          </>
        )}
      </ScrollView>

      {/* Navigation inférieure */}
      <MaterialBottomTabs
        tabs={tabs}
        activeIndex={activeTab}
        onTabPress={setActiveTab}
        onFabPress={handleSearch}
        fabIcon={<PlusIcon size={28} color="white" />}
      />
    </View>
  );
}
```

---

## 🌙 Gestion des Thèmes Dark/Light

Tous les composants supportent automatiquement les thèmes:

```tsx
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function MyComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Contenu</Text>
      <LoadingIcon color={isDark ? 'white' : 'black'} />
    </View>
  );
}
```

---

## ⚙️ Conseils de Performance

1. **Memoization**: Utilisez `React.memo()` pour les onglets statiques
2. **Lazy Loading**: Chargez les contenuutes au besoin
3. **Animations**: Les animations utilisent le thread natif via `Animated`
4. **Badges**: Limitez les updates de badges fréquentes

```tsx
// Optimisé
const MemoizedHeader = React.memo(Header);
const MemoizedTab = React.memo(({ tab, isActive }) => (
  <TabButton tab={tab} isActive={isActive} />
));
```

---

## 📱 Compatibilité

- ✅ iOS 13+
- ✅ Android 5.0+
- ✅ Expo 55.0+
- ✅ React Native 0.83+

---

## 🔗 Fichiers Connexes

- **Components**: [components/](../components/)
- **Icons**: [components/Icons.tsx](../components/Icons.tsx)
- **Colors**: [constants/Colors.ts](../constants/Colors.ts)
- **Tab Layout**: [app/(tabs)/_layout.tsx](../app/(tabs)/_layout.tsx)

---

Maintenant vous êtes prêt à utiliser tous les nouveaux composants Material Design! 🎉
