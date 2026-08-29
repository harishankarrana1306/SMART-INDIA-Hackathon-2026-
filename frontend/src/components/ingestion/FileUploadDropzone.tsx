import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-[#9C6644] bg-[#9C6644]/10 scale-[0.99]'
          : selectedFile
          ? 'border-emerald-400 bg-emerald-50/50'
          : 'border-[#E5DACB] bg-[#F5EFE6]/40 hover:bg-[#F5EFE6]/80 hover:border-[#9C6644]/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf,.csv,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#2C241D]">{selectedFile.name}</p>
            <p className="text-xs text-[#7D7268]">
              {(selectedFile.size / 1024).toFixed(1)} KB • Ready for NLP Entity Extraction
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-[#9C6644] hover:underline font-semibold mt-2 cursor-pointer"
          >
            Change selected file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3.5 bg-[#EAE1D5] text-[#9C6644] rounded-2xl shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2C241D]">
              Click to upload or drag & drop document
            </p>
            <p className="text-xs text-[#8C827A] mt-0.5">
              Supports unstructured FIR complaints (.txt), cellular CDR (.csv), wire records (.csv), or JSON
            </p>
          </div>
          <span className="inline-block px-3 py-1 bg-white border border-[#E5DACB] rounded-full text-[11px] font-semibold text-[#5C5248] shadow-sm">
            Automatic NLP Pipeline Processing
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploadDropzone;
