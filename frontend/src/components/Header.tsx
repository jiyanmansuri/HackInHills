"use client";

import React from "react";
import { ShieldCheck, UploadCloud } from "lucide-react";

interface HeaderProps {
  onOpenUpload: () => void;
  asOfDate?: string;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  asOfDate = "2026-09-22",
  onSelectDate,
  selectedDate = "2026-09-22",
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
      {/* Top Demo Data Notice Strip */}
      <div className="bg-[#FEF9F0] border-b border-[#E8D3AE] px-4 sm:px-8 py-1.5 text-xs text-[#8A5816] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#B8860B] animate-pulse"></span>
          <span className="font-semibold">MCX Gold Surveillance Engine Active:</span>
          <span className="hidden md:inline">
            252 sessions Multi-Contract Settlement Data (GBM + Carry + Dislocation Regime).
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            DEMO DATASET
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500">
            As of: <strong className="text-slate-800">{asOfDate}</strong>
          </span>
          <button
            onClick={onOpenUpload}
            className="font-medium text-[#B8860B] hover:text-[#8A5816] underline cursor-pointer flex items-center space-x-1"
          >
            <UploadCloud className="w-3.5 h-3.5 inline mr-0.5" />
            Upload Bhavcopy CSV
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 whitespace-nowrap">
                Commodity Derivatives Intelligence
              </h1>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                Hack in Hills '26
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md">
              India MCX Gold Cross-Contract Relative-Value &amp; Basis Surveillance Engine
            </p>
          </div>
        </div>

        {/* Right-aligned action controls */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          {onSelectDate && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500">Replay:</span>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-semibold cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="2026-09-22">2026-09-22 (Equilibrium)</option>
                <option value="2026-09-15">2026-09-15 (Dislocation &bull; Z = -1.46σ)</option>
                <option value="2026-08-17">2026-08-17 (High Dislocation &bull; +4.2% Alpha)</option>
              </select>
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span className="whitespace-nowrap">Import Bhavcopy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
