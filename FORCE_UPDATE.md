# Blocage de version obligatoire (force update)

1. **Table SQL**
   - Voir le fichier `sql/app_versions.sql` pour la création de la table `app_versions`.

2. **Installation**
   - `npm install expo-linking`

3. **Hook de vérification**
   - Utilise le hook `useForceUpdateCheck` dans `utils/useForceUpdateCheck.ts`.
   - Ce hook vérifie la version minimale requise à chaque démarrage de l'app.
   - Si la version de l'utilisateur est trop ancienne, il est bloqué et redirigé vers le store.

4. **Intégration**
   - Le hook est appelé dans `app/_layout.tsx` (racine de l'app).

5. **Personnalisation**
   - Pour changer le message ou l’URL du store, modifie le hook ou la table SQL.
   - Pour cibler Android/iOS, renseigne bien le champ `platform` dans la table.

6. **Ajout d'une version obligatoire**
   - Insère une ligne dans la table `app_versions` avec la version minimale et `force_update = true`.

7. **Comparaison de version**
   - Le hook compare la version courante (package.json/manifest) à la version minimale requise.

---

**Exemple d’utilisation** :

```ts
// Dans app/_layout.tsx
useForceUpdateCheck();
```

**Exemple d’insertion SQL** :

```sql
INSERT INTO app_versions (platform, min_version, force_update, message)
VALUES ('android', '1.2.0', true, 'Merci de mettre à jour pour continuer !');
```
