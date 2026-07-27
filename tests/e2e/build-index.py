#!/usr/bin/env python3
"""Aggregate per-engine Playwright reports into a single index.html.

Scans an input directory for subfolders containing `report-<engine>.html`
and `report-<engine>.json` (produced by cover-shortcuts.spec.py), copies
the per-engine reports into an output directory, and writes an `index.html`
that consolidates them with tabs + summary cards.

Usage:
  python3 tests/e2e/build-index.py --input <downloaded-artifacts-dir> --output <out-dir>
"""
from __future__ import annotations

import argparse
import html as _html
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ENGINES = ["chromium", "firefox", "webkit"]


def find_summary(input_dir: Path, engine: str) -> tuple[Path, Path] | None:
    """Return (html_path, json_path) for an engine, or None if missing."""
    for html_path in input_dir.rglob(f"report-{engine}.html"):
        json_path = html_path.with_suffix(".json")
        if json_path.exists():
            return html_path, json_path
    # Fallback: html only (older runs)
    for html_path in input_dir.rglob(f"report-{engine}.html"):
        return html_path, Path()
    return None


def load_summary(json_path: Path, engine: str) -> dict:
    if json_path and json_path.exists():
        data = json.loads(json_path.read_text(encoding="utf-8"))
        data.setdefault("browser", engine)
        return data
    return {
        "browser": engine,
        "overall": "unknown",
        "passed": 0,
        "failed": 0,
        "total": 0,
        "duration_ms": 0,
        "scenarios": [],
    }


