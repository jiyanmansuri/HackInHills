"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadBhavcopyFile } from "@/lib/api";

interface BhavcopyUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const BhavcopyUploader: React.FC<BhavcopyUploaderProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const res = await uploadBhavcopyFile(file);
      setResult(res);
      setUploading(false);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-[#C8963E] flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B192C]">
                Import MCX Bhavcopy Settlement Data
              </h3>
              <p className="text-xs text-slate-500">
                Upload real MCX daily settlement CSV file to validate and update analytics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-[#C8963E] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="bhavcopy-file-input"
            />
            <label htmlFor="bhavcopy-file-input" className="cursor-pointer">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <span className="text-sm font-semibold text-slate-800 block">
                {file ? file.name : "Select or drag Bhavcopy CSV file"}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Standard columns: Symbol, Date, ExpiryDate, Open, High, Low, Close, Volume, OpenInterest
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ingestion &amp; Validation Successful</span>
              </div>
              <p>Ingested: <strong>{result.inserted_raw} raw records</strong></p>
              <p>Cleaned &amp; Validated: <strong>{result.validation?.clean_rows} records</strong></p>
              <p>Health Score: <strong>{result.quality_report?.health_score}% ({result.quality_report?.status})</strong></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 rounded-lg cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting...</span>
              </>
            ) : (
              <span>Upload &amp; Validate</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
