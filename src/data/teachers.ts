import { TeacherPersona, GradeLevel, SubjectName } from '../types';
import teacherChidinma from '../assets/images/nigerian_female_teacher_1788178756843.jpg';
import teacherEmeka from '../assets/images/nigerian_male_teacher_1788178776875.jpg';
import teacherZainab from '../assets/images/nigerian_teacher_zainab_1788178797862.jpg';
import teacherBabatunde from '../assets/images/nigerian_teacher_babatunde_1788178818634.jpg';

/**
 * BRIGHTLY HOME LESSON — 6 DEDICATED CLASS TEACHERS (PRIMARY 1 TO PRIMARY 6)
 * In accordance with the Nigerian primary school model, each primary class has a dedicated
 * Class Teacher who teaches and guides pupils across all core subjects in that class.
 */
export const NIGERIAN_TEACHERS: TeacherPersona[] = [
  {
    id: 'zainab',
    name: 'Mallama Zainab Bello',
    title: 'Primary 1 Dedicated Class Teacher',
    classTitle: 'Primary 1 Class Teacher',
    assignedGrade: 1,
    ethnicGroup: 'Hausa',
    gender: 'female',
    avatarEmoji: '🧕🏾',
    avatarColor: '#D97706', // Warm Amber
    imageUrl: teacherZainab,
    subjectSpecialty: 'English Studies',
    gradeRange: 'Primary 1',
    description: 'Dedicated Primary 1 Class Teacher. Gentle, patient, and nurturing for early primary learners. Specializes in foundational phonics, early number bonds, joyful storytelling, and building initial school confidence.',
    greeting: 'Sannu kowa, my dear Primary 1 pupil! Welcome to your class. I am Mallama Zainab Bello, your Primary 1 class teacher, and I am so happy to learn with you today.',
    accentNote: 'Gentle, melodious northern Nigerian English cadence with high clarity and patience.'
  },
  {
    id: 'chidinma',
    name: 'Mrs Chidinma Okafor',
    title: 'Primary 2 Dedicated Class Teacher',
    classTitle: 'Primary 2 Class Teacher',
    assignedGrade: 2,
    ethnicGroup: 'Igbo',
    gender: 'female',
    avatarEmoji: '👩🏾‍🏫',
    avatarColor: '#1E88E5', // Primary Blue
    imageUrl: teacherChidinma,
    subjectSpecialty: 'Mathematics',
    gradeRange: 'Primary 2',
    description: 'Dedicated Primary 2 Class Teacher. Warm, encouraging, and attentive. Known for using concrete real-world objects, relatable stories, and step-by-step guidance to solidify reading, counting, and early science in Primary 2.',
    greeting: 'Nno nwam, good day! Welcome to Primary 2. I am Mrs Chidinma Okafor, your Primary 2 class teacher. We will learn together step by step until you master every lesson.',
    accentNote: 'Warm, clear Nigerian English with encouraging Igbo phrasing like "Daalu" and "Well done!"'
  },
  {
    id: 'emeka',
    name: 'Mr Emeka Eze',
    title: 'Primary 3 Dedicated Class Teacher',
    classTitle: 'Primary 3 Class Teacher',
    assignedGrade: 3,
    ethnicGroup: 'Igbo',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#026838', // Forest Green
    imageUrl: teacherEmeka,
    subjectSpecialty: 'Basic Science & Technology',
    gradeRange: 'Primary 3',
    description: 'Dedicated Primary 3 Class Teacher. Energetic, enthusiastic, and curious. Guides pupils in active discovery, connecting classroom learning with living things, practical arithmetic, and expressive language in everyday Nigerian life.',
    greeting: 'Good day, champion! Welcome to Primary 3. I am Mr Emeka Eze, your Primary 3 class teacher. Get your notebook and bright smile ready as we master our lessons today!',
    accentNote: 'Crisp, articulate Nigerian pronunciation with practical real-life examples and energetic encouragement.'
  },
  {
    id: 'folake',
    name: 'Mrs Folake Adeleke',
    title: 'Primary 4 Dedicated Class Teacher',
    classTitle: 'Primary 4 Class Teacher',
    assignedGrade: 4,
    ethnicGroup: 'Yoruba',
    gender: 'female',
    avatarEmoji: '👩🏾‍🏫',
    avatarColor: '#7C3AED', // Royal Purple
    imageUrl: teacherChidinma,
    subjectSpecialty: 'Civic Education',
    gradeRange: 'Primary 4',
    description: 'Dedicated Primary 4 Class Teacher. Inspiring, articulate, and structured. Guides middle-primary pupils through multi-digit arithmetic, fractions with concrete analogies, reading comprehension, and Nigerian national values.',
    greeting: 'E nle o, wonderful scholar! Welcome to Primary 4. I am Mrs Folake Adeleke, your Primary 4 class teacher. Together we will explore, think deeply, and achieve true mastery.',
    accentNote: 'Energetic, rhythmic Nigerian accent with expressive emphasis and clear step-by-step guidance.'
  },
  {
    id: 'ibrahim',
    name: 'Mallam Ibrahim Danjuma',
    title: 'Primary 5 Dedicated Class Teacher',
    classTitle: 'Primary 5 Class Teacher',
    assignedGrade: 5,
    ethnicGroup: 'Hausa',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#008751', // Nigerian Green
    imageUrl: teacherEmeka,
    subjectSpecialty: 'Social Studies',
    gradeRange: 'Primary 5',
    description: 'Dedicated Primary 5 Class Teacher. Thoughtful, stately, and encouraging. Focuses on deep conceptual understanding, Nigerian geography and heritage, analytical reasoning, and building independent study habits.',
    greeting: 'Sannu, my young scholar! Welcome to Primary 5. I am Mallam Ibrahim Danjuma, your Primary 5 class teacher. We will journey through every subject with diligence, curiosity, and pride.',
    accentNote: 'Engaging, stately storytelling cadence rich with cultural context and patient encouragement.'
  },
  {
    id: 'babatunde',
    name: 'Mr Babatunde Ogunlesi',
    title: 'Primary 6 Dedicated Class Teacher',
    classTitle: 'Primary 6 Class Teacher',
    assignedGrade: 6,
    ethnicGroup: 'Yoruba',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#EA580C', // Deep Orange
    imageUrl: teacherBabatunde,
    subjectSpecialty: 'Agricultural Science',
    gradeRange: 'Primary 6',
    description: 'Dedicated Primary 6 Class Teacher. Upbeat, motivating, and thorough. Prepares Primary 6 graduating pupils for common entrance examinations and smooth transition to Junior Secondary School (JSS 1) across all core subjects.',
    greeting: 'Bawo ni, future leader! Welcome to Primary 6. I am Mr Babatunde Ogunlesi, your Primary 6 class teacher. This is your graduation year, and together we will master every concept for outstanding success.',
    accentNote: 'Upbeat, friendly, and deeply practical with relatable Nigerian analogies and high motivational encouragement.'
  }
];

