const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { SUBJECT_MAP, cleanText, getSubjectSlug, classifyWeekType } = require('./parse_scheme_config.cjs');

async function testExtraction() {
  const buf = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');
  const parser = new PDFParse({ data: buf });
  const doc = await parser.getText();
  console.log('PDF Loaded. Total pages:', doc.pages.length);

  // Test first 3 subjects of P1
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const subj = SUBJECT_MAP[sIdx];
    console.log(`\n================== P${subj.grade} ${subj.subject} (Pages ${subj.startPage}-${subj.endPage}) ==================`);
    
    // Combine text of all pages for this subject
    let fullText = '';
    for (let p = subj.startPage; p <= subj.endPage; p++) {
      const pageText = doc.pages[p - 1]?.text || '';
      fullText += `\n--- PAGE ${p} ---\n` + pageText;
    }

    // Check occurrences of FIRST TERM, SECOND TERM, THIRD TERM
    console.log('Has FIRST TERM:', /FIRST\s+TERM/i.test(fullText));
    console.log('Has SECOND TERM:', /SECOND\s+TERM/i.test(fullText));
    console.log('Has THIRD TERM:', /THIRD\s+TERM/i.test(fullText));
  }
}

testExtraction().catch(console.error);
