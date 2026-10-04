"use client";

import React from "react";
import { ShieldCheck, UploadCloud, Database, Sparkles, Activity } from "lucide-react";

interface HeaderProps {
  onOpenUpload: () => void;
  dataHealth?: number;
  totalTradingDays?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  dataHealth = 88,
  totalTradingDays = 252,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Synthetic Calibration Notice Banner */}
      <div className="bg-[#FEF9F0] border-b border-[#E8D3AE] px-4 py-1.5 text-xs text-[#8A5816] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C8963E] animate-pulse"></span>
          <span className="font-semibold">MCX Gold Surveillance Engine Active:</span>
          <span>
            Calibrated on {totalTradingDays} sessions of Multi-Contract Settlement Data (GBM + Carry + Dislocation Regime).
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="hidden sm:inline text-slate-500">
            Database: <strong className="text-slate-700">Auto-Synced (SQLite/Supabase)</strong>
          </span>
          <button
            onClick={onOpenUpload}
            className="font-medium text-[#C8963E] hover:text-[#9A671A] underline cursor-pointer flex items-center space-x-1"
          >
            <UploadCloud className="w-3.5 h-3.5 inline mr-0.5" />
            Upload Real Bhavcopy CSV
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B192C] flex items-center justify-center text-[#C8963E] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-[#0B192C]">
                Commodity Derivatives Intelligence
              </h1>
              <span className="bg-[#0B192C]/5 text-[#0B192C] border border-[#0B192C]/10 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Hack in Hills '26
              </span>
            </div>
            <p className="text-xs text-slate-500">
              India MCX Gold Cross-Contract Relative-Value &amp; Basis Surveillance &bull; Team Holyknight
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>Health Score: <strong>{dataHealth}%</strong></span>
          </div>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-[#C8963E]" />
            <span>Import Bhavcopy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
