"""Run the whole data pipeline in order (python pipeline/run_all.py).

Each step caches its downloads in pipeline/.cache, so a second run is fast.
"""
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEPS = [
    "01_geography.py",       # Natural Earth borders, capitals, rivers, lakes, seas
    "02_power_countries.py", # NASA POWER climate series for every country
    "03_global_series.py",   # GISTEMP, CO2, ozone hole, sea ice
    "04_gibs_catalog.py",    # NASA GIBS layer catalogue + colour maps
    "05_firms_ukraine.py",   # NASA FIRMS fires in Ukraine 2001-2025
    "06_gibs_trends.py",     # trend maps + MODIS country series
    "08_event_fires.py",     # NASA FIRMS fire points for the fire-spread events
    "09_event_causes.py",    # NASA POWER daily weather vs 1991-2020 normals for 2026 events
    "10_tot_official.py",    # front line: official list of occupied territories + OCHA borders
]
# (step 07 — an older, unofficial front-line source — was removed: step 10 uses only official data)

if __name__ == "__main__":
    sys.path.insert(0, str(HERE))
    only = sys.argv[1:]
    for step in STEPS:
        if only and not any(step.startswith(o) for o in only):
            continue
        print(f"\n=== {step} ===", flush=True)
        try:
            runpy.run_path(str(HERE / step), run_name="__main__")
        except SystemExit as e:  # a step that cannot run (e.g. missing input files) must not stop the rest
            if e.code not in (None, 0):
                print(f"  skipped: {e.code}", flush=True)
