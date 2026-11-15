// Line icons drawn for the start page (our own, 32×32 grid, 1.5 px stroke).
// Each one is a small picture of the idea next to it, not a generic glyph.

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ICONS = {
  // a noisy chart with a question: is it a trend or just a hot year?
  problem: (
    <>
      <path d="M5 5v21h22" />
      <path d="M8 20l3-4 2.5 3 3-7 2.5 5 2.5-2 2.5 3" />
      <circle cx="24" cy="9" r="4.5" />
      <path d="M22.6 7.8a1.5 1.5 0 1 1 2 1.4c-.5.2-.6.5-.6 1" />
      <path d="M24 11.6v.01" />
    </>
  ),
  // the globe with a trend arrow running over it
  solution: (
    <>
      <circle cx="15" cy="16" r="10" />
      <path d="M5 16h20" />
      <path d="M15 6c3 3 3 17 0 20M15 6c-3 3-3 17 0 20" />
      <path d="M17 13l4-4 3 2 4-5" />
      <path d="M25 6h3v3" />
    </>
  ),
  // two students with an open book
  people: (
    <>
      <circle cx="10.5" cy="9" r="3.2" />
      <circle cx="21.5" cy="9" r="3.2" />
      <path d="M4.5 21c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6" />
      <path d="M15.5 21c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6" />
      <path d="M6 24.5c3.4-1 6.6-1 10 .8 3.4-1.8 6.6-1.8 10-.8V28c-3.4-1-6.6-1-10 .8-3.4-1.8-6.6-1.8-10-.8z" />
    </>
  ),
  // a satellite with two solar panels and a signal to the ground
  satellite: (
    <>
      <path d="M13.2 11.6l4.2-4.2 5.2 5.2-4.2 4.2z" />
      <path d="M12.4 6.2L8.3 2.1 4.1 6.3l4.1 4.1zM23.8 17.6l4.1 4.1-4.2 4.2-4.1-4.1z" />
      <path d="M11 9.4l2.2 2.2M18.8 17.2l2.2 2.2" />
      <path d="M15.2 17.4l-2.6 2.6" />
      <path d="M6.5 22.5a6 6 0 0 0 3 3M3.5 22.2a9 9 0 0 0 6.3 6.3" />
    </>
  ),
  // stacked map layers with data points
  data: (
    <>
      <path d="M16 4l12 6-12 6-12-6z" />
      <path d="M4 16l12 6 12-6" />
      <path d="M4 22l12 6 12-6" />
      <circle cx="12" cy="10" r=".8" fill="currentColor" />
      <circle cx="17" cy="8.4" r=".8" fill="currentColor" />
      <circle cx="20" cy="11" r=".8" fill="currentColor" />
    </>
  ),
  // a magnifying glass over the trend line
  test: (
    <>
      <path d="M3 24l5-4 4 2 5-6" />
      <circle cx="20" cy="12" r="7" />
      <path d="M15.5 14.5l2.5-2 2 1.5 3.5-4" />
      <path d="M25 17l5 5" />
    </>
  ),
  // a speech bubble with a check: the conclusion in plain words
  answer: (
    <>
      <path d="M5 6h22v15H14l-6 5v-5H5z" />
      <path d="M11 13.5l3.5 3.5L21 10.5" />
    </>
  ),
};

export function LIcon({ name, size = 32 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" {...P}>
      {ICONS[name]}
    </svg>
  );
}
