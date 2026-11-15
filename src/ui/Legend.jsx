import { legendBar, legendScale } from '../lib/legend.js';
import { useT } from '../i18n/index.js';
import { useStore } from '../state/store.js';

// Colour bar of a data layer with round ticks. When the mouse is over the map,
// an arrow shows where the value under the cursor lies on the bar.
export default function Legend({ layer }) {
  const { t, lang } = useT();
  const probe = useStore((s) => s.probe);
  const bar = legendBar(layer, lang);
  if (!bar) {
    return layer?.legendImage ? <img className="legend-img" src={layer.legendImage} alt={t('legend')} /> : null;
  }
  if (bar.classes) {
    return (
      <div className="legend classes">
        {bar.classes.map((c, i) => (
          <span key={i} className="cls"><i style={{ background: c.color }} />{c.label}</span>
        ))}
      </div>
    );
  }
  const sc = legendScale(layer, lang);
  const here = sc && probe?.layer === layer.id && probe.value != null ? sc.pos(probe.value) : null;
  const uk = lang === 'uk';
  return (
    <div className="legend">
      <div className="legend-units">{bar.units || ''}</div>
      <div className="bar-wrap">
        <div className="bar" style={{ background: bar.gradient }} />
        {here != null && (
          <div className="legend-probe" style={{ left: `${here * 100}%` }}>
            <span className="mono">{probe.text}</span>
          </div>
        )}
      </div>
      {sc ? (
        <div className="ticks scale">
          {sc.ticks.map((tk) => <span key={tk.v} style={{ left: `${tk.pos * 100}%` }}>{tk.label}</span>)}
        </div>
      ) : (
        <div className="ticks"><span>{bar.min}</span><span>{bar.mid}</span><span>{bar.max} {bar.units}</span></div>
      )}
      <p className="legend-help">{uk
        ? 'Наведи курсор на карту: стрілка над шкалою покаже, яке значення в цьому місці, а у підказці біля курсора буде точне число.'
        : 'Point at the map: the arrow above the bar shows the value at that place, and the tooltip next to the cursor gives the number.'}</p>
    </div>
  );
}
