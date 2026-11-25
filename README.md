# REVIEWER NI ASHH

Local study application. Install Python 3.10 or newer, then run:

```
python -m pip install -r requirements.txt
python server.py
```

Open http://127.0.0.1:8000. The supplied PDFs in the project folder are imported by module number. Files with little extractable text are flagged for manual correction. Text extraction cannot read image-only content; review the extracted text before studying. The website uses these existing lessons and does not display an upload page.

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as environment variables before launching to enable AI generation. For example, in PowerShell, use `$env:OPENAI_API_KEY = 'your-full-key'` in the same terminal before starting the server. The `.env.example` file documents the variable names; it is not loaded automatically. The key remains on the server. AI output may contain errors; verify against the source material. Set `BRAVE_SEARCH_API_KEY` to enable optional online enrichment. Data is saved in `data/study.sqlite3`; back up this file to preserve progress. The server is intended for one person on the local computer, not public deployment.

`python test_workflows.py` runs isolated server workflow tests with a simulated AI. The optional browser test `test_mobile.cjs` requires Playwright, a local browser, and a server running on port 8765. These tests do not validate live model accuracy or the quality of extracted image content.
