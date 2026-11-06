const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Define TOC metadata for Primary 1 to 6 based on verified pages
const SUBJECT_MAP = [
  // PRIMARY 1
  { grade: 1, subject: 'English Studies', startPage: 611, endPage: 616 },
  { grade: 1, subject: 'Mathematics', startPage: 617, endPage: 622 },
  { grade: 1, subject: 'Basic Science', startPage: 623, endPage: 629 },
  { grade: 1, subject: 'Physical and Health Education', startPage: 630, endPage: 636 },
  { grade: 1, subject: 'Christian Religious Studies', startPage: 637, endPage: 642 },
  { grade: 1, subject: 'Islamic Studies', startPage: 643, endPage: 647 },
  { grade: 1, subject: 'Nigerian History', startPage: 648, endPage: 653 },
  { grade: 1, subject: 'Social and Citizenship Studies', startPage: 654, endPage: 660 },
  { grade: 1, subject: 'Cultural and Creative Arts', startPage: 661, endPage: 666 },

  // PRIMARY 2
  { grade: 2, subject: 'English Studies', startPage: 668, endPage: 673 },
  { grade: 2, subject: 'Mathematics', startPage: 674, endPage: 679 },
  { grade: 2, subject: 'Basic Science', startPage: 680, endPage: 688 },
  { grade: 2, subject: 'Physical and Health Education', startPage: 689, endPage: 697 },
  { grade: 2, subject: 'Christian Religious Studies', startPage: 698, endPage: 706 },
  { grade: 2, subject: 'Islamic Studies', startPage: 707, endPage: 714 },
  { grade: 2, subject: 'Nigerian History', startPage: 715, endPage: 723 },
  { grade: 2, subject: 'Social and Citizenship Studies', startPage: 724, endPage: 735 },
  { grade: 2, subject: 'Cultural and Creative Arts', startPage: 736, endPage: 741 },

  // PRIMARY 3
  { grade: 3, subject: 'English Studies', startPage: 743, endPage: 745 },
  { grade: 3, subject: 'Mathematics', startPage: 746, endPage: 748 },
  { grade: 3, subject: 'Basic Science', startPage: 749, endPage: 751 },
  { grade: 3, subject: 'Physical and Health Education', startPage: 752, endPage: 754 },
  { grade: 3, subject: 'Christian Religious Studies', startPage: 755, endPage: 757 },
  { grade: 3, subject: 'Islamic Studies', startPage: 758, endPage: 760 },
  { grade: 3, subject: 'Nigerian History', startPage: 761, endPage: 763 },
  { grade: 3, subject: 'Social and Citizenship Studies', startPage: 764, endPage: 766 },
  { grade: 3, subject: 'Cultural and Creative Arts', startPage: 767, endPage: 769 },

  // PRIMARY 4
  { grade: 4, subject: 'English Studies', startPage: 771, endPage: 779 },
  { grade: 4, subject: 'Mathematics', startPage: 780, endPage: 786 },
  { grade: 4, subject: 'Basic Science & Technology', startPage: 787, endPage: 789 },
  { grade: 4, subject: 'Physical and Health Education', startPage: 790, endPage: 796 },
  { grade: 4, subject: 'Christian Religious Studies', startPage: 797, endPage: 804 },
  { grade: 4, subject: 'Islamic Studies', startPage: 805, endPage: 813 },
  { grade: 4, subject: 'Nigerian History', startPage: 814, endPage: 816 },
  { grade: 4, subject: 'Social and Citizenship Studies', startPage: 817, endPage: 819 },
  { grade: 4, subject: 'Cultural and Creative Arts', startPage: 820, endPage: 825 },
  { grade: 4, subject: 'Basic Digital Literacy', startPage: 826, endPage: 831 },
  { grade: 4, subject: 'Prevocational Studies', startPage: 832, endPage: 834 },
  { grade: 4, subject: 'French Language', startPage: 835, endPage: 843 },

  // PRIMARY 5
  { grade: 5, subject: 'English Studies', startPage: 845, endPage: 847 },
  { grade: 5, subject: 'Mathematics', startPage: 848, endPage: 852 },
  { grade: 5, subject: 'Basic Science & Technology', startPage: 853, endPage: 855 },
  { grade: 5, subject: 'Physical and Health Education', startPage: 856, endPage: 858 },
  { grade: 5, subject: 'Christian Religious Studies', startPage: 859, endPage: 862 },
  { grade: 5, subject: 'Islamic Studies', startPage: 863, endPage: 868 },
  { grade: 5, subject: 'Nigerian History', startPage: 869, endPage: 871 },
  { grade: 5, subject: 'Social and Citizenship Studies', startPage: 872, endPage: 874 },
  { grade: 5, subject: 'Cultural and Creative Arts', startPage: 875, endPage: 880 },
  { grade: 5, subject: 'Basic Digital Literacy', startPage: 881, endPage: 886 },
  { grade: 5, subject: 'Prevocational Studies', startPage: 887, endPage: 889 },
  { grade: 5, subject: 'French Language', startPage: 890, endPage: 893 },

  // PRIMARY 6
  { grade: 6, subject: 'English Studies', startPage: 895, endPage: 900 },
  { grade: 6, subject: 'Mathematics', startPage: 901, endPage: 906 },
  { grade: 6, subject: 'Basic Science & Technology', startPage: 907, endPage: 912 },
  { grade: 6, subject: 'Physical and Health Education', startPage: 913, endPage: 918 },
  { grade: 6, subject: 'Christian Religious Studies', startPage: 919, endPage: 924 },
  { grade: 6, subject: 'Islamic Studies', startPage: 925, endPage: 930 },
  { grade: 6, subject: 'Nigerian History', startPage: 931, endPage: 933 },
  { grade: 6, subject: 'Social and Citizenship Studies', startPage: 934, endPage: 936 },
  { grade: 6, subject: 'Cultural and Creative Arts', startPage: 937, endPage: 942 },
  { grade: 6, subject: 'Basic Digital Literacy', startPage: 943, endPage: 948 },
  { grade: 6, subject: 'Prevocational Studies', startPage: 949, endPage: 951 },
  { grade: 6, subject: 'French Language', startPage: 952, endPage: 957 }
];

function cleanText(text) {
  return text
    .replace(/\t+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

function getSubjectSlug(subject) {
  return subject.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
}

function classifyWeekType(topicTitle) {
  const upper = topicTitle.toUpperCase();
  if (upper.includes('MID-TERM BREAK') || upper.includes('MIDTERM BREAK') || upper.includes('HOLIDAY')) return 'break';
  if (upper.includes('MID-TERM') || upper.includes('MIDTERM')) return 'assessment';
  if (upper.includes('REVISION')) return 'revision';
  if (upper.includes('EXAMINATION') || upper.includes('EXAM')) return 'examination';
  if (upper.includes('CLOSING') || upper.includes('VACATION')) return 'closing';
  return 'instructional';
}

module.exports = {
  SUBJECT_MAP,
  cleanText,
  getSubjectSlug,
  classifyWeekType
};
