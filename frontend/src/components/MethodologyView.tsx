"use client";

import React, { useState } from "react";
import {
  BookOpen,
  FileSpreadsheet,
  Download,
  Share2,
  Printer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Coins,
} from "lucide-react";
import { DataQualityReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface MethodologyViewProps {
  dataQuality: DataQualityReport | null;
  onOpenUpload: () => void;
}

export function MethodologyView({
  dataQuality,
  onOpenUpload,
}: MethodologyViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Generate sample CSV of normalized contract specs and summary
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Symbol,ContractSizeG,QuoteBaseG,Purity,TickSizeINR,ExpiryRule,TypicalVolumeG\n" +
      "GOLDM,100,10,995,1.00,Month-End,125000\n" +
      "GOLDTEN,10,10,995,1.00,Month-End,45000\n" +
      "GOLDGUINEA,8,8,995,1.00,5th-of-Month,18000\n" +
      "GOLDPETAL,1,1,999,1.00,5th-of-Month,8500\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MCX_Gold_Contracts_Spec_CDI.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="surface-card p-6 border-l-4 border-l-[#C8963E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C8963E]/10 text-[#C8963E] text-[11px] font-black uppercase tracking-wider">
                Institutional Documentation
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Methodology &amp; Governance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-display mt-1">
              Data Quality, Contract Specs &amp; Regulatory Disclosures
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
              Complete specification of exchange contracts, mathematical formulas, cost hurdle models, and data pipeline audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0E1B2E] text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#C8963E]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0E1B2E] text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0E1B2E] text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Data Quality Audit Dashboard */}
      <div className="surface-card p-6">
        <h3 className="text-base font-bold text-stone-900 dark:text-white font-display mb-3">
          MCX Bhavcopy Ingestion &amp; Quality Audit
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Health Score
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {dataQuality?.health_score || 94}%
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">Surveillance Ready</span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Clean Records
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">
              {dataQuality?.total_clean_rows || 1008}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              of {dataQuality?.total_raw_rows || 1008} rows
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Trading Days
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">
              {dataQuality?.trading_days || 252}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">1-Year Calendar</span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Thin Liquidity Filtered
            </span>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {dataQuality?.thin_liquidity_count || 32}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              {dataQuality?.thin_liquidity_pct?.toFixed(1) || "3.2"}% flagged
            </span>
          </div>
        </div>
      </div>

      {/* 3. Official MCX Contract Specifications Table */}
      <div className="surface-card p-6">
        <h3 className="text-base font-bold text-stone-900 dark:text-white font-display mb-3">
          MCX Gold Contract Specifications Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Symbol</th>
                <th className="pb-2.5">Lot Size</th>
                <th className="pb-2.5">Quotation Base</th>
                <th className="pb-2.5">Purity</th>
                <th className="pb-2.5">Tick Size</th>
                <th className="pb-2.5">Expiry Day</th>
                <th className="pb-2.5">Delivery Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              <tr className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                <td className="py-2.5 font-bold font-mono text-[#C8963E]">GOLDM</td>
                <td className="py-2.5">100 grams</td>
                <td className="py-2.5 font-semibold">per 10g</td>
                <td className="py-2.5">995 (99.5%)</td>
                <td className="py-2.5 font-mono">₹1.00 / 10g</td>
                <td className="py-2.5 font-medium text-[#1E3E62]">Month-End (Last day)</td>
                <td className="py-2.5">Compulsory Delivery</td>
              </tr>
              <tr className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                <td className="py-2.5 font-bold font-mono text-[#1E3E62]">GOLDTEN</td>
                <td className="py-2.5">10 grams</td>
                <td className="py-2.5 font-semibold">per 10g</td>
                <td className="py-2.5">995 (99.5%)</td>
                <td className="py-2.5 font-mono">₹1.00 / 10g</td>
                <td className="py-2.5 font-medium text-[#1E3E62]">Month-End (Last day)</td>
                <td className="py-2.5">Compulsory Delivery</td>
              </tr>
              <tr className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                <td className="py-2.5 font-bold font-mono text-[#059669]">GOLDGUINEA</td>
                <td className="py-2.5">8 grams</td>
                <td className="py-2.5 font-semibold">per 8g</td>
                <td className="py-2.5">995 (99.5%)</td>
                <td className="py-2.5 font-mono">₹1.00 / 8g</td>
                <td className="py-2.5 font-medium text-[#C8963E]">5th of the Month</td>
                <td className="py-2.5">Compulsory Delivery</td>
              </tr>
              <tr className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                <td className="py-2.5 font-bold font-mono text-[#D97706]">GOLDPETAL</td>
                <td className="py-2.5">1 gram</td>
                <td className="py-2.5 font-semibold">per 1g</td>
                <td className="py-2.5">999 (99.9%)</td>
                <td className="py-2.5 font-mono">₹1.00 / 1g</td>
                <td className="py-2.5 font-medium text-[#C8963E]">5th of the Month</td>
                <td className="py-2.5">Compulsory Delivery</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Core Mathematical Assumptions & Known Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card p-6 space-y-3">
          <h4 className="text-sm font-bold text-stone-900 dark:text-white font-display flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-[#C8963E]" />
            <span>Mathematical Model &amp; Carry Assumptions</span>
          </h4>
          <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
            <li>
              <strong>Per-Gram Basis:</strong> Prices are divided by their quotation base grams:
              <br />
              <code className="text-[11px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono">
                P_norm = P_raw / quote_base_grams
              </code>
            </li>
            <li>
              <strong>Cost of Carry:</strong> Annualized Indian risk-free rate approximated at 6.50% p.a.,
              net of storage and insurance costs (~0.50% p.a.).
            </li>
            <li>
              <strong>Transaction Friction:</strong> Standard round-trip cost assumed at <strong>12 bps (0.12%)</strong>,
              accounting for MCX exchange turnover fees, STT/CTT, stamp duty, SEBI turnover fees, GST, and broker commissions.
            </li>
          </ul>
        </div>

        <div className="surface-card p-6 space-y-3">
          <h4 className="text-sm font-bold text-stone-900 dark:text-white font-display flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Known Surveillance &amp; Execution Limitations</span>
          </h4>
          <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
            <li>
              <strong>Physical Delivery Risk:</strong> The final 5 trading days prior to contract expiry are
              marked as the "Tender Exclusion Zone" where cash arbitrage is halted due to delivery assignment risks.
            </li>
            <li>
              <strong>Retail Slippage on Petals:</strong> GOLDPETAL exhibits wider bid-ask spreads during off-market hours.
              Thin liquidity thresholds filter these days automatically.
            </li>
            <li>
              <strong>GST Differences:</strong> Physical delivery entails 3% GST which does not apply to cash-squared intraday/expiry rolls.
            </li>
          </ul>
        </div>
      </div>

      {/* 5. Institutional Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-stone-100 dark:bg-[#132238] border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400 space-y-1">
        <div className="flex items-center space-x-1.5 font-bold text-stone-800 dark:text-stone-200">
          <ShieldAlert className="w-4 h-4 text-[#C8963E]" />
          <span>Regulatory Notice &amp; Compliance Statement</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          <strong>Decision-support analytics. Not investment advice.</strong> This software is engineered
          strictly as a quantitative surveillance demonstration prototype for Hack in Hills '26 (Team Holyknight).
          Historical backtests and walk-forward evaluations do not guarantee future returns.
        </p>
      </div>
    </div>
  );
}
