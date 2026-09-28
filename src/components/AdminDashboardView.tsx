import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Users, 
  BarChart3, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon,
  KeyRound,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { GradeLevel, SubjectName, LessonTopic, StudentProfile, ConcreteVisualAid, TeachingAidType, UserRole } from '../types';
import { CURRICULUM_DATA } from '../data/curriculum';
import { NIGERIAN_TEACHERS } from '../data/teachers';

interface AdminDashboardViewProps {
  students: StudentProfile[];
  onClose?: () => void;
  onSelectLessonForPreview?: (lesson: LessonTopic) => void;
  currentRole?: UserRole | null;
  onAuthenticatedAsAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  students,
  onClose,
  onSelectLessonForPreview,
  currentRole,
  onAuthenticatedAsAdmin,
}) => {
  // Admin Passcode Gate (Default: '9999')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(currentRole === 'admin');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<'curriculum' | 'classes' | 'subjects' | 'aids' | 'pupils' | 'reports'>('curriculum');

  // Curriculum Filter State
  const [selectedClass, setSelectedClass] = useState<GradeLevel>(4);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | 'All'>('All');
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [searchTopic, setSearchTopic] = useState('');

  // Selected Topic for Detail Inspector Modal/Panel
  const [inspectingTopic, setInspectingTopic] = useState<LessonTopic | null>(null);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '9999' || passcode.trim() === 'admin123') {
      setIsAdminAuthenticated(true);
      setAuthError(null);
      if (onAuthenticatedAsAdmin) {
        onAuthenticatedAsAdmin();
      }
    } else {
      setAuthError('Invalid Admin Passcode. Default system administrator PIN is 9999.');
    }
  };

  // If not yet authenticated, render the Admin Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#026838] text-white flex items-center justify-center text-2xl mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Admin & Governance Gate
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase font-display">
              Administrator Login
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Access the curriculum management system, class schemes of work, and teaching aids library.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Admin Security Passcode:
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (default: 9999)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-[#026838]"
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Unlock Admin Console
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            Authorized for Brightly Home Lesson curriculum managers. Default PIN: <strong className="text-slate-700">9999</strong>
          </p>
        </div>
      </div>
    );
  }

  // Filter lessons for Curriculum Management Page
  const filteredCurriculum = CURRICULUM_DATA.filter((lesson) => {
    const matchClass = lesson.grade === selectedClass;
    const matchTerm = lesson.term === selectedTerm;
    const matchSubject = selectedSubject === 'All' || lesson.subject === selectedSubject;
    const matchSearch = searchTopic === '' || 
      lesson.topic.toLowerCase().includes(searchTopic.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchTopic.toLowerCase());
    return matchClass && matchTerm && matchSubject && matchSearch;
  });

  return (
    <div id="admin-dashboard-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Admin Header - High Contrast Dark Green & Dark Slate */}
      <div className="bg-white border-2 border-emerald-600/30 text-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-[#026838] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              Admin Console Active
            </span>
            <span className="text-xs text-slate-800 font-black font-mono">
              NERDC Curriculum Hierarchy Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-[#026838]">
            BRIGHTLY CURRICULUM & OPERATIONS MANAGEMENT
          </h1>
          <p className="text-xs sm:text-sm text-slate-800 font-bold max-w-3xl">
            Manage Primary 1–6 classes, subjects, weekly topics, 30-minute lesson structures, and teaching aids.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsAdminAuthenticated(false)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Lock Admin
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'curriculum'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Curriculum Hierarchy (NERDC Structure)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'classes'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Classes (Primary 1–6)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'subjects'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Subjects (6 Core)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('aids')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'aids'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Teaching Aids Library</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('pupils')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'pupils'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pupils & Parents</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'reports'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Reports & Analytics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CURRICULUM MANAGEMENT PAGE (NERDC → Class → Subject → Term → Week → Topic) */}
      {/* ========================================================================= */}
      {adminTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Breadcrumb Hierarchy Indicator */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-[#026838] flex flex-wrap items-center gap-2">
            <span>NERDC Standard</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="bg-white px-2 py-0.5 rounded shadow-2xs">Primary {selectedClass}</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="bg-white px-2 py-0.5 rounded shadow-2xs">{selectedSubject}</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="bg-white px-2 py-0.5 rounded shadow-2xs">Term {selectedTerm}</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 font-medium">30-Min Lesson Modules</span>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Select Class */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Class / Grade:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(Number(e.target.value) as GradeLevel)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <option key={g} value={g}>Primary {g}</option>
                  ))}
                </select>
              </div>

              {/* Select Term */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Term:</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value={1}>First Term</option>
                  <option value={2}>Second Term</option>
                  <option value={3}>Third Term</option>
                </select>
              </div>

              {/* Select Subject */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="All">All Subjects (6 Core)</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Studies">English Studies</option>
                  <option value="Basic Science & Technology">Basic Science & Technology</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Civic Education">Civic Education</option>
                  <option value="Agricultural Science">Agricultural Science</option>
                </select>
              </div>

              {/* Search Topic */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Search Topic:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    placeholder="Search by topic name..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Topics Table / Cards */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase font-display">
                  Scheme of Work Topics ({filteredCurriculum.length} Active Modules)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Primary {selectedClass} • Term {selectedTerm}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredCurriculum.map((lesson) => (
                <div key={lesson.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#026838] text-white rounded">
                        Week {lesson.week}
                      </span>
                      <span className="text-xs font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {lesson.subject}
                      </span>
                      <span className="text-sm font-black text-slate-900 truncate">
                        {lesson.topic}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {lesson.subtopic} • Objectives: {lesson.objectives?.slice(0, 2).join('; ')}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                      <span>🎨 {lesson.concreteVisualAids?.length || 1} Teaching Aid(s)</span>
                      <span>📝 {lesson.whiteboardSteps?.length || 3} Whiteboard Steps</span>
                      <span>🎯 {lesson.assessmentQuestions?.length || 2} Diagnostic Qs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectingTopic(lesson)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      Inspect Module
                    </button>

                    {onSelectLessonForPreview && (
                      <button
                        type="button"
                        onClick={() => onSelectLessonForPreview(lesson)}
                        className="px-3.5 py-1.5 bg-[#026838] hover:bg-[#014d28] text-white rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                      >
                        Preview Lesson
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CLASSES MANAGER */}
      {/* ========================================================================= */}
      {adminTab === 'classes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((grade) => (
            <div key={grade} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#026838] text-white flex items-center justify-center font-black text-xl shadow-xs">
                  P{grade}
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Universal Basic Ed
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase font-display">
                  Primary {grade}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {grade <= 3 ? 'Lower Basic Phase' : grade <= 5 ? 'Middle Basic Phase' : 'Upper Basic / Common Entrance Prep'}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Enrolled Pupils:</span>
                  <span className="font-black text-slate-900">{students.filter(s => s.grade === grade).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Subjects:</span>
                  <span className="font-black text-slate-900">6 Core Subjects</span>
                </div>
                <div className="flex justify-between">
                  <span>Curriculum Status:</span>
                  <span className="font-black text-[#026838]">100% NERDC Aligned</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED CLASS TEACHERS & CORE SUBJECTS */}
      {/* ========================================================================= */}
      {adminTab === 'subjects' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-5 rounded-2xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#026838] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                Primary Education Class Teacher Model
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                6 Classes Distributed to 6 Dedicated Class Teachers (Primary 1–6)
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Brightly Home Lesson assigns one dedicated Nigerian Class Teacher to each primary class to guide pupils across all core subjects (Mathematics, English Studies, Basic Science & Tech, Social Studies, Civic Education, and Agricultural Science).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {NIGERIAN_TEACHERS.map((teacher) => (
              <div key={teacher.id} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#F59E0B] shrink-0 bg-emerald-50 flex items-center justify-center">
                    {teacher.imageUrl ? (
                      <img src={teacher.imageUrl} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{teacher.avatarEmoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase font-display leading-tight">
                      {teacher.name}
                    </h3>
                    <span className="text-xs font-black text-[#026838] uppercase block">
                      {teacher.classTitle}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Assigned Class:</span>
                    <span className="font-black text-[#026838]">Primary {teacher.assignedGrade}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Cultural Accent:</span>
                    <span>{teacher.ethnicGroup} Cadence</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Teaching Scope:</span>
                    <span className="font-bold text-slate-900">All Core Subjects</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  "{teacher.greeting}"
                </p>

                <p className="text-[11px] text-slate-500 font-medium leading-normal">
                  {teacher.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TEACHING AIDS LIBRARY */}
      {/* ========================================================================= */}
      {adminTab === 'aids' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase font-display">
              Teaching Aids & Visual Demonstration Assets
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Supported aid types: Image, Diagram, Flashcard, Audio, Video, Animation, Interactive Activity, Real-life Object, and Printable Resources.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Agege Bread Fractions Loaf', type: 'Real-Life Object / Diagram', topic: 'Proper & Improper Fractions', icon: '🍞' },
              { title: 'Naira Currency Banknotes Set', type: 'Real-Life Object / Printable', topic: 'Addition in Naira & Kobo', icon: '💵' },
              { title: 'Nigerian Geopolitical Map', type: 'Diagram / Image', topic: '6 Geopolitical Zones of Nigeria', icon: '🗺️' },
              { title: 'MR NIGER D Flashcard Series', type: 'Flashcard / Interactive', topic: 'Characteristics of Living Things', icon: '🦎' },
              { title: 'Analog & Digital Clock Face', type: 'Interactive Activity', topic: 'Reading Time & Daily Routine', icon: '⏰' },
              { title: 'Soil Types & Maize Seedlings', type: 'Real-Life Object / Diagram', topic: 'Soil Classification & Crops', icon: '🌾' },
            ].map((aid, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{aid.icon}</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase truncate">{aid.title}</h4>
                    <span className="text-[10px] text-amber-800 font-bold uppercase">{aid.type}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">Topic: {aid.topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PUPILS & PARENTS DIRECTORY */}
      {/* ========================================================================= */}
      {adminTab === 'pupils' && (
        <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 uppercase font-display">
              Registered Pupils & Enrollment Status
            </h3>
            <span className="text-xs font-black text-[#026838] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {students.length} Enrolled
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {students.map((student) => (
              <div key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: student.avatarColor || '#026838' }}
                  >
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{student.name}</h4>
                    <span className="text-xs text-slate-500">
                      Primary {student.grade} • Registered Class: Primary {student.registeredGrade}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-600">Mastery: <strong className="text-[#026838]">{student.overallScore}%</strong></span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px] uppercase">
                    Active Session
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {adminTab === 'reports' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Curriculum Topics</span>
            <div className="text-3xl font-black text-slate-900 font-display">216</div>
            <p className="text-xs text-slate-500">Across Primary 1 to 6 in all 3 terms</p>
          </div>

          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Average Pupil Mastery Rate</span>
            <div className="text-3xl font-black text-[#026838] font-display">89.4%</div>
            <p className="text-xs text-slate-500">Mastery Before Moving On standard</p>
          </div>

          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Paystack Tuition Settlement</span>
            <div className="text-3xl font-black text-[#D97706] font-display">100%</div>
            <p className="text-xs text-slate-500">Automated receipts & reconciliations</p>
          </div>
        </div>
      )}

      {/* Inspector Modal for Inspecting a Curriculum Topic Module */}
      {inspectingTopic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-2 py-0.5 rounded">
                  Primary {inspectingTopic.grade} • Term {inspectingTopic.term} • Week {inspectingTopic.week}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase font-display mt-1">
                  {inspectingTopic.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTopic(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="block text-slate-800 uppercase font-black">Subject:</strong>
                <span className="text-slate-600">{inspectingTopic.subject} ({inspectingTopic.subtopic})</span>
              </div>

              <div>
                <strong className="block text-slate-800 uppercase font-black">Curriculum Objectives:</strong>
                <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                  {inspectingTopic.objectives?.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="block text-slate-800 uppercase font-black">Visual Teaching Aids:</strong>
                <div className="space-y-1 pt-1">
                  {inspectingTopic.concreteVisualAids?.map((aid, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                      <span className="text-xl">{aid.icon}</span>
                      <div>
                        <span className="font-bold text-slate-900 block">{aid.title}</span>
                        <span className="text-[10px] text-slate-500">{aid.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingTopic(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
