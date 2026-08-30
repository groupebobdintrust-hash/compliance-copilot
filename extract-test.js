// extract-test.js
// RUN 01 — Compliance Copilot — premier appel Nutrient DWS Data Extraction API
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.DWS_API_KEY;
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'invoice-test.pdf');
const PROOF_PATH = path.join(__dirname, 'fixtures', 'extract-proof.json');
const ENDPOINT = 'https://api.nutrient.io/extraction/extract';

const schema = {
  type: 'object',
  properties: {
    invoice_number: { type: 'string', description: 'Invoice identifier' },
    supplier: { type: 'string', description: 'Supplier or vendor name' },
    total_amount: { type: 'number', description: 'Final total amount on the invoice' },
    invoice_date: { type: 'string', format: 'date', description: 'Invoice date' }
  },
  required: ['invoice_number', 'total_amount']
};

const instructions = {
  schema,
  parseConfig: { mode: 'understand' },
  options: {
    includeCitations: true,
    strict: false,
    multimodal: false
  }
};

const baseProof = {
  endpoint: ENDPOINT,
  fixture: 'fixtures/invoice-test.pdf',
  schema
};

function writeProofAndExit(extra, exitCode) {
  const proof = Object.assign({}, baseProof, extra);
  fs.writeFileSync(PROOF_PATH, JSON.stringify(proof, null, 2));
  console.log('Preuve ecrite dans', PROOF_PATH);
  process.exit(exitCode);
}

async function main() {
  if (!API_KEY) {
    console.error('ERREUR: DWS_API_KEY absente de l\'environnement. Abandon.');
    process.exit(1);
  }

  if (!fs.existsSync(FIXTURE_PATH)) {
    console.error(`ERREUR: fixture introuvable a ${FIXTURE_PATH}. Abandon.`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(FIXTURE_PATH);
  const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });

  const form = new FormData();
  form.append('file', fileBlob, 'invoice-test.pdf');
  form.append('instructions', JSON.stringify(instructions));

  console.log('Envoi de la requete a', ENDPOINT, '...');

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form
    });
  } catch (networkErr) {
    writeProofAndExit(
      { outcome: 'NETWORK_ERROR', error_message: networkErr.message },
      1
    );
    return;
  }

  const status = response.status;
  const rawText = await response.text();

  let body;
  try {
    body = JSON.parse(rawText);
  } catch (parseErr) {
    writeProofAndExit(
      { outcome: 'NON_JSON_RESPONSE', response_status: status },
      1
    );
    return;
  }

  console.log('Statut HTTP:', status);

  if (status >= 400) {
    writeProofAndExit(
      {
        outcome: 'HTTP_ERROR',
        response_status: status,
        error_message: (body && (body.message || body.error)) || 'unspecified'
      },
      1
    );
    return;
  }

  const data = body.output && body.output.data;
  const metadata = body.output && body.output.metadata;
  const usage = body.usage || null;

  if (!data || !metadata) {
    writeProofAndExit(
      { outcome: 'MISSING_EXPECTED_OUTPUT', response_status: status, usage },
      1
    );
    return;
  }

  writeProofAndExit(
    {
      outcome: 'SUCCESS',
      response_status: status,
      output: { data, metadata },
      usage
    },
    0
  );
}

main().catch((err) => {
  console.error('Erreur inattendue non geree:', err.message);
  process.exit(1);
});
