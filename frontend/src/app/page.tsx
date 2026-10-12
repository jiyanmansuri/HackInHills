"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroKPIs } from "@/components/HeroKPIs";
import { PriceComparisonChart } from "@/components/PriceComparisonChart";
import { RelativeValuePanel } from "@/components/RelativeValuePanel";
import { MarketSignals } from "@/components/MarketSignals";
import { ContractCalendar } from "@/components/ContractCalendar";
import { TermStructureChart } from "@/components/TermStructureChart";
import { ValidationBacktest } from "@/components/ValidationBacktest";
import { AttributionChart } from "@/components/AttributionChart";
import { ExplainDrawer } from "@/components/ExplainDrawer";
import { BhavcopyUploader } from "@/components/BhavcopyUploader";

import {
  fetchNormalizedPrices,
  fetchRelativeValue,
  fetchTermStructure,
  fetchCalendar,
  fetchSignals,
  fetchBacktestSummary,
  fetchBacktestTrades,
  fetchAttribution,
  fetchDataQuality,
} from "@/lib/api";

import {
  NormalizedPriceRecord,
  RelativeValueRecord,
  TermStructureResponse,
  CalendarItem,
  SignalsResponse,
  BacktestSummaryResponse,
  BacktestTrade,
  AttributionResponse,
  DataQualityReport,
  SignalItem,
} from "@/lib/types";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [prices, setPrices] = useState<NormalizedPriceRecord[]>([]);
  const [spreads, setSpreads] = useState<RelativeValueRecord[]>([]);
  const [signalsData, setSignalsData] = useState<SignalsResponse | null>(null);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [termStructure, setTermStructure] = useState<TermStructureResponse | null>(null);
  const [backtestSummary, setBacktestSummary] = useState<BacktestSummaryResponse | null>(null);
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>([]);
  const [attribution, setAttribution] = useState<AttributionResponse | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);

  // Interactive controls
  const [activeTab, setActiveTab] = useState<"overview" | "spreads" | "term-structure" | "validation">("overview");
  const [selectedTermSymbol, setSelectedTermSymbol] = useState<string>("GOLDM");
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-12");
  const [explainSignal, setExplainSignal] = useState<Partial<SignalItem> | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        pricesRes,
        spreadsRes,
        signalsRes,
        calRes,
        tsRes,
        btSummaryRes,
        btTradesRes,
        attRes,
        dqRes,
      ] = await Promise.all([
        fetchNormalizedPrices(undefined, undefined, selectedDate),
        fetchRelativeValue(selectedDate),
        fetchSignals(selectedDate),
        fetchCalendar(selectedDate),
        fetchTermStructure(selectedTermSymbol, selectedDate),
        fetchBacktestSummary(),
        fetchBacktestTrades(50),
        fetchAttribution(),
        fetchDataQuality(),
      ]);

      setPrices(pricesRes);
      setSpreads(spreadsRes);
      setSignalsData(signalsRes);
      setCalendar(calRes);
      setTermStructure(tsRes);
      setBacktestSummary(btSummaryRes);
      setBacktestTrades(btTradesRes);
      setAttribution(attRes);
      setDataQuality(dqRes);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load derivatives intelligence data.");
    } finally {
      setLoading(false);
    }
  }, [selectedTermSymbol, selectedDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle symbol change in term structure
  const handleTermSymbolChange = async (sym: string) => {
    setSelectedTermSymbol(sym);
    try {
      const res = await fetchTermStructure(sym, selectedDate);
      setTermStructure(res);
    } catch (e) {
      console.error("Failed to load term structure for", sym, e);
    }
  };

  // Auto-open explain drawer when replaying a dislocation date
  useEffect(() => {
    if (signalsData && (selectedDate === "2026-08-12" || selectedDate === "2026-08-10" || selectedDate === "2026-03-17")) {
      const activeSig = signalsData.signals.find((s) => s.is_active);
      if (activeSig) {
        setExplainSignal(activeSig);
        setIsExplainOpen(true);
      }
    }
  }, [selectedDate, signalsData]);

  const handleOpenExplain = (signal: Partial<SignalItem>) => {
    setExplainSignal(signal);
    setIsExplainOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Top Navbar & Calibration Notice */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        asOfDate={selectedDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>
              <strong>Notice:</strong> Using demo dataset snapshots while calibrating live connection.
            </span>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-white border border-amber-300 rounded-lg font-semibold hover:bg-amber-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-slate-200/60 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* 1. Hero 4-card KPI strip */}
            <HeroKPIs
              activeCount={signalsData?.active_count || 0}
              totalEvaluated={signalsData?.total_evaluated || 3}
              disciplineStatus={signalsData?.discipline_status || "STAY_QUIET"}
              avgConfidence={signalsData?.avg_confidence || 0.65}
              bestOpportunity={signalsData?.best_opportunity || null}
              healthScore={dataQuality?.health_score || 88}
              tradingDays={dataQuality?.trading_days || 252}
              thinLiquidityCount={dataQuality?.thin_liquidity_count || 0}
              asOfDate={selectedDate}
              onSelectSignal={handleOpenExplain}
            />

            {/* 2. Primary Hero Visualizer (65% Parity / ±Z-Bands Chart + 35% ML Signal Discipline) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
              <div className="lg:col-span-8">
                <PriceComparisonChart
                  data={prices}
                  asOfDate={selectedDate}
                  defaultSymbol={signalsData?.best_opportunity?.symbol || "GOLDTEN"}
                  hasActiveSignal={(signalsData?.active_count || 0) > 0}
                />
              </div>
              <div className="lg:col-span-4">
                <MarketSignals
                  signalsData={signalsData}
                  onSelectSignal={handleOpenExplain}
                />
              </div>
            </div>

            {/* 3. Navigation Tabs */}
            <div className="flex items-center space-x-1.5 border-b border-slate-200 mb-6 pb-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                }`}
              >
                Overview &amp; Calendar
              </button>
              <button
                onClick={() => setActiveTab("spreads")}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "spreads"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                }`}
              >
                Relative-Value Spreads
              </button>
              <button
                onClick={() => setActiveTab("term-structure")}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "term-structure"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                }`}
              >
                Forward Term Structure
              </button>
              <button
                onClick={() => setActiveTab("validation")}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "validation"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                }`}
              >
                Walk-Forward Validation &amp; Alpha
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <RelativeValuePanel
                  spreads={spreads}
                  onSelectSignal={handleOpenExplain}
                />
                <ContractCalendar calendar={calendar} />
              </div>
            )}

            {activeTab === "spreads" && (
              <div>
                <RelativeValuePanel
                  spreads={spreads}
                  onSelectSignal={handleOpenExplain}
                />
              </div>
            )}

            {activeTab === "term-structure" && (
              <div>
                <TermStructureChart
                  termStructure={termStructure}
                  selectedSymbol={selectedTermSymbol}
                  onSelectSymbol={handleTermSymbolChange}
                />
              </div>
            )}

            {activeTab === "validation" && (
              <div className="space-y-6">
                <ValidationBacktest
                  summary={backtestSummary}
                  trades={backtestTrades}
                />
                <AttributionChart attribution={attribution} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Claude AI Explanation Drawer */}
      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        signal={explainSignal}
      />

      {/* Bhavcopy CSV Ingestion Modal */}
      <BhavcopyUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
}
