"""
Anthropic Claude AI Explanation Client.
Provides institutional trader-grade commentary with automatic fallback.
Hack in Hills '26 - Team Holyknight
"""

import logging
from typing import Dict, Any
from backend.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from backend.explain.template_fallback import generate_deterministic_explanation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a Senior Quantitative Commodities Strategist on the institutional Precious Metals trading desk, specializing in MCX India Gold Futures arbitrage and cross-contract relative value.

MANDATORY RULES:
1. Provide decision-support market intelligence only. STRICTLY DO NOT provide investment advice or guarantee profits or returns.
2. Structure your commentary cleanly using Markdown:
   - Core Thesis: Why this relative value dislocation is structurally interesting.
   - Basis Drivers: Specific pricing friction driving the dislocation (e.g. retail lot premium, coin packaging, liquidity discount, financing/carry difference).
   - Key Execution Risks: Liquidity friction, physical tender lot delivery rules, bid-ask slippage, roll-window compression.
   - Invalidation Triggers: Exact quantitative boundary or macro catalyst that invalidates the trade.
3. Keep the tone concise, incisive, and trader-friendly. Add the disclaimer: 'Decision-support analytics. Not investment advice.' at the end."""


# In-memory explanation response cache
_EXPLANATION_CACHE: Dict[str, Dict[str, Any]] = {}


def explain_signal(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an AI-powered qualitative explanation for a given relative value signal.

    Args:
        payload: Dict containing signal fields (symbol, expiry_date, z_score, spread_pct,
                 spread_abs, confidence, days_to_expiry, is_thin_liquidity, regime)

    Returns:
        Dict: {"explanation": str, "model_used": str, "is_fallback": bool}
    """
    cache_key = f"{payload.get('symbol')}_{payload.get('expiry_date')}_{round(float(payload.get('z_score', 0)), 2)}_{round(float(payload.get('spread_pct', 0)), 3)}"
    if cache_key in _EXPLANATION_CACHE:
        return _EXPLANATION_CACHE[cache_key]

    if not ANTHROPIC_API_KEY:
        logger.info("ANTHROPIC_API_KEY not configured. Using deterministic quantitative template engine.")
        explanation = generate_deterministic_explanation(payload)
        res = {
            "explanation": explanation,
            "model_used": "deterministic-quant-engine",
            "is_fallback": True
        }
        _EXPLANATION_CACHE[cache_key] = res
        return res

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        prompt = f"""Analyze the following MCX Gold Futures relative-value signal:
- Contract Pair: {payload.get('symbol')} vs GOLDM (Benchmark)
- Expiry Date: {payload.get('expiry_date')} ({payload.get('days_to_expiry')} days to expiry)
- Absolute Spread: {payload.get('spread_abs', 0.0):.2f} INR/g
- Percentage Spread: {payload.get('spread_pct', 0.0):.3f}%
- 30-Day Rolling Z-Score: {payload.get('z_score', 0.0):+.2f}
- ML Reversion Confidence: {float(payload.get('confidence', 0.5)):.1%}
- Liquidity Regime: {'THIN LIQUIDITY WARNING' if payload.get('is_thin_liquidity') else 'Normal Liquidity'}
- Market Regime: {payload.get('regime')}
- Signal Type: {payload.get('signal_type')}

Provide your structured quantitative analysis for this trade."""

        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.content[0].text
        res = {
            "explanation": content,
            "model_used": CLAUDE_MODEL,
            "is_fallback": False
        }
        _EXPLANATION_CACHE[cache_key] = res
        return res

    except Exception as e:
        logger.warning(f"Anthropic API call failed ({e}). Falling back to deterministic template engine.")
        explanation = generate_deterministic_explanation(payload)
        res = {
            "explanation": explanation,
            "model_used": "deterministic-quant-engine",
            "is_fallback": True,
            "error_note": str(e)
        }
        _EXPLANATION_CACHE[cache_key] = res
        return res
