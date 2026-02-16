
## Correction des images cassées sur la page Collections

### Probleme identifie
La derniere modification a introduit une fonction `originalImage` qui tente de construire une URL vers le fichier original (sans suffixe `__grid`), mais ce fichier n'existe pas en stockage. Seules les variantes (`__grid.webp`, `__detail.webp`, `__cover.webp`) existent reellement.

### Solution
Revenir a l'utilisation directe des URLs variantes existantes, mais avec `object-cover` en CSS pour que le navigateur rogne naturellement le padding blanc des variantes "contain-fit". Le padding blanc etant sur les bords, `object-cover` le coupera en remplissant le conteneur.

### Modifications

**1. `src/pages/Collections.tsx`**
- Pour les images de couverture : utiliser `coverImage()` (variante `__cover`) au lieu de `originalImage()`
- Pour les images mises en avant (thumbnails) : utiliser directement l'URL de la variante `__detail` via `toVariant()` pour avoir la meilleure resolution, avec `object-cover` qui rognera le padding blanc
- Importer `toVariant` depuis `imageVariants` et `detailImage` depuis `imageOptim`

**2. `src/lib/imageOptim.ts`**
- Supprimer la fonction `originalImage` qui genere des URLs cassees (fichiers inexistants)

### Details techniques

Les variantes contain-fit ajoutent du padding blanc autour de la photo pour la centrer dans un cadre fixe. Quand on affiche ces images avec `object-cover` dans un conteneur CSS de ratio different (ou plus petit), le navigateur zoome et rogne les bords -- ce qui elimine visuellement le padding blanc sans avoir besoin du fichier original.

Pour les couvertures : `coverImage()` retourne la variante `__cover` (1920x840, ratio 16:7) qui correspond au ratio du conteneur, donc le padding sera minimal et rogne par `object-cover`.

Pour les thumbnails : `detailImage()` retourne la variante `__detail` (1800x2400, ratio 3:4) qui correspond au ratio du conteneur `aspect-[3/4]`, donc meme logique.
