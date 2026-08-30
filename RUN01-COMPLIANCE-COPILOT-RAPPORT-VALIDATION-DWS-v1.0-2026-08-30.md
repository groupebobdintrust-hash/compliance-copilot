# RUN 01 — Compliance Copilot — Rapport de validation preuve DWS
Date : 2026-08-30

## 1. Appel effectué
Appel réel à l'API Nutrient DWS, endpoint `/extraction/extract`, sur la fixture fictive `fixtures/invoice-test.pdf` (ACME Test Services Ltd, INV-2026-001), schéma demandé : `invoice_number` / `supplier` / `total_amount` / `invoice_date`.

## 2. Statut HTTP et code de sortie
- 1er appel : 401 Unauthorized
- 2e appel (après correction) : HTTP 200, code de sortie 0

## 3. Outcome
Succès. Réponse écrite dans `fixtures/extract-proof.json`.

## 4. Valeurs extraites (comparées à la fixture de référence)
| Champ | Valeur extraite | Fixture attendue | Verdict |
|---|---|---|---|
| invoice_number | INV-2026-001 | INV-2026-001 | PASS |
| supplier | ACME Test Services Ltd | ACME Test Services Ltd | PASS |
| total_amount | 125000 | 125000 (NGN) | PASS |
| invoice_date | 2026-08-30 | 2026-08-30 | PASS |

## 5. output.metadata et scores de confiance réellement observés
- supplier : confidence 0.95 (confidenceComponents.groundingScore 0.95, source: "no-logprobs")
- total_amount : confidence 0.9696927825876808 (formatScore 1, groundingScore 0.95, source: "no-logprobs")
- invoice_date : confidence 0.9696927825876808 (formatScore 1, groundingScore 0.95, source: "no-logprobs")
- invoice_number : confidence NON capturée dans la portion du fichier effectivement inspectée (champ situé hors de la zone consultée à l'écran) — RÉSERVE explicite, non affirmée comme validée par cette preuve.

## 6. Citations / localisations réellement présentes
Pour supplier, total_amount, invoice_date : match "id_match", pageIndex 0, pageNumber 1, source_bboxes présents avec coordonnées bbox et block_id (b2 pour supplier/invoice_date, b4 pour total_amount). Localisation cohérente avec un document mono-page.

## 7. Usage / crédits réellement retournés
usage.data_extraction_credits : coût 15 crédits pour cet appel, 4985 crédits restants.
price_composition : extract = 6 crédits (unit_cost 6, 1 unité), parse = 9 crédits (unit_cost 9, 1 unité).

## 8. Fichier de preuve
`/root/projects/compliance-copilot/fixtures/extract-proof.json`, présent et lu à plusieurs reprises durant la session de validation, contenu inchangé entre les lectures.

## 9. État Git
Dernier état connu (non revérifié dans cette session par un `git status` réel) : aucun commit ni push effectué sur compliance-copilot. RÉSERVE explicite : à confirmer par un `git status` séparé avant toute décision de commit.

## 10. Absence de secrets
Observation directe dans la session : commande `unset DWS_API_KEY` exécutée sur le serveur après le second appel, cohérent avec la discipline de non-persistance du credential déjà appliquée depuis GATE 4/G6.H1. Aucune valeur de clé affichée à l'écran durant les lectures effectuées.

## 11. Nombre total d'appels DWS
2 appels au total (1 échoué à 401, 1 réussi à 200). Aucun appel supplémentaire effectué durant la session de validation.

## 12. Historique du 401 et correction du credential
1er appel : clé DWS mal capturée dans la session (144 caractères au lieu de 52). Diagnostic posé, clé réexportée proprement (52 caractères, préfixe pdf_). 2e appel autorisé et exécuté avec succès (HTTP 200, code de sortie 0).

## VERDICT
RUN 01 — PASS / FUNCTIONAL PROOF ACHIEVED, sous réserve du point 5 (confidence invoice_number non observée) et du point 9 (état Git à reconfirmer avant toute décision de commit/push).
