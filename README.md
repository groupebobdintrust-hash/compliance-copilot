# Compliance Copilot

Moteur générique de traitement documentaire avec chaîne de confiance vérifiable — extraction automatique, décision par seuil de confiance, revue humaine tracée, document final consolidé, et preuve d'audit déterministe vérifiable indépendamment.

Construit pour le **DevNetwork [API + Cloud + AI] Hackathon 2026** — challenge sponsor **Nutrient DWS**.

## Le problème

Les documents professionnels (factures, contrats, formulaires) doivent souvent être extraits, validés et archivés dans des contextes réglementés. L'extraction automatique seule n'est pas fiable sans traçabilité : il faut savoir quels champs sont fiables, lesquels nécessitent une intervention humaine, et pouvoir prouver après coup que rien n'a été altéré.

## La solution

Une chaîne en six étapes qui traite un document, décide automatiquement de ce qui peut être validé sans intervention, trace toute correction humaine, consolide un document final, puis génère et vérifie une preuve d'intégrité cryptographique.

## Fonctionnement end-to-end

1. Extraction (Nutrient DWS Data Extraction API) -> champs extraits + score de confiance par champ
2. Triage par confiance (seuil 0.90) -> AUTO_VALIDATED si confiance >= 0.90, sinon NEEDS_HUMAN_REVIEW
3. Revue humaine (simulee pour cette demonstration) -> decision tracee pour chaque champ a faible confiance
4. Consolidation du document final -> valeur retenue par champ + source (AUTO ou HUMAN) + tracabilite complete
5. Preuve d'audit deterministe -> SHA-256 de chaque artefact + chain_hash reproductible
6. Verification independante de la preuve -> recalcul des empreintes, detection de toute falsification

## Role central de Nutrient DWS

L'etape 1 (extraction) appelle reellement l'API Nutrient DWS Data Extraction (api.nutrient.io/extraction/extract) pour lire un PDF de facture et en extraire les champs structures (numero de facture, fournisseur, montant total, date) avec un score de confiance par champ. Ce score de confiance est la donnee qui pilote directement l'etape 2 (triage automatique vs revue humaine) : sans lui, la distinction entre "peut etre valide automatiquement" et "doit etre revu par un humain" n'existe pas. DWS n'est donc pas un appel isole en peripherie du projet -- c'est la source de la donnee qui structure toute la chaine de decision en aval.

## Chaine de preuve technique RUN01 a RUN06

Le projet a ete construit et verifie par increments, chacun documente et publie separement :

- RUN01 : extraction reelle via Nutrient DWS -- RUN01-COMPLIANCE-COPILOT-RAPPORT-VALIDATION-DWS-v1.0-2026-08-30.md
- RUN02 : triage automatique par seuil de confiance -- RUN02-COMPLIANCE-COPILOT-RAPPORT-TRIAGE-CONFIANCE-v1.0-2026-08-30.md
- RUN03 : revue humaine simulee avec tracabilite -- pas de rapport dedie, voir Limites ci-dessous
- RUN04 : consolidation du document final trace -- RUN04-COMPLIANCE-COPILOT-RAPPORT-FINALISATION-v1.0-2026-08-30.md
- RUN05 : preuve d'audit deterministe et reproductible -- RUN05-COMPLIANCE-COPILOT-RAPPORT-AUDIT-PROOF-v1.0-2026-08-30.md
- RUN06 : verification independante de la preuve, avec test negatif concluant -- RUN06-COMPLIANCE-COPILOT-RAPPORT-AUDIT-VERIFICATION-v1.0-2026-08-30.md

Cette chaine n'est pas seulement decrite : elle a ete testee activement. En RUN06, un test negatif controle a deliberement altere un artefact pour confirmer que la verification detecte reellement une falsification (MISMATCH / overall_status: FAILED) -- avant restauration propre du resultat reel (VERIFIED).

## Preuves

Toutes les preuves sont dans le depot, aucune n'est decrite sans exister :

- fixtures/invoice-test.pdf -- facture de test (fictive)
- fixtures/extract-proof.json -- resultat reel de l'appel DWS
- fixtures/triage-result.json -- resultat du triage par confiance
- fixtures/human-review-result.json, fixtures/triage-result-synthetic-review-case.json -- artefacts de la revue humaine simulee
- fixtures/final-document.json -- document final consolide avec tracabilite
- fixtures/audit-proof.json -- preuve d'audit deterministe (RUN05)
- fixtures/audit-verification-result.json -- resultat de la verification independante (RUN06)

## Architecture minimale

Scripts, dans l'ordre d'execution reel :

1. fixtures/generate-fixture.js -- genere la facture de test PDF
2. extract-test.js -- appelle l'API DWS Data Extraction
3. triage.js -- classe les champs par seuil de confiance
4. human-review.js -- applique des decisions humaines simulees sur le cas synthetique
5. finalize.js -- consolide le document final
6. build-audit-proof.js -- construit la preuve d'audit deterministe
7. verify-audit-proof.js -- verifie independamment la preuve d'audit

## Instructions de reproduction

Prerequis : Node.js, un compte Nutrient DWS avec une cle API.

Depuis la racine du depot (obligatoire, voir note ci-dessous) :

    npm install
    export DWS_API_KEY="votre_cle_dws"
    node extract-test.js
    node triage.js
    node human-review.js
    node finalize.js
    node build-audit-proof.js
    node verify-audit-proof.js

Note importante : triage.js et human-review.js utilisent des chemins de fichiers relatifs (fixtures/...) et doivent donc etre executes depuis la racine du depot, pas depuis un autre repertoire.

## Limites actuelles

- RUN03 (revue humaine) est simule, pas connecte a une vraie interface humaine. human-review.js applique des decisions codees en dur pour un scenario de test, comme l'indique explicitement un commentaire dans le fichier source : "Decisions humaines simulees, codees en dur pour ce scenario de test. Ces decisions ne proviennent d'aucun appel DWS et ne remplacent jamais une confidence ou une valeur retournee par l'API."
- Aucun rapport Markdown dedie n'existe pour RUN03 -- seuls les artefacts (human-review.js, fixtures/human-review-result.json, fixtures/triage-result-synthetic-review-case.json) et l'historique de commit documentent cette etape.
- Un seul type de document a ete teste (facture), sur une fixture fictive unique.
- Pas de conversion vers un format e-invoice structure.
- Pas de signature numerique du document final.
- Pas d'integration avec la DWS Viewer pour une revue humaine reelle en interface.

## Pistes d'evolution

- Remplacer la revue humaine simulee par une veritable interface de revue (potentiellement via Nutrient DWS Viewer)
- Conversion du document final vers un format e-invoice structure (ex. conformite mandat francais, applicable des le 1er septembre 2026)
- Signature numerique du document final pour en garantir l'authenticite de facon prouvable
- Support de types de documents supplementaires (contrats, formulaires, pieces d'identite)
- Gestion de cas limites reels (champ manquant, fichier corrompu)

## Chaine de commits

Tous les increments RUN01 a RUN06 sont publies sur la branche main de ce depot public, chacun avec un message de commit explicite et verifiable via l'historique Git.
