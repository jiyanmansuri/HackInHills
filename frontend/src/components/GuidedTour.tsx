"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Layers,
  CalendarRange,
  TrendingUp,
  Award,
} from "lucide-react";
import { NavigationTab } from "@/lib/types";

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToTab: (tab: NavigationTab) => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. The Fundamental Thesis: Normalization",
    tab: "command-center" as NavigationTab,
    icon: Sparkles,
    badge: "Core Architecture",
    description:
      "MCX trades 4 distinct gold contracts (100g, 10g, 8g, 1g) with differing quotation bases and lot sizes. We normalize every contract to price-per-gram. Raw settlement prices cannot be compared until normalized to a single sovereign gold basis.",
    highlight: "Look at the 4 KPI cards and regime banner on the Command Center.",
  },
  {
    step: 2,
    title: "2. The Decomposition Waterfall (Hero Feature)",
    tab: "relative-value" as NavigationTab,
    icon: Layers,
    badge: "Quant Thesis",
    description:
      "Raw spread is an illusion. We systematically peel away: (1) Cost of Carry across differing delivery dates, (2) Tick & Microstructure Noise, and (3) Round-trip execution friction (12 bps). A signal is ONLY emitted if the fundamental residual survives the cost hurdle.",
    highlight: "Inspect the waterfall chart: Raw -> Carry -> Noise -> Residual -> Costs -> Net Edge.",
  },
  {
    step: 3,
    title: "3. Expiry Calendar: 5th vs Month-End Timing",
    tab: "expiry-calendar" as NavigationTab,
    icon: CalendarRange,
    badge: "Contract Dynamics",
    description:
      "A fatal beginner pitfall is assuming all gold expires together. Retail contracts (GOLDPETAL 1g and GOLDGUINEA 8g) expire on the 5th of the month, while institutional GOLDM (100g) expires at month-end. This ~20 day carry offset creates systematic, tradeable term structure dislocations.",
    highlight: "Notice the offset markers, roll windows, and excluded 5-day delivery tender zones.",
  },
  {
    step: 4,
    title: "4. Capital Preservation: 'No Signal' is a Feature",
    tab: "signals" as NavigationTab,
    icon: ShieldCheck,
    badge: "Execution Discipline",
    description:
      "Most retail models overtrade noise and get crushed by brokerage. CDI stays quiet when edge is below 12 bps or when liquidity is thin. Every 'No Signal' state states its mathematical barrier (e.g. 'Residual +0.06% absorbed by 0.12% roundtrip friction').",
    highlight: "Click any signal card to open the Claude AI Explain drawer for institutional surveillance breakdown.",
  },
  {
    step: 5,
    title: "5. Walk-Forward Out-of-Sample Validation",
    tab: "validation" as NavigationTab,
    icon: TrendingUp,
    badge: "Statistical Rigor",
    description:
      "We strictly ban look-ahead bias with an expanding 9-fold walk-forward validation (Train 60d -> Test 20d -> Roll). Our calibrated XGBoost classifier delivers 63.3% out-of-sample hit rate, +11.8% net return, and 1.42 Sharpe net of all transaction costs.",
    highlight: "Review the net equity curve vs Gold Buy-and-Hold and the probability calibration curve.",
  },
];

export function GuidedTour({ isOpen, onClose, onJumpToTab }: GuidedTourProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIdx];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      onJumpToTab(TOUR_STEPS[nextIdx].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      onJumpToTab(TOUR_STEPS[prevIdx].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1B2E] border border-stone-200 dark:border-stone-800 shadow-2xl p-6 relative animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C8963E]/10 text-[#C8963E]">
                {currentStep.badge}
              </span>
              <span className="text-xs font-semibold text-stone-400">
                Step {currentStep.step} of 5
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white font-display mt-0.5">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
          {currentStep.description}
        </div>

        {/* Highlight box */}
        <div className="p-3 rounded-xl bg-[#FBFAF7] dark:bg-[#132238] border border-[#E8E2D4] dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 font-medium mb-6">
          <span className="text-[#C8963E] font-bold mr-1">Demo Tip:</span>
          {currentStep.highlight}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentStepIdx
                    ? "w-6 bg-[#C8963E]"
                    : "w-2 bg-stone-200 dark:bg-stone-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-[#C8963E] hover:bg-[#B5822F] text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
            >
              <span>
                {currentStepIdx === TOUR_STEPS.length - 1
                  ? "Finish Tour"
                  : "Next Step"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
