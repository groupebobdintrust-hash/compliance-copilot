const fs = require('fs');

const input = JSON.parse(fs.readFileSync('fixtures/human-review-result.json', 'utf8'));
const expectedFields = ['invoice_number', 'supplier', 'total_amount', 'invoice_date'];

const final = {};
const trace = {};

for (const key of expectedFields) {
  const f = input.fields ? input.fields[key] : undefined;
  if (!f) {
    throw new Error(`STOP: champ attendu manquant dans human-review-result.json: ${key}`);
  }

  if (f.status === 'AUTO_VALIDATED') {
    if (typeof f.value === 'undefined') {
      throw new Error(`STOP: champ AUTO_VALIDATED sans 'value': ${key}`);
    }
    final[key] = f.value;
    trace[key] = {
      value: f.value,
      source: 'AUTO_VALIDATED',
      confidence: f.confidence
    };
  } else if (f.status === 'HUMAN_VALIDATED' || f.status === 'HUMAN_REJECTED') {
    if (typeof f.reviewed_value === 'undefined') {
      throw new Error(`STOP: champ ${f.status} sans 'reviewed_value': ${key}`);
    }
    final[key] = f.reviewed_value;
    trace[key] = {
      value: f.reviewed_value,
      source: 'HUMAN_REVIEW',
      human_status: f.status,
      decision_source: f.decision_source || null,
      original_value: f.original_value,
      original_confidence: f.original_confidence,
      original_status: f.original_status
    };
  } else {
    throw new Error(`STOP: statut inattendu pour ${key}: ${f.status}`);
  }
}

const output = {
  synthetic_source: true,
  source_note: "Document consolidé à partir d'un cas synthétique. Les décisions HUMAN_* proviennent de human_review_simulation et ne représentent pas une revue humaine réelle.",
  generated_from: input.source_file || 'fixtures/human-review-result.json',
  final_document: final,
  field_trace: trace
};

fs.writeFileSync('fixtures/final-document.json', JSON.stringify(output, null, 2));
console.log('RUN04: fixtures/final-document.json généré avec succès');
