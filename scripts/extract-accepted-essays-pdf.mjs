/**
 * One-off: extract text from the accepted-essays PDF into src/data/accepted-essays-corpus.txt
 * Usage: node scripts/extract-accepted-essays-pdf.mjs "C:\\path\\to\\file.pdf"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "src", "data", "accepted-essays-corpus.txt");

const pdfPath = process.argv[2] || process.env.ACCEPTED_ESSAYS_PDF;
if (!pdfPath) {
  console.error(
    'Usage: node scripts/extract-accepted-essays-pdf.mjs "<path-to.pdf>"\n' +
      "Or set ACCEPTED_ESSAYS_PDF to the PDF path.",
  );
  process.exit(1);
}

const buf = fs.readFileSync(pdfPath);
pdfParse(buf).then((data) => {
  const text = String(data.text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, text, "utf8");
  console.log(`Wrote ${outPath} (${text.length} chars, ${data.numpages} pages)`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
