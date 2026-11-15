import { useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';

/** Global topics ask (once) whether to switch from the 3D globe to the contour map. */
export function suggestContourMap(reason, onDone) {
  const st = useStore.getState();
  if (st.mode !== 'globe') return onDone?.();
  const go = () => { st.setFlatStyle('contour'); st.setMode('flat'); onDone?.(); };
  if (st.consentRemember === 'yes') return go();
  if (st.consentRemember === 'no') return onDone?.();
  st.askConsent({ reason, onYes: go, onNo: onDone });
}

export default function ConsentPrompt() {
  const consent = useStore((s) => s.consent);
  const ask = useStore((s) => s.askConsent);
  const [remember, setRemember] = useState(false);
  const { t, pick } = useT();
  if (!consent) return null;
  const answer = (yes) => {
    if (remember) useStore.setState({ consentRemember: yes ? 'yes' : 'no' });
    ask(null);
    yes ? consent.onYes?.() : consent.onNo?.();
  };
  return (
    <div className="consent" role="dialog" aria-modal="false">
      <b>{t('consentTitle')}</b>
      <p>{pick(consent.reason)}</p>
      <div className="row">
        <button className="primary" onClick={() => answer(true)}>{t('consentYes')}</button>
        <button onClick={() => answer(false)}>{t('consentNo')}</button>
        <label className="small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {t('remember')}</label>
      </div>
    </div>
  );
}
