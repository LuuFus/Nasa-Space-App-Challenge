import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useT } from '../i18n/index.js';

// only the parts of ECharts we use (keeps the download small)
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkPointComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer]);

/** ECharts wrapper with a full-screen toggle (drag the slider to stretch the years). */
export default function Chart({ option, height = 320 }) {
  const el = useRef(null);
  const chart = useRef(null);
  const [full, setFull] = useState(false);
  const { t } = useT();
  useEffect(() => {
    chart.current = echarts.init(el.current, 'dark', { renderer: 'canvas' });
    const ro = new ResizeObserver(() => chart.current?.resize());
    ro.observe(el.current);
    return () => { ro.disconnect(); chart.current.dispose(); };
  }, []);
  useEffect(() => { if (option) chart.current.setOption(option, true); }, [option]);
  useEffect(() => {
    setTimeout(() => chart.current?.resize(), 30);
    const esc = (e) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [full]);
  return (
    <div className={full ? 'chart-box fullscreen' : 'chart-box'} style={full ? undefined : { height }}>
      <button className="fs-btn" onClick={() => setFull(!full)}>{full ? t('closeFullscreen') : t('fullscreen')}</button>
      <div ref={el} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
