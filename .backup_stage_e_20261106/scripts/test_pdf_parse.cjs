const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');

pdf(dataBuffer).then(function(data) {
  console.log('Total pages in PDF:', data.numpages);
  console.log('Sample text (first 500 chars):', data.text.slice(0, 500));
}).catch(err => {
  console.error('PDF parse error:', err);
});
