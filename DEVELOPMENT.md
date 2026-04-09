# 📚 Guide de Développement - eMobilier

## 🎯 Vue d'ensemble

Ce document fournit un guide complet pour les développeurs qui souhaitent contribuer ou continuer le développement de l'application eMobilier.

## 📁 Architecture du Projet

### Structure en Couches

```
Présentation (UI Components)
         ↓
États & Hooks (useAuth, useProperty, etc.)
         ↓
Services (API calls)
         ↓
Types (TypeScript)
         ↓
Backend API
```

## 👨‍💻 Conventions de Code

### Nommage des Fichiers
- **Composants React**: `PascalCase.tsx`
  - Exemple: `PropertyCard.tsx`, `SearchBar.tsx`
- **Hooks**: `useXxx.ts`
  - Exemple: `useAuth.ts`, `useProperty.ts`
- **Services**: `xxxService.ts`
  - Exemple: `propertyService.ts`, `authService.ts`
- **Types**: `index.ts` ou `xxx.ts`
  - Exemple: `types/index.ts`
- **Constants**: `xxxConstants.ts` ou `xxx.ts`
  - Exemple: `Colors.ts`, `PropertyCategories.ts`

### Nommage des Variables
- **Composants**: `PascalCase`
- **Variables**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE` (seulement pour les vrais constants)
- **Interfaces**: `ISomething` ou `Something` (selon la préférence)
- **Types**: `TypeName` ou `SomethingType`

### Imports
```tsx
// Ordre d'importation préféré:
import React from 'react';
import { Import1, Import2 } from 'react-native';
import { SomeLibrary } from 'some-library';
import { LocalComponent } from '@/components/LocalComponent';
import { TypeDefinition } from '@/types';
import Colors from '@/constants/Colors';
```

## 🔧 Développer une Nouvelle Page

### Étapes

1. **Créer le fichier de page** dans le dossier `app/`
2. **Importer les dépendances** nécessaires
3. **Définir les types** si nécessaire
4. **Créer le composant** principal
5. **Exporter en défaut** le composant

### Exemple: Page "Mon Portefeuille"

```tsx
// app/(tabs)/portfolio.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function PortfolioScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="📊 Mon Portefeuille" />
        {/* Votre contenu */}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.white,
    },
  });
```

## 🧩 Créer un Composant Réutilisable

### Étapes

1. **Créer le fichier** dans `components/`
2. **Définir l'interface Props**
3. **Implémenter le composant**
4. **Exporter en nommé** (ou par défaut)

### Exemple: Composant "ReviewCard"

```tsx
// components/ReviewCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/Colors';

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewCardProps {
  review: Review;
  style?: ViewStyle;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.author}>{review.author}</Text>
        <Text style={styles.rating}>{'⭐'.repeat(review.rating)}</Text>
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      <Text style={styles.date}>{review.date}</Text>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? Colors.dark.surface : Colors.gray100,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    author: {
      fontWeight: '600',
      color: isDark ? Colors.dark.text : Colors.black,
    },
    rating: {
      fontSize: 12,
    },
    comment: {
      fontSize: 13,
      color: Colors.gray600,
      lineHeight: 18,
      marginBottom: 8,
    },
    date: {
      fontSize: 11,
      color: Colors.gray500,
    },
  });
```

## 🪝 Créer un Hook Personnalisé

### Étapes

1. **Créer le fichier** dans `hooks/`
2. **Implémenter la logique**
3. **Retourner l'état et les méthodes**

### Exemple: Hook "useProperties"

```tsx
// hooks/useProperties.ts
import { useState, useCallback, useEffect } from 'react';
import { Property, SearchFilter } from '@/types';
import { propertyService } from '@/utils/propertyService';

export function useProperties(
  initialFilters?: SearchFilter
) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (
    filters?: SearchFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await propertyService.getProperties(
        filters || initialFilters
      );
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchProperties();
  }, []);

  return {
    properties,
    loading,
    error,
    refetch: fetchProperties,
  };
}
```

## 🔌 Intégrer une API

### Configuration

1. **Créer un service** dans `utils/xxxService.ts`
2. **Définir l'interface** pour les réponses
3. **Ajouter error handling**
4. **Utiliser dans les components** via les hooks

### Exemple: Intégration d'API Firebase

```tsx
// utils/firebaseService.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

