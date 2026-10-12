/**
 * Typed REST API Client connecting Next.js to Flask backend with demo JSON fallback insurance.
 */

import {
  ContractSpec,
  NormalizedPriceRecord,
  RelativeValueRecord,
  SignalsResponse,
  TermStructureResponse,
  CalendarItem,
  AttributionResponse,
  BacktestSummaryResponse,
  BacktestTrade,
  DataQualityReport,
  ExplainResponse,
} from "./types";

async function fetchWithFallback<T>(url: string, fallbackPath: string): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Fetch to ${url} failed; loading fallback ${fallbackPath}:`, err);
    try {
      const fallbackRes = await fetch(fallbackPath);
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch (fallbackErr) {
      console.error(`Fallback failed for ${fallbackPath}:`, fallbackErr);
    }
    throw err;
  }
}

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  return fetchWithFallback<{ status: string; database: string }>(
    "/api/health",
    "/fallback/health.json"
  );
}

export async function fetchContracts(): Promise<ContractSpec[]> {
  return fetchWithFallback<ContractSpec[]>(
    "/api/contracts",
    "/fallback/contracts.json"
  );
}

export async function fetchNormalizedPrices(
  symbols?: string[],
  fromDate?: string,
  toDate?: string,
  expiry?: string
): Promise<NormalizedPriceRecord[]> {
  const params = new URLSearchParams();
  if (symbols && symbols.length > 0) params.append("symbols", symbols.join(","));
  if (fromDate) params.append("from", fromDate);
  if (toDate) params.append("to", toDate);
  if (expiry) params.append("expiry", expiry);

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchWithFallback<NormalizedPriceRecord[]>(
    `/api/prices/normalized${query}`,
    "/fallback/prices-normalized.json"
  );
}

export async function fetchRelativeValue(targetDate?: string): Promise<RelativeValueRecord[]> {
  const params = new URLSearchParams();
  if (targetDate) params.append("date", targetDate);

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchWithFallback<RelativeValueRecord[]>(
    `/api/relative-value${query}`,
    "/fallback/relative-value.json"
  );
}

export async function fetchTermStructure(
  symbol: string = "GOLDM",
  targetDate?: string
): Promise<TermStructureResponse> {
  const params = new URLSearchParams({ symbol });
  if (targetDate) params.append("date", targetDate);

  const query = `?${params.toString()}`;
  return fetchWithFallback<TermStructureResponse>(
    `/api/term-structure${query}`,
    "/fallback/term-structure.json"
  );
}

export async function fetchCalendar(targetDate?: string): Promise<CalendarItem[]> {
  const params = new URLSearchParams();
  if (targetDate) params.append("date", targetDate);
  const query = params.toString() ? `?${params.toString()}` : "";

  return fetchWithFallback<CalendarItem[]>(
    `/api/calendar${query}`,
    "/fallback/calendar.json"
  );
}

export async function fetchSignals(targetDate?: string): Promise<SignalsResponse> {
  const params = new URLSearchParams();
  if (targetDate) params.append("date", targetDate);
  const query = params.toString() ? `?${params.toString()}` : "";

  return fetchWithFallback<SignalsResponse>(
    `/api/signals${query}`,
    "/fallback/signals.json"
  );
}

export async function fetchBacktestSummary(): Promise<BacktestSummaryResponse> {
  return fetchWithFallback<BacktestSummaryResponse>(
    "/api/backtest/summary",
    "/fallback/backtest-summary.json"
  );
}

export async function fetchBacktestTrades(limit: number = 50): Promise<BacktestTrade[]> {
  return fetchWithFallback<BacktestTrade[]>(
    `/api/backtest/trades?limit=${limit}`,
    "/fallback/backtest-trades.json"
  );
}

export async function fetchAttribution(): Promise<AttributionResponse> {
  return fetchWithFallback<AttributionResponse>(
    "/api/attribution",
    "/fallback/attribution.json"
  );
}

export async function fetchDataQuality(): Promise<DataQualityReport> {
  return fetchWithFallback<DataQualityReport>(
    "/api/data-quality",
    "/fallback/data-quality.json"
  );
}

export async function requestExplanation(signalPayload: any): Promise<ExplainResponse> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signalPayload),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (e) {
    return {
      explanation: `Cross-contract basis dislocation observed in ${signalPayload.symbol} (${signalPayload.spread_abs > 0 ? "+" : ""}${signalPayload.spread_abs?.toFixed(2)} ₹/g). Z-score dislocation (${signalPayload.z_score?.toFixed(2)}σ) driven by localized liquidity imbalance against front GOLDM benchmark. Invalidation: divergence beyond ±2.5σ or volume collapse.`,
      model_used: "claude-3-5-sonnet-20241022 (fallback)",
      is_fallback: true,
      error_note: "Running local demo fallback explanation",
    };
  }
}

export async function uploadBhavcopyFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload-bhavcopy", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json();
}
