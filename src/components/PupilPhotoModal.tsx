import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Image as ImageIcon, Check, Trash2, Sparkles } from 'lucide-react';
import { StudentProfile } from '../types';
import pupilBoy from '../assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from '../assets/images/nigerian_pupil_girl_1788178854346.jpg';

interface PupilPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSaveAvatar: (avatarUrl: string) => void;
}

export const PupilPhotoModal: React.FC<PupilPhotoModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveAvatar,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(student.avatarUrl || pupilBoy);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presetAvatars = [
    { label: 'Nigerian School Boy (Blue Uniform)', url: pupilBoy },
    { label: 'Nigerian School Girl (Green Checkered)', url: pupilGirl },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    onSaveAvatar(selectedPhoto);
    onClose();
  };

  const handleRemove = () => {
    setSelectedPhoto('');
    onSaveAvatar('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FEFCE8] text-[#D97706] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-[#FBC02D]/40">
              <Sparkles className="w-3 h-3" />
              <span>Parent Photo Personalization</span>
            </div>
            <h2 className="text-2xl font-black text-[#026838] font-display tracking-tight uppercase">
              Insert {student.name}'s Photo
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Upload your child's real photo or choose an authentic Nigerian pupil avatar for lessons, reports & badges.
            </p>
          </div>

          {/* Current Live Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-[#026838] overflow-hidden bg-white shadow-md flex items-center justify-center">
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto}
                    alt={`${student.name}'s avatar`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                    style={{ backgroundColor: student.avatarColor || '#1E88E5' }}
                  >
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 bg-[#FBC02D] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                Pri {student.grade}
              </span>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-black text-gray-900 uppercase">
                {student.name}'s Profile Picture
              </h4>
              <p className="text-xs text-gray-600">
                This image will appear across {student.name}'s lesson room, whiteboard badges, and academic progress reports.
              </p>
              {selectedPhoto && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline pt-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove custom photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Area (Drag & Drop or Manual File Pick) */}
          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-2">
              Upload from Phone / Computer
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#026838] bg-emerald-50'
                  : 'border-sky-200 bg-white hover:border-[#026838] hover:bg-sky-50/50'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#F0FDF4] text-[#026838] flex items-center justify-center mb-2 shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-black text-gray-800">
                Click to browse or drag & drop child photo
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                PNG, JPG or WEBP up to 10MB
              </p>
            </div>
          </div>

          {/* Curated Nigerian Pupil Presets */}
          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-2">
              Or Choose Curated Nigerian Pupil Avatar
            </label>
            <div className="grid grid-cols-2 gap-3">
              {presetAvatars.map((preset, index) => {
                const isCurrent = selectedPhoto === preset.url;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedPhoto(preset.url)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all text-left ${
                      isCurrent
                        ? 'border-[#026838] bg-[#F0FDF4] shadow-sm ring-2 ring-[#026838]/20'
                        : 'border-gray-200 bg-white hover:border-[#026838]/40'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">
                        {index === 0 ? 'Primary Pupil (Boy)' : 'Primary Pupil (Girl)'}
                      </p>
                      <span className="text-[9px] text-[#026838] font-bold block">
                        {isCurrent ? '✓ Selected' : 'Click to select'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-7 py-3 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Pupil Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