def render_index(summaries: dict[str, dict | None], out_path: Path) -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    totals_passed = sum((s or {}).get("passed", 0) for s in summaries.values())
    totals_failed = sum((s or {}).get("failed", 0) for s in summaries.values())
    totals_total = sum((s or {}).get("total", 0) for s in summaries.values())
    totals_duration = sum((s or {}).get("duration_ms", 0) for s in summaries.values())
    overall = "passed" if totals_failed == 0 and totals_total > 0 else (
        "failed" if totals_failed > 0 else "unknown"
    )

    def status_pill(status: str) -> str:
        cls = {"passed": "ok", "failed": "err"}.get(status, "warn")
        return f'<span class="pill {cls}">{_html.escape(status.upper())}</span>'

    # Engine cards
    engine_cards = []
    for engine in ENGINES:
        s = summaries.get(engine)
        if not s:
            engine_cards.append(f"""
      <div class="engine-card missing">
        <div class="engine-head">
          <h3>{engine}</h3>{status_pill("missing")}
        </div>
        <p class="muted">No report artifact found for this engine.</p>
      </div>""")
            continue
        report_href = f"reports/report-{engine}.html"
        engine_cards.append(f"""
      <div class="engine-card {s.get('overall','unknown')}">
        <div class="engine-head">
          <h3>{engine}</h3>{status_pill(s.get('overall','unknown'))}
        </div>
        <div class="mini-grid">
          <div><div class="k">Passed</div><div class="v ok">{s.get('passed',0)}</div></div>
          <div><div class="k">Failed</div><div class="v err">{s.get('failed',0)}</div></div>
          <div><div class="k">Total</div><div class="v">{s.get('total',0)}</div></div>
          <div><div class="k">Duration</div><div class="v">{s.get('duration_ms',0)} ms</div></div>
        </div>
        <div class="actions">
          <a class="pill link" href="{report_href}" target="engine-frame">Open report ↗</a>
          <a class="pill link" href="{report_href}" target="_blank" rel="noopener">New tab</a>
        </div>
      </div>""")

    # Tabs
    tabs = []
    panes = []
    available = [e for e in ENGINES if summaries.get(e)]
    default_engine = available[0] if available else ENGINES[0]
    for engine in ENGINES:
        s = summaries.get(engine)
        active = " active" if engine == default_engine else ""
        disabled = "" if s else " disabled"
        tabs.append(
            f'<button class="tab{active}{disabled}" data-engine="{engine}"'
            f'{" disabled" if not s else ""}>{engine}'
            f'{"" if s else " (missing)"}</button>'
        )
        if s:
            panes.append(
                f'<iframe class="pane{active}" data-engine="{engine}" '
                f'src="reports/report-{engine}.html" title="{engine} report"></iframe>'
            )

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>E2E consolidated report — cover-shortcuts</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #0b1120; color: #e2e8f0; }}
  header {{ padding: 24px 32px; border-bottom: 1px solid #1e293b;
            background: linear-gradient(180deg, #0f172a, #0b1120); }}
  header h1 {{ margin: 0 0 6px; font-size: 22px; }}
  header .sub {{ color: #94a3b8; font-size: 13px; }}
  main {{ padding: 24px 32px; }}
  .summary {{ display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr));
              gap: 12px; margin-bottom: 24px; }}
  .card {{ background: #111827; border: 1px solid #1f2937; padding: 14px 16px;
           border-radius: 10px; }}
  .card .k {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }}
  .card .v {{ font-size: 22px; margin-top: 4px; font-weight: 600; }}
  .card.ok .v {{ color: #34d399; }}
  .card.err .v {{ color: #f87171; }}
  .engines {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
              gap: 14px; margin-bottom: 28px; }}
  .engine-card {{ background: #111827; border: 1px solid #1f2937; border-radius: 12px;
                  padding: 16px; }}
  .engine-card.passed {{ border-color: #14532d; }}
  .engine-card.failed {{ border-color: #7f1d1d; }}
  .engine-card.missing {{ border-color: #422006; opacity: .8; }}
  .engine-head {{ display: flex; justify-content: space-between; align-items: center;
                  margin-bottom: 12px; }}
  .engine-head h3 {{ margin: 0; text-transform: capitalize; font-size: 16px; }}
  .mini-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }}
  .mini-grid .k {{ color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }}
  .mini-grid .v {{ font-size: 16px; font-weight: 600; margin-top: 2px; }}
  .mini-grid .v.ok {{ color: #34d399; }}
  .mini-grid .v.err {{ color: #f87171; }}
  .actions {{ margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }}
  .pill {{ display: inline-block; padding: 4px 10px; border-radius: 999px;
           background: #1e293b; color: #93c5fd; font-size: 12px; text-decoration: none; }}
  .pill.link:hover {{ background: #334155; }}
  .pill.ok {{ background: #052e1a; color: #4ade80; }}
  .pill.err {{ background: #3f0d0d; color: #fca5a5; }}
  .pill.warn {{ background: #3a2d0a; color: #fbbf24; }}
  .tabs {{ display: flex; gap: 4px; border-bottom: 1px solid #1e293b; margin-bottom: 0; }}
  .tab {{ background: transparent; color: #94a3b8; border: none;
          padding: 10px 16px; cursor: pointer; font-size: 14px;
          border-bottom: 2px solid transparent; text-transform: capitalize; }}
  .tab:hover:not(:disabled) {{ color: #e2e8f0; }}
  .tab.active {{ color: #e2e8f0; border-bottom-color: #38bdf8; }}
  .tab:disabled {{ opacity: .4; cursor: not-allowed; }}
  .frame-wrap {{ background: #111827; border: 1px solid #1f2937; border-top: none;
                 border-radius: 0 0 10px 10px; height: 78vh; }}
  .pane {{ display: none; width: 100%; height: 100%; border: none; background: #0f172a; }}
  .pane.active {{ display: block; }}
  .muted {{ color: #64748b; font-size: 12px; }}
  h2 {{ font-size: 16px; margin: 24px 0 12px; color: #cbd5e1; }}
</style></head><body>
<header>
  <h1>E2E consolidated report — cover-shortcuts</h1>
  <div class="sub">Chromium · Firefox · WebKit &middot; Generated {now}</div>
</header>
<main>
  <div class="summary">
    <div class="card"><div class="k">Overall</div><div class="v">{overall.upper()}</div></div>
    <div class="card ok"><div class="k">Passed</div><div class="v">{totals_passed}</div></div>
    <div class="card err"><div class="k">Failed</div><div class="v">{totals_failed}</div></div>
    <div class="card"><div class="k">Total</div><div class="v">{totals_total}</div></div>
    <div class="card"><div class="k">Duration</div><div class="v">{totals_duration} ms</div></div>
  </div>

  <h2>Per-engine summary</h2>
  <div class="engines">{''.join(engine_cards)}</div>

  <h2>Full reports</h2>
  <div class="tabs">{''.join(tabs)}</div>
  <div class="frame-wrap">{''.join(panes) or '<p class="muted" style="padding:16px">No per-engine reports were found.</p>'}</div>
</main>
<script>
  const tabs = document.querySelectorAll('.tab:not(:disabled)');
  const panes = document.querySelectorAll('.pane');
  tabs.forEach(tab => tab.addEventListener('click', () => {{
    const engine = tab.dataset.engine;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    panes.forEach(p => p.classList.toggle('active', p.dataset.engine === engine));
  }}));
</script>
</body></html>"""
    out_path.write_text(html, encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Directory containing downloaded report artifacts")
    ap.add_argument("--output", required=True, help="Output directory for the aggregated index")
    args = ap.parse_args()

    input_dir = Path(args.input).resolve()
    output_dir = Path(args.output).resolve()
    reports_dir = output_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    summaries: dict[str, dict | None] = {}
    for engine in ENGINES:
        found = find_summary(input_dir, engine)
        if not found:
            print(f"[warn] no report found for {engine}")
            summaries[engine] = None
            continue
        html_path, json_path = found
        shutil.copy2(html_path, reports_dir / f"report-{engine}.html")
        if json_path and json_path.exists():
            shutil.copy2(json_path, reports_dir / f"report-{engine}.json")
        summaries[engine] = load_summary(json_path, engine)
        print(f"[ok] {engine}: {summaries[engine]['overall']} "
              f"({summaries[engine]['passed']}/{summaries[engine]['total']})")

    index_path = output_dir / "index.html"
    render_index(summaries, index_path)
    print(f"index written: {index_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
