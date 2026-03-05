const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf16le'));
let hasErrors = false;
data.forEach(r => {
    const errs = r.messages.filter(m => m.severity === 2);
    if (errs.length > 0) {
        hasErrors = true;
        console.log('File:', r.filePath);
        errs.forEach(m => console.log('Line ' + m.line + ': ' + m.message));
        console.log('---');
    }
});
if (!hasErrors) console.log("No errors found!");
