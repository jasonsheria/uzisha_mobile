# 🔐 Guide d'Authentification Supabase

## Configuration Initiale

### 1️⃣ Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet:

```bash
# Supabase (copier depuis votre dashboard Supabase)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optionnel
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 2️⃣ Installer les dépendances requises

```bash
npm install expo-secure-store @supabase/supabase-js @react-native-async-storage/async-storage
```

### 3️⃣ Configuration du Provider

Dans **`app/_layout.tsx`**, enveloppez votre app avec `AuthProvider`:

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <NavigationThemeProvider value={...}>
            {/* votre navigation */}
          </NavigationThemeProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

---

## Utilisation dans les Composants

### Login (Connexion)

```tsx
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      alert('Erreur: ' + (error as Error).message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        <Text>{loading ? 'Chargement...' : 'Se connecter'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Signup (Inscription)

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function SignupScreen() {
  const { signup, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      await signup(email, name, password);
      router.replace('/(tabs)');
    } catch (error) {
      alert('Erreur: ' + (error as Error).message);
    }
  };

  return (
    <View>
      {/* Inputs... */}
      <TouchableOpacity onPress={handleSignup} disabled={loading}>
        <Text>{loading ? 'Chargement...' : 'S\'inscrire'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Accéder aux Infos Utilisateur

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Text>Pas d'utilisateur connecté</Text>;
  }

  return (
    <View>
      <Text>Nom: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## API du AuthService

### `login(data: LoginData): Promise<AuthResponse>`
Connecte un utilisateur avec email et mot de passe.

```typescript
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});
```

### `signup(data: SignupData): Promise<AuthResponse>`
Crée un nouveau compte utilisateur.

```typescript
const { user, token } = await authService.signup({
  email: 'newuser@example.com',
  name: 'User Name',
  password: 'password123'
});
```

### `logout(): Promise<void>`
Déconnecte l'utilisateur actuel.

```typescript
await authService.logout();
```

### `getCurrentUser(token?: string): Promise<User | null>`
Récupère les infos de l'utilisateur actuellement connecté.

```typescript
const user = await authService.getCurrentUser();
```

### `updateProfile(userId: string, updates: Partial<User>): Promise<User>`
Met à jour le profil utilisateur.

```typescript
const updated = await authService.updateProfile(userId, {
  name: 'Nouveau Nom',
  phone: '+221771234567',
  avatar: 'https://...'
});
```

### `resetPassword(email: string): Promise<void>`
Envoie un email de réinitialisation du mot de passe.

```typescript
await authService.resetPassword('user@example.com');
```

### `updatePassword(newPassword: string): Promise<void>`
Met à jour le mot de passe de l'utilisateur connecté.

```typescript
await authService.updatePassword('newpassword123');
```

### `emailExists(email: string): Promise<boolean>`
Vérifie si un email existe dans la base de données.

```typescript
const exists = await authService.emailExists('user@example.com');
```

### `onAuthStateChange(callback): Unsubscribe`
S'abonne aux changements d'état d'authentification.

```typescript
const unsubscribe = authService.onAuthStateChange((user) => {
  if (user) {
    console.log('Utilisateur connecté:', user);
  } else {
    console.log('Utilisateur déconnecté');
  }
});

// Nettoyer à la destruction du composant
return () => unsubscribe();
```

---

## Architecture de Sécurité

### 🔒 Secure Store (Tokens)
- Les tokens sont stockés dans `expo-secure-store` (chiffré natif)
- Stockage minimal et sécurisé sur le device

### 🗝️ AsyncStorage (Session)
- Utilisé par Supabase pour persister la session
- Auto-refresh des tokens

### 🔐 Row Level Security (RLS)
- Chaque utilisateur ne voit que SES données
- Appliqué au niveau de la base de données

### 📱 auth.uid() 
- Fonction Supabase pour vérifier l'identité
- Utilisée dans les RLS policies

---

## Flux d'Authentification

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Supabase Auth.signInWith │
│       Password()         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Récupérer User Profile   │
│ depuis Table 'users'     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Sauvegarder Token dans   │
│    Secure Store          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Mettre à jour            │
│ AuthContext (user state) │
└──────────────────────────┘
```

---

## Erreurs Courantes

### ❌ "Cannot find module '@supabase/supabase-js'"
→ Installer: `npm install @supabase/supabase-js`

### ❌ "Variables d'environnement non définies"
→ Créer `.env.local` avec `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### ❌ "User table not found"
→ Vérifier que la migration SQL a été exécutée sur Supabase

### ❌ "RLS policy rejected"
→ Vérifier les RLS policies dans Supabase Dashboard > Authentication > Policies

### ❌ "Token expired"
→ Supabase rafraîchit automatiquement les tokens (AsyncStorage configuré)

---

## Fonctionnalités Disponibles

✅ Connexion par email/mot de passe  
✅ Inscription nouvel utilisateur  
✅ Déconnexion  
✅ Récupération profil utilisateur  
✅ Mise à jour profil  
✅ Réinitialisation mot de passe  
✅ Vérification email unique  
✅ Stockage sécurisé tokens  
✅ Auto-refresh session  
✅ RLS Policies appliquées  

---

## Prochaines Étapes

1. **Authentification Google/Facebook**
   ```typescript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: 'emobilier://oauth-callback'
     }
   });
   ```

2. **2FA (Two-Factor Authentication)**
   - Implémenter via Supabase MFA

3. **Vérification Email**
   - Confirmer email avant activation compte

4. **Rôles & Permissions**
   - Admin, Agent, User roles
   - Implémenter via custom claims JWT
