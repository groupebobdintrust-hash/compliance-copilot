const fs = require('fs');
const crypto = require('crypto');

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

const sources = [
  { run: 'RUN01', label: 'extraction', path: 'fixtures/extract-proof.json' },
  { run: 'RUN02', label: 'triage', path: 'fixtures/triage-result.json' },
  { run: 'RUN03', label: 'human_review', path: 'fixtures/human-review-result.json' },
  { run: 'RUN04', label: 'final_document', path: 'fixtures/final-document.json' }
];

const entries = sources.map(s => {
  if (!fs.existsSync(s.path)) {
    throw new Error(`STOP: fichier source manquant: ${s.path}`);
  }
  return {
    run: s.run,
    label: s.label,
    file: s.path,
    sha256: sha256(s.path)
  };
});

const chainInput = entries.map(e => e.sha256).join('');
const chain_hash = crypto.createHash('sha256').update(chainInput).digest('hex');

const manifest = {
  schema: 'compliance-copilot-audit-proof-v1',
  entries: entries,
  chain_hash: chain_hash
};

fs.writeFileSync('fixtures/audit-proof.json', JSON.stringify(manifest, null, 2));
console.log('RUN05: fixtures/audit-proof.json généré avec succès');
