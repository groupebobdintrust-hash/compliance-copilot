const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('fixtures/invoice-test.pdf'));

doc.fontSize(10).fillColor('red').text('DOCUMENT DE TEST — DONNEES FICTIVES', { align: 'center' });
doc.moveDown(2);

doc.fillColor('black').fontSize(20).text('FACTURE / INVOICE', { align: 'center' });
doc.moveDown(2);

doc.fontSize(12);
doc.text('Fournisseur : ACME Test Services Ltd');
doc.text('Numero de facture : INV-2026-001');
doc.text('Date : 2026-08-30');
doc.moveDown();
doc.text('Description                    Montant');
doc.text('Services de test               125000 NGN');
doc.moveDown();
doc.fontSize(14).text('Montant total : 125000 NGN');

doc.end();
console.log('Fixture generee.');
