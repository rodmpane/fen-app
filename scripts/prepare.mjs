// Copie les bibliothèques (PDF, Excel, QR code) depuis node_modules vers www/vendor.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
const files = [
  ['node_modules/jspdf/dist/jspdf.umd.min.js', 'www/vendor/jspdf.umd.min.js'],
  ['node_modules/xlsx/dist/xlsx.full.min.js', 'www/vendor/xlsx.full.min.js'],
  ['node_modules/qrcode-generator/qrcode.js', 'www/vendor/qrcode.js'],
];
mkdirSync('www/vendor', { recursive: true });
for (const [from, to] of files) {
  if (!existsSync(from)) { console.error('Fichier introuvable : ' + from + ' (lancez d’abord « npm install »)'); process.exit(1); }
  copyFileSync(from, to);
  console.log('copié', to);
}
