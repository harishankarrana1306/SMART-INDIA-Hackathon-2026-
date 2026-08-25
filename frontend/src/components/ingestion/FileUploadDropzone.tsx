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
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-brand-purple bg-purple-50/50 scale-[0.99]'
          : selectedFile
          ? 'border-emerald-300 bg-emerald-50/40'
          : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/60 hover:border-brand-purple/60'
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

      <div className="flex flex-col items-center justify-center space-y-3">
        {selectedFile ? (
          <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-brand-purple/10 text-brand-purple shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
        )}

        <div>
          {selectedFile ? (
            <div>
              <p className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                {selectedFile.name}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for NLP extraction
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800">
                Drag & drop investigative document here, or <span className="text-brand-purple underline">browse</span>
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Supports FIR narrative (.txt / .pdf), cellular CDR logs (.csv), bank ledgers (.csv), and surveillance notes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadDropzone;
