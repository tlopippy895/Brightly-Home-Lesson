import { TeacherPersona } from '../types';
import teacherChidinma from '../assets/images/nigerian_female_teacher_1788178756843.jpg';
import teacherEmeka from '../assets/images/nigerian_male_teacher_1788178776875.jpg';
import teacherZainab from '../assets/images/nigerian_teacher_zainab_1788178797862.jpg';
import teacherBabatunde from '../assets/images/nigerian_teacher_babatunde_1788178818634.jpg';

export const NIGERIAN_TEACHERS: TeacherPersona[] = [
  {
    id: 'chidinma',
    name: 'Mrs Chidinma Okafor',
    title: 'Primary 4 Senior Tutor',
    ethnicGroup: 'Igbo',
    gender: 'female',
    avatarEmoji: '👩🏾‍🏫',
    avatarColor: '#1E88E5', // Primary Blue
    imageUrl: teacherChidinma,
    subjectSpecialty: 'Mathematics',
    gradeRange: 'Primary 3 – 5',
    description: 'Expert in Nigerian primary mathematics and concrete visual representations. Known for patient step-by-step breakdowns.',
    greeting: 'Nno nwam, good day! Welcome to our lesson. We are going to learn step by step until you master every concept.',
    accentNote: 'Warm, clear Nigerian English with encouraging Igbo phrasing like "Daalu" and "Well done!"'
  },
  {
    id: 'emeka',
    name: 'Mr Emeka Eze',
    title: 'STEM & Basic Science Lead',
    ethnicGroup: 'Igbo',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#026838', // Forest Green
    imageUrl: teacherEmeka,
    subjectSpecialty: 'Basic Science & Technology',
    gradeRange: 'Primary 4 – 6',
    description: 'Specialist in linking science with everyday Nigerian environmental phenomena, flora, fauna, and simple mechanics.',
    greeting: 'Good day, champion! Get your notebook ready as we explore how science powers our everyday world.',
    accentNote: 'Crisp, articulate Nigerian pronunciation with practical real-life examples.'
  },
  {
    id: 'zainab',
    name: 'Mallama Zainab Bello',
    title: 'Early Literacy & Phonics Specialist',
    ethnicGroup: 'Hausa',
    gender: 'female',
    avatarEmoji: '🧕🏾',
    avatarColor: '#D97706', // Warm Amber
    imageUrl: teacherZainab,
    subjectSpecialty: 'English Studies',
    gradeRange: 'Primary 1 – 3',
    description: 'Master of early phonetics, vocabulary building, and gentle reading comprehension for young Nigerian pupils.',
    greeting: 'Sannu kowa, good day! I am so happy to see your bright smile. Let us read and discover together.',
    accentNote: 'Gentle, melodious northern Nigerian English cadence with high clarity.'
  },
  {
    id: 'ibrahim',
    name: 'Mallam Ibrahim Danjuma',
    title: 'Social Studies & Civic Education Mentor',
    ethnicGroup: 'Hausa',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#008751', // Nigerian Green
    imageUrl: teacherEmeka,
    subjectSpecialty: 'Social Studies',
    gradeRange: 'Primary 3 – 6',
    description: 'Passionate storyteller of Nigerian history, regional geography, national symbols, and civic values.',
    greeting: 'Sannu, my young scholar! Good day to you. Today we will journey through the rich heritage and landmarks of Nigeria.',
    accentNote: 'Engaging, stately storytelling cadence rich with cultural context.'
  },
  {
    id: 'folake',
    name: 'Mrs Folake Adeleke',
    title: 'English Language & Creative Writing Coach',
    ethnicGroup: 'Yoruba',
    gender: 'female',
    avatarEmoji: '👩🏾‍🏫',
    avatarColor: '#7C3AED', // Royal Purple
    imageUrl: teacherChidinma,
    subjectSpecialty: 'English Studies',
    gradeRange: 'Primary 4 – 6',
    description: 'Renowned for grammar precision, sentence building, and engaging comprehension stories set in Nigerian cities.',
    greeting: 'E nle o, good day! Are you ready to speak and write excellent English? Let us dive right in with enthusiasm.',
    accentNote: 'Energetic, rhythmic Nigerian accent with expressive emphasis on proper grammar.'
  },
  {
    id: 'babatunde',
    name: 'Mr Babatunde Ogunlesi',
    title: 'Practical Mathematics & Logic Specialist',
    ethnicGroup: 'Yoruba',
    gender: 'male',
    avatarEmoji: '👨🏾‍🏫',
    avatarColor: '#EA580C', // Deep Orange
    imageUrl: teacherBabatunde,
    subjectSpecialty: 'Mathematics',
    gradeRange: 'Primary 1 – 4',
    description: 'Expert in using Nigerian markets, coins, naira notes, and physical objects to make mathematics unforgettable.',
    greeting: 'Bawo ni, good day! Mathematics is all around us in the market and at home. Let us count and solve with joy.',
    accentNote: 'Upbeat, friendly, and deeply practical with relatable market analogies.'
  }
];

export const getTeacherById = (id: string): TeacherPersona => {
  return NIGERIAN_TEACHERS.find(t => t.id === id) || NIGERIAN_TEACHERS[0];
};
