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
      const res = await fetchTermStructure(sym);
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar & Calibration Banner */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        dataHealth={dataQuality?.health_score || 88}
        totalTradingDays={dataQuality?.trading_days || 252}
        asOfDate={selectedDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>
              <strong>Connection Warning:</strong> {error}
            </span>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-white border border-rose-300 rounded font-semibold hover:bg-rose-100 cursor-pointer"
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
                <div key={i} className="h-32 bg-slate-200/70 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-64 bg-slate-200/70 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* 1. Hero KPIs */}
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

            {/* 2. Contract Price Comparison Chart */}
            <PriceComparisonChart data={prices} />

            {/* 3. Relative Value Panel */}
            <RelativeValuePanel
              spreads={spreads}
              onSelectSignal={handleOpenExplain}
            />

            {/* 4. Market Signals & Confidence Gauge */}
            <MarketSignals
              signalsData={signalsData}
              onSelectSignal={handleOpenExplain}
            />

            {/* Grid: 5. Contract Calendar & 6. Term Structure */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ContractCalendar calendar={calendar} />
              <TermStructureChart
                termStructure={termStructure}
                selectedSymbol={selectedTermSymbol}
                onSelectSymbol={handleTermSymbolChange}
              />
            </div>

            {/* 7. Walk-Forward Backtesting Validation */}
            <ValidationBacktest
              summary={backtestSummary}
              trades={backtestTrades}
            />

            {/* 8. Performance Attribution (Alpha vs Beta) */}
            <AttributionChart attribution={attribution} />
          </>
        )}
      </main>

      {/* 9. Claude AI Qualitative Explanation Drawer */}
      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        signal={explainSignal}
      />

      {/* Bhavcopy Ingestion Modal */}
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
