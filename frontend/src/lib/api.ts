/**
 * Typed REST API Client connecting Next.js to Flask backend.
 * Hack in Hills '26 - Team Holyknight
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${BASE_URL}/api/health`, { cache: "no-store" });
  return handleResponse(res);
}

export async function fetchContracts(): Promise<ContractSpec[]> {
  const res = await fetch(`${BASE_URL}/api/contracts`, { credentials: "omit" });
  return handleResponse(res);
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

  const res = await fetch(`${BASE_URL}/api/prices/normalized?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchRelativeValue(targetDate?: string): Promise<RelativeValueRecord[]> {
  const params = new URLSearchParams();
  if (targetDate) params.append("date", targetDate);

  const res = await fetch(`${BASE_URL}/api/relative-value?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchTermStructure(
  symbol: string = "GOLDM",
  targetDate?: string
): Promise<TermStructureResponse> {
  const params = new URLSearchParams({ symbol });
  if (targetDate) params.append("date", targetDate);

  const res = await fetch(`${BASE_URL}/api/term-structure?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchCalendar(): Promise<CalendarItem[]> {
  const res = await fetch(`${BASE_URL}/api/calendar`);
  return handleResponse(res);
}

export async function fetchSignals(): Promise<SignalsResponse> {
  const res = await fetch(`${BASE_URL}/api/signals`);
  return handleResponse(res);
}

export async function fetchBacktestSummary(): Promise<BacktestSummaryResponse> {
  const res = await fetch(`${BASE_URL}/api/backtest/summary`);
  return handleResponse(res);
}

export async function fetchBacktestTrades(limit: number = 50): Promise<BacktestTrade[]> {
  const res = await fetch(`${BASE_URL}/api/backtest/trades?limit=${limit}`);
  return handleResponse(res);
}

export async function fetchAttribution(): Promise<AttributionResponse> {
  const res = await fetch(`${BASE_URL}/api/attribution`);
  return handleResponse(res);
}

export async function fetchDataQuality(): Promise<DataQualityReport> {
  const res = await fetch(`${BASE_URL}/api/data-quality`);
  return handleResponse(res);
}

export async function requestExplanation(signalPayload: any): Promise<ExplainResponse> {
  const res = await fetch(`${BASE_URL}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signalPayload),
  });
  return handleResponse(res);
}

export async function uploadBhavcopyFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/upload-bhavcopy`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}
