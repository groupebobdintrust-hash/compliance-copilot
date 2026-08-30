# RUN04 — Compliance Copilot — Rapport de Finalisation

**Date** : 2026-08-30
**Statut** : RUN04 — PASS / FUNCTIONAL CONSOLIDATION ACHIEVED

## 1. Objectif

Consolider les décisions finales du pipeline (extraction → confiance → révision humaine) en un document final exploitable unique, avec valeur canonique retenue par champ et traçabilité complète de la source de chaque valeur (extraction automatique ou révision humaine).

## 2. Entrées utilisées

- `fixtures/human-review-result.json` (produit RUN03, cas synthétique)

## 3. Caractère synthétique

L'entrée de consolidation provient du cas synthétique RUN03 (`triage-result-synthetic-review-case.json` via `human-review-result.json`), seule entrée disponible démontrant un mélange réel de statuts AUTO_VALIDATED / HUMAN_VALIDATED / HUMAN_REJECTED. Le cas réel RUN02 (`triage-result.json`) ne contient que des champs AUTO_VALIDATED et n'a pas été utilisé comme source de consolidation. Le document final porte explicitement `synthetic_source: true`.

## 4. Logique de consolidation

Pour chaque champ (`invoice_number`, `supplier`, `total_amount`, `invoice_date`) :
- si statut `AUTO_VALIDATED` : valeur retenue = `value`, source tracée = `AUTO_VALIDATED` avec confidence d'origine ;
- si statut `HUMAN_VALIDATED` ou `HUMAN_REJECTED` : valeur retenue = `reviewed_value`, source tracée = `HUMAN_REVIEW` avec `human_status`, `decision_source`, et les valeurs/statut/confidence originaux.

Aucune inférence ni recalcul de confiance. Script : `finalize.js`.

## 5. Résultat final par champ

| Champ | Valeur retenue | Source |
|---|---|---|
| invoice_number | INV-2026-001 | AUTO_VALIDATED (confidence 0.95) |
| supplier | ACME Test Services Ltd | HUMAN_REVIEW / HUMAN_VALIDATED |
| total_amount | 125000 | AUTO_VALIDATED (confidence 0.9696927825876808) |
| invoice_date | 2026-08-29 | HUMAN_REVIEW / HUMAN_REJECTED (original: 2026-08-30) |

## 6. Traçabilité AUTO/HUMAN

Chaque champ HUMAN_REVIEW conserve dans `field_trace` : `human_status`, `decision_source: "human_review_simulation"`, `original_value`, `original_confidence`, `original_status`. Chaque champ AUTO_VALIDATED conserve sa `confidence` d'origine.

## 7. SHA-256 avant/après des trois sources

Avant exécution :
Après exécution : hashes strictement identiques.

## 8. Absence d'appel réseau/DWS

Aucun appel réseau effectué. `finalize.js` opère exclusivement en lecture/écriture locale de fichiers JSON.

## 9. Absence de modification des RUN01/RUN02/RUN03

Confirmée par comparaison des SHA-256 avant/après (point 7) : `extract-proof.json`, `triage-result.json` et `human-review-result.json` restent bit-à-bit inchangés.

## 10. Artefacts RUN04 créés

- `finalize.js`
- `fixtures/final-document.json`
- Le présent rapport

## 11. Réserve documentaire

Le contenu de `fixtures/final-document.json` a été vérifié par plusieurs lectures/captures successives, et non par un unique `cat` intégral visible en une seule capture. La structure et les valeurs ont été recoupées entre plusieurs segments d'affichage, sans discontinuité relevée entre eux, mais cette réserve méthodologique est actée.

## 12. Verdict

**RUN04 — PASS / FUNCTIONAL CONSOLIDATION ACHIEVED**
