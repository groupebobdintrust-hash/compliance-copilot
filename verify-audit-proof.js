const fs = require('fs');
const crypto = require('crypto');

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

const auditProofPath = process.argv[2] || 'fixtures/audit-proof.json';

if (!fs.existsSync(auditProofPath)) {
  throw new Error(`STOP: manifeste introuvable: ${auditProofPath}`);
}

const manifest = JSON.parse(fs.readFileSync(auditProofPath, 'utf8'));

if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
  throw new Error('STOP: manifeste invalide, entries manquant ou vide');
}

const results = manifest.entries.map(entry => {
  if (!fs.existsSync(entry.file)) {
    return {
      run: entry.run,
      file: entry.file,
      expected_sha256: entry.sha256,
      actual_sha256: null,
      status: 'FILE_MISSING'
    };
  }
  const actual = sha256(entry.file);
  return {
    run: entry.run,
    file: entry.file,
    expected_sha256: entry.sha256,
    actual_sha256: actual,
    status: actual === entry.sha256 ? 'MATCH' : 'MISMATCH'
  };
});

const chainInput = manifest.entries.map(e => e.sha256).join('');
const recomputed_chain_hash = crypto.createHash('sha256').update(chainInput).digest('hex');
const chain_status = recomputed_chain_hash === manifest.chain_hash ? 'MATCH' : 'MISMATCH';

const allMatch = results.every(r => r.status === 'MATCH') && chain_status === 'MATCH';

const output = {
  schema: 'compliance-copilot-audit-verification-v1',
  source_manifest: auditProofPath,
  entries: results,
  chain_hash: {
    expected: manifest.chain_hash,
    recomputed: recomputed_chain_hash,
    status: chain_status
  },
  overall_status: allMatch ? 'VERIFIED' : 'FAILED'
};

fs.writeFileSync('fixtures/audit-verification-result.json', JSON.stringify(output, null, 2));
console.log(`RUN06: verification terminee - overall_status: ${output.overall_status}`);
