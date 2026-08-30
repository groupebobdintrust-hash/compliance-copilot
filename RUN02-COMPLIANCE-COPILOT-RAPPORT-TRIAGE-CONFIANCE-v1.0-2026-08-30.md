# RUN 02 — Compliance Copilot — Rapport de triage par confiance
Date : 2026-08-30

## 1. Source utilisée
`fixtures/extract-proof.json` (preuve DWS produite lors de RUN 01, aucune modification apportée).

## 2. Seuil appliqué
0.90

## 3. Absence de tout appel réseau
Aucun appel réseau effectué. `triage.js` lit uniquement le fichier local `fixtures/extract-proof.json` via le module natif `fs`.

## 4. Logique appliquée
- Valeurs lues depuis `output.data[champ]`
- Confidences lues depuis `output.metadata[champ].confidence`
- Aucune inférence à partir de `confidenceComponents`, `groundingScore` ou `formatScore` : seule la clé `confidence` explicite a été utilisée.

## 5. Résultats des 4 champs
| Champ | Confidence | Statut |
|---|---|---|
| invoice_number | 0.95 | AUTO_VALIDATED |
| supplier | 0.95 | AUTO_VALIDATED |
| total_amount | 0.9696927825876808 | AUTO_VALIDATED |
| invoice_date | 0.9696927825876808 | AUTO_VALIDATED |

## 6. Verdict global
AUTO_VALIDATED

## 7. Résumé
4 champs auto-validés / 0 champ nécessitant une revue humaine.

## 8. Artefact produit
`fixtures/triage-result.json`, généré par exécution locale de `node triage.js`.

## 9. Code source
`triage.js` créé et vérifié syntaxiquement valide (`node --check triage.js`, aucune erreur retournée).

## 10. Intégrité RUN 01
Aucun artefact du RUN 01 n'a été modifié par cette opération (commit `34d41ad` inchangé, fichiers RUN 01 non touchés).

## 11. État Git observé
`triage.js` et `fixtures/triage-result.json` apparaissent comme fichiers non suivis (untracked). Le reste du dépôt est propre et synchronisé avec `origin/main`. Aucun `git add`, commit ou push effectué durant ce RUN.

## Correction relative au RUN 01
L'inspection complète de `fixtures/extract-proof.json` réalisée dans le cadre du cadrage de RUN 02 a établi que le champ `invoice_number` possède bien une confidence de 0.95 dans `output.metadata.invoice_number.confidence`. La réserve formulée dans le rapport RUN 01 (confidence non capturée dans la portion inspectée à l'écran) est donc une réserve d'inspection incomplète, désormais invalidée par les faits. Le commit RUN 01 (`34d41ad`) n'est pas modifié rétroactivement ; cette correction est actée ici comme amendement de traçabilité distinct.

## VERDICT
RUN 02 — PASS. Triage par confiance appliqué de façon déterministe et reproductible sur la preuve existante, sans nouvel appel DWS, sans modification du RUN 01.
