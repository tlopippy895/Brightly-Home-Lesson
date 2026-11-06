const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { SUBJECT_MAP, classifyWeekType, getSubjectSlug } = require('./parse_scheme_config.cjs');

function normalizePageText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ');
}

function parseWeeksFromTermText(termText, grade, subject, termNum, sourcePage) {
  const lines = termText.split('\n').map(l => l.trim()).filter(Boolean);
  const weekEntries = [];
  const weekRegex = /^(\d{1,2}(?:\s*[-–]\s*\d{1,2})?)\s+(.*)/;

  let currentWeek = null;
  let currentTopic = '';
  let currentContent = [];
  let sawBullet = false;

  function flush() {
    if (currentWeek) {
      let fullContent = currentContent.join(' ').trim();
      let subtopics = [];
      if (fullContent.includes('•')) {
        subtopics = fullContent.split('•').map(s => s.trim()).filter(Boolean);
      } else if (fullContent.includes('')) {
        subtopics = fullContent.split('').map(s => s.trim()).filter(Boolean);
      } else if (fullContent.includes(';')) {
        subtopics = fullContent.split(';').map(s => s.trim()).filter(Boolean);
      } else {
        subtopics = fullContent ? [fullContent] : [];
      }

      let finalTopic = currentTopic.trim();
      // Clean leading bullet or dash
      finalTopic = finalTopic.replace(/^[•\-–\s]+/, '').trim();
      if (finalTopic.includes('•')) {
        const parts = finalTopic.split('•');
        finalTopic = parts[0].trim();
        const extra = parts.slice(1).map(s => s.trim()).filter(Boolean);
        subtopics = extra.concat(subtopics);
      }
      if (finalTopic.includes('')) {
        const parts = finalTopic.split('');
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
        const subjectSlug = getSubjectSlug(subject);
        const recordId = `p${grade}-t${termNum}-w${w}-${subjectSlug}`;
        
        weekEntries.push({
          id: recordId,
          grade,
          subject,
          term: termNum,
          termName: termNum === 1 ? 'First Term' : termNum === 2 ? 'Second Term' : 'Third Term',
          week: w,
          rawWeekLabel: currentWeek,
          topic: finalTopic || `Week ${w} Study`,
          subtopics,
          contentDetails: fullContent,
          weekType: classifyWeekType(finalTopic),
          isFree: w === 1,
          hasFullLesson: false,
          publishingStatus: 'DRAFT',
          sourceDocument: 'THE COMPLETE SCHEME OF WORK FOR PRE-PRIMARY & PRIMARY SCHOOLS.pdf',
          sourceReference: `Pawills Consulting, Primary ${grade} ${subject}, Term ${termNum}, Week ${w} (Page ${sourcePage})`,
          notes: 'Extracted directly from uploaded comprehensive scheme of work.'
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
        sawBullet = false;
        if (rest.includes('•') || rest.includes('')) {
          sawBullet = true;
          const bulletIdx = rest.search(/[•]/);
          currentTopic = rest.slice(0, bulletIdx).trim();
          currentContent = [rest.slice(bulletIdx)];
        } else {
          currentTopic = rest.trim();
          currentContent = [];
        }
        continue;
      }
    }

    if (currentWeek) {
      if (line.includes('•') || line.includes('')) {
        sawBullet = true;
        currentContent.push(line);
      } else if (!sawBullet) {
        // Line belongs to topic title before bullet points start
        currentTopic = (currentTopic + ' ' + line).trim();
      } else {
        currentContent.push(line);
      }
    }
  }
  flush();

  return weekEntries;
}

async function extractAll() {
  console.log('Loading PDF...');
  const buf = fs.readFileSync('public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf');
  const parser = new PDFParse({ data: buf });
  const doc = await parser.getText();
  console.log('PDF Loaded. Total pages:', doc.pages.length);

  const allImportedRecords = [];
  const coverageByGrade = {};

  for (let g = 1; g <= 6; g++) {
    coverageByGrade[g] = {
      grade: g,
      className: `Primary ${g}`,
      subjectsFound: [],
      totalTopics: 0,
      terms: { 1: 0, 2: 0, 3: 0 },
      flaggedItems: []
    };
  }

  for (const subj of SUBJECT_MAP) {
    let fullText = '';
    for (let p = subj.startPage; p <= subj.endPage; p++) {
      fullText += '\n' + normalizePageText(doc.pages[p - 1]?.text || '');
    }

    const t1Match = fullText.search(/(?:FIRST|1ST)\s+TERM/i);
    const t2Match = fullText.search(/(?:SECOND|2ND)\s+TERM/i);
    const t3Match = fullText.search(/(?:THIRD|3RD)\s+TERM/i);

    if (t1Match === -1 || t2Match === -1 || t3Match === -1) {
      coverageByGrade[subj.grade].flaggedItems.push({
        subject: subj.subject,
        issue: `Could not identify all 3 terms in text (T1: ${t1Match}, T2: ${t2Match}, T3: ${t3Match})`
      });
      continue;
    }

    const t1Text = fullText.slice(t1Match, t2Match);
    const t2Text = fullText.slice(t2Match, t3Match);
    const t3Text = fullText.slice(t3Match);

    const t1 = parseWeeksFromTermText(t1Text, subj.grade, subj.subject, 1, subj.startPage);
    const t2 = parseWeeksFromTermText(t2Text, subj.grade, subj.subject, 2, subj.startPage + 1);
    const t3 = parseWeeksFromTermText(t3Text, subj.grade, subj.subject, 3, subj.startPage + 2);

    const subjectWeeks = [...t1, ...t2, ...t3];
    allImportedRecords.push(...subjectWeeks);

    coverageByGrade[subj.grade].subjectsFound.push({
      subject: subj.subject,
      t1Count: t1.length,
      t2Count: t2.length,
      t3Count: t3.length,
      total: subjectWeeks.length
    });

    coverageByGrade[subj.grade].totalTopics += subjectWeeks.length;
    coverageByGrade[subj.grade].terms[1] += t1.length;
    coverageByGrade[subj.grade].terms[2] += t2.length;
    coverageByGrade[subj.grade].terms[3] += t3.length;
  }

  console.log('\n================ EXTRACTION SUMMARY ================');
  let grandTotal = 0;
  for (let g = 1; g <= 6; g++) {
    const c = coverageByGrade[g];
    console.log(`Primary ${g}: ${c.subjectsFound.length} subjects, ${c.totalTopics} topics (T1: ${c.terms[1]}, T2: ${c.terms[2]}, T3: ${c.terms[3]})`);
    grandTotal += c.totalTopics;
  }
  console.log('Grand Total Imported Topics:', grandTotal);

  fs.mkdirSync('src/data', { recursive: true });
  fs.mkdirSync('server/data', { recursive: true });

  const exportPayload = {
    metadata: {
      sourceDocument: 'THE COMPLETE SCHEME OF WORK FOR PRE-PRIMARY & PRIMARY SCHOOLS.pdf',
      publisher: 'Pawills Consulting',
      extractedAt: new Date().toISOString(),
      curriculumStandard: 'Nigerian Primary School Curriculum (Universal Basic Education)',
      disclaimer: 'Extracted verbatim from source PDF. Official government gazette endorsement claims require independent regulatory verification.',
      totalRecords: allImportedRecords.length,
      gradeSummary: coverageByGrade
    },
    records: allImportedRecords
  };

  fs.writeFileSync('src/data/extractedSchemeOfWork.json', JSON.stringify(exportPayload, null, 2));
  fs.writeFileSync('server/data/extractedSchemeOfWork.json', JSON.stringify(exportPayload, null, 2));
  console.log('Saved refined extracted scheme to src/data/extractedSchemeOfWork.json and server/data/extractedSchemeOfWork.json');
}

extractAll().catch(console.error);
