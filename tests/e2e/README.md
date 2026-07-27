# E2E tests

Playwright (Python) end-to-end tests. The Vite dev server must already be running at `http://localhost:8080`.

## Run

```bash
python3 tests/e2e/cover-shortcuts.spec.py
```

Exits with `0` when every scenario passes, `1` otherwise. On failure a screenshot is written to `/tmp/browser/cover-shortcuts/`.

## Suites

- **`cover-shortcuts.spec.py`** — keyboard shortcuts (Enter, Ctrl+Z) in the cover-swap modal on `/painel/produtos`. Seeds a fixture product into `localStorage` under the key `dsp:catalog:v1` and exercises: modal closed, invalid selection, valid selection, post-undo, and final-confirm-open states.
