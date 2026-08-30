const fs = require('fs');

const THRESHOLD = 0.90;
const FIELDS = ['invoice_number', 'supplier', 'total_amount', 'invoice_date'];
const SOURCE_FILE = 'fixtures/extract-proof.json';

function classify(confidence) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return { status: 'NEEDS_HUMAN_REVIEW', reason: 'confidence not available in source proof' };
  }
  if (confidence >= THRESHOLD) {
    return { status: 'AUTO_VALIDATED', reason: 'confidence >= 0.90' };
  }
  return { status: 'NEEDS_HUMAN_REVIEW', reason: 'confidence < 0.90' };
}

function main() {
  const raw = fs.readFileSync(SOURCE_FILE, 'utf8');
  const proof = JSON.parse(raw);

  const data = proof.output && proof.output.data;
  const metadata = proof.output && proof.output.metadata;

  if (!data || !metadata) {
    throw new Error('Structure attendue absente : output.data ou output.metadata manquant.');
  }

  const fields = {};
  let autoValidatedCount = 0;
  let needsReviewCount = 0;

  for (const field of FIELDS) {
    const value = data[field] !== undefined ? data[field] : null;
    const confidence = (metadata[field] && typeof metadata[field].confidence === 'number')
      ? metadata[field].confidence
      : null;

    const { status, reason } = classify(confidence);

    fields[field] = { value, confidence, status, reason };

    if (status === 'AUTO_VALIDATED') autoValidatedCount++;
    else needsReviewCount++;
  }

  let globalVerdict;
  if (autoValidatedCount === FIELDS.length) {
    globalVerdict = 'AUTO_VALIDATED';
  } else if (autoValidatedCount > 0) {
    globalVerdict = 'PARTIAL_REVIEW_REQUIRED';
  } else {
    globalVerdict = 'FULL_REVIEW_REQUIRED';
  }

  const result = {
    source_file: SOURCE_FILE,
    threshold: THRESHOLD,
    fields,
    global_verdict: globalVerdict,
    summary: {
      auto_validated_count: autoValidatedCount,
      needs_review_count: needsReviewCount
    }
  };

  fs.writeFileSync('fixtures/triage-result.json', JSON.stringify(result, null, 2));
  console.log('Triage terminé. Verdict global :', globalVerdict);
}

main();
