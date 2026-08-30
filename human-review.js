const fs = require('fs');

const SOURCE_FILE = 'fixtures/triage-result-synthetic-review-case.json';
const OUTPUT_FILE = 'fixtures/human-review-result.json';

// Décisions humaines simulées, codées en dur pour ce scénario de test.
// Ces décisions ne proviennent d'aucun appel DWS et ne remplacent jamais
// une confidence ou une valeur retournée par l'API.
const SIMULATED_DECISIONS = {
  supplier: {
    decision: 'VALIDATED',
    reviewed_value: 'ACME Test Services Ltd',
    note: 'Le réviseur confirme que la valeur extraite est correcte malgré la confidence basse.'
  },
  invoice_date: {
    decision: 'REJECTED',
    reviewed_value: '2026-08-29',
    note: 'Le réviseur corrige la date : la valeur extraite était incorrecte (exemple synthétique).'
  }
};

function main() {
  const raw = fs.readFileSync(SOURCE_FILE, 'utf8');
  const triage = JSON.parse(raw);

  if (triage.synthetic !== true) {
    throw new Error('Source refusée : ce script ne doit traiter que des entrées explicitement marquées "synthetic": true.');
  }

  const fields = {};

  for (const [fieldName, fieldData] of Object.entries(triage.fields)) {
    if (fieldData.status === 'AUTO_VALIDATED') {
      // Champ auto-validé : transmis inchangé, jamais retouché par la revue humaine.
      fields[fieldName] = { ...fieldData };
      continue;
    }

    if (fieldData.status === 'NEEDS_HUMAN_REVIEW') {
      const decision = SIMULATED_DECISIONS[fieldName];
      if (!decision) {
        throw new Error(`Aucune décision simulée définie pour le champ "${fieldName}".`);
      }

      const newStatus = decision.decision === 'VALIDATED' ? 'HUMAN_VALIDATED' : 'HUMAN_REJECTED';

      fields[fieldName] = {
        original_value: fieldData.value,
        original_confidence: fieldData.confidence,
        original_status: fieldData.status,
        reviewer_decision: decision.decision,
        reviewed_value: decision.reviewed_value,
        reviewer_note: decision.note,
        status: newStatus,
        decision_source: 'human_review_simulation'
      };
      continue;
    }

    throw new Error(`Statut inattendu pour "${fieldName}": ${fieldData.status}`);
  }

  const result = {
    source_file: SOURCE_FILE,
    synthetic_source: true,
    fields,
    generated_note: 'Ce fichier contient des décisions humaines simulées (decision_source: human_review_simulation) pour les champs synthétiquement placés en revue. Il ne représente aucun appel DWS réel.'
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log('Human review simulation terminée. Résultat écrit dans', OUTPUT_FILE);
}

main();