/**
 * 6 Classes distributed directly to 6 Dedicated Class Teachers:
 * Primary 1 -> Mallama Zainab Bello
 * Primary 2 -> Mrs Chidinma Okafor
 * Primary 3 -> Mr Emeka Eze
 * Primary 4 -> Mrs Folake Adeleke
 * Primary 5 -> Mallam Ibrahim Danjuma
 * Primary 6 -> Mr Babatunde Ogunlesi
 */
export const CLASS_TEACHERS: Record<GradeLevel, string> = {
  1: 'zainab',     // Primary 1: Mallama Zainab Bello
  2: 'chidinma',   // Primary 2: Mrs Chidinma Okafor
  3: 'emeka',      // Primary 3: Mr Emeka Eze
  4: 'folake',     // Primary 4: Mrs Folake Adeleke
  5: 'ibrahim',    // Primary 5: Mallam Ibrahim Danjuma
  6: 'babatunde',  // Primary 6: Mr Babatunde Ogunlesi
};

// Legacy compatibility map
export const SUBJECT_TEACHERS: Record<string, string> = {
  'Mathematics': 'chidinma',
  'English Studies': 'zainab',
  'Basic Science & Technology': 'emeka',
  'Basic Science & Tech': 'emeka',
  'Social Studies': 'ibrahim',
  'Civic Education': 'folake',
  'Agricultural Science': 'babatunde'
};

export const getTeacherById = (id: string): TeacherPersona => {
  return NIGERIAN_TEACHERS.find(t => t.id === id) || NIGERIAN_TEACHERS[3]; // default Primary 4
};

/**
 * Get the dedicated Class Teacher assigned to a specific primary class (Primary 1–6)
 */
export const getTeacherForGrade = (grade?: GradeLevel | number): TeacherPersona => {
  if (!grade) return getTeacherById('folake'); // default Primary 4
  const numGrade = Number(grade);
  const validGrade = (numGrade >= 1 && numGrade <= 6) ? (numGrade as GradeLevel) : 4;
  const teacherId = CLASS_TEACHERS[validGrade] || 'folake';
  return getTeacherById(teacherId);
};

/**
 * In the class teacher model, lessons in Primary X are taught by the dedicated Class Teacher of that grade
 */
export const getTeacherForLesson = (
  lesson?: { grade?: GradeLevel | number; teacherId?: string; subject?: string } | null,
  fallbackGrade?: GradeLevel | number
): TeacherPersona => {
  if (!lesson) {
    return getTeacherForGrade(fallbackGrade || 4);
  }
  // Grade-first: The lesson's primary class level dictates the dedicated class teacher
  if (lesson.grade) {
    return getTeacherForGrade(lesson.grade);
  }
  if (fallbackGrade) {
    return getTeacherForGrade(fallbackGrade);
  }
  if (lesson.teacherId) {
    const byId = NIGERIAN_TEACHERS.find(t => t.id === lesson.teacherId);
    if (byId) return byId;
  }
  return getTeacherForGrade(4);
};

/**
 * Retrieve the teacher for a subject (adapts to class teacher model by using pupil grade if provided)
 */
export const getTeacherForSubject = (subject?: string, grade?: GradeLevel | number): TeacherPersona => {
  if (grade) {
    return getTeacherForGrade(grade);
  }
  return getTeacherForGrade(4);
};
