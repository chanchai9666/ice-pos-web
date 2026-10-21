'use client';

import React, { useState, useRef } from 'react';
import { Icons } from '@/components/ui/Icons';

export interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onImageSelected: (file: File | null) => void;
  maxSizeBytes?: number; // default 5MB
}

export function ImageUploader({
  currentImageUrl,
  onImageSelected,
  maxSizeBytes = 5 * 1024 * 1024,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with currentImageUrl when it changes
  React.useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('รองรับเฉพาะไฟล์รูปภาพนามสกุล JPG, PNG หรือ WebP เท่านั้น');
      return;
    }

    // Validate size
    if (file.size > maxSizeBytes) {
      const sizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      setErrorMessage(`ขนาดไฟล์ต้องไม่เกิน ${sizeMB} MB`);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onImageSelected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected(null);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-4 p-3 rounded-xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'
        }`}
      >
        {/* Preview Frame */}
        <div className="relative w-20 h-20 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="ตัวอย่างรูปสินค้า"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Icons.Image className="w-7 h-7 text-slate-600" />
              <span className="text-[10px] text-slate-600 mt-1 font-mono">ไม่มีรูป</span>
            </div>
          )}
        </div>

        {/* Action & Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-slate-200">
            {isDragging ? 'วางรูปภาพที่นี่เพื่ออัปโหลด' : 'ลากไฟล์รูปภาพมาวาง หรือคลิกเลือกไฟล์'}
          </p>
          <p className="text-[11px] text-slate-400">
            รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-medium border border-slate-700 transition-colors cursor-pointer min-h-[36px]"
            >
              <Icons.Upload className="w-3.5 h-3.5" />
              <span>{previewUrl ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ'}</span>
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/30 text-xs text-rose-400 border border-slate-700/60 transition-colors cursor-pointer min-h-[36px]"
              >
                <Icons.Trash className="w-3.5 h-3.5" />
                <span>ลบรูป</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1.5 rounded-lg">
          <Icons.AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
