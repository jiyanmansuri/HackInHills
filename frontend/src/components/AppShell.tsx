"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  GitCompare,
  SlidersHorizontal,
  CalendarRange,
  Zap,
  TrendingUp,
  PieChart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Tv,
  Search,
  Sparkles,
  UploadCloud,
  Coins,
  Shield,
  Layers,
  Info,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";
import { NavigationTab } from "@/lib/types";

interface AppShellProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  referenceSymbol: string;
  onSelectReference: (sym: string) => void;
  isNetOfCosts: boolean;
  onToggleCosts: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isPresentMode: boolean;
  onTogglePresentMode: () => void;
  activeSignalCount: number;
  asOfDate: string;
  isSynthetic: boolean;
  onOpenUpload: () => void;
  onStartTour: () => void;
  onOpenPalette: () => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    id: "command-center" as NavigationTab,
    label: "Command Center",
    shortLabel: "Overview",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    id: "contract-compare" as NavigationTab,
    label: "Contract Compare",
    shortLabel: "Compare",
    icon: GitCompare,
    badge: null,
  },
  {
    id: "relative-value" as NavigationTab,
    label: "Relative Value",
    shortLabel: "Rel Value",
    icon: SlidersHorizontal,
    badge: "Hero",
  },
  {
    id: "expiry-calendar" as NavigationTab,
    label: "Expiry Calendar",
    shortLabel: "Calendar",
    icon: CalendarRange,
    badge: null,
  },
  {
    id: "signals" as NavigationTab,
    label: "Market Signals",
    shortLabel: "Signals",
    icon: Zap,
    badge: "signalsCount",
  },
  {
    id: "validation" as NavigationTab,
    label: "ML Validation",
    shortLabel: "Validation",
    icon: TrendingUp,
    badge: null,
  },
  {
    id: "attribution" as NavigationTab,
    label: "PnL Attribution",
    shortLabel: "Attribution",
    icon: PieChart,
    badge: null,
  },
  {
    id: "methodology" as NavigationTab,
    label: "Data & Specs",
    shortLabel: "Specs",
    icon: BookOpen,
    badge: null,
  },
];

