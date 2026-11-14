"""Step 1 — geography for the globe and the contour map.

Source: Natural Earth 1:10m (public domain), the *Ukraine point-of-view* edition
(ne_10m_admin_0_countries_ukr), so Crimea is shown as part of Ukraine.

Outputs (public/data/geo/):
  countries.json   country polygons (topology-preserving simplification) + metadata
  capitals.json    national capitals
  rivers.json      major rivers (centerlines) with UA/EN names
  lakes.json       large lakes (for the contour map and labels)
  marine.json      label points for oceans, seas, gulfs, straits
  ukraine_oblasts.json  oblast polygons of Ukraine (used for war-impact stats)

Geometry encoding (compact, ~10x smaller than GeoJSON): every ring is a flat list
of integers [x0, y0, dx1, dy1, dx2, dy2, ...] in units of 1/QUANT degrees
(delta-encoded). Exterior rings are counter-clockwise, holes clockwise, so the
polygon interior is always on the LEFT when walking a ring — the globe uses this
to draw each country's border just inside the country, in the country's colour.
"""
from __future__ import annotations

import json
import math

from common import download, log, point_in_polygons, ring_area_km2, signed_area, write_json

NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
QUANT = 2000          # 1/2000 degree ≈ 55 m
TOL_COUNTRIES = 0.006  # Douglas–Peucker tolerance in degrees (~650 m)
TOL_RIVERS = 0.01
TOL_LAKES = 0.01
SMALL_KM2 = 25_000     # drawn with a dashed outline
TINY_KM2 = 2_500       # additionally marked with a ring so they can be found


def load(name: str):
    data = download(NE + name + ".geojson", timeout=300)
    return json.loads(data)["features"]


def polygons_of(geom):
    if geom is None:
        return []
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def lines_of(geom):
    if geom is None:
        return []
    if geom["type"] == "LineString":
        return [geom["coordinates"]]
    if geom["type"] == "MultiLineString":
        return geom["coordinates"]
    return []


def clean_ring(ring):
    """Drop the closing duplicate and consecutive duplicates; round to 1e-7."""
    out = []
    for x, y, *_ in ring:
        p = (round(x, 7), round(y, 7))
        if not out or out[-1] != p:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def dp_keep(points, tol):
    """Douglas–Peucker on an open polyline; returns sorted indices to keep."""
    n = len(points)
    if n <= 2:
        return list(range(n))
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    tol2 = tol * tol
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            if L2 == 0:
                d2 = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / L2
                t = 0 if t < 0 else 1 if t > 1 else t
                qx, qy = ax + t * dx, ay + t * dy
                d2 = (px - qx) ** 2 + (py - qy) ** 2
            if d2 > best:
                best, idx = d2, i
        if best > tol2 and idx > 0:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [i for i, k in enumerate(keep) if k]


def simplify_topological(rings: list[list[tuple]], tol: float) -> list[list[tuple]]:
    """Simplify many rings at once without opening gaps between neighbours.

    A vertex is 'fixed' when the set of rings that use it differs from the set
    used by its predecessor or successor (that is where shared borders start and
    end). Douglas–Peucker then runs only between fixed vertices, so both
    countries along a shared border get exactly the same simplified line.
    """
    users: dict[tuple, set] = {}
    for rid, ring in enumerate(rings):
        for p in ring:
            users.setdefault(p, set()).add(rid)
    keyed = {p: frozenset(s) for p, s in users.items()}
    out = []
    for ring in rings:
        n = len(ring)
        if n < 4:
            out.append(ring)
            continue
        fixed = [False] * n
        for i in range(n):
            k = keyed[ring[i]]
            if len(k) > 2 or k != keyed[ring[i - 1]] or k != keyed[ring[(i + 1) % n]]:
                fixed[i] = True
        if not any(fixed):
            # ring shares nothing (an island): anchor at the extreme points
            xs = [p[0] for p in ring]
            for i in (xs.index(min(xs)), xs.index(max(xs))):
                fixed[i] = True
        starts = [i for i in range(n) if fixed[i]]
        kept = []
        for si, a in enumerate(starts):
            b = starts[(si + 1) % len(starts)]
            seg = [ring[a]]
            j = a
            while True:
                j = (j + 1) % n
                seg.append(ring[j])
                if j == b:
                    break
            idx = dp_keep(seg, tol)
            kept.extend(seg[i] for i in idx[:-1])
        out.append(kept)
    return out


