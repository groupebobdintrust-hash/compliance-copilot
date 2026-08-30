# RUN06 — Compliance Copilot — Rapport de Vérification de la Preuve d'Audit
**Version v1.0 — 2026-08-30**

## 1. Objectif de RUN06

Vérifier de manière indépendante l'intégrité de la preuve d'audit déterministe produite en RUN05 (`fixtures/audit-proof.json`), en recalculant réellement les empreintes SHA-256 des artefacts sources et le `chain_hash`, plutôt que de faire confiance aveuglément aux valeurs déclarées. Le script `verify-audit-proof.js` (modules Node natifs `fs`/`crypto` uniquement) lit le manifeste, recalcule chaque empreinte, compare, et produit un verdict global reproductible dans `fixtures/audit-verification-result.json`.

## 2. Artefacts vérifiés

| Run | Fichier |
|---|---|
| RUN01 | `fixtures/extract-proof.json` |
| RUN02 | `fixtures/triage-result.json` |
| RUN03 | `fixtures/human-review-result.json` |
| RUN04 | `fixtures/final-document.json` |

## 3. Résultats MATCH

Les 4 entrées ont produit un statut `MATCH` : `expected_sha256` égal à `actual_sha256` pour chacune, sans exception.

## 4. Vérification indépendante des SHA-256

Chaque empreinte a été **recalculée** à partir du contenu réel des fichiers sur disque au moment de l'exécution (`sha256(entry.file)`), et comparée à l'empreinte déclarée dans `fixtures/audit-proof.json` (RUN05) — pas une simple relecture du manifeste. Les 4 comparaisons concordent.

## 5. Vérification du chain_hash

Le `chain_hash` déclaré (`83dce50b...376f`) a été recalculé indépendamment par concaténation ordonnée des 4 empreintes SHA-256 puis hachage SHA-256 du résultat. Valeur recalculée identique à la valeur attendue : `chain_hash.status = "MATCH"`.

## 6. Test négatif contrôlé et restauration

Pour valider que le script détecte réellement une divergence (et ne renvoie pas toujours `VERIFIED` par construction), un test négatif isolé a été mené :
- Copie jetable de `final-document.json` créée (`tmp-tamper-test.json`), valeur `total_amount` altérée (125000 → 125001)
- Manifeste de test jetable créé (`tmp-tamper-manifest.json`), entrée RUN04 repointée vers le fichier altéré, `sha256` attendu inchangé
- Résultat réel (`VERIFIED`) sauvegardé avant le test
- Exécution du script sur le manifeste de test : résultat `status: MISMATCH` sur RUN04, `overall_status: FAILED` — comportement correctement détecté
- Résultat réel restauré depuis la sauvegarde, revérifié (`overall_status: VERIFIED`)
- Les 3 fichiers temporaires supprimés ; `git status --short` confirmé propre (aucune trace résiduelle)

Aucun artefact publié (RUN01–RUN05, ni la version finale de `audit-verification-result.json`) n'a été affecté de façon durable par ce test.

## 7. Reproductibilité

Le script n'utilise que des modules Node natifs (`fs`, `crypto`), aucun appel réseau, aucune dépendance externe, aucun timestamp variable dans les données comparées. Le résultat est déterministe : deux exécutions successives sur les mêmes fichiers produisent des empreintes et un verdict identiques (propriété déjà établie en RUN05 pour `audit-proof.json`, confirmée ici par construction du script de vérification).

## 8. Absence de réseau / DWS

Aucun appel à l'API Nutrient DWS n'a eu lieu durant RUN06. La vérification porte exclusivement sur des fichiers déjà présents localement, produits lors des RUN01–RUN05.

## 9. Absence de modification des artefacts antérieurs

Les fichiers sources RUN01–RUN04 (`extract-proof.json`, `triage-result.json`, `human-review-result.json`, `final-document.json`) et le manifeste RUN05 (`audit-proof.json`) n'ont subi aucune modification durant RUN06. Le test négatif (section 6) a opéré exclusivement sur des copies temporaires, supprimées après usage.

## 10. Divergence de nomenclature constatée

Lors du cadrage initial de la revérification, une vérification a été demandée sur des champs nommés `verification`, `source_integrity_verified` et `chain_hash_verified`. Ces champs **n'existent pas** dans le schéma réel produit par `verify-audit-proof.js`. Le schéma réel utilise :
- `overall_status` (valeurs possibles : `VERIFIED` / `FAILED`) — équivalent fonctionnel du champ `verification` demandé
- `chain_hash.status` (`MATCH` / `MISMATCH`), au sein d'un objet `chain_hash: { expected, recomputed, status }` — équivalent fonctionnel du champ `chain_hash_verified` demandé
- Aucun champ n'agrège explicitement une notion de « source_integrity_verified » globale distincte du statut par entrée (`entries[].status`)

Cette divergence n'a pas été masquée ni comblée par l'ajout de champs artificiels ; le verdict ci-dessous se fonde uniquement sur les champs réellement présents et vérifiés.

## 11. Verdict

Toutes les vérifications ci-dessus ont été menées et documentées : 4/4 artefacts en `MATCH`, `chain_hash` en `MATCH`, `overall_status: VERIFIED`, test négatif concluant avec restauration propre, reproductibilité confirmée, aucun appel réseau, aucun artefact antérieur altéré, divergence de nomenclature documentée sans dissimulation.

**RUN06 — PASS / CLOSED**
