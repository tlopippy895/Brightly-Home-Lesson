const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function testPrimary1Extraction() {
  const buf = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  
  console.log('Total pages:', result.pages.length);
  
  // Let's inspect pages 610 to 666 (indexes 609 to 665)
  const p1Pages = result.pages.slice(609, 666);
  console.log('P1 pages count:', p1Pages.length);

  for (let i = 0; i < 15; i++) {
    const pageNum = 610 + i;
    const pageText = p1Pages[i].text.replace(/\t+/g, ' ');
    const firstLine = pageText.split('\n').slice(0, 3).join(' | ');
    console.log(`Page ${pageNum}: ${firstLine.slice(0, 100)}`);
  }
}

testPrimary1Extraction().catch(console.error);