def orient(ring, ccw: bool):
    if (signed_area(ring) > 0) != ccw:
        return list(reversed(ring))
    return ring


def encode_ring(ring):
    flat = []
    px = py = 0
    for i, (x, y) in enumerate(ring):
        qx, qy = int(round(x * QUANT)), int(round(y * QUANT))
        if i == 0:
            flat += [qx, qy]
        else:
            flat += [qx - px, qy - py]
        px, py = qx, qy
    return flat


def bbox_of(polys):
    xs = [p[0] for poly in polys for p in poly[0]]
    ys = [p[1] for poly in polys for p in poly[0]]
    return [round(min(xs), 3), round(min(ys), 3), round(max(xs), 3), round(max(ys), 3)]


def label_point(polys):
    """Visual centre: the grid point inside the polygon farthest from its edges."""
    big = max(polys, key=lambda p: abs(signed_area(p[0])))
    ext = big[0]
    xs = [p[0] for p in ext]
    ys = [p[1] for p in ext]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    best, bp = -1.0, ((x0 + x1) / 2, (y0 + y1) / 2)
    N = 24
    step = max(x1 - x0, y1 - y0) / N or 1e-6
    for i in range(N + 1):
        for j in range(N + 1):
            x = x0 + (x1 - x0) * i / N
            y = y0 + (y1 - y0) * j / N
            if not point_in_polygons(x, y, [big]):
                continue
            d = min(_seg_dist(x, y, ext[k], ext[(k + 1) % len(ext)]) for k in range(0, len(ext), max(1, len(ext) // 400)))
            if d > best:
                best, bp = d, (x, y)
    return [round(bp[0], 3), round(bp[1], 3)]


def _seg_dist(x, y, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / L2))
    return math.hypot(x - (ax + t * dx), y - (ay + t * dy))


# --------------------------------------------------------------------------- countries

def build_countries():
    log("countries (Natural Earth 10m, Ukraine POV)…")
    feats = load("ne_10m_admin_0_countries_ukr")
    rings, owner = [], []          # flat list of all rings, owner = (country index, polygon index, ring index)
    meta = []
    for ci, f in enumerate(feats):
        p = f["properties"]
        polys = [[clean_ring(r) for r in poly] for poly in polygons_of(f["geometry"])]
        polys = [[r for r in poly if len(r) >= 3] for poly in polys]
        polys = [poly for poly in polys if poly]
        area = sum(ring_area_km2(poly[0]) - sum(ring_area_km2(h) for h in poly[1:]) for poly in polys)
        for pi, poly in enumerate(polys):
            for ri, r in enumerate(poly):
                rings.append(r)
                owner.append((ci, pi, ri))
        iso2 = p.get("ISO_A2_EH") if p.get("ISO_A2_EH") not in (None, "-99") else p.get("ISO_A2")
        meta.append({
            "id": p["ADM0_A3"],
            "iso3": p["ISO_A3_EH"] if p.get("ISO_A3_EH") not in (None, "-99") else p["ADM0_A3"],
            "iso2": None if iso2 in (None, "-99") else iso2,
            "name": {"en": p.get("NAME_EN") or p["NAME"], "uk": p.get("NAME_UK") or p.get("NAME_EN") or p["NAME"]},
            "type": p.get("TYPE"),
            "sov": p.get("SOV_A3"),
            "continent": p.get("CONTINENT"),
            "region": p.get("REGION_UN"),
            "subregion": p.get("SUBREGION"),
            "pop": p.get("POP_EST"),
            "gdp": p.get("GDP_MD"),
            "income": p.get("INCOME_GRP"),
            "area": round(area),
            "label": [round(p["LABEL_X"], 3), round(p["LABEL_Y"], 3)] if p.get("LABEL_X") is not None else None,
            "minLabel": p.get("MIN_LABEL"),
            "rank": p.get("LABELRANK"),
            "color": (p.get("MAPCOLOR9") or 1) - 1,
            "color13": (p.get("MAPCOLOR13") or 1) - 1 if (p.get("MAPCOLOR13") or 0) > 0 else 0,
            "small": area < SMALL_KM2,
            "tiny": area < TINY_KM2,
            "_polys": polys,
        })
    n_before = sum(len(r) for r in rings)
    simp = simplify_topological(rings, TOL_COUNTRIES)
    n_after = sum(len(r) for r in simp)
    log(f"  vertices {n_before} -> {n_after}")

    # put simplified rings back, drop rings that collapsed (keep at least one per country)
    rebuilt: dict[int, dict[int, list]] = {}
    for (ci, pi, ri), r, orig in zip(owner, simp, rings):
        if len(r) < 3:
            r = orig if ri == 0 and len(orig) <= 12 else r
        rebuilt.setdefault(ci, {}).setdefault(pi, [None] * (ri + 1))
        lst = rebuilt[ci][pi]
        while len(lst) <= ri:
            lst.append(None)
        lst[ri] = r
    out = []
    for ci, m in enumerate(meta):
        polys = []
        for pi, rs in sorted(rebuilt.get(ci, {}).items()):
            ext = rs[0]
            if ext is None or len(ext) < 3:
                continue
            holes = [h for h in rs[1:] if h is not None and len(h) >= 3]
            polys.append([orient(ext, True)] + [orient(h, False) for h in holes])
        if not polys:   # micro-state collapsed entirely -> keep original geometry
            polys = [[orient(poly[0], True)] + [orient(h, False) for h in poly[1:]] for poly in m["_polys"]]
        # drop specks: islands below ~3 km² unless they are the whole country
        if len(polys) > 1:
            areas = [ring_area_km2(p[0]) for p in polys]
            keep = [p for p, a in zip(polys, areas) if a > 3 or a == max(areas)]
            polys = keep
        m.pop("_polys")
        m["bbox"] = bbox_of(polys)
        if not m["label"]:
            m["label"] = label_point(polys)
        m["polys"] = [[encode_ring(r) for r in poly] for poly in polys]
        out.append(m)
    # sanity: Crimea must belong to Ukraine in this edition
    ukr = next(c for c in out if c["id"] == "UKR")
    log(f"  Ukraine area {ukr['area']} km² (with Crimea ≈ 603 500)")
    write_json("geo/countries.json", {"quant": QUANT, "source": "Natural Earth 1:10m, Ukraine POV (public domain)", "countries": out})
    return out


# --------------------------------------------------------------------------- capitals

def build_capitals():
    log("capitals…")
    feats = load("ne_10m_populated_places")
    caps = []
    for f in feats:
        p = f["properties"]
        if p.get("ADM0CAP") != 1 and "Admin-0 capital" not in (p.get("FEATURECLA") or ""):
            continue
        caps.append({
            "name": {"en": p.get("NAME_EN") or p["NAME"], "uk": p.get("NAME_UK") or p.get("NAME_EN") or p["NAME"]},
            "country": p.get("ADM0_A3"),
            "lon": round(p["LONGITUDE"], 4),
            "lat": round(p["LATITUDE"], 4),
            "pop": p.get("POP_MAX"),
            "rank": p.get("SCALERANK"),
            "alt": "alt" in (p.get("FEATURECLA") or "").lower(),
        })
    caps.sort(key=lambda c: -(c["pop"] or 0))
    write_json("geo/capitals.json", caps)


# --------------------------------------------------------------------------- rivers

# Natural Earth has no Ukrainian names for rivers, so the main ones are translated here.
RIVER_UK = {
    "Dnipro": "Дніпро", "Dnieper": "Дніпро", "Dniester": "Дністер", "Dnister": "Дністер", "Danube": "Дунай",
    "Desna": "Десна", "Pripyat": "Прип'ять", "Pripyat'": "Прип'ять", "Prypiat": "Прип'ять", "Southern Bug": "Південний Буг",
    "Pivdennyy Buh": "Південний Буг", "Siverskyi Donets": "Сіверський Донець", "Donets": "Сіверський Донець", "Severskiy Donets": "Сіверський Донець",
    "Western Bug": "Західний Буг", "Bug": "Західний Буг", "Prut": "Прут", "Tisza": "Тиса", "Tysa": "Тиса", "Volga": "Волга", "Don": "Дон",
    "Ural": "Урал", "Kama": "Кама", "Oka": "Ока", "Western Dvina": "Західна Двіна", "Daugava": "Даугава", "Neman": "Німан",
    "Vistula": "Вісла", "Wisla": "Вісла", "Oder": "Одра", "Odra": "Одра", "Elbe": "Ельба", "Rhine": "Рейн", "Rhône": "Рона",
    "Rhone": "Рона", "Seine": "Сена", "Loire": "Луара", "Garonne": "Гаронна", "Po": "По", "Ebro": "Ебро", "Tagus": "Тахо",
    "Tajo": "Тахо", "Douro": "Дуеро", "Thames": "Темза", "Ob": "Об", "Ob'": "Об", "Irtysh": "Іртиш", "Yenisey": "Єнісей",
    "Yenisei": "Єнісей", "Lena": "Лена", "Angara": "Ангара", "Amur": "Амур", "Kolyma": "Колима", "Indigirka": "Індигірка",
    "Yangtze": "Янцзи", "Chang Jiang": "Янцзи", "Huang He": "Хуанхе", "Yellow": "Хуанхе", "Mekong": "Меконг",
    "Ganges": "Ганг", "Ganga": "Ганг", "Brahmaputra": "Брахмапутра", "Indus": "Інд", "Irrawaddy": "Іраваді",
    "Salween": "Салуїн", "Euphrates": "Євфрат", "Tigris": "Тигр", "Amu Darya": "Амудар'я", "Syr Darya": "Сирдар'я",
    "Nile": "Ніл", "White Nile": "Білий Ніл", "Blue Nile": "Блакитний Ніл", "Congo": "Конго", "Niger": "Нігер",
    "Zambezi": "Замбезі", "Orange": "Оранжева", "Limpopo": "Лімпопо", "Senegal": "Сенегал", "Ubangi": "Убангі",
    "Kasai": "Касаї", "Okavango": "Окаванго", "Benue": "Бенуе", "Chari": "Шарі",
    "Amazon": "Амазонка", "Amazonas": "Амазонка", "Paraná": "Парана", "Parana": "Парана", "Orinoco": "Оріноко",
    "Madeira": "Мадейра", "Negro": "Ріу-Негру", "São Francisco": "Сан-Франсиску", "Sao Francisco": "Сан-Франсиску",
    "Paraguay": "Парагвай", "Uruguay": "Уругвай", "Tocantins": "Токантінс", "Xingu": "Шингу", "Purus": "Пурус",
    "Juruá": "Журуа", "Japurá": "Японра", "Mississippi": "Міссісіпі", "Missouri": "Міссурі", "Ohio": "Огайо",
    "Arkansas": "Арканзас", "Colorado": "Колорадо", "Columbia": "Колумбія", "Rio Grande": "Ріо-Гранде",
    "Yukon": "Юкон", "Mackenzie": "Маккензі", "St. Lawrence": "Святого Лаврентія", "Saint Lawrence": "Святого Лаврентія",
    "Nelson": "Нельсон", "Saskatchewan": "Саскачеван", "Snake": "Снейк", "Tennessee": "Теннессі", "Red": "Ред-Ривер",
    "Murray": "Муррей", "Darling": "Дарлінг", "Sepik": "Сепік", "Fly": "Флай",
}

RIVER_UK.update({
    "Dnepre": "Дніпро", "Amu Darya": "Амудар'я", "Syr Darya": "Сирдар'я", "São Francisco": "Сан-Франсиску", "Al Furat": "Євфрат",
    "Firat": "Євфрат", "Dicle": "Тигр", "Ertis": "Іртиш", "Huang": "Хуанхе", "Tisa": "Тиса", "Rhein": "Рейн", "Rhne": "Рона",
    "Duero": "Дуеро", "Neva": "Нева", "Pechora": "Печора", "Severnaya Dvina": "Північна Двіна", "Selenga": "Селенга",
    "Vilyuy": "Вілюй", "Aldan": "Алдан", "Khatanga": "Хатанга", "Olenëk": "Оленьок", "Taz": "Таз", "Tobol": "Тобол",
    "Nizhnyaya Tunguska": "Нижня Тунгуска", "Kamchatka": "Камчатка", "Anadyr’": "Анадир", "Sungari": "Сунгарі",
    "Liao": "Ляохе", "Xi": "Сіцзян", "Tarim": "Тарим", "Helmand": "Гільменд", "Jordan": "Йордан", "Shatt al Arab": "Шатт-ель-Араб",
    "Panj": "Пяндж", "Naryn": "Нарин", "Sutlej": "Сатледж", "Chenab": "Ченаб", "Yamuna": "Джамна", "Narmada": "Нармада",
    "Krishna": "Крішна", "Godävari": "Годаварі", "Mahäna Nadï": "Маханаді", "Irrawaddy Delta": "Дельта Іраваді", "Kapuas": "Капуас",
    "Fraser": "Фрейзер", "Athabasca": "Атабаска", "Peace": "Піс", "Churchill": "Черчилл", "Ottawa": "Оттава", "Hudson": "Гудзон",
    "Niagara": "Ніагара", "Potomac": "Потомак", "Sacramento": "Сакраменто", "Brazos": "Бразос", "Kuskokwim": "Кускоквім",
    "Tanana": "Танана", "Liard": "Ліард", "Slave": "Невільнича", "Winnipeg": "Вінніпег", "Magdalena": "Магдалена",
    "Marañón": "Мараньйон", "Ucayali": "Укаялі", "Tapajós": "Тапажос", "Araguaia": "Арагуая", "Pilcomayo": "Пількомайо",
    "Mamoré": "Маморе", "Branco": "Ріу-Бранку", "Caquetá": "Какета", "Meta": "Мета", "Purús": "Пурус", "Volta": "Вольта",
    "Black Volta": "Чорна Вольта", "White Volta": "Біла Вольта", "Lualaba": "Луалаба", "Kafue": "Кафуе", "Vaal": "Вааль",
    "Shire": "Шире", "Jubba": "Джуба", "Omo": "Омо", "Atbara": "Атбара", "Sénégal": "Сенегал", "Bénoué": "Бенуе",
    "Sanaga": "Санага", "Ruvuma": "Рувума", "Kagera": "Кагера", "Kwango": "Кванго", "Cubango": "Кубанго",
    "Victoria Nile": "Ніл Вікторія", "Albert Nile": "Ніл Альберта", "Mountain Nile": "Гірський Ніл",
    "Bratul Chillia": "Кілійське гирло", "Bratul Sulina": "Сулинське гирло", "Bratul Sfintu Gheorghe": "Георгіївське гирло",
    "Suez Canal": "Суецький канал", "Panama Canal": "Панамський канал", "Waal": "Ваал", "IJssel": "Ейсел", "Drau": "Драва",
    "Mur": "Мура", "Dalälven": "Дальельвен", "Kemijoki": "Кемійокі", "Vuoksi": "Вуокса", "Svir": "Свір", "Sukhona": "Сухона",
    "Vychegda": "Вичегда", "Daly": "Дейлі", "Fitzroy": "Фіцрой", "Waikato": "Вайкато", "Clutha": "Клута", "Grande": "Гранде",
    "Salado": "Саладо", "San Juan": "Сан-Хуан", "Madre de Dios": "Мадре-де-Дьос", "Paranaíba": "Паранаїба", "Ishikari": "Ісікарі",
    "Han": "Ханган", "Min": "Міньцзян", "Nu": "Нуцзян", "Ergun": "Аргунь", "Hailar": "Хайлар", "Yukon": "Юкон", "Pripyat": "Прип'ять",
})


def build_rivers():
    log("rivers…")
    feats = load("ne_10m_rivers_lake_centerlines")
    out = []
    missing = {}
    for f in feats:
        p = f["properties"]
        if (p.get("scalerank") or 99) > 9:
            continue
        name_en = " ".join((p.get("name_en") or p.get("name") or "").split())
        name_uk = RIVER_UK.get(name_en) or RIVER_UK.get(p.get("name") or "")
        if name_en and not name_uk and (p.get("scalerank") or 99) <= 5:
            missing[name_en] = p.get("scalerank")
        for line in lines_of(f["geometry"]):
            pts = [(round(x, 7), round(y, 7)) for x, y, *_ in line]
            idx = dp_keep(pts, TOL_RIVERS)
            pts = [pts[i] for i in idx]
            if len(pts) < 2:
                continue
            out.append({
                "name": {"en": name_en, "uk": name_uk or name_en} if name_en else None,
                "rank": p.get("scalerank"),
                "lake": p.get("featurecla") == "Lake Centerline",
                "line": encode_ring(pts),
            })
    if missing:
        log(f"  rivers (rank<=5) without a Ukrainian name, kept in English: {', '.join(sorted(missing)[:40])}")
    write_json("geo/rivers.json", {"quant": QUANT, "rivers": out})


# --------------------------------------------------------------------------- lakes + marine labels

def build_lakes():
    log("lakes…")
    feats = load("ne_50m_lakes")
    out = []
    for f in feats:
        p = f["properties"]
        polys = [[clean_ring(r) for r in poly] for poly in polygons_of(f["geometry"])]
        polys = [[r for r in poly if len(r) >= 3] for poly in polys if poly and len(poly[0]) >= 3]
        if not polys:
            continue
        enc = []
        for poly in polys:
            rs = []
            for k, r in enumerate(poly):
                idx = dp_keep(r + [r[0]], TOL_LAKES)
                rr = [r[i] for i in idx if i < len(r)]
                if len(rr) >= 3:
                    rs.append(encode_ring(orient(rr, k == 0)))
            if rs:
                enc.append(rs)
        area = sum(ring_area_km2(poly[0]) for poly in polys)
        name_en = p.get("name_en") or p.get("name")
        out.append({
            "name": {"en": name_en, "uk": p.get("name_uk") or name_en} if name_en else None,
            "rank": p.get("scalerank"),
            "area": round(area),
            "label": label_point(polys),
            "polys": enc,
        })
    write_json("geo/lakes.json", {"quant": QUANT, "lakes": out})


def build_marine():
    log("ocean & sea labels…")
    feats = load("ne_10m_geography_marine_polys")
    out = []
    for f in feats:
        p = f["properties"]
        polys = [[clean_ring(r) for r in poly] for poly in polygons_of(f["geometry"])]
        polys = [poly for poly in polys if poly and len(poly[0]) >= 3]
        if not polys or not (p.get("name_en") or p.get("name")):
            continue
        out.append({
            "name": {"en": p.get("name_en") or p["name"], "uk": p.get("name_uk") or p.get("name_en") or p["name"]},
            "kind": (p.get("featurecla") or "").lower(),
            "rank": p.get("scalerank"),
            "minLabel": p.get("min_label"),
            "label": label_point(polys),
        })
    write_json("geo/marine.json", out)


# --------------------------------------------------------------------------- Ukraine oblasts

def build_ukraine_oblasts():
    log("Ukraine oblasts (admin-1)…")
    feats = [f for f in load("ne_10m_admin_1_states_provinces") if f["properties"].get("adm0_a3") == "UKR"]
    rings, owner, meta = [], [], []
    for ci, f in enumerate(feats):
        p = f["properties"]
        polys = [[clean_ring(r) for r in poly] for poly in polygons_of(f["geometry"])]
        for pi, poly in enumerate(polys):
            for ri, r in enumerate(poly):
                rings.append(r)
                owner.append((ci, pi, ri))
        meta.append({"id": p.get("iso_3166_2"), "name": {"en": p.get("name_en") or p.get("name"), "uk": p.get("name_uk") or p.get("name")},
                     "label": [round(p["longitude"], 3), round(p["latitude"], 3)]})
    simp = simplify_topological(rings, 0.01)
    by = {}
    for (ci, pi, ri), r in zip(owner, simp):
        by.setdefault(ci, {}).setdefault(pi, {})[ri] = r
    out = []
    for ci, m in enumerate(meta):
        polys = []
        for pi, rs in sorted(by.get(ci, {}).items()):
            ext = rs.get(0)
            if not ext or len(ext) < 3:
                continue
            polys.append([orient(ext, True)] + [orient(h, False) for k, h in sorted(rs.items()) if k > 0 and len(h) >= 3])
        m["polys"] = [[encode_ring(r) for r in poly] for poly in polys]
        out.append(m)
    write_json("geo/ukraine_oblasts.json", {"quant": QUANT, "oblasts": out})


if __name__ == "__main__":
    build_countries()
    build_capitals()
    build_rivers()
    build_lakes()
    build_marine()
    build_ukraine_oblasts()
    log("done.")
