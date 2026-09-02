import React from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle2, Lock, FileText } from 'lucide-react';
import { REGULATORY_AND_PORTALS } from '../data/regulatoryPortals';

interface RegulatoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulatoryModal: React.FC<RegulatoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#026838] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#026838]" />
              <span>Institutional & Compliance Matrix</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#026838] font-display tracking-tight uppercase">
              Regulatory Standards & Portals
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Brightly Home Lesson is engineered in strict compliance with the Nigeria Data Protection Act (NDPA), NERDC national standards, and live enterprise payment gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REGULATORY_AND_PORTALS.map((item) => (
              <div key={item.id} className="p-5 rounded-[24px] bg-[#F0F9FF] border border-sky-100 flex flex-col justify-between space-y-3 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#1E88E5] bg-sky-50 px-2.5 py-0.5 rounded-full uppercase border border-sky-200">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-black text-[#026838] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#43A047]" />
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 leading-snug font-display uppercase">
                    {item.name}
                  </h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#1E88E5] hover:underline flex items-center gap-1"
                  >
                    <span>{item.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-3 rounded-2xl border border-sky-50">
                  {item.purpose}
                </p>

                <div className="text-[10px] text-gray-500 font-semibold border-t border-sky-200/50 pt-2">
                  🔒 {item.actionRequired}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-[#F0FDF4] border border-emerald-200 rounded-[24px] text-xs text-gray-700 space-y-1 shadow-sm">
            <strong className="text-[#026838] font-black uppercase tracking-wider block">NDPA Minor Privacy Guarantee:</strong>
            Brightly does not collect pupil biometric data, GPS tracking, or personal phone numbers. All accounts and PINs are strictly parent-controlled.
          </div>
        </div>
      </div>
    </div>
  );
};
