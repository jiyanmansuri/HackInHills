"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  GitCompare,
  SlidersHorizontal,
  CalendarRange,
  Zap,
  TrendingUp,
  PieChart,
  BookOpen,
  Sun,
  Moon,
  Coins,
  UploadCloud,
  X,
  PlayCircle,
  HelpCircle,
} from "lucide-react";
import { NavigationTab } from "@/lib/types";

interface CmdKPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  referenceSymbol: string;
  onSelectReference: (sym: string) => void;
  isNetOfCosts: boolean;
  onToggleCosts: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  onStartTour: () => void;
  onSelectScenario: (scenario: string) => void;
}

export function CmdKPalette({
  isOpen,
  onClose,
  onSelectTab,
  referenceSymbol,
  onSelectReference,
  isNetOfCosts,
  onToggleCosts,
  isDarkMode,
  onToggleTheme,
  onOpenUpload,
  onStartTour,
  onSelectScenario,
}: CmdKPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      group: "Navigation Pages",
      items: [
        {
          id: "command-center",
          label: "Command Center (KPIs & Top Signals)",
          icon: LayoutDashboard,
          run: () => {
            onSelectTab("command-center");
            onClose();
          },
        },
        {
          id: "contract-compare",
          label: "Contract Compare (Normalized Per-Gram Chart)",
          icon: GitCompare,
          run: () => {
            onSelectTab("contract-compare");
            onClose();
          },
        },
        {
          id: "relative-value",
          label: "Relative Value (Hero Decomposition Waterfall)",
          icon: SlidersHorizontal,
          run: () => {
            onSelectTab("relative-value");
            onClose();
          },
        },
        {
          id: "expiry-calendar",
          label: "Expiry Calendar (5th vs Month-End Gantt)",
          icon: CalendarRange,
          run: () => {
            onSelectTab("expiry-calendar");
            onClose();
          },
        },
        {
          id: "signals",
          label: "Market Signals (ML Classifications & Claude AI)",
          icon: Zap,
          run: () => {
            onSelectTab("signals");
            onClose();
          },
        },
        {
          id: "validation",
          label: "Validation (Walk-Forward Out-of-Sample Backtest)",
          icon: TrendingUp,
          run: () => {
            onSelectTab("validation");
            onClose();
          },
        },
        {
          id: "attribution",
          label: "Performance Attribution (Spread Alpha vs Gold Beta)",
          icon: PieChart,
          run: () => {
            onSelectTab("attribution");
            onClose();
          },
        },
        {
          id: "methodology",
          label: "Data & Methodology (Specs & Regulatory Disclaimer)",
          icon: BookOpen,
          run: () => {
            onSelectTab("methodology");
            onClose();
          },
        },
      ],
    },
    {
      group: "Preferences & Reference",
      items: [
        {
          id: "toggle-ref-goldm",
          label: `Set Reference to GOLDM (100g) ${referenceSymbol === "GOLDM" ? "✓" : ""}`,
          icon: Coins,
          run: () => {
            onSelectReference("GOLDM");
            onClose();
          },
        },
        {
          id: "toggle-ref-goldten",
          label: `Set Reference to GOLDTEN (10g) ${referenceSymbol === "GOLDTEN" ? "✓" : ""}`,
          icon: Coins,
          run: () => {
            onSelectReference("GOLDTEN");
            onClose();
          },
        },
        {
          id: "toggle-costs",
          label: `Switch to ${isNetOfCosts ? "Gross Spread View" : "Net-of-Costs View (12 bps friction)"}`,
          icon: SlidersHorizontal,
          run: () => {
            onToggleCosts();
            onClose();
          },
        },
        {
          id: "toggle-theme",
          label: `Switch to ${isDarkMode ? "Light Mode" : "Dark Mode"}`,
          icon: isDarkMode ? Sun : Moon,
          run: () => {
            onToggleTheme();
            onClose();
          },
        },
      ],
    },
    {
      group: "Demo & Surveillance Tools",
      items: [
        {
          id: "start-tour",
          label: "Start 5-Step Guided Walkthrough for Judges",
          icon: HelpCircle,
          run: () => {
            onStartTour();
            onClose();
          },
        },
        {
          id: "scenario-dhanteras",
          label: "Simulate: Dhanteras Retail Demand Squeeze (Petal +0.85%)",
          icon: PlayCircle,
          run: () => {
            onSelectScenario("dhanteras");
            onClose();
          },
        },
        {
          id: "scenario-illiquid",
          label: "Simulate: Thin Liquidity False Divergence (System Stays Quiet)",
          icon: PlayCircle,
          run: () => {
            onSelectScenario("illiquid");
            onClose();
          },
        },
        {
          id: "upload-bhavcopy",
          label: "Ingest MCX Bhavcopy CSV File",
          icon: UploadCloud,
          run: () => {
            onOpenUpload();
            onClose();
          },
        },
      ],
    },
  ];

  const filteredGroups = actions
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0E1B2E] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <Search className="w-5 h-5 text-stone-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page (Esc to close)..."
            className="w-full bg-transparent text-sm font-medium text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400">
              No matching commands or pages found.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.group}>
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {group.group}
                </div>
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.run}
                        className="w-full flex items-center px-3 py-2 rounded-xl text-left text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-[#F4EFE6] dark:hover:bg-[#132238] transition-colors group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:text-[#C8963E] group-hover:bg-[#F4E9D2] dark:group-hover:bg-[#2A2415] mr-3">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Jump ↵
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 flex items-center justify-between text-xs text-stone-400">
          <span>Navigate with arrows or mouse</span>
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-[10px] font-mono">
              ESC
            </kbd>
            <span>to exit</span>
          </span>
        </div>
      </div>
    </div>
  );
}
