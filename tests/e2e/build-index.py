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


def _render_failed_table(summaries: dict[str, dict | None]) -> str:
    rows = []
    for engine in ENGINES:
        s = summaries.get(engine)
        if not s:
            continue
        trace_href = s.get("trace_href")
        video_href = s.get("video_href")
        for sc in s.get("scenarios", []):
            if sc.get("status") != "failed":
                continue
            name = _html.escape(sc.get("name", "(unnamed)"))
            dur = sc.get("duration_ms", 0)
            links = []
            if trace_href:
                links.append(f'<a class="inline-link trace" href="{trace_href}" download title="Download trace.zip">trace</a>')
            if video_href:
                links.append(f'<a class="inline-link video" href="{video_href}" download title="Download video.webm">video</a>')
            links_html = f' <span class="inline-links">{" ".join(links)}</span>' if links else ""
            rows.append(
                f'<tr data-engine="{engine}" data-name="{name.lower()}" data-duration="{dur}"'
                f' data-trace="{"1" if trace_href else "0"}" data-video="{"1" if video_href else "0"}"'
                f' data-trace-href="{trace_href or ""}" data-video-href="{video_href or ""}">'
                f'<td class="eng">{engine}</td>'
                f'<td class="sc"><span class="scn">{name}</span>{links_html}</td>'
                f'<td class="dur">{dur} ms</td></tr>'
            )
    if not rows:
        return ""
    engines_with_failures = [
        e for e in ENGINES
        if any(sc.get("status") == "failed" for sc in (summaries.get(e) or {}).get("scenarios", []))
    ]
    engine_options = "".join(f'<option value="{e}">{e}</option>' for e in engines_with_failures)
    return f"""
  <h2>Failed scenarios</h2>
  <div class="failed-table-wrap">
    <div class="failed-toolbar">
      <input type="search" id="failedSearch" class="failed-input"
             placeholder="Search scenario name…" autocomplete="off" spellcheck="false">
      <select id="failedEngine" class="failed-select" aria-label="Filter by engine">
        <option value="">All engines</option>{engine_options}
      </select>
      <select id="failedAssets" class="failed-select" aria-label="Filter by assets">
        <option value="">All assets</option>
        <option value="any">With trace or video</option>
        <option value="trace">With trace</option>
        <option value="video">With video</option>
        <option value="both">With trace and video</option>
        <option value="none">Without assets</option>
      </select>
      <span class="failed-count muted" id="failedCount"></span>
      <button type="button" id="failedExport" class="failed-clear failed-export" title="Export filtered failures to CSV">Export CSV ↓</button>
      <button type="button" id="failedClear" class="failed-clear" title="Clear filters">Clear</button>
    </div>
    <table class="failed-table">
      <thead><tr><th>Engine</th><th>Scenario</th>
        <th id="failedSortDur" class="sortable" role="button" tabindex="0"
            aria-sort="none" title="Sort by duration">Duration <span class="sort-arrow">⇅</span></th></tr></thead>
      <tbody id="failedTbody">{''.join(rows)}</tbody>
      <tfoot><tr id="failedEmpty" style="display:none"><td colspan="3" class="muted"
        style="text-align:center;padding:18px">No failures match the current filters.</td></tr></tfoot>
    </table>
    <p class="muted">Trace/video assets are recorded per engine run and shared across its failed scenarios.</p>
  </div>"""


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

    def asset_link(label: str, href: str | None, kind: str) -> str:
        if not href:
            return f'<span class="pill warn" title="not available">{label} —</span>'
        return f'<a class="pill link {kind}" href="{href}" download>{label} ↓</a>'

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
        trace_href = s.get("trace_href")
        video_href = s.get("video_href")

        failed_scenarios = [sc for sc in s.get("scenarios", []) if sc.get("status") == "failed"]
        if failed_scenarios:
            failed_rows = "".join(
                f'<li><span class="scname">{_html.escape(sc["name"])}</span>'
                f'<span class="scassets">{asset_link("trace.zip", trace_href, "trace")}'
                f'{asset_link("video.webm", video_href, "video")}</span></li>'
                for sc in failed_scenarios
            )
            failed_block = f"""
        <div class="failed-list">
          <div class="k">Failed scenarios &middot; downloads</div>
          <ul>{failed_rows}</ul>
          <p class="muted">Note: trace/video are recorded per engine run and shared across its failed scenarios.</p>
        </div>"""
        else:
            failed_block = ""

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
          {asset_link("trace.zip", trace_href, "trace")}
          {asset_link("video.webm", video_href, "video")}
        </div>{failed_block}
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
  .pill.trace {{ background: #1e1b4b; color: #c4b5fd; }}
  .pill.trace:hover {{ background: #312e81; }}
  .pill.video {{ background: #134e4a; color: #5eead4; }}
  .pill.video:hover {{ background: #115e59; }}
  .failed-list {{ margin-top: 14px; padding-top: 12px; border-top: 1px dashed #1f2937; }}
  .failed-list .k {{ color: #94a3b8; font-size: 11px; text-transform: uppercase;
                     letter-spacing: .05em; margin-bottom: 8px; }}
  .failed-list ul {{ list-style: none; padding: 0; margin: 0 0 8px; }}
  .failed-list li {{ display: flex; justify-content: space-between; align-items: center;
                     gap: 8px; padding: 6px 0; border-bottom: 1px solid #111827; }}
  .failed-list li:last-child {{ border-bottom: none; }}
  .scname {{ color: #f87171; font-size: 13px; font-weight: 500; }}
  .scassets {{ display: flex; gap: 6px; flex-wrap: wrap; }}
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
  .failed-table-wrap {{ background: #111827; border: 1px solid #1f2937; border-radius: 10px;
                        padding: 4px 4px 12px; }}
  .failed-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  .failed-table th, .failed-table td {{ padding: 10px 14px; text-align: left;
                                        border-bottom: 1px solid #1f2937; }}
  .failed-table th {{ color: #94a3b8; font-weight: 500; font-size: 11px;
                      text-transform: uppercase; letter-spacing: .05em; }}
  .failed-table tbody tr:last-child td {{ border-bottom: none; }}
  .failed-table td.eng {{ text-transform: capitalize; color: #cbd5e1; width: 120px; }}
  .failed-table td.dur {{ color: #94a3b8; width: 100px; }}
  .failed-table .scn {{ color: #f87171; font-weight: 500; }}
  .inline-links {{ margin-left: 10px; display: inline-flex; gap: 6px; }}
  .inline-link {{ display: inline-block; padding: 2px 8px; border-radius: 999px;
                  font-size: 11px; text-decoration: none; font-weight: 500; }}
  .inline-link.trace {{ background: #1e1b4b; color: #c4b5fd; }}
  .inline-link.trace:hover {{ background: #312e81; }}
  .inline-link.video {{ background: #134e4a; color: #5eead4; }}
  .inline-link.video:hover {{ background: #115e59; }}
  .failed-table-wrap + p.muted {{ padding: 0 14px; }}
  .failed-toolbar {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
                     padding: 10px 12px; border-bottom: 1px solid #1f2937; }}
  .failed-input, .failed-select {{ background: #0b1120; border: 1px solid #1f2937;
                                    color: #e2e8f0; border-radius: 8px; padding: 6px 10px;
                                    font-size: 13px; outline: none; }}
  .failed-input {{ flex: 1; min-width: 200px; }}
  .failed-input::placeholder {{ color: #475569; }}
  .failed-input:focus, .failed-select:focus {{ border-color: #38bdf8; }}
  .failed-select {{ text-transform: capitalize; cursor: pointer; }}
  .failed-count {{ font-size: 12px; margin-left: auto; }}
  .failed-clear {{ background: #1e293b; border: none; color: #cbd5e1; padding: 6px 12px;
                   border-radius: 8px; font-size: 12px; cursor: pointer; }}
  .failed-clear:hover {{ background: #334155; }}
  .failed-table tr.hidden {{ display: none; }}
  mark.hl {{ background: #fbbf24; color: #0b1120; padding: 0 2px; border-radius: 2px; }}
  th.sortable {{ cursor: pointer; user-select: none; }}
  th.sortable:hover {{ color: #e2e8f0; }}
  th.sortable:focus {{ outline: 2px solid #38bdf8; outline-offset: -2px; }}
  th.sortable .sort-arrow {{ color: #475569; font-size: 11px; margin-left: 4px; }}
  th.sortable[aria-sort="ascending"] .sort-arrow,
  th.sortable[aria-sort="descending"] .sort-arrow {{ color: #38bdf8; }}

  /* Asset modal */
  .modal-backdrop {{ position: fixed; inset: 0; background: rgba(2, 6, 23, .82);
                     backdrop-filter: blur(6px); display: none; align-items: center;
                     justify-content: center; z-index: 9999; padding: 24px; }}
  .modal-backdrop.open {{ display: flex; }}
  .modal {{ background: #0f172a; border: 1px solid #1f2937; border-radius: 14px;
            width: min(1200px, 100%); height: min(85vh, 900px); display: flex;
            flex-direction: column; overflow: hidden;
            box-shadow: 0 30px 80px rgba(0,0,0,.6); }}
  .modal-head {{ display: flex; justify-content: space-between; align-items: center;
                 padding: 14px 18px; border-bottom: 1px solid #1e293b; gap: 12px; }}
  .modal-title {{ font-size: 14px; font-weight: 600; color: #e2e8f0;
                  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }}
  .modal-title .badge {{ font-size: 10px; padding: 2px 8px; border-radius: 999px;
                         text-transform: uppercase; letter-spacing: .05em;
                         background: #1e293b; color: #94a3b8; }}
  .modal-title .badge.trace {{ background: #1e1b4b; color: #c4b5fd; }}
  .modal-title .badge.video {{ background: #134e4a; color: #5eead4; }}
  .modal-actions {{ display: flex; gap: 8px; align-items: center; }}
  .modal-close {{ background: transparent; color: #94a3b8; border: 1px solid #1f2937;
                  border-radius: 8px; width: 32px; height: 32px; cursor: pointer;
                  font-size: 18px; line-height: 1; }}
  .modal-close:hover {{ color: #e2e8f0; background: #1e293b; }}
  .modal-body {{ flex: 1; overflow: hidden; background: #020617;
                 display: flex; align-items: center; justify-content: center; }}
  .modal-body iframe {{ width: 100%; height: 100%; border: none; background: #020617; }}
  .modal-body video {{ max-width: 100%; max-height: 100%; background: #000; }}
  .modal-hint {{ padding: 10px 18px; background: #0b1120; border-top: 1px solid #1e293b;
                 color: #64748b; font-size: 11px; }}
  .modal-hint code {{ background: #1e293b; color: #cbd5e1; padding: 1px 6px;
                      border-radius: 4px; font-size: 10px; }}

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

  {_render_failed_table(summaries)}

  <h2>Full reports</h2>
  <div class="tabs">{''.join(tabs)}</div>
  <div class="frame-wrap">{''.join(panes) or '<p class="muted" style="padding:16px">No per-engine reports were found.</p>'}</div>
</main>

<div class="modal-backdrop" id="assetModal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="modal">
    <div class="modal-head">
      <div class="modal-title">
        <span id="assetModalTitle">Asset</span>
        <span class="badge" id="assetModalBadge">asset</span>
      </div>
      <div class="modal-actions">
        <a class="pill link" id="assetModalDownload" href="#" download>Download ↓</a>
        <a class="pill link" id="assetModalOpen" href="#" target="_blank" rel="noopener">Open in new tab ↗</a>
        <button class="modal-close" id="assetModalClose" aria-label="Close">×</button>
      </div>
    </div>
    <div class="modal-body" id="assetModalBody"></div>
    <div class="modal-hint" id="assetModalHint"></div>
  </div>
</div>

<script>
  const tabs = document.querySelectorAll('.tab:not(:disabled)');
  const panes = document.querySelectorAll('.pane');
  tabs.forEach(tab => tab.addEventListener('click', () => {{
    const engine = tab.dataset.engine;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    panes.forEach(p => p.classList.toggle('active', p.dataset.engine === engine));
  }}));

  // Asset modal: intercept trace/video pill clicks and preview inline.
  const modal = document.getElementById('assetModal');
  const modalTitle = document.getElementById('assetModalTitle');
  const modalBadge = document.getElementById('assetModalBadge');
  const modalBody = document.getElementById('assetModalBody');
  const modalHint = document.getElementById('assetModalHint');
  const modalDownload = document.getElementById('assetModalDownload');
  const modalOpen = document.getElementById('assetModalOpen');
  const modalClose = document.getElementById('assetModalClose');

  function openAsset(kind, href, label) {{
    const absolute = new URL(href, window.location.href).href;
    modalTitle.textContent = label || (kind === 'trace' ? 'Trace' : 'Video');
    modalBadge.textContent = kind;
    modalBadge.className = 'badge ' + kind;
    modalDownload.href = href;
    modalDownload.setAttribute('download', '');
    modalOpen.href = href;
    modalBody.innerHTML = '';
    if (kind === 'video') {{
      const v = document.createElement('video');
      v.src = href; v.controls = true; v.autoplay = true; v.playsInline = true;
      modalBody.appendChild(v);
      modalHint.innerHTML = 'Playback served directly from the report artifacts.';
    }} else {{
      // Trace viewer requires an https URL reachable by trace.playwright.dev.
      const isHttp = /^https?:/i.test(absolute);
      if (isHttp) {{
        const iframe = document.createElement('iframe');
        iframe.src = 'https://trace.playwright.dev/?trace=' + encodeURIComponent(absolute);
        iframe.allow = 'clipboard-read; clipboard-write';
        modalBody.appendChild(iframe);
        modalHint.innerHTML = 'Powered by <code>trace.playwright.dev</code> — trace loaded from <code>' + absolute + '</code>.';
      }} else {{
        modalBody.innerHTML = '<div style="padding:24px;color:#94a3b8;max-width:520px;text-align:center">' +
          'Trace viewer requires an <code style="background:#1e293b;padding:1px 6px;border-radius:4px">http(s)</code> URL. ' +
          'This page is served from <code style="background:#1e293b;padding:1px 6px;border-radius:4px">' + window.location.protocol + '</code>, so use <b>Download</b> and open with:<br><br>' +
          '<code style="background:#1e293b;padding:6px 10px;border-radius:6px;display:inline-block">playwright show-trace ' + href.split('/').pop() + '</code></div>';
        modalHint.innerHTML = 'Publish this report over http(s) to preview traces inline.';
      }}
    }}
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }}

  function closeModal() {{
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
    document.body.style.overflow = '';
  }}

  document.addEventListener('click', (e) => {{
    const el = e.target.closest('a.pill.trace, a.pill.video, a.inline-link.trace, a.inline-link.video');
    if (!el) return;
    const kind = el.classList.contains('trace') ? 'trace' : 'video';
    e.preventDefault();
    const label = el.getAttribute('title') || el.textContent.trim();
    openAsset(kind, el.getAttribute('href'), label);
  }});

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {{ if (e.target === modal) closeModal(); }});
  document.addEventListener('keydown', (e) => {{
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    if (e.key === '/' && !modal.classList.contains('open')) {{
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      const s = document.getElementById('failedSearch');
      if (s) {{ e.preventDefault(); s.focus(); s.select(); }}
    }}
  }});

  // Failed scenarios filters
  const fSearch = document.getElementById('failedSearch');
  const fEngine = document.getElementById('failedEngine');
  const fAssets = document.getElementById('failedAssets');
  const fClear = document.getElementById('failedClear');
  const fCount = document.getElementById('failedCount');
  const fEmpty = document.getElementById('failedEmpty');
  const fBody = document.getElementById('failedTbody');
  if (fBody) {{
    const rows = Array.from(fBody.querySelectorAll('tr'));
    const originalHtml = new Map(rows.map(r => {{
      const scn = r.querySelector('.scn');
      return [r, scn ? scn.textContent : ''];
    }}));
    const totalRows = rows.length;

    function escapeRe(s) {{ return s.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&'); }}
    function assetMatch(r, mode) {{
      const hasT = r.dataset.trace === '1';
      const hasV = r.dataset.video === '1';
      switch (mode) {{
        case '':      return true;
        case 'any':   return hasT || hasV;
        case 'trace': return hasT;
        case 'video': return hasV;
        case 'both':  return hasT && hasV;
        case 'none':  return !hasT && !hasV;
        default:      return true;
      }}
    }}
    function applyFilters() {{
      const q = (fSearch.value || '').trim().toLowerCase();
      const eng = fEngine.value || '';
      const assets = fAssets.value || '';
      let visible = 0;
      const re = q ? new RegExp('(' + escapeRe(q) + ')', 'ig') : null;
      rows.forEach(r => {{
        const name = r.dataset.name || '';
        const engine = r.dataset.engine || '';
        const match = (!eng || engine === eng)
          && (!q || name.includes(q))
          && assetMatch(r, assets);
        r.classList.toggle('hidden', !match);
        const scn = r.querySelector('.scn');
        if (scn) {{
          const original = originalHtml.get(r) || '';
          scn.innerHTML = match && re
            ? original.replace(re, '<mark class="hl">$1</mark>')
            : original;
        }}
        if (match) visible++;
      }});
      fCount.textContent = visible + ' of ' + totalRows + ' failure' + (totalRows === 1 ? '' : 's');
      fEmpty.style.display = visible === 0 ? '' : 'none';
    }}
    fSearch.addEventListener('input', applyFilters);
    fEngine.addEventListener('change', applyFilters);
    fAssets.addEventListener('change', applyFilters);
    fClear.addEventListener('click', () => {{
      fSearch.value = ''; fEngine.value = ''; fAssets.value = '';
      applyFilters(); fSearch.focus();
    }});
    applyFilters();

    // Sort by duration
    const sortDur = document.getElementById('failedSortDur');
    let sortDir = null; // null | 'asc' | 'desc'
    function applySort() {{
      if (!sortDir) {{
        sortDur.setAttribute('aria-sort', 'none');
        rows.forEach(r => fBody.appendChild(r)); // restore original DOM order
        return;
      }}
      sortDur.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
      const sorted = rows.slice().sort((a, b) => {{
        const da = parseInt(a.dataset.duration || '0', 10);
        const db = parseInt(b.dataset.duration || '0', 10);
        return sortDir === 'asc' ? da - db : db - da;
      }});
      sorted.forEach(r => fBody.appendChild(r));
    }}
    function cycleSort() {{
      sortDir = sortDir === null ? 'desc' : sortDir === 'desc' ? 'asc' : null;
      applySort();
    }}
    sortDur.addEventListener('click', cycleSort);
    sortDur.addEventListener('keydown', (e) => {{
      if (e.key === 'Enter' || e.key === ' ') {{ e.preventDefault(); cycleSort(); }}
    }});
  }}
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
        summary = load_summary(json_path, engine)

        # Copy trace/video assets if the artifact ships them alongside the report.
        search_root = html_path.parent
        for asset_key, filename in (("trace_href", f"trace-{engine}.zip"),
                                    ("video_href", f"video-{engine}.webm")):
            candidates = list(search_root.rglob(filename))
            if candidates:
                shutil.copy2(candidates[0], reports_dir / filename)
                summary[asset_key] = f"reports/{filename}"
            else:
                summary[asset_key] = None

        summaries[engine] = summary
        print(f"[ok] {engine}: {summary['overall']} ({summary['passed']}/{summary['total']}) "
              f"trace={'yes' if summary.get('trace_href') else 'no'} "
              f"video={'yes' if summary.get('video_href') else 'no'}")

    index_path = output_dir / "index.html"
    render_index(summaries, index_path)
    print(f"index written: {index_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
