// HTML labels that follow points on the globe / map: country names, capitals,
// oceans, rivers, event markers. Each frame we project the anchors, hide the
// ones on the far side of the Earth, and place labels by priority so they do not
// overlap (the most important names win).

export class Labels {
  constructor(engine, container) {
    this.engine = engine;
    this.root = document.createElement('div');
    this.root.className = 'labels-layer';
    container.appendChild(this.root);
    this.groups = new Map(); // kind -> { items, visible }
    this.lang = 'uk';
    this.dirty = true;
  }

  /**
   * items: [{ key, lon, lat, text: {uk,en} | string, cls, priority, minZoom, maxZoom,
   *           marker: bool (always shown, clickable), onClick, title }]
   */
  setGroup(kind, items, visible = true) {
    const old = this.groups.get(kind);
    if (old) old.items.forEach((it) => it.el?.remove());
    this.groups.set(kind, { items, visible });
    this.dirty = true;
    this.engine.requestRender();
  }

  setVisible(kind, visible) {
    const g = this.groups.get(kind);
    if (!g) return;
    if (g.visible === visible) return;
    g.visible = visible;
    if (!visible) g.items.forEach((it) => { if (it.el) it.el.style.display = 'none'; });
    this.dirty = true;
    this.engine.requestRender();
  }

  setLang(lang) {
    this.lang = lang;
    for (const g of this.groups.values()) for (const it of g.items) if (it.el && !it.html) it.el.firstChild.textContent = this._text(it);
    for (const g of this.groups.values()) for (const it of g.items) if (it.el && it.title) it.el.title = typeof it.title === 'string' ? it.title : it.title[lang];
    this.dirty = true;
    this.engine.requestRender();
  }

  _text(it) {
    if (!it.text) return '';
    return typeof it.text === 'string' ? it.text : it.text[this.lang] || it.text.en;
  }

  _el(it) {
    if (it.el) return it.el;
    const el = document.createElement('div');
    el.className = 'lbl ' + (it.cls || '');
    const span = document.createElement('span');
    // `html` = a small trusted SVG icon made by our own code (event markers)
    if (it.html) span.innerHTML = it.html; else span.textContent = this._text(it);
    el.appendChild(span);
    if (it.title) el.title = typeof it.title === 'string' ? it.title : it.title[this.lang];
    if (it.onClick) {
      el.classList.add('clickable');
      el.addEventListener('click', (e) => { e.stopPropagation(); it.onClick(it, el); });
    }
    if (it.onEnter) el.addEventListener('pointerenter', () => it.onEnter(it, el));
    if (it.onLeave) el.addEventListener('pointerleave', () => it.onLeave(it, el));
    this.root.appendChild(el);
    it.el = el;
    it.w = it.html ? 26 : Math.max(14, span.textContent.length * (it.charW || 6.4) + 10);
    it.h = it.lineH || 16;
    return el;
  }

  _hide(it) {
    if (it.el && it._shown !== false) { it.el.style.display = 'none'; it._shown = false; }
  }

  update() {
    const eng = this.engine;
    const zoom = eng.zoom;
    const W = eng.width, H = eng.height;
    const cand = [];
    for (const g of this.groups.values()) {
      if (!g.visible) continue;
      for (const it of g.items) {
        const show = (it.minZoom == null || zoom >= it.minZoom) && (it.maxZoom == null || zoom <= it.maxZoom);
        if (!show) { this._hide(it); continue; }
        const p = eng.project(it.lon, it.lat);
        if (!p || p.x < -50 || p.y < -20 || p.x > W + 50 || p.y > H + 20) { this._hide(it); continue; }
        it._x = p.x; it._y = p.y;
        cand.push(it);
      }
    }
    cand.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
    const placed = [];
    let count = 0;
    for (const it of cand) {
      const el = this._el(it);
      const w = it.w, h = it.h;
      const x0 = it._x - (it.anchorLeft ? 0 : w / 2), y0 = it._y - h / 2;
      let ok = true;
      if (!it.marker) {
        if (count > 220) ok = false;
        for (let i = 0; ok && i < placed.length; i++) {
          const r = placed[i];
          if (x0 < r[2] && x0 + w > r[0] && y0 < r[3] && y0 + h > r[1]) ok = false;
        }
      }
      if (!ok) { this._hide(it); continue; }
      placed.push([x0 - 2, y0 - 1, x0 + w + 2, y0 + h + 1]);
      count++;
      // touch the DOM only when something changed
      if (it._shown !== true) { el.style.display = ''; it._shown = true; }
      const tx = `translate(${it._x.toFixed(1)}px, ${it._y.toFixed(1)}px)`;
      if (tx !== it._tx) { el.style.transform = tx; it._tx = tx; }
    }
  }
}
