const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { SUBJECT_MAP, classifyWeekType } = require('./parse_scheme_config.cjs');

function normalizePageText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ');
}

function parseWeeksFromTermText(termText, grade, subject, termNum) {
  // Normalize lines
  const lines = termText.split('\n').map(l => l.trim()).filter(Boolean);
  const weekEntries = [];

  // Match: starts with 1-13 or 1-2 digits, or ranges like 11-13
  const weekRegex = /^(\d{1,2}(?:\s*[-–]\s*\d{1,2})?)\s+(.*)/;

  let currentWeek = null;
  let currentTopic = '';
  let currentContent = [];

  function flush() {
    if (currentWeek) {
      let fullContent = currentContent.join(' ').trim();
      let subtopics = [];
      if (fullContent.includes('•')) {
        subtopics = fullContent.split('•').map(s => s.trim()).filter(Boolean);
      } else if (fullContent.includes(';')) {
        subtopics = fullContent.split(';').map(s => s.trim()).filter(Boolean);
      } else {
        subtopics = fullContent ? [fullContent] : [];
      }

      let finalTopic = currentTopic.trim();
      if (finalTopic.includes('•')) {
        const parts = finalTopic.split('•');
        finalTopic = parts[0].trim();
        const extra = parts.slice(1).map(s => s.trim()).filter(Boolean);
        subtopics = extra.concat(subtopics);
      }

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
    if (line.includes('| 985|BACK TO TABLE OF CONTENT')) continue;
    if (/^(FIRST|SECOND|THIRD)\s+TERM/i.test(line)) continue;
    if (/^Week\s+Topic/i.test(line)) continue;
    if (/^PRIMARY\s+\d/i.test(line)) continue;

    const match = line.match(weekRegex);
    if (match) {
      const numStr = match[1].replace(/\s+/g, '');
      const rest = match[2];
      const isNumValid = /^([1-9]|1[0-3])([–-]([1-9]|1[0-3]))?$/.test(numStr);
      
      if (isNumValid) {
        flush();
        currentWeek = numStr;
        currentTopic = rest;
        currentContent = [];
        continue;
      }
    }

    if (currentWeek) {
      currentContent.push(line);
    }
  }
  flush();

  return weekEntries;
}

async function testFull() {
  const buf = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');
  const parser = new PDFParse({ data: buf });
  const doc = await parser.getText();

  // Test P1 English
  const subj = SUBJECT_MAP[0];
  let fullText = '';
  for (let p = subj.startPage; p <= subj.endPage; p++) {
    fullText += '\n' + normalizePageText(doc.pages[p - 1]?.text || '');
  }

  const t1Match = fullText.search(/FIRST\s+TERM/i);
  const t2Match = fullText.search(/SECOND\s+TERM/i);
  const t3Match = fullText.search(/THIRD\s+TERM/i);

  const t1Text = fullText.slice(t1Match, t2Match);
  const t2Text = fullText.slice(t2Match, t3Match);
  const t3Text = fullText.slice(t3Match);

  const t1 = parseWeeksFromTermText(t1Text, 1, subj.subject, 1);
  const t2 = parseWeeksFromTermText(t2Text, 1, subj.subject, 2);
  const t3 = parseWeeksFromTermText(t3Text, 1, subj.subject, 3);

  console.log(`P1 ${subj.subject} Results:`);
  console.log('T1 count:', t1.length, t1.map(w => `W${w.week}:${w.topic.slice(0, 20)}`).join(', '));
  console.log('T2 count:', t2.length, t2.map(w => `W${w.week}:${w.topic.slice(0, 20)}`).join(', '));
  console.log('T3 count:', t3.length, t3.map(w => `W${w.week}:${w.topic.slice(0, 20)}`).join(', '));
}

testFull().catch(console.error);
