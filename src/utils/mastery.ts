export type MasteryLevel = 
  | 'Beginning' 
  | 'Developing' 
  | 'Approaching Mastery' 
  | 'Mastered' 
  | 'Strong Mastery';

export interface MasteryInfo {
  level: MasteryLevel;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  needsSupport: boolean;
}

export function getMasteryLevel(score: number): MasteryInfo {
  if (score >= 95) {
    return {
      level: 'Strong Mastery',
      color: '#026838',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-300',
      badgeText: 'text-emerald-900 font-black',
      description: 'Exceptional retention & fluent mastery of the NERDC topic.',
      needsSupport: false,
    };
  } else if (score >= 85) {
    return {
      level: 'Mastered',
      color: '#026838',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-[#026838] font-black',
      description: 'Topic mastered! Ready to advance to the next week.',
      needsSupport: false,
    };
  } else if (score >= 70) {
    return {
      level: 'Approaching Mastery',
      color: '#1E88E5',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeText: 'text-blue-800 font-bold',
      description: 'Good understanding. Minor practice recommended before exam.',
      needsSupport: false,
    };
  } else if (score >= 50) {
    return {
      level: 'Developing',
      color: '#D97706',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      badgeText: 'text-amber-800 font-bold',
      description: 'Developing concept understanding. Additional practice guided.',
      needsSupport: true,
    };
  } else {
    return {
      level: 'Beginning',
      color: '#DC2626',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      badgeText: 'text-rose-800 font-bold',
      description: 'Beginning stage. Adaptive re-teaching loop activated.',
      needsSupport: true,
    };
  }
}
