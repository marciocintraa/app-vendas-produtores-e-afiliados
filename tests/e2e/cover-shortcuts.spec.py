"""E2E tests for keyboard shortcuts in the cover-swap modal.

Covers:
- Enter is blocked while the selected cover is INVALID (shows toast, no final confirm).
- Enter opens the final-confirm step when the selected cover is VALID.
- Ctrl+Z restores the original cover after selecting another one.
- Ctrl+Z shows a "nothing to undo" toast when already on the original cover.
- Shortcuts DO NOT fire when the modal is closed (before opening / after canceling).
- Shortcuts DO NOT fire while the final-confirm step is open.

Prereqs: the Vite dev server must be running at http://localhost:8080.
Run: `python3 tests/e2e/cover-shortcuts.spec.py`
"""

import asyncio
import base64
import io
import json
import os
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeoutError

BASE_URL = "http://localhost:8080"
STORAGE_KEY = "dsp:catalog:v1"
SCREENSHOTS = Path("/tmp/browser/cover-shortcuts")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)


def png_data_url(color: tuple[int, int, int], size: int = 220) -> str:
    """Return a data-URL for a solid PNG (≥ MIN_DIM=200)."""
    img = Image.new("RGB", (size, size), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def invalid_svg_data_url() -> str:
    """SVG mime is NOT in ALLOWED_MIME → validation fails immediately."""
    svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><rect width='10' height='10' fill='red'/></svg>"
    from urllib.parse import quote
    return f"data:image/svg+xml;utf8,{quote(svg)}"


COVER_A = png_data_url((124, 58, 237))     # valid, will be initial cover
COVER_B = png_data_url((34, 211, 238))     # valid, alternate gallery image
COVER_BAD = invalid_svg_data_url()         # invalid (svg mime)


PRODUCT = {
    "id": "e2e-shortcut-test",
    "title": "E2E Shortcut Test",
    "tagline": "Fixture for keyboard shortcut tests",
    "description": "Seeded product used by cover-shortcuts.spec.py.",
    "price": 197,
    "originalPrice": 297,
    "category": "Marketing Digital",
    "platform": "Hotmart",
    "rating": 5,
    "reviews": 10,
    "affiliateUrl": "https://example.com",
    "cover": COVER_A,
    "gallery": [COVER_A, COVER_B, COVER_BAD],
    "highlights": ["item"],
    "modules": [{"title": "m1", "lessons": 1}],
    "published": True,
}


class TestFailure(Exception):
    pass


def check(condition: bool, message: str) -> None:
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {message}")
    if not condition:
        raise TestFailure(message)


async def install_toast_capture(page: Page) -> None:
    """Buffer sonner toasts on window so tests can assert on their text."""
    await page.evaluate(
        """() => {
          window.__toasts = [];
          const push = (m) => { if (m) window.__toasts.push(String(m)); };
          const scan = () => {
            document.querySelectorAll('[data-sonner-toast]').forEach((el) => {
              if (!el.__seen) { el.__seen = true; push(el.textContent || ''); }
            });
          };
          const mo = new MutationObserver(scan);
          mo.observe(document.body, { childList: true, subtree: true, characterData: true });
          scan();
        }"""
    )



async def recent_toasts(page: Page) -> list[str]:
    return await page.evaluate("() => (window.__toasts || []).slice(-8)")


async def clear_toasts(page: Page) -> None:
    await page.evaluate("() => { window.__toasts = []; }")


async def open_modal(page: Page) -> None:
    """Open the product editor, then the cover-swap modal via the cover 'Remover' button."""
    # Open editor
    await page.get_by_role("button", name="Editar").first.click()
    await page.wait_for_selector("text=Imagem de capa", timeout=5000)
    # Trigger the cover-swap modal (the cover-section 'Remover' button; gallery
    # variants use the aria-label 'Remover imagem' and are excluded by exact=True).
    await page.get_by_role("button", name="Remover", exact=True).first.click()
    await page.wait_for_selector("text=Trocar capa principal?", timeout=5000)


async def modal_is_open(page: Page) -> bool:
    return await page.locator("text=Trocar capa principal?").count() > 0


async def final_modal_is_open(page: Page) -> bool:
    return await page.locator("text=Confirmação final da troca de capa").count() > 0


async def close_final_confirm(page: Page) -> None:
    if await final_modal_is_open(page):
        # The final-confirm modal footer's Cancelar button
        loc = page.locator("div.z-\\[90\\] button:has-text('Cancelar')").first
        if await loc.count() > 0:
            await loc.click()
            await page.wait_for_timeout(150)


async def close_confirm_modal(page: Page) -> None:
    await close_final_confirm(page)
    if await modal_is_open(page):
        # First-level modal Cancelar (avoid final-confirm scope)
        loc = page.locator("div.z-\\[60\\] button:has-text('Cancelar')").first
        if await loc.count() == 0:
            loc = page.get_by_role("button", name="Cancelar").first
        await loc.click()
        await page.wait_for_timeout(150)


async def close_editor(page: Page) -> None:
    await close_confirm_modal(page)
    fechar = page.get_by_role("button", name="Fechar").first
    if await fechar.count() > 0 and await fechar.is_visible():
        try:
            await fechar.click(timeout=1500)
            await page.wait_for_timeout(150)
        except Exception:
            pass


async def validation_status(page: Page) -> str:
    """Read the confirm button's disabled attribute as a proxy for validation state."""
    btn = page.get_by_role("button", name="Sim, trocar capa")
    if await btn.count() == 0:

        return "missing"
    disabled = await btn.first.is_disabled()
    return "disabled" if disabled else "enabled"


async def wait_for_validation(page: Page, expect: str, timeout_ms: int = 8000) -> None:
    """Poll until the confirm button matches expected state (`enabled` or `disabled`)."""
    deadline = asyncio.get_event_loop().time() + timeout_ms / 1000
    last = ""
    while asyncio.get_event_loop().time() < deadline:
        last = await validation_status(page)
        if last == expect:
            return
        await asyncio.sleep(0.15)
    raise TestFailure(f"Timed out waiting for validation={expect}, last={last}")


async def select_candidate(page: Page, data_url: str) -> None:
    """Click a gallery candidate button inside the modal by its <img src>."""
    btn = page.locator(f"div.z-\\[60\\] button:has(img[src='{data_url}'])").first
    await btn.scroll_into_view_if_needed()
    await btn.click()



async def press(page: Page, key: str) -> None:
    # Blur any focused actionable element so the global keydown handler runs
    # (isActionTarget short-circuits the handler when a button/link owns focus).
    await page.evaluate(
        "() => { const a = document.activeElement; if (a && typeof a.blur === 'function') a.blur(); }"
    )
    await page.keyboard.press(key)



async def scenario_shortcuts_ignored_before_modal(page: Page) -> None:
    print("• Scenario: shortcuts do nothing when the modal is not open")
    await clear_toasts(page)
    await press(page, "Enter")
    await press(page, "Control+z")
    await asyncio.sleep(0.2)
    toasts = await recent_toasts(page)
    check(not any("desfazer" in t.lower() for t in toasts),
          "no undo toast fires before the modal opens")
    check(not await final_modal_is_open(page),
          "Enter does not open the final-confirm step before modal opens")


async def scenario_invalid_then_valid(page: Page) -> None:
    print("• Scenario: invalid selection blocks Enter; valid selection allows it")
    await open_modal(page)
    # selectedNext defaults to candidates[0] = COVER_B (valid). Force invalid first.
    await select_candidate(page, COVER_BAD)
    await wait_for_validation(page, "disabled")
    check(await modal_is_open(page), "modal remains open on invalid selection")

    await clear_toasts(page)
    await press(page, "Enter")
    # Poll for either the final-confirm to open (unexpected) or a toast to render.
    for _ in range(30):
        await asyncio.sleep(0.1)
        if await final_modal_is_open(page):
            break
        toasts_now = await recent_toasts(page)
        if any("valida" in t.lower() or "aguarde" in t.lower() for t in toasts_now):
            break
    check(not await final_modal_is_open(page),
          "Enter is blocked while cover is invalid (no final-confirm step)")
    toasts = await recent_toasts(page)
    check(any("aguarde" in t.lower() or "valida" in t.lower() for t in toasts),
          "an error/warning toast is shown when Enter fires on invalid cover")


    # Now switch to a valid candidate.
    await select_candidate(page, COVER_B)
    await wait_for_validation(page, "enabled")
    await clear_toasts(page)
    await press(page, "Enter")
    await page.wait_for_selector("text=Confirmação final da troca de capa",
                                 timeout=4000)
    check(await final_modal_is_open(page),
          "Enter opens final-confirm step when cover is valid")

    await close_editor(page)



async def scenario_ctrl_z_restores_original(page: Page) -> None:
    print("• Scenario: Ctrl+Z restores the original cover after selecting another one")
    await open_modal(page)
    # candidates default is [COVER_B, COVER_BAD]; selectedNext = COVER_B.
    await select_candidate(page, COVER_BAD)  # push history
    await wait_for_validation(page, "disabled")
    await clear_toasts(page)
    await press(page, "Control+z")
    await asyncio.sleep(0.4)
    # After undo, selectedNext should be the ORIGINAL cover (COVER_A).
    # editing.cover is COVER_A, so undoCoverSelection sets selectedNext=COVER_A.
    await wait_for_validation(page, "enabled")
    toasts = await recent_toasts(page)
    check(any("capa atual restaurada" in t.lower() for t in toasts),
          "toast confirms 'Capa atual restaurada'")

    # Second Ctrl+Z: nothing to undo (already on current cover)
    await clear_toasts(page)
    await press(page, "Control+z")
    await asyncio.sleep(0.3)
    toasts = await recent_toasts(page)
    check(
        any("nada para desfazer" in t.lower() or "já está na capa atual" in t.lower()
            for t in toasts),
        "second Ctrl+Z surfaces a 'nothing to undo' / 'already current' toast",
    )

    # Cleanup
    await close_editor(page)



async def scenario_shortcuts_disabled_during_final_confirm(page: Page) -> None:
    print("• Scenario: shortcuts do not fire while the final-confirm step is open")
    await open_modal(page)
    await select_candidate(page, COVER_B)
    await wait_for_validation(page, "enabled")
    await asyncio.sleep(0.2)
    await press(page, "Enter")
    try:
        await page.wait_for_selector("text=Confirmação final da troca de capa", timeout=4000)
    except Exception:
        dump = await page.evaluate("() => ({ toasts: window.__toasts || [], hasFinal: !!document.querySelector('text') })")
        print("DEBUG scenario4:", dump)
        raise
    check(await final_modal_is_open(page), "final-confirm step is open")


    await clear_toasts(page)
    # Ctrl+Z should NOT emit any undo toast while final-confirm is up.
    await press(page, "Control+z")
    await asyncio.sleep(0.3)
    toasts = await recent_toasts(page)
    check(not any("desfazer" in t.lower() or "capa atual restaurada" in t.lower()
                  for t in toasts),
          "Ctrl+Z is inert while final-confirm is open")

    # Cleanup: close final step, main modal, and editor.
    await close_editor(page)



async def scenario_shortcuts_after_close(page: Page) -> None:
    print("• Scenario: after closing the modal, shortcuts no longer fire")
    await clear_toasts(page)
    await press(page, "Enter")
    await press(page, "Control+z")
    await asyncio.sleep(0.3)
    toasts = await recent_toasts(page)
    check(not any("capa atual restaurada" in t.lower() or "nada para desfazer" in t.lower()
                  for t in toasts),
          "no undo toast fires after the modal was closed")
    check(not await final_modal_is_open(page),
          "no final-confirm step opens after the modal was closed")


async def main() -> int:
    browser_name = os.environ.get("PLAYWRIGHT_BROWSER", "chromium").lower()
    if browser_name not in {"chromium", "firefox", "webkit"}:
        print(f"Unknown PLAYWRIGHT_BROWSER={browser_name!r}; falling back to chromium")
        browser_name = "chromium"
    print(f"Running suite on {browser_name}")
    async with async_playwright() as pw:
        browser_type = getattr(pw, browser_name)
        browser = await browser_type.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})

        trace_enabled = os.environ.get("PLAYWRIGHT_TRACE", "1") != "0"
        trace_path = SCREENSHOTS / f"trace-{browser_name}.zip"
        if trace_enabled:
            await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        page = await context.new_page()

        # Seed localStorage then navigate.
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.evaluate(
            "(payload) => window.localStorage.setItem(payload.key, payload.value)",
            {"key": STORAGE_KEY, "value": json.dumps([PRODUCT])},
        )
        await page.goto(f"{BASE_URL}/painel/produtos", wait_until="domcontentloaded")
        await page.wait_for_selector("text=E2E Shortcut Test", timeout=8000)
        await install_toast_capture(page)

        failures: list[str] = []
        scenarios = [
            scenario_shortcuts_ignored_before_modal,
            scenario_invalid_then_valid,
            scenario_ctrl_z_restores_original,
            scenario_shortcuts_disabled_during_final_confirm,
            scenario_shortcuts_after_close,
        ]
        for i, sc in enumerate(scenarios, 1):
            try:
                await sc(page)
            except (TestFailure, PWTimeoutError, AssertionError) as exc:
                failures.append(f"{sc.__name__}: {exc}")
                try:
                    await page.screenshot(path=str(SCREENSHOTS / f"fail_{i}_{sc.__name__}.png"))
                except Exception:
                    pass
            # Nuclear reset between scenarios: reload page to guaranteed clean state.
            if i < len(scenarios):
                await page.goto(f"{BASE_URL}/painel/produtos", wait_until="domcontentloaded")
                await page.wait_for_selector("text=E2E Shortcut Test", timeout=8000)
                await install_toast_capture(page)

        if trace_enabled:
            # Only persist the trace when something failed — keeps CI artifacts small.
            if failures:
                await context.tracing.stop(path=str(trace_path))
                print(f"trace saved: {trace_path}")
            else:
                await context.tracing.stop()

        await context.close()
        await browser.close()

        print("")
        if failures:
            print(f"✖ {len(failures)} scenario(s) failed:")
            for f in failures:
                print(f"  - {f}")
            return 1
        print(f"✔ All {len(scenarios)} scenarios passed.")
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
