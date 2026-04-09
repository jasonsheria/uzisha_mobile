# 🚀 Quick Start Guide - eMobilier

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Installation des Dépendances
```bash
cd c:\Users\Dell\Desktop\NdakuMobile\emobilier
npm install
```

### 2️⃣ Configuration d'Environnement
```bash
# Copier le fichier template
cp .env.example .env

# Éditer .env (optionnel pour hors-ligne)
# Les valeurs par défaut fonctionnent en mode développement
```

### 3️⃣ Lancer l'Application
```bash
# Option A: Lancer le serveur Expo (recommandé au départ)
npm start

# Option B: Lancer directement sur iOS
npm run ios

# Option C: Lancer directement sur Android
npm run android

# Option D: Lancer sur le Web
npm run web
```

### 4️⃣ Tester l'Application

#### Premier Lancement
1. **Écran Splash** → Chargement automatique
2. **Onboarding** → 4 écrans à swiper
3. **Signup** → Créer un compte (données simulation)
4. **Home** → Vous êtes connecté! 🎉

#### Comptes de Test
```
Email: test@example.com
Mot de passe: password123

Ou créer un compte via Signup
```

#### Navigation
- **Onglet 1 (🏠)**: Accueil - Découvrez les propriétés
- **Onglet 2 (🔍)**: Recherche - Filtrez par catégorie
- **Onglet 3 (❤️)**: Favoris - Sauvegardez vos préférées
- **Onglet 4 (📅)**: Réservations - Vos bookings
- **Onglet 5 (👤)**: Profil - Infos utilisateur

---

## 📋 Checklist d'Installation

- [ ] Node.js 16+ installé (`node --version`)
- [ ] npm 8+ installé (`npm --version`)
- [ ] Expo CLI installé (`npm install -g expo-cli`)
- [ ] iOS Simulator ou Android Emulator (optionnel)
- [ ] Dépendances installées (`npm install`)
- [ ] Variables d'environnement configurées
- [ ] L'application démarre sans erreurs

---

## 🎮 Commandes Principales

```bash
# Démarrer le serveur de développement
npm start

# Lancer sur iOS (macOS uniquement)
npm run ios

# Lancer sur Android (nécessite Android Studio)
npm run android

# Lancer dans un navigateur
npm run web

# Nettoyer le cache
npm start -- --clear

# Installer une dépendance
npm install nom-du-package

# Mettre à jour les dépendances
npm update
```

---

## 📱 Options de Lancement

### Après `npm start`, vous verrez un menu:

```
› Press i to open iOS Simulator
› Press a to open Android Emulator
› Press w to open web
› Press j to open Expo DevTools
› Press r to reload app
› Press s to switch mode
› Press q to quit
```

---

## 🐛 Dépannage

### Problem: "Cannot find module..."
**Solution**: Réinstaller les dépendances
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Problem: Port 8081 déjà utilisé
**Solution**: Arrêter les autres serveurs ou utiliser un port différent
```bash
# Sur macOS/Linux
lsof -i :8081
kill -9 <PID>

# Ou démarrer sur un port différent
npm start -- --port 8082
```

### Problem: Le simulateur iOS ne lance pas
**Solution**: Redémarrer Xcode
```bash
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
npm run ios
```

### Problem: Erreur "Expo SDK version"
**Solution**: Mettre à jour Expo
```bash
npm install -g expo-cli@latest
npm install expo@latest
```

---

## 📚 Documentation Importante

| Document | Purpose |
|----------|---------|
| **README.md** | 📖 Guide complet du projet |
| **DEVELOPMENT.md** | 👨‍💻 Guide pour développeurs |
| **PROJECT_STATUS.md** | 📋 Statut et progression |
| **VISUAL_STRUCTURE.md** | 📐 Architecture des écrans |
| **FILES_CREATED.md** | 📦 Liste des fichiers créés |

---

## 🎨 Exploration de l'Interface

### Écran d'Accueil
- 🏠 Barre de logo
- 🔍 Recherche en temps réel
- 🏷️ 6 Catégories filtrables
- 📊 3 Propriétés en vedette
- 📈 Statistiques de plateforme

### Propriétés
- 🖼️ Image haute résolution
- 💰 Affichage du prix
- ⭐ Note et commentaires
- 🛏️ Détails (chambres, bains, m²)
- 📍 Localisation

### Détail de Propriété
- 📸 Images pleine résolution
- 📋 Description complète
- 🛠️ Équipements listés
- 👤 Infos du propriétaire
- 🔘 Boutons: Réserver & Favoris

---

## 🔑 Fonctionnalités Principales

### Login & Signup
```typescript
// Démo:
Email: utilisateur@example.com
Password: Test123!

// Ou créer un nouveau compte
// (Les données sont simulées)
```

### Recherche
- Tapez dans la barre de recherche
- Ou cliquez sur une catégorie
- Les résultats s'affichent en direct

### Favoris
- Cliquez ❤️ sur une propriété
- Retrouvez-la dans l'onglet Favoris

### Réservations
- Affichage des réservations simulées
- Statuts: Confirmée, En attente, Annulée

### Profil
- Infos utilisateur
- Statistiques (12 réservations, 5 favoris)
- Menu de paramètres
- Bouton de déconnexion

---

## 🌙 Mode Sombre

L'application supporte le mode sombre!

- **iOS**: Allez dans Paramètres → Affichage → Mode Sombre
- **Android**: Allez dans Paramètres → Affichage → Thème sombre
- L'interface s'adapte automatiquement

---

## 🔗 Ressources Utiles

### Documentation Officielle
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction/)

### Outils
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Xcode](https://developer.apple.com/xcode/) (iOS)
- [Android Studio](https://developer.android.com/studio) (Android)

---

## 💡 Tips & Tricks

### Raccourcis Clavier (dans le terminal)
- `r` → Rechargement live
- `i` → Ouvrir iOS Simulator (macOS)
- `a` → Ouvrir Android Emulator
- `w` → Ouvrir dans un navigateur
- `q` → Quitter

### Hot Reload
L'application se recharge automatiquement lors de modifications du code!

### DevTools
- Appuyez sur Ctrl+M (Android) ou Cmd+D (iOS)
- Ou appuyez sur `j` après `npm start`

---

## 🎯 Prochaines Étapes

1. ✅ **Lancer l'app** avec `npm start`
2. ✅ **Explorer les fonctionnalités**
3. 📖 **Lire la documentation** (README.md)
4. 👨‍💻 **Consulter DEVELOPMENT.md** pour contribuer
5. 🔌 **Connecter à un backend réel**

---

## ❓ Questions Fréquentes

**Q: Où sont stockées les données?**
A: En développement, les données sont simulées. Une fois connecté à un backend, elles seront persistées.

**Q: Puis-je utiliser un vrai appareil?**
A: Oui! Installez l'app Expo sur votre téléphone et scannez le code QR affiché.

**Q: Comment déboguer l'application?**
A: Utilisez React Native Debugger ou Flipper (voir Ressources).

**Q: Est-ce que TypeScript est obligatoire?**
A: Non, mais c'est recommandé pour une meilleure expérience développeur.

---

## 📞 Besoin d'Aide?

1. Consultez la **FAQ** ci-dessus
2. Lisez **DEVELOPMENT.md** pour plus de détails
3. Vérifiez les **Issues** de la documentation
4. Contactez l'équipe de développement

---

**Bon développement! 🚀**

*Créé en Mars 2025*
