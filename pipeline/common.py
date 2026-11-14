"""Shared helpers for the data pipeline.

Every script in this folder downloads open data (NASA first, partners second),
caches the raw files in pipeline/.cache and writes compact files for the website
into public/data. Re-running a script re-uses the cache, so the pipeline is cheap
to repeat and fully reproducible.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "pipeline" / ".cache"
OUT = ROOT / "public" / "data"
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

USER_AGENT = "EarthTrendDetective/0.1 (NASA Space Apps 2026 student project)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

EARTH_RADIUS_KM = 6371.0088


def log(*args):
    print(*args, flush=True)


def cache_path(url: str, suffix: str = "") -> Path:
    name = url.rstrip("/").split("/")[-1].split("?")[0] or "index"
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    return CACHE / f"{h}_{name}{suffix}"


def download(url: str, *, retries: int = 4, timeout: int = 120, binary: bool = True,
             cache: bool = True, params: dict | None = None, quiet: bool = False) -> bytes | None:
    """GET a URL with a small retry loop and an on-disk cache.

    Returns None for HTTP 404 (missing tile/file), raises on other persistent errors.
    """
    key = url + ("?" + json.dumps(params, sort_keys=True) if params else "")
    path = cache_path(key)
    if cache and path.exists():
        return path.read_bytes()
    missing = path.with_suffix(path.suffix + ".404")
    if cache and missing.exists():
        return None
    last = None
    for attempt in range(retries):
        try:
            r = SESSION.get(url, params=params, timeout=timeout)
            if r.status_code == 404:
                if cache:
                    missing.write_text("404")
                return None
            if r.status_code == 429:  # rate limited: wait (server hint or growing pause)
                wait = float(r.headers.get("Retry-After") or 0) or 15 * (attempt + 1)
                if not quiet:
                    log(f"  rate limited, waiting {wait:.0f}s")
                time.sleep(wait)
                last = RuntimeError("429 Too Many Requests")
                continue
            r.raise_for_status()
            data = r.content
            if cache:
                tmp = path.with_suffix(path.suffix + ".part")
                tmp.write_bytes(data)
                os.replace(tmp, path)
            return data
        except Exception as e:  # network hiccups are common on long runs
            last = e
            if not quiet:
                log(f"  retry {attempt + 1}/{retries} {url[:110]} -> {e}")
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to download {url}: {last}")


def download_json(url: str, **kw):
    data = download(url, **kw)
    return None if data is None else json.loads(data)


def parallel(fn, items, workers: int = 8, desc: str = ""):
    """Run fn(item) in a thread pool, print progress, return results in input order."""
    results = [None] * len(items)
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fn, it): i for i, it in enumerate(items)}
        for f in as_completed(futs):
            i = futs[f]
            results[i] = f.result()
            done += 1
            if done % max(1, len(items) // 20) == 0 or done == len(items):
                log(f"  {desc} {done}/{len(items)}  ({time.time() - t0:.0f}s)")
    return results


def write_json(name: str, obj, *, compact: bool = True):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if compact:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(obj, f, ensure_ascii=False, indent=1)
    log(f"  wrote {path.relative_to(ROOT)}  ({path.stat().st_size / 1024:.0f} KB)")
    return path


def read_json(name: str):
    with open(OUT / name, encoding="utf-8") as f:
        return json.load(f)


def rnd(x, nd=3):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return None
    return round(float(x), nd)


def ring_area_km2(ring) -> float:
    """Spherical polygon area of a lon/lat ring (absolute value), km²."""
    if len(ring) < 3:
        return 0.0
    total = 0.0
    n = len(ring)
    for i in range(n):
        lon1, lat1 = ring[i]
        lon2, lat2 = ring[(i + 1) % n]
        total += math.radians(lon2 - lon1) * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2)))
    return abs(total * EARTH_RADIUS_KM ** 2 / 2.0)


def signed_area(ring) -> float:
    """Planar signed area in lon/lat space (positive = counter-clockwise)."""
    s = 0.0
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % n]
        s += x1 * y2 - x2 * y1
    return s / 2.0


def point_in_ring(x, y, ring) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-300) + xi:
            inside = not inside
        j = i
    return inside


def point_in_polygons(x, y, polygons) -> bool:
    """polygons: list of [exterior, hole, hole...]."""
    for poly in polygons:
        if point_in_ring(x, y, poly[0]) and not any(point_in_ring(x, y, h) for h in poly[1:]):
            return True
    return False


if __name__ == "__main__":
    sys.exit("This module only holds helpers; run the numbered scripts instead.")
