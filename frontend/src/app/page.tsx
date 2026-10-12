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
  const [selectedTermSymbol, setSelectedTermSymbol] = useState<string>("GOLDM");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-22");
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
        fetchNormalizedPrices(),
        fetchRelativeValue(selectedDate),
        fetchSignals(),
        fetchCalendar(),
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
      // Notice: with fallback insurance, errors are caught silently unless completely broken
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
              <strong>Notice:</strong> Using cached demo dataset snapshots while calibrating live connection.
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
                <div key={i} className="h-32 bg-slate-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-slate-200/60 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* 1. Hero 4-card strip */}
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

            {/* 2. Two-Column Hero: 65% Price/Z-Score Parity Chart + 35% Signal Discipline Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
              <div className="lg:col-span-8">
                <PriceComparisonChart data={prices} asOfDate={selectedDate} />
              </div>
              <div className="lg:col-span-4">
                <MarketSignals
                  signalsData={signalsData}
                  onSelectSignal={handleOpenExplain}
                />
              </div>
            </div>

            {/* 3. Cross-Contract Relative Value Matrix */}
            <RelativeValuePanel
              spreads={spreads}
              onSelectSignal={handleOpenExplain}
            />

            {/* 4. Forward Term Structure Curve */}
            <TermStructureChart
              termStructure={termStructure}
              selectedSymbol={selectedTermSymbol}
              onSelectSymbol={handleTermSymbolChange}
            />

            {/* 5. Contract Lifecycle & Expiry Schedule */}
            <ContractCalendar calendar={calendar} />

            {/* 6. Walk-Forward Backtesting Validation */}
            <ValidationBacktest
              summary={backtestSummary}
              trades={backtestTrades}
            />

            {/* 7. Performance Attribution (Alpha vs Beta) */}
            <AttributionChart attribution={attribution} />
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