## 🎨 Système de Couleurs

### Utiliser les Couleurs

```tsx
import Colors from '@/constants/Colors';

// Utilisation simple
style={{ backgroundColor: Colors.primary }}

// Avec le mode sombre
const isDark = colorScheme === 'dark';
style={{ backgroundColor: isDark ? Colors.dark.background : Colors.white }}
```

### Ajouter une Nouvelle Couleur

```tsx
// constants/Colors.ts
const Colors = {
  // ... existing colors
  newColor: '#XXXXX',
  
  // Pour les thèmes
  dark: {
    // ... existing
    newDarkColor: '#XXXXX',
  },
  light: {
    // ... existing
    newLightColor: '#XXXXX',
  },
};
```

##

 🧪 Testing

### Tests Unitaires

```tsx
// __tests__/utils/helpers.test.ts
import { formatCurrency, isValidEmail } from '@/utils/helpers';

describe('Helpers', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1500.50, '€')).toBe('€1,501');
    });
  });

  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });
});
```

## 📱 Bonnes Pratiques

### Performance

1. **Lazy Loading**: Charger les composants sous demande
2. **Memoization**: Utiliser `React.memo` pour les composants qui changent rarement
3. **FlatList**: Utiliser pour les listes longues
4. **Optimisation des images**: Compresser et redimensionner
5. **Caching**: Implémenter la mise en cache des API

### Accessibilité

```tsx
// Ajouter des labels d'accessibilité
<TouchableOpacity
  accessible
  accessibilityLabel="Chercher une propriété"
  accessibilityHint="Double-tap to search"
  onPress={handleSearch}
>
  <Text>Chercher</Text>
</TouchableOpacity>
```

### Erreurs Courantes à Éviter

```tsx
// ❌ Mauvais
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1); // Boucle infinie!
});

// ✅ Correct
useEffect(() => {
  setCount(c => c + 1);
}, []);

// ❌ Mauvais
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={() => Math.random()} // Clés mauvaises!
/>

// ✅ Correct
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

## 📦 Dépendances Utiles à Ajouter

```json
{
  "@react-navigation/native": "Latest",
  "date-fns": "^3.0.0",
  "axios": "^1.6.0",
  "zustand": "^4.0.0",
  "@react-async-hook/async-hook": "^4.0.0",
  "react-native-vector-icons": "^10.0.0"
}
```

## 🚀 Déploiement

### Build iOS
```bash
eas build --platform ios
```

### Build Android
```bash
eas build --platform android
```

### Soumettre à l'App Store
```bash
eas submit --platform ios
```

## 📝 Commits et Versioning

### Format de Commit Préféré

```
feat: Add property search functionality
fix: Resolve navigation issue on Android
docs: Update README with new API endpoints
style: Format code according to ESLint rules
refactor: Extract PropertyCard into separate component
perf: Optimize image loading
test: Add unit tests for helpers
chore: Update dependencies
```

### Versioning Sémantique

- **Major**: Changements non rétro-compatibles
- **Minor**: Nouvelles fonctionnalités compatibles
- **Patch**: Correctifs de bugs

## 🔗 Ressources Utiles

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks API](https://react.dev/reference/react/hooks)
- [expo-router Guide](https://docs.expo.dev/routing/introduction/)

## ❓ FAQ

### Q: Comment ajouter une nouvelle page?
R: Créer un fichier `.tsx` dans `app/` et le système de routage d'Expo le détectera automatiquement.

### Q: Comment gérer l'état global?
R: Utiliser le hook `useAuth` pour l'authentification, ou implémenter Zustand/Context pour d'autres états.

### Q: Comment intégrer une API Backend?
R: Créer un service dans `utils/` avec les fonctions fetch, puis l'utiliser dans les hooks.

### Q: Comment supporter plusieurs langues?
R: Utiliser i18next ou créer un système de traduction simple avec des constantes.

---

**Besoin d'aide?** Consultez la documentation officielle ou contactez l'équipe de développement.
