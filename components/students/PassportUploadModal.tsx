'use client';

/**
 * @file components/students/PassportUploadModal.tsx
 * @description Reusable client component for uploading student passport photos with client-side canvas compression.
 * Resizes images to max 400x400px JPEG (~0.8 quality) and uploads to Supabase Storage at `${studentId}/passport.jpg`
 * using { upsert: true } before updating students.passport_url.
 */

import { useState, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressImage, CompressionResult } from '@/lib/utils/imageCompression';
import { updateStudentPassportAction } from '@/app/dashboard/admin/actions';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface PassportUploadModalProps {
  studentId: string;
  studentName: string;
  currentPassportUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PassportUploadModal({
  studentId,
  studentName,
  currentPassportUrl,
  isOpen,
  onClose,
  onSuccess,
}: PassportUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Format bytes to human readable string (KB / MB)
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsCompressing(true);

    try {
      const result = await compressImage(file, 400, 0.8);
      setCompressionResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to compress image file.');
      setCompressionResult(null);
      setSelectedFile(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = () => {
    if (!compressionResult || !studentId) {
      setError('Please select a valid passport photo image.');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const path = `${studentId}/passport.jpg`;

        // 1. Upload compressed Blob to Supabase Storage 'passports' bucket using upsert: true
        const { error: uploadError } = await supabase.storage
          .from('passports')
          .upload(path, compressionResult.blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          if (uploadError.message.includes('403') || uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
            throw new Error('Permission denied: You do not have authorization to upload photos for this student.');
          }
          if (uploadError.message.includes('size') || uploadError.message.includes('limit')) {
            throw new Error('File exceeds storage limit (2MB max allowed).');
          }
          throw new Error(uploadError.message || 'Failed to upload photo to storage.');
        }

        // 2. Update students table record with storage path
        const res = await updateStudentPassportAction(studentId, path);
        if (res.error) {
          throw new Error(res.error);
        }

        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || 'An error occurred during passport upload.');
      }
    });
  };

  const handleResetSelection = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
              <Upload className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight">
                Upload Passport Photo
              </h2>
              <p className="text-olive-200 text-xs font-medium">
                {studentName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-olive-300 hover:text-white rounded-lg hover:bg-olive-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* File Picker & Compression Area */}
          {!compressionResult ? (
            <div className="space-y-4">
              <label
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isCompressing
                    ? 'bg-olive-50 border-olive-400'
                    : 'border-olive-300 hover:border-schoolYellow-500 hover:bg-schoolYellow-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-10 h-10 text-schoolYellow-600 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-olive-900">
                      Compressing image to 400x400 JPEG...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 text-schoolYellow-700 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-olive-900">
                        Click to choose passport photo
                      </p>
                      <p className="text-xs text-olive-600 font-medium mt-1">
                        JPEG, PNG, or WebP (Auto-compressed to 400x400 max)
                      </p>
                    </div>
                  </div>
                )}
              </label>

              {/* Current Passport Preview if available */}
              {currentPassportUrl && (
                <div className="p-3 bg-olive-50 rounded-xl border border-olive-200 flex items-center space-x-3">
                  <img
                    src={currentPassportUrl}
                    alt={studentName}
                    className="w-12 h-12 rounded-lg object-cover border border-olive-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-olive-900">Current Passport Photo</p>
                    <p className="text-2xs text-olive-600">Selecting a new photo will overwrite the current image.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Compressed Image Preview & Compression Stats */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Canvas Compression Ready</span>
                  </span>
                  <button
                    onClick={handleResetSelection}
                    disabled={isPending}
                    className="text-xs font-semibold text-olive-700 hover:text-olive-900 underline cursor-pointer"
                  >
                    Choose Different Image
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Compressed Image Preview */}
                  <img
                    src={compressionResult.previewUrl}
                    alt="Passport Preview"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-300 shadow-sm shrink-0"
                  />

                  {/* Size Reduction Metrics */}
                  <div className="space-y-1.5 text-xs text-emerald-950 font-medium">
                    <p className="font-bold text-sm text-emerald-900">
                      Resolution: {compressionResult.width} x {compressionResult.height}px
                    </p>
                    <p>
                      Original Size: <span className="font-semibold text-olive-700">{formatBytes(compressionResult.originalSize)}</span>
                    </p>
                    <p>
                      Compressed Size:{' '}
                      <strong className="text-emerald-800">
                        {formatBytes(compressionResult.compressedSize)} (JPEG ~0.8)
                      </strong>
                    </p>
                    <p className="text-2xs text-emerald-700">
                      Destination: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">{studentId}/passport.jpg</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-6 bg-olive-50 border-t border-olive-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 border border-olive-300 text-olive-800 hover:bg-olive-100 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending || !compressionResult}
            className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Passport Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
