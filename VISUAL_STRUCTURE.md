# 📐 Architecture Visuelle - eMobilier

## Structure d'Écrans

```
┌─────────────────────────────────────────────┐
│            EMOBILIER APPLICATION            │
├─────────────────────────────────────────────┤
│
│  FLOW 1: FIRST-TIME USER
│  ═════════════════════════════════════════
│
│  ┌──────────────────────────────────────┐
│  │   Splash Screen                      │
│  │   Loading Assets...                  │
│  └─────────┬────────────────────────────┘
│            │
│            ↓
│  ┌──────────────────────────────────────┐
│  │   ONBOARDING CAROUSEL                │
│  │                                      │
│  │  Screen 1: Welcome 🏠               │
│  │  Screen 2: Search 📅                │
│  │  Screen 3: Offers ✨                │
│  │  Screen 4: Manage 📊                │
│  │                                      │
│  │  [Indicators] | [Skip] [Next →]     │
│  └─────────┬────────────────────────────┘
│            │
│            ↓
│  ┌──────────────────────────────────────┐
│  │   SIGNUP PAGE                        │
│  │                                      │
│  │   Full Name: [_______]               │
│  │   Email: [_______]                   │
│  │   Password: [_______]                │
│  │   Confirm: [_______]                 │
│  │                                      │
│  │   [Sign Up Button]                   │
│  │   → Have account? Login              │
│  └─────────┬────────────────────────────┘
│            │
│            ↓
│  ┌──────────────────────────────────────┐
│  │   HOME (TABS NAVIGATION)             │
│  └─────────┬────────────────────────────┘
│
│  FLOW 2: EXISTING USER
│  ═════════════════════════════════════════
│
│  ┌──────────────────────────────────────┐
│  │   LOGIN PAGE                         │
│  │                                      │
│  │   Email: [_______]                   │
│  │   Password: [_______]                │
│  │                                      │
│  │   [Login Button]                     │
│  │   → Forgot password? | Sign up       │
│  └─────────┬────────────────────────────┘
│            │
│            ↓
│  ┌──────────────────────────────────────┐
│  │   HOME (TABS NAVIGATION)             │
│  └─────────┬────────────────────────────┘
│
│  MAIN APP SCREENS
│  ═════════════════════════════════════════
│
│  ┌──────────────────────────────────────┐
│  │   TAB 1: HOME 🏠                    │
│  │                                      │
│  │   Header: "eMobilier"                │
│  │   [Search Bar 🔍]                    │
│  │   [Categories Scroll]                │
│  │   ├─ 🏠 Maisons                      │
│  │   ├─ 🏢 Appartements                 │
│  │   ├─ 📍 Parcelles                    │
│  │   ├─ 🏨 Hôtels                       │
│  │   ├─ 🍽️ Restaurants                 │
│  │   └─ 🎉 Salles de Fête               │
│  │                                      │
│  │   Tendances:                         │
│  │   [Property Card 1]                  │
│  │   [Property Card 2]                  │
│  │   [Property Card 3]                  │
│  │                                      │
│  │   Stats:                             │
│  │   10K+ Propriétés | 5K+ Users        │
│  └──────────────────────────────────────┘
│            │
│  Property Card Structure:                │
│  ┌──────────────────────────────────────┐
│  │ ┌────────────────────────────────────┤ │
│  │ │        [IMAGE]                     │ │
│  │ │  [Badge: Type] ... [$Price]        │ │
│  │ │────────────────────────────────────│ │
│  │ │ Title: ...                         │ │
│  │ │ 📍 Location                        │ │
│  │ │ ⭐ 4.8 (234 reviews)               │ │
│  │ │ 🛏️ 4 | 🚿 3 | 📐 280 m²           │ │
│  │ └────────────────────────────────────┘ │
│  └──────────────────────────────────────┘
│
│  ┌──────────────────────────────────────┐
│  │   TAB 2: SEARCH 🔍                  │
│  │                                      │
│  │   [Search Bar]                       │
│  │   [Filters]                          │
│  │   ├─ Category [Buttons]              │
│  │   ├─ Price Range                     │
│  │   └─ Location                        │
│  │                                      │
│  │   Results (X properties):            │
│  │   [Property Card] × N                │
│  └──────────────────────────────────────┘
│
│  ┌──────────────────────────────────────┐
│  │   TAB 3: FAVORITES ❤️               │
│  │                                      │
│  │   My Favorites                       │
│  │                                      │
│  │   [Property Card] × N                │
│  │                                      │
│  │   OR Empty State:                    │
│  │   📌 No Favorites Yet                │
│  └──────────────────────────────────────┘
│
│  ┌──────────────────────────────────────┐
│  │   TAB 4: BOOKINGS 📅                │
│  │                                      │
│  │   My Reservations                    │
│  │                                      │
│  │   [Booking Card 1]                   │
│  │   ├─ Property Title                  │
│  │   ├─ 📅 Check-in → Check-out         │
│  │   ├─ [Status Badge]                  │
│  │   └─ $Total | Details →              │
│  │                                      │
│  │   [Booking Card N]                   │
│  └──────────────────────────────────────┘
│
│  ┌──────────────────────────────────────┐
│  │   TAB 5: PROFILE 👤                 │
│  │                                      │
│  │        [Avatar 👤]                   │
│  │        Username                      │
│  │        email@example.com             │
│  │                                      │
│  │   12 Réservations | 5 Favoris        │
│  │   ⭐ 4.8                             │
│  │                                      │
│  │   [Menu Items]:                      │
│  │   • 👤 Mon Profil                    │
│  │   • 🏠 Mes Propriétés                │
│  │   • ⚙️ Paramètres                    │
│  │   • 💬 Aide & Support                │
│  │   • ℹ️ À propos                      │
│  │                                      │
│  │   [se Déconnecter]                   │
│  │                                      │
│  │   eMobilier v1.0.0                   │
│  └──────────────────────────────────────┘
│
│  DETAIL SCREENS
│  ═════════════════════════════════════════
│
│  ┌──────────────────────────────────────┐
│  │   PROPERTY DETAIL                    │
│  │                                      │
│  │   [← Retour]                         │
│  │   [Full Width Image]                 │
│  │                                      │
│  │   Title                              │
│  │   📍 Location                        │
│  │                          [Price]     │
│  │                                      │
│  │   ⭐ 4.8 (234 avis)                  │
│  │                                      │
│  │   Features:                          │
│  │   🛏️ 4 | 🚿 3 | 📐 280 m²           │
│  │                                      │
│  │   Description:                       │
│  │   "Magnifique villa..."              │
│  │                                      │
│  │   Equipment:                         │
│  │   [Wi-Fi] [Pool] [Garden] ...        │
│  │                                      │
│  │   Owner Info:                        │
│  │   [Avatar] Jean Dupont               │
│  │           +221 77 123 45 67          │
│  │                                      │
│  │   [Réserver maintenant]              │
│  │   [❤️ Ajouter aux favoris]           │
│  └──────────────────────────────────────┘
│
│  TAB BAR (Bottom Navigation)
│  ═════════════════════════════════════════
│  │ 🏠 | 🔍 | ❤️ | 📅 | 👤 │
│  │ Home | Search | Favorites | Bookings | Profile │
│  └──────────────────────────────────────┘
│
└─────────────────────────────────────────────┘
```

