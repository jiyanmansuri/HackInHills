"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { CmdKPalette } from "@/components/CmdKPalette";
import { GuidedTour } from "@/components/GuidedTour";
import { ExplainDrawer } from "@/components/ExplainDrawer";
import { BhavcopyUploader } from "@/components/BhavcopyUploader";

import { CommandCenterView } from "@/components/CommandCenterView";
import { ContractCompareView } from "@/components/ContractCompareView";
import { RelativeValueHeroView } from "@/components/RelativeValueHeroView";
import { ExpiryCalendarView } from "@/components/ExpiryCalendarView";
import { SignalsView } from "@/components/SignalsView";
import { ValidationView } from "@/components/ValidationView";
import { AttributionView } from "@/components/AttributionView";
import { MethodologyView } from "@/components/MethodologyView";

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
  NavigationTab,
} from "@/lib/types";

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation & URL state
  const [activeTab, setActiveTab] = useState<NavigationTab>("command-center");
  const [referenceSymbol, setReferenceSymbol] = useState<string>("GOLDM");
  const [isNetOfCosts, setIsNetOfCosts] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isPresentMode, setIsPresentMode] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("default");

  // Modals & Drawers
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [explainSignal, setExplainSignal] = useState<Partial<SignalItem> | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [heroPairSymbol, setHeroPairSymbol] = useState<string>("GOLDPETAL");

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

  // Sync with URL query parameters on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as NavigationTab;
      if (tabParam) setActiveTab(tabParam);

      const refParam = params.get("ref");
      if (refParam) setReferenceSymbol(refParam);

      const netParam = params.get("net");
      if (netParam !== null) setIsNetOfCosts(netParam === "true");

      // Check saved theme or system preference
      const savedTheme = localStorage.getItem("cdi-theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Sync state to URL when changed
  const updateUrlParams = (tab: NavigationTab, ref: string, net: boolean) => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      url.searchParams.set("ref", ref);
      url.searchParams.set("net", String(net));
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    updateUrlParams(tab, referenceSymbol, isNetOfCosts);
  };

  const handleSelectReference = (ref: string) => {
    setReferenceSymbol(ref);
    updateUrlParams(activeTab, ref, isNetOfCosts);
  };

  const handleToggleCosts = () => {
    const nextNet = !isNetOfCosts;
    setIsNetOfCosts(nextNet);
    updateUrlParams(activeTab, referenceSymbol, nextNet);
  };

  const handleToggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cdi-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cdi-theme", "light");
    }
  };

  const handleTogglePresentMode = () => {
    const nextPresent = !isPresentMode;
    setIsPresentMode(nextPresent);
    if (nextPresent) {
      document.body.classList.add("present-mode");
    } else {
      document.body.classList.remove("present-mode");
    }
  };

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load backend data
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
        fetchRelativeValue(),
        fetchSignals(),
        fetchCalendar(),
        fetchTermStructure(referenceSymbol),
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
  }, [referenceSymbol]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleOpenExplain = (signal: Partial<SignalItem>) => {
    setExplainSignal(signal);
    setIsExplainOpen(true);
  };

  const handleOpenDecomposition = (pairSymbol: string) => {
    setHeroPairSymbol(pairSymbol);
    setActiveTab("relative-value");
    updateUrlParams("relative-value", referenceSymbol, isNetOfCosts);
  };

  // Scenario Simulations (without mutating backend)
  const activeSignalsList = React.useMemo(() => {
    if (!signalsData) return [];
    if (selectedScenario === "dhanteras") {
      return signalsData.signals.map((s) =>
        s.symbol === "GOLDPETAL"
          ? {
              ...s,
              spread_pct: 0.85,
              spread_abs: 61.2,
              z_score: 3.12,
              confidence: 0.84,
              regime: "HIGH_DISLOCATION",
            }
          : s
      );
    }
    if (selectedScenario === "illiquid") {
      return signalsData.signals.map((s) =>
        s.symbol === "GOLDGUINEA"
          ? {
              ...s,
              is_thin_liquidity: true,
              confidence: 0.52,
            }
          : s
      );
    }
    if (selectedScenario === "flat") {
      return signalsData.signals.map((s) => ({
        ...s,
        spread_pct: 0.04,
        spread_abs: 2.88,
        z_score: 0.25,
        confidence: 0.48,
        regime: "EQUILIBRIUM",
      }));
    }
    return signalsData.signals;
  }, [signalsData, selectedScenario]);

  // Derive latest date from data
  const asOfDate = React.useMemo(() => {
    if (prices && prices.length > 0) {
      return prices[prices.length - 1].trade_date;
    }
    return "2026-03-31";
  }, [prices]);

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      referenceSymbol={referenceSymbol}
      onSelectReference={handleSelectReference}
      isNetOfCosts={isNetOfCosts}
      onToggleCosts={handleToggleCosts}
      isDarkMode={isDarkMode}
      onToggleTheme={handleToggleTheme}
      isPresentMode={isPresentMode}
      onTogglePresentMode={handleTogglePresentMode}
      activeSignalCount={
        activeSignalsList.filter((s) => s.confidence >= 0.60 && (s.spread_pct > 0.12 || s.spread_pct < -0.12))
          .length
      }
      asOfDate={asOfDate}
      isSynthetic={true}
      onOpenUpload={() => setIsUploadOpen(true)}
      onStartTour={() => setIsTourOpen(true)}
      onOpenPalette={() => setIsPaletteOpen(true)}
      selectedScenario={selectedScenario}
      onSelectScenario={(sc) => setSelectedScenario(sc)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>
              <strong>Connection Warning:</strong> {error}
            </span>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-white dark:bg-[#0E1B2E] border border-rose-300 dark:border-rose-700 rounded font-semibold hover:bg-rose-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-24 bg-stone-200/60 dark:bg-stone-800/60 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-stone-200/60 dark:bg-stone-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-stone-200/60 dark:bg-stone-800/60 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Page 1: Command Center */}
            {activeTab === "command-center" && (
              <CommandCenterView
                signals={activeSignalsList}
                prices={prices}
                dataQuality={dataQuality}
                referenceSymbol={referenceSymbol}
                isNetOfCosts={isNetOfCosts}
                onSelectSignal={handleOpenExplain}
                onNavigateTab={handleSelectTab}
                onOpenDecomposition={handleOpenDecomposition}
              />
            )}

            {/* Page 2: Contract Compare */}
            {activeTab === "contract-compare" && (
              <ContractCompareView
                prices={prices}
                referenceSymbol={referenceSymbol}
              />
            )}

            {/* Page 3: Relative Value (Hero Waterfall) */}
            {activeTab === "relative-value" && (
              <RelativeValueHeroView
                spreads={spreads}
                referenceSymbol={referenceSymbol}
                isNetOfCosts={isNetOfCosts}
                onSelectSignal={handleOpenExplain}
                selectedPairSymbol={heroPairSymbol}
              />
            )}

            {/* Page 4: Expiry Calendar */}
            {activeTab === "expiry-calendar" && (
              <ExpiryCalendarView calendar={calendar} />
            )}

            {/* Page 5: Market Signals */}
            {activeTab === "signals" && (
              <SignalsView
                signalsData={
                  signalsData ? { ...signalsData, signals: activeSignalsList } : null
                }
                referenceSymbol={referenceSymbol}
                isNetOfCosts={isNetOfCosts}
                onSelectSignal={handleOpenExplain}
              />
            )}

            {/* Page 6: Validation */}
            {activeTab === "validation" && (
              <ValidationView
                summary={backtestSummary}
                trades={backtestTrades}
              />
            )}

            {/* Page 7: Performance Attribution */}
            {activeTab === "attribution" && (
              <AttributionView attribution={attribution} />
            )}

            {/* Page 8: Data & Methodology */}
            {activeTab === "methodology" && (
              <MethodologyView
                dataQuality={dataQuality}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Cmd+K Palette */}
      <CmdKPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        referenceSymbol={referenceSymbol}
        onSelectReference={handleSelectReference}
        isNetOfCosts={isNetOfCosts}
        onToggleCosts={handleToggleCosts}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenUpload={() => {
          setIsPaletteOpen(false);
          setIsUploadOpen(true);
        }}
        onStartTour={() => {
          setIsPaletteOpen(false);
          setIsTourOpen(true);
        }}
        onSelectScenario={(sc) => setSelectedScenario(sc)}
      />

      {/* Guided Tour Modal */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onJumpToTab={handleSelectTab}
      />

      {/* Claude AI Explain Drawer */}
      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        signal={explainSignal}
      />

      {/* Bhavcopy CSV Uploader */}
      <BhavcopyUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          loadDashboardData();
        }}
      />
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-stone-400">
          Loading Commodity Derivatives Intelligence...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
