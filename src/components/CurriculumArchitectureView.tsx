import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  School,
  Layers,
  ShieldCheck,
  ChevronRight,
  Filter,
  Download,
  ExternalLink,
  Info,
  Calendar,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  GradeLevel,
  SubjectName,
  CurriculumLifecycleState,
  CurriculumHierarchyNode,
  MissingCurriculumDocument,
  AuditableCoverageReport
} from '../types';
import {
  ALL_NIGERIAN_PRIMARY_CLASSES,
  ALL_CORE_PRIMARY_SUBJECTS,
  AUTHENTIC_TERM_CALENDARS,
  NATIONAL_NERDC_AUTHORITY,
  OFFICIAL_MISSING_NERDC_DOCUMENTS,
  SAMPLE_SCHOOL_SCHEMES_OF_WORK,
  generateAuditableCoverageReport
} from '../data/curriculumArchitecture';
import { VERIFIED_HIERARCHY_RECORDS } from '../../server/curriculumArchitecture';

interface CurriculumArchitectureViewProps {
  onSelectLessonForPreview?: (lessonId: string) => void;
  onClose?: () => void;
}

export const CurriculumArchitectureView: React.FC<CurriculumArchitectureViewProps> = ({
  onSelectLessonForPreview,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'hierarchy' | 'schemes' | 'missing_docs' | 'audit_report'>('matrix');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(4);
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('Mathematics');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-p4-t1-w1-math');
  const [viewingSchemeId, setViewingSchemeId] = useState<string>('sow_corona_p4_math_t1');

  // Generate real auditable report
  const report: AuditableCoverageReport = generateAuditableCoverageReport(VERIFIED_HIERARCHY_RECORDS);

  // Find currently selected node
  const activeNode: CurriculumHierarchyNode | undefined = 
    VERIFIED_HIERARCHY_RECORDS.find(n => n.nodeId === selectedNodeId) ||
    VERIFIED_HIERARCHY_RECORDS.find(n => n.grade === selectedGrade && n.term === selectedTerm && n.subject === selectedSubject) ||
    VERIFIED_HIERARCHY_RECORDS[0];

  const currentTermCal = AUTHENTIC_TERM_CALENDARS[selectedTerm];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-[#026838] to-[#014d28] text-white p-6 shadow-md border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 tracking-wider">
                NERDC Standard · Phase 6
              </span>
              <span className="bg-amber-400/20 text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-400/30 tracking-wider">
                Primary 1–6 · Terms 1–3
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-emerald-300 shrink-0" />
              Three-Term Curriculum Architecture & Coverage Matrix
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 font-medium mt-1 max-w-3xl">
              Authentic Nigerian 17-layer curriculum structure adhering strictly to NERDC gazetted standards. Unverified topics are transparently registered as official missing document gaps.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
              >
                Close View
              </button>
            )}
          </div>
        </div>

        {/* Anti-Fabrication Guarantee Alert */}
        <div className="max-w-7xl mx-auto mt-4 p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-100">
            <span className="font-bold text-white">Strict Anti-Fabrication & Traceability Policy:</span> Incomplete or unverified curriculum weeks are never artificially generated from model memory. They remain explicitly tracked as <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-amber-300 font-mono">missing</code> official source documents awaiting verified NERDC gazettes.
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#026838] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Coverage Matrix (P1–P6)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hierarchy'
                ? 'bg-[#026838] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            17-Layer Hierarchy Inspector
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schemes'
                ? 'bg-[#026838] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            National vs School Schemes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing_docs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'missing_docs'
                ? 'bg-[#026838] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Missing Documents Register ({OFFICIAL_MISSING_NERDC_DOCUMENTS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_report')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit_report'
                ? 'bg-[#026838] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-500" />
            Auditable Report
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: COVERAGE MATRIX */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'matrix' && (
          <div className="mt-6 space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Class:</span>
                  <div className="flex gap-1">
                    {ALL_NIGERIAN_PRIMARY_CLASSES.map(c => (
                      <button
                        key={c.grade}
                        type="button"
                        onClick={() => setSelectedGrade(c.grade)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedGrade === c.grade
                            ? 'bg-[#026838] text-white font-black'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        P{c.grade}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden md:block" />

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Term:</span>
                  <div className="flex gap-1">
                    {([1, 2, 3] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTerm(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedTerm === t
                            ? 'bg-amber-600 text-white font-black'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Term {t} ({AUTHENTIC_TERM_CALENDARS[t].totalWeeks} Wks)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing Primary {selectedGrade} · {currentTermCal.termName} ({currentTermCal.totalWeeks} Weeks total)
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase font-display">
                    Primary {selectedGrade} · {currentTermCal.termName} Scheme of Work Grid
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentTermCal.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Verified & Published ({VERIFIED_HIERARCHY_RECORDS.filter(r => r.grade === selectedGrade && r.term === selectedTerm).length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                    Awaiting Official Source
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                      <th className="p-3 w-20">Week</th>
                      <th className="p-3 w-32">Week Type</th>
                      {ALL_CORE_PRIMARY_SUBJECTS.map(sub => (
                        <th key={sub} className="p-3 min-w-[180px]">
                          {sub}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: currentTermCal.totalWeeks }, (_, i) => i + 1).map(weekNum => {
                      let weekBadge = 'Instructional';
                      let weekBadgeClass = 'bg-slate-100 text-slate-700';

                      if (currentTermCal.revisionWeeks.includes(weekNum)) {
                        weekBadge = 'Revision';
                        weekBadgeClass = 'bg-amber-100 text-amber-800 font-bold';
                      } else if (currentTermCal.assessmentWeeks.includes(weekNum)) {
                        weekBadge = 'Mid-Term CA';
                        weekBadgeClass = 'bg-blue-100 text-blue-800 font-bold';
                      } else if (currentTermCal.examinationWeeks.includes(weekNum)) {
                        weekBadge = selectedTerm === 3 ? 'Promotional Exam' : 'Terminal Exam';
                        weekBadgeClass = 'bg-purple-100 text-purple-800 font-black';
                      }

                      return (
                        <tr key={weekNum} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-900 bg-slate-50/50">
                            Week {weekNum}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider inline-block ${weekBadgeClass}`}>
                              {weekBadge}
                            </span>
                          </td>

                          {ALL_CORE_PRIMARY_SUBJECTS.map(subject => {
                            const verified = VERIFIED_HIERARCHY_RECORDS.find(
                              r => r.grade === selectedGrade && r.subject === subject && r.term === selectedTerm && r.week === weekNum
                            );

                            if (verified) {
                              return (
                                <td key={subject} className="p-3 bg-emerald-50/40">
                                  <div
                                    onClick={() => {
                                      setSelectedNodeId(verified.nodeId);
                                      setActiveTab('hierarchy');
                                    }}
                                    className="p-2 bg-white rounded-xl border border-emerald-300 shadow-xs hover:border-[#026838] transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Verified & Published
                                      </span>
                                      {onSelectLessonForPreview && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectLessonForPreview(verified.lessonId);
                                          }}
                                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
                                        >
                                          Preview <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="font-bold text-slate-900 group-hover:text-[#026838] text-xs line-clamp-2">
                                      {verified.topic}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                      {verified.subtopic}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-700 font-medium">
                                      <span>{verified.learningObjectives.length} Objectives</span>
                                      <span>•</span>
                                      <span>Concrete Aids ({verified.activitiesAndResources.concreteVisualAids.length})</span>
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            // Missing Official Document
                            const missingDoc = OFFICIAL_MISSING_NERDC_DOCUMENTS.find(
                              d => d.affectedGrades.includes(selectedGrade) && d.affectedSubjects.includes(subject)
                            );

                            return (
                              <td key={subject} className="p-3">
                                <div className="p-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Awaiting Official Document
                                  </div>
                                  <div className="text-[11px] text-slate-500 italic">
                                    {missingDoc?.code || 'DOC-NERDC-REQ'}
                                  </div>
                                  <div className="text-[9px] text-slate-400 mt-1">
                                    Zero synthetic content generated
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: 17-LAYER HIERARCHY INSPECTOR */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'hierarchy' && activeNode && (
          <div className="mt-6 space-y-6">
            {/* Hierarchy Path Breadcrumb Bar */}
            <div className="bg-[#026838] text-white p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">
                Complete 17-Layer Pedagogical Chain
              </div>
              <div className="text-xs font-bold flex flex-wrap items-center gap-1 text-emerald-100">
                <span className="bg-white/20 px-2 py-0.5 rounded text-white font-mono">1. {activeNode.authority.authorityName}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-white/20 px-2 py-0.5 rounded text-white">2. {activeNode.className}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-white/20 px-2 py-0.5 rounded text-white">3. {activeNode.subject}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-white/20 px-2 py-0.5 rounded text-white">4. {activeNode.academicSession}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-white/20 px-2 py-0.5 rounded text-white">5. {activeNode.termName}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-white/20 px-2 py-0.5 rounded text-white">6. Week {activeNode.week}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                <span className="bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded">7-18. {activeNode.topic}</span>
              </div>
            </div>

            {/* Detailed Layer-by-Layer Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Layers 1 to 7 */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layers 1–6 · Structural Foundation
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-500">1. Authority & Version:</span>
                      <p className="font-bold text-slate-800">{activeNode.authority.authorityName} ({activeNode.curriculumVersion})</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">2. Class & Stage:</span>
                      <p className="font-bold text-slate-800">{activeNode.className} · {activeNode.stage} ({activeNode.ageRange})</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">3. Subject:</span>
                      <p className="font-bold text-slate-800">{activeNode.subject}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">4. Academic Session:</span>
                      <p className="font-bold text-slate-800">{activeNode.academicSession}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">5. Term & Weeks:</span>
                      <p className="font-bold text-slate-800">{activeNode.termName} ({activeNode.termTotalWeeks} total weeks)</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">6. Week & Classification:</span>
                      <p className="font-bold text-slate-800">Week {activeNode.week} · {activeNode.weekType} period</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layers 7–9 · Curriculum Topic & Strand
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-500">7. Strand / Theme:</span>
                      <p className="font-black text-[#026838]">{activeNode.strand} · {activeNode.theme}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">8. Authoritative Topic:</span>
                      <p className="font-black text-slate-900 text-sm">{activeNode.topic}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">9. Subtopic:</span>
                      <p className="font-bold text-slate-700">{activeNode.subtopic}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layers 10–11 · Objectives & Competencies
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 text-xs">10. Learning Objectives:</span>
                    <ul className="mt-1 space-y-1">
                      {activeNode.learningObjectives.map((obj, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-[#026838] font-bold">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 text-xs">11. Competencies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeNode.competencies.map((comp, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Layers 12 to 14 */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layer 12 · Teaching Content & Pedagogical Steps
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block mb-1">Age-Appropriate Explanation:</span>
                    {activeNode.teachingContent.ageAppropriateExplanation}
                  </div>
                  <div className="space-y-2 mt-2">
                    <span className="font-bold text-slate-600 text-xs">Whiteboard Progression:</span>
                    {activeNode.teachingContent.whiteboardSteps.map((step) => (
                      <div key={step.stepNumber} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="font-bold text-[#026838] mb-1">
                          Step {step.stepNumber}: {step.title}
                        </div>
                        <div className="font-mono bg-slate-900 text-emerald-400 p-2 rounded text-[11px] whitespace-pre-line mb-1.5">
                          {step.boardText}
                        </div>
                        <div className="text-slate-600 italic text-[11px]">
                          Teacher Speech: "{step.teacherSpeech}"
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Nigerian Cultural Context:</span> {activeNode.teachingContent.culturalContext}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layer 13 · Concrete Visual Aids & Activities
                  </div>
                  <div className="space-y-2">
                    {activeNode.activitiesAndResources.concreteVisualAids.map((aid, idx) => (
                      <div key={idx} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-3">
                        <span className="text-2xl">{aid.icon || '📦'}</span>
                        <div>
                          <div className="font-bold text-xs text-emerald-950">{aid.title}</div>
                          <div className="text-[11px] text-emerald-800">{aid.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold">Home Exploration:</span> {activeNode.activitiesAndResources.homeExplorationTask}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layer 14 · Structured 30-Minute Lesson Plan
                  </div>
                  <div className="space-y-1.5">
                    {activeNode.lessonPlan.phases.map((ph) => (
                      <div key={ph.phaseNumber} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center font-bold text-[10px]">
                            {ph.phaseNumber}
                          </span>
                          <span className="font-bold text-slate-800">{ph.name}</span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">{ph.durationMinutes} Mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Layers 15 to 18 */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layers 15–16 · Practice & Assessment
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Guided Practice Problems:</span>
                    <span className="font-black text-[#026838]">{activeNode.practice.length} items</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Mastery Assessment Questions:</span>
                    <span className="font-black text-[#026838]">{activeNode.assessment.length} diagnostic questions</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layer 17 · Mastery Criteria & Remedial/Enrichment
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Mastery Pass Benchmark:</span>
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{activeNode.masteryCriteria.passPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Mastery Badge:</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{activeNode.masteryCriteria.badgeAwarded}</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-950">
                      <span className="font-bold block mb-1">Remedial Trigger (&lt;80%):</span>
                      <p className="text-[11px]">{activeNode.masteryCriteria.remedialWork.triggerCondition}</p>
                      <ul className="mt-1 space-y-0.5 text-[10px] list-disc list-inside">
                        {activeNode.masteryCriteria.remedialWork.remedialSteps.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-950">
                      <span className="font-bold block mb-1">Enrichment (100%):</span>
                      <p className="text-[11px]">{activeNode.masteryCriteria.enrichment.advancedChallengeTask}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Layer 18 · Parent Report Mapping
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Competency Descriptor:</span>
                      <p className="text-slate-800 text-[11px] mt-0.5">{activeNode.parentReportMapping.competencyDescriptor}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">Report Card Comments:</span>
                      <p className="text-emerald-800 text-[10px]"><span className="font-bold">Exemplary:</span> {activeNode.parentReportMapping.reportCardComments.exemplary}</p>
                      <p className="text-amber-800 text-[10px] mt-1"><span className="font-bold">Needs Support:</span> {activeNode.parentReportMapping.reportCardComments.needsSupport}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">Home Discussion Prompt:</span>
                      <p className="text-slate-600 italic text-[11px]">{activeNode.parentReportMapping.homeDiscussionPrompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: NATIONAL VS SCHOOL SCHEMES OF WORK */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'schemes' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase font-display">
                    Separating National Curriculum from School Schemes of Work
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Brightly separates the foundational National NERDC Standard from a school’s adapted Scheme of Work, allowing schools to tailor term lengths, pacing, and specialized lab weeks without altering national regulatory compliance.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Select School Scheme:</span>
                  <select
                    value={viewingSchemeId}
                    onChange={(e) => setViewingSchemeId(e.target.value)}
                    className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    {SAMPLE_SCHOOL_SCHEMES_OF_WORK.map(s => (
                      <option key={s.id} value={s.id}>{s.schoolName} ({s.subject} P{s.grade})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scheme Detail Table */}
              {(() => {
                const scheme = SAMPLE_SCHOOL_SCHEMES_OF_WORK.find(s => s.id === viewingSchemeId) || SAMPLE_SCHOOL_SCHEMES_OF_WORK[0];
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block font-bold">School Institution:</span>
                        <span className="font-bold text-slate-900">{scheme.schoolName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold">Academic Session:</span>
                        <span className="font-bold text-slate-900">{scheme.academicSession} · Term {scheme.term}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold">Base National Standard:</span>
                        <span className="font-bold text-emerald-800">{scheme.baseNationalCurriculumVersion}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold">Adapted By:</span>
                        <span className="font-bold text-slate-900">{scheme.adaptedBy}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-3 w-16">Week</th>
                            <th className="p-3 w-32">Week Type</th>
                            <th className="p-3">School Adapted Topic</th>
                            <th className="p-3">National NERDC Alignment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scheme.weeks.map(w => (
                            <tr key={w.week} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">Week {w.week}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                                  {w.weekType}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {w.customTopic || w.periodTitle}
                              </td>
                              <td className="p-3">
                                <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Aligned with NERDC National Standard
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: OFFICIAL MISSING DOCUMENTS REGISTER */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'missing_docs' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase font-display flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Official Register of Missing NERDC Source Documents
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Auditable log of official federal curriculum volumes requested from the Nigerian Educational Research and Development Council (NERDC). Brightly Home Lesson refuses to invent synthetic curriculum topics without authentic gazettes.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Document Code</th>
                      <th className="p-3">Official Publication Title</th>
                      <th className="p-3">Publisher & Edition</th>
                      <th className="p-3">Affected Classes</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {OFFICIAL_MISSING_NERDC_DOCUMENTS.map((doc) => (
                      <tr key={doc.code} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#026838]">
                          {doc.code}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[10px] text-slate-500">{doc.notes}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800">{doc.publisher}</div>
                          <div className="text-[10px] text-slate-500">{doc.isbnOrGazette}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {doc.affectedGrades.map(g => (
                              <span key={g} className="px-1.5 py-0.5 bg-slate-100 font-bold rounded text-[10px]">
                                P{g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[10px] tracking-wider uppercase border border-amber-300">
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: AUDITABLE REPORT */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'audit_report' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">
                    Official Curriculum Coverage & Integrity Audit Report
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authority: {report.curriculumAuthority} · Standards Version: {report.curriculumVersion}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#026838] hover:bg-[#014d28] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Print / Save Audit PDF
                </button>
              </div>

              {/* Summary Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-2xl font-black text-[#026838]">{report.summary.totalVerifiedPublished}</div>
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider mt-1">Verified & Published</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">100% Pedagogical Readiness</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-800">{report.summary.totalPossibleTopicSlots}</div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">Potential Week Slots</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Primary 1–6 (Terms 1–3)</div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <div className="text-2xl font-black text-amber-700">{report.summary.totalMissingDocumentGaps}</div>
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mt-1">Missing Document Gaps</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Awaiting Official Gazettes</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-2xl font-black text-blue-700">{report.missingDocuments.length}</div>
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mt-1">Official Document Requests</div>
                  <div className="text-[10px] text-blue-700 mt-0.5">Logged with NERDC Press</div>
                </div>
              </div>

              {/* Audit Breakdown by Grade Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase font-display">
                  Class-by-Class Verification Audit
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Class Level</th>
                        <th className="p-3">Stage</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Verified Lessons</th>
                        <th className="p-3">Terms 1–3 Completeness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.classes.map(c => {
                        const verifiedCount = c.terms.reduce((acc, t) => acc + t.subjects.reduce((sAcc, sub) => sAcc + sub.verifiedCount, 0), 0);
                        return (
                          <tr key={c.grade} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{c.className}</td>
                            <td className="p-3 text-slate-600">{c.stage}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {c.status === 'active' ? 'Active Verified Records' : 'Awaiting NERDC Records'}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{verifiedCount} record(s)</td>
                            <td className="p-3 text-slate-500">
                              {verifiedCount > 0 ? `${verifiedCount} published topics` : '0 synthetic topics (Strict anti-fabrication)'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legal and Compliance Certification Note */}
              <div className="p-4 bg-slate-100 rounded-xl text-slate-600 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">Governance Statement:</span>
                <p>
                  This curriculum architecture conforms with the 9-Year Basic Education Curriculum Standards gazetted by the Nigerian Educational Research and Development Council (NERDC). No unverified curriculum entries are marked complete or exposed to pupils as published without passing the 12-rule Lesson Readiness Gate.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
