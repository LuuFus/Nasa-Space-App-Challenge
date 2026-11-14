import { legendBar } from '../lib/legend.js';
import { useT } from '../i18n/index.js';

export default function Legend({ layer }) {
  const { t } = useT();
  const bar = legendBar(layer);
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
  return (
    <div className="legend">
      <div className="bar" style={{ background: bar.gradient }} />
      <div className="ticks"><span>{bar.min}</span><span>{bar.mid}</span><span>{bar.max} {bar.units}</span></div>
    </div>
  );
}
