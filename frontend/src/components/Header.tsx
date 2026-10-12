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
    <header className="border-b border-line bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-ink flex items-center justify-center text-gold shadow-2xs shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-ink whitespace-nowrap">
                Commodity Derivatives Intelligence
              </h1>
              <span className="text-[11px] font-mono text-muted whitespace-nowrap">
                MCX Gold Surveillance
              </span>
            </div>
            <p className="text-[11.5px] text-muted truncate max-w-md">
              Cross-Contract Relative-Value &amp; Basis Surveillance Engine &bull; As of {asOfDate}
            </p>
          </div>
        </div>

        {/* Right-aligned action controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          {onSelectDate && (
            <div className="flex items-center space-x-1.5 bg-ground px-2.5 py-1 rounded text-xs font-mono">
              <span className="text-muted text-[11px]">Replay:</span>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-white border border-line rounded px-1.5 py-0.5 text-xs text-ink font-medium cursor-pointer outline-none"
              >
                <option value="2026-09-22">2026-09-22 (Equilibrium)</option>
                <option value="2026-09-15">2026-09-15 (Dislocation &bull; Z = -1.46σ)</option>
                <option value="2026-08-17">2026-08-17 (High Dislocation &bull; +4.2% Alpha)</option>
              </select>
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-1.5 bg-ink hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-gold" />
            <span className="whitespace-nowrap">Import Bhavcopy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