## État des Données

```
Global State:
├── User
│   ├── id
│   ├── email
│   ├── name
│   └── isFirstTime
├── Properties
│   ├── [Property]
│   │   ├── id, title, type
│   │   ├── price, location, image
│   │   ├── rating, reviews
│   │   └── beds, baths, area
│   └── [...]
├── Favorites
│   └── [propertyId, ...]
├── Bookings
│   ├── [Booking]
│   │   ├── id, propertyId
│   │   ├── checkIn, checkOut
│   │   ├── status, totalPrice
│   │   └── guests
│   └── [...]
└── Filters
    ├── type, priceMin, priceMax
    ├── location, rating
    └── searchQuery
```

## Navigation Flow

```
         ┌─────────────────┐
         │  App Root       │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Loading Check  │
         └────────┬────────┘
                  │
      ┌───────────┴────────────┐
      │                        │
   No User          Is First Time?
   ├─ Login                   │
   └─ Signup            Yes ──┼── No
                               │      │
                        Onboarding  Tabs
                               │      │
                        [Complete]   │
                               │      │
                               └──────┘
                                  │
                           Home ──┼── Search
                           Favorites │
                           Bookings ─┘
                           Profile
```

---

**Dernière mise à jour**: Mars 2025  
**Version**: 1.0.0 Beta
