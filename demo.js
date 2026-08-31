'use strict';

/**
 * demo.js — Orchestrateur de démonstration end-to-end (Livrable 2)
 *
 * Ce script NE CONTIENT AUCUNE LOGIQUE MÉTIER.
 * Il appelle séquentiellement les 6 scripts existants du pipeline,
 * dans leur ordre réel, et affiche un résumé terminal structuré.
 *
 * Catégories :
 *   REAL       — RUN01, RUN02 (extraction DWS réelle + triage local déterministe)
 *   SYNTHETIC  — RUN03, RUN04 (human review simulée sur cas synthétique séparé)
 *   INTEGRITY  — RUN05, RUN06 (preuve SHA-256/chain_hash + vérification)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;

const STEPS = [
  { run: 'RUN01', label: 'Extraction (Nutrient DWS)', script: 'extract-test.js', category: 'REAL' },
  { run: 'RUN02', label: 'Triage (local, déterministe)', script: 'triage.js', category: 'REAL' },
  { run: 'RUN03', label: 'Human Review (cas synthétique)', script: 'human-review.js', category: 'SYNTHETIC' },
  { run: 'RUN04', label: 'Finalize (hérite du synthétique)', script: 'finalize.js', category: 'SYNTHETIC' },
  { run: 'RUN05', label: 'Audit Proof (SHA-256 / chain_hash)', script: 'build-audit-proof.js', category: 'INTEGRITY' },
  { run: 'RUN06', label: 'Verify Audit Proof', script: 'verify-audit-proof.js', category: 'INTEGRITY' },
];

function fail(message) {
  console.error(`\nSTOP: ${message}`);
  process.exit(1);
}

function preflight() {
  console.log('=== PREFLIGHT ===');

  const required = [
    'package.json',
    'fixtures/invoice-test.pdf',
    'fixtures/triage-result-synthetic-review-case.json',
  ];

  for (const rel of required) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      fail(`fichier requis manquant: ${rel}`);
    }
    console.log(`  [OK] ${rel}`);
  }

  if (!process.env.DWS_API_KEY) {
    fail('variable d\'environnement DWS_API_KEY absente (valeur jamais affichée par ce script)');
  }
  console.log('  [OK] DWS_API_KEY présente (valeur non affichée)');

  console.log('Préflight terminé.\n');
}

function runStep(step) {
  console.log(`--- [${step.run}] ${step.label} (${step.category}) ---`);
  try {
    execFileSync('node', [step.script], { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    fail(`échec à l'étape ${step.run} (${step.script}), code de sortie non nul.`);
  }
  console.log(`[${step.run}] OK\n`);
}

function readJsonSafe(rel) {
  const p = path.join(ROOT, rel);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    return null;
  }
}

function printSummary() {
  console.log('=== RÉSUMÉ FINAL ===\n');

  const triage = readJsonSafe('fixtures/triage-result.json');
  const humanReview = readJsonSafe('fixtures/human-review-result.json');
  const finalDoc = readJsonSafe('fixtures/final-document.json');
  const auditProof = readJsonSafe('fixtures/audit-proof.json');
  const verification = readJsonSafe('fixtures/audit-verification-result.json');

  console.log('[RUN01] Extraction (REAL — Nutrient DWS)........... OK');

  if (triage) {
    console.log(`[RUN02] Triage (REAL — local, seuil ${triage.threshold})........ OK  verdict: ${triage.global_verdict}`);
  } else {
    console.log('[RUN02] Triage (REAL — local)....................... OK (résultat non relu)');
  }

  if (humanReview && humanReview.fields) {
    const decisions = Object.values(humanReview.fields).filter(f => f.reviewer_decision);
    const validated = decisions.filter(f => f.reviewer_decision === 'VALIDATED').length;
    const rejected = decisions.filter(f => f.reviewer_decision === 'REJECTED').length;
    console.log(`[RUN03] Human Review (SYNTHETIC — cas simulé)....... OK  ${validated} VALIDATED / ${rejected} REJECTED`);
  } else {
    console.log('[RUN03] Human Review (SYNTHETIC — cas simulé)....... OK (résultat non relu)');
  }

  if (finalDoc) {
    console.log(`[RUN04] Finalize (SYNTHETIC — hérite RUN03)......... OK  synthetic_source: ${finalDoc.synthetic_source}`);
  } else {
    console.log('[RUN04] Finalize (SYNTHETIC — hérite RUN03)......... OK (résultat non relu)');
  }

  if (auditProof) {
    console.log(`[RUN05] Audit Proof (INTEGRITY — 4 artefacts, SHA-256 + chain_hash). OK  chain_hash: ${auditProof.chain_hash.slice(0, 16)}...`);
  } else {
    console.log('[RUN05] Audit Proof (INTEGRITY)..................... OK (résultat non relu)');
  }

  if (verification) {
    console.log(`[RUN06] Verify (INTEGRITY — recalcul + comparaison). OK  overall_status: ${verification.overall_status}`);
  } else {
    console.log('[RUN06] Verify (INTEGRITY).......................... OK (résultat non relu)');
  }

  console.log('\n--------------------------------------------------');
  console.log('Nature des preuves :');
  console.log('  REAL       : RUN01, RUN02  (extraction + triage sur données réelles DWS)');
  console.log('  SYNTHETIC  : RUN03, RUN04  (revue humaine simulée, cas de test)');
  console.log('  INTEGRITY  : RUN05, RUN06  (SHA-256 / chain_hash sur 4 artefacts —');
  console.log('               atteste l\'intégrité des fichiers, PAS que tous sont réels)');
  console.log('--------------------------------------------------\n');

  console.log('Pipeline terminé avec succès.');
}

function main() {
  console.log('=== COMPLIANCE COPILOT — DEMO END-TO-END ===\n');
  preflight();
  for (const step of STEPS) {
    runStep(step);
  }
  printSummary();
}

main();