export function AppShell({
  activeTab,
  onSelectTab,
  referenceSymbol,
  onSelectReference,
  isNetOfCosts,
  onToggleCosts,
  isDarkMode,
  onToggleTheme,
  isPresentMode,
  onTogglePresentMode,
  activeSignalCount,
  asOfDate,
  isSynthetic,
  onOpenUpload,
  onStartTour,
  onOpenPalette,
  selectedScenario,
  onSelectScenario,
  children,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSyntheticTooltip, setShowSyntheticTooltip] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] ${isPresentMode ? "present-mode" : ""}`}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E1B2E]/95 backdrop-blur-md border-b border-[var(--border)] transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand & Mobile Menu */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B5822F] via-[#C8963E] to-[#E2B258] text-white flex items-center justify-center font-black shadow-sm shadow-[#C8963E]/30 text-sm">
                CDI
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display text-sm tracking-tight text-[var(--navy)] font-extrabold">
                    COMMODITY INTELLIGENCE
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E] font-bold">
                    MCX GOLD
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                  Cross-Contract Relative Value &bull; Surveillance Terminal
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Data Source Ribbon & As-Of Date */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Synthetic Data Ribbon */}
            <div className="relative">
              <button
                onClick={() => setShowSyntheticTooltip(!showSyntheticTooltip)}
                onMouseEnter={() => setShowSyntheticTooltip(true)}
                onMouseLeave={() => setShowSyntheticTooltip(false)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSynthetic
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isSynthetic ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isSynthetic ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </span>
                <span>{isSynthetic ? "SYNTHETIC DATA" : "REAL MCX BHAVCOPY"}</span>
                <Info className="w-3 h-3 text-stone-400" />
              </button>

              {showSyntheticTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 rounded-xl bg-white dark:bg-[#15263F] border border-stone-200 dark:border-stone-700 text-xs shadow-xl z-50 animate-in fade-in-0 duration-150">
                  <div className="font-bold text-stone-900 dark:text-white mb-1 flex items-center space-x-1">
                    <span>Data Integrity Protocol</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 leading-normal text-[11px]">
                    {isSynthetic
                      ? "Calibrated 252-day Geometric Brownian Motion engine simulating GOLDM, GOLDTEN, GOLDGUINEA, and GOLDPETAL with cost-of-carry term structure, mean-reverting basis, and liquidity regimes."
                      : "Direct MCX Bhavcopy daily settlement prices from verified exchange feed."}
                  </p>
                  <button
                    onClick={onOpenUpload}
                    className="mt-2 text-[10px] text-[#C8963E] font-bold hover:underline flex items-center space-x-1"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload your own Bhavcopy CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* As-Of Date */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] text-[11px] font-semibold text-stone-600 dark:text-stone-400 border border-[var(--border)]">
              <span className="text-stone-400">As of:</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">{asOfDate || "2026-03-31"}</span>
            </div>

            {/* Reference Contract Dropdown */}
            <div className="hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold">
              <span className="text-stone-400 text-[10px] uppercase font-bold mr-1">Ref:</span>
              <select
                value={referenceSymbol}
                onChange={(e) => onSelectReference(e.target.value)}
                className="bg-transparent text-stone-800 dark:text-stone-200 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="GOLDM" className="text-stone-900 dark:text-white bg-white dark:bg-[#0E1B2E]">
                  GOLDM (100g)
                </option>
                <option value="GOLDTEN" className="text-stone-900 dark:text-white bg-white dark:bg-[#0E1B2E]">
                  GOLDTEN (10g)
                </option>
              </select>
            </div>

            {/* Gross / Net-of-Costs Toggle */}
            <button
              onClick={onToggleCosts}
              title="Toggle transaction cost friction (12 bps round-trip hurdle)"
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isNetOfCosts
                  ? "bg-[#E6F4EA] dark:bg-[#0E291B] text-[#1F7A4D] dark:text-[#2EAA6E] border-[#1F7A4D]/30"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>{isNetOfCosts ? "Net of Costs (-12 bps)" : "Gross Spread"}</span>
            </button>
          </div>

          {/* Right Controls: Tour, Present Mode, Search, Theme */}
          <div className="flex items-center space-x-2">
            {/* Demo Scenario Selector */}
            <div className="hidden xl:flex items-center space-x-1">
              <select
                value={selectedScenario}
                onChange={(e) => onSelectScenario(e.target.value)}
                className="px-2 py-1 rounded-lg border border-[#DFC79E] dark:border-stone-700 bg-[#FEF9F0] dark:bg-[#1C180E] text-[#B5822F] dark:text-[#E2B258] text-[11px] font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="default" className="bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white">
                  Scenario: Default Regime
                </option>
                <option value="dhanteras" className="bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white">
                  Scenario: Dhanteras Spike (+0.85%)
                </option>
                <option value="illiquid" className="bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white">
                  Scenario: Thin Liquidity Gap (Quiet)
                </option>
                <option value="flat" className="bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white">
                  Scenario: Disciplined Flat Day (0 Signal)
                </option>
              </select>
            </div>

            {/* Guided Tour Button */}
            <button
              onClick={onStartTour}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-[#F4EFE6] dark:hover:bg-[#15263F] border border-[var(--border)] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              title="Launch 5-step judge walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
              <span className="hidden lg:inline">Guided Tour</span>
            </button>

            {/* Cmd+K Search Palette Trigger */}
            <button
              onClick={onOpenPalette}
              className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-medium flex items-center space-x-1.5 cursor-pointer"
              title="Command Palette (Ctrl+K or Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] text-stone-400">Cmd+K</span>
            </button>

            {/* Present Mode Toggle (for 1280x720 projector display) */}
            <button
              onClick={onTogglePresentMode}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isPresentMode
                  ? "bg-[#C8963E] text-white border-[#C8963E]"
                  : "border-[var(--border)] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-[var(--surface)]"
              }`}
              title={isPresentMode ? "Exit Present Mode" : "Present Mode (Projector 1280x720)"}
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-[var(--border)] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-[var(--surface)] transition-colors cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Bhavcopy Upload button */}
            <button
              onClick={onOpenUpload}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#C8963E] hover:bg-[#B5822F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Ingest</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Collapsible Sidebar */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Desktop) */}
        <aside
          className={`hidden md:flex flex-col border-r border-[var(--border)] bg-white dark:bg-[#0E1B2E] transition-all duration-200 shrink-0 present-hide ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Navigation Links */}
          <div className="flex-1 py-4 px-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeContent =
                item.badge === "Hero" ? (
                  <span className="px-1.5 py-0.5 rounded-sm bg-[#C8963E]/15 text-[#C8963E] text-[10px] font-extrabold uppercase">
                    HERO
                  </span>
                ) : item.badge === "signalsCount" && activeSignalCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#1F7A4D] text-white text-[10px] font-black">
                    {activeSignalCount}
                  </span>
                ) : null;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer group ${
                    isActive
                      ? "bg-[#F4E9D2] dark:bg-[#2A2415] text-[#0E1B2E] dark:text-[#E2B258] font-bold shadow-xs border border-[#DFC79E]/40"
                      : "text-stone-600 dark:text-stone-300 hover:bg-[var(--surface-subtle)] hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-[#C8963E]"
                        : "text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200"
                    } ${isSidebarCollapsed ? "mx-auto" : "mr-3"}`}
                  />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between text-left">
                      <span>{item.label}</span>
                      {badgeContent}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer & Collapse Toggle */}
          <div className="p-3 border-t border-[var(--border)] space-y-2">
            {!isSidebarCollapsed && (
              <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-700 dark:text-stone-300">
                  <span>Engine:</span>
                  <span className="text-[#1F7A4D] font-mono">SQLite WAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contracts:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">4 Active</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span>Friction Hurdle:</span>
                  <span className="font-mono text-stone-600 dark:text-stone-400">12 bps round-trip</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center space-x-1.5 text-xs text-stone-400">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Menu</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Content Container */}
        <main className="flex-1 min-w-0 pb-20 md:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (<768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E1B2E]/95 backdrop-blur-md border-t border-[var(--border)] px-2 py-1.5 flex items-center justify-around present-hide shadow-lg">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "text-[#C8963E] font-bold"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
