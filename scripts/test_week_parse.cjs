const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { SUBJECT_MAP, cleanText, getSubjectSlug, classifyWeekType } = require('./parse_scheme_config.cjs');

function parseWeeksFromTermText(termText, grade, subject, termNum) {
  // Normalize tabs to spaces and cleanup headers
  let cleaned = termText
    .replace(/\d+\s+\|\s+985\|BACK TO TABLE OF CONTENT/gi, '')
    .replace(/--- PAGE \d+ ---/g, '')
    .replace(/Week\s+Topic\s+Breakdown\s*(\(Subtopics\))?/gi, '')
    .replace(/Week\s+Topic\s+Content(\s+Breakdown)?/gi, '')
    .replace(/Week\s+Theme\s*\/\s*Focus Area\s+Topic & Content Breakdown/gi, '')
    .replace(/WEE\s*K\s+TOPIC\s+CONTENT/gi, '');

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  const weekEntries = [];

  // Regex to match start of a week entry: e.g. "1 ", "12 ", "11-13 ", "11–13 "
  const weekRegex = /^(\d{1,2}(?:[–-]\d{1,2})?)\s+(.*)/;

  let currentWeek = null;
  let currentTopic = '';
  let currentContentLines = [];

  function flush() {
    if (currentWeek) {
      let fullContent = currentContentLines.join(' ').trim();
      // Split subtopics by bullet • or semicolons ; if available
      let subtopics = [];
      if (fullContent.includes('•')) {
        subtopics = fullContent.split('•').map(s => s.trim()).filter(Boolean);
      } else if (fullContent.includes(';')) {
        subtopics = fullContent.split(';').map(s => s.trim()).filter(Boolean);
      } else {
        subtopics = fullContent ? [fullContent] : [];
      }

      // If currentTopic has a bullet in it, separate topic and subtopic
      let finalTopic = currentTopic.trim();
      if (finalTopic.includes('•')) {
        const parts = finalTopic.split('•');
        finalTopic = parts[0].trim();
        const extra = parts.slice(1).map(s => s.trim()).filter(Boolean);
        subtopics = extra.concat(subtopics);
      }

      // Handle multi-week range like 11-13
      let startWeek = 1;
      let endWeek = 1;
      if (currentWeek.includes('-') || currentWeek.includes('–')) {
        const [s, e] = currentWeek.split(/[-–]/).map(n => parseInt(n.trim(), 10));
        startWeek = s;
        endWeek = e || s;
      } else {
        startWeek = parseInt(currentWeek, 10);
        endWeek = startWeek;
      }

      for (let w = startWeek; w <= endWeek; w++) {
        weekEntries.push({
          grade,
          subject,
          term: termNum,
          week: w,
          rawWeekLabel: currentWeek,
          topic: finalTopic,
          subtopics,
          contentDetails: fullContent,
          weekType: classifyWeekType(finalTopic)
        });
      }
    }
  }

  for (const line of lines) {
    const match = line.match(weekRegex);
    if (match) {
      // Check if it really is a week line (number is 1..13 or 11-13)
      const numStr = match[1];
      const rest = match[2];
      const isNumValid = /^([1-9]|1[0-3])([–-]([1-9]|1[0-3]))?$/.test(numStr);
      
      if (isNumValid) {
        flush();
        currentWeek = numStr;
        currentTopic = rest;
        currentContentLines = [];
        continue;
      }
    }

    if (currentWeek) {
      currentContentLines.push(line);
    }
  }
  flush();

  return weekEntries;
}

async function testSubjectParser() {
  const buf = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');
  const parser = new PDFParse({ data: buf });
  const doc = await parser.getText();

  // Test P1 English (Pages 611-616)
  const subj = SUBJECT_MAP[0];
  let fullText = '';
  for (let p = subj.startPage; p <= subj.endPage; p++) {
    fullText += `\n--- PAGE ${p} ---\n` + (doc.pages[p - 1]?.text || '');
  }

  // Split by terms
  const firstTermIdx = fullText.indexOf('FIRST TERM');
  const secondTermIdx = fullText.indexOf('SECOND TERM');
  const thirdTermIdx = fullText.indexOf('THIRD TERM');

  const t1Text = fullText.slice(firstTermIdx, secondTermIdx);
  const t2Text = fullText.slice(secondTermIdx, thirdTermIdx);
  const t3Text = fullText.slice(thirdTermIdx);

  const t1Weeks = parseWeeksFromTermText(t1Text, 1, subj.subject, 1);
  const t2Weeks = parseWeeksFromTermText(t2Text, 1, subj.subject, 2);
  const t3Weeks = parseWeeksFromTermText(t3Text, 1, subj.subject, 3);

  console.log('T1 weeks extracted:', t1Weeks.length);
  t1Weeks.forEach(w => console.log(`  W${w.week} [${w.weekType}]: ${w.topic} (${w.subtopics.length} subtopics)`));

  console.log('T2 weeks extracted:', t2Weeks.length);
  t2Weeks.forEach(w => console.log(`  W${w.week} [${w.weekType}]: ${w.topic} (${w.subtopics.length} subtopics)`));

  console.log('T3 weeks extracted:', t3Weeks.length);
  t3Weeks.forEach(w => console.log(`  W${w.week} [${w.weekType}]: ${w.topic} (${w.subtopics.length} subtopics)`));
}

testSubjectParser().catch(console.error);
