import { Aurora, CursorRipples, FloatingParticles, Shader, VideoTexture, Vignette } from 'shaders/react';

// WebGPU effects of the start page (package `shaders`, MIT). Loaded only when
// the browser has WebGPU, see effects.jsx. Telemetry of the library is off:
// visitors' data never goes to shaders.com.

/** the Earth video with soft water-like ripples that follow the mouse */
export function HeroShader({ url }) {
  return (
    <Shader className="l-shader" disableTelemetry>
      <VideoTexture url={url} objectFit="cover" loop />
      <CursorRipples intensity={6} radius={0.32} decay={7} chromaticSplit={0.7} edges="mirror" />
      <Vignette color="#020617" intensity={0.55} radius={0.78} falloff={0.55} />
    </Shader>
  );
}

/** northern lights in the brand blues and a field of slowly drifting stars */
export function CtaShader() {
  return (
    <Shader className="l-shader" disableTelemetry>
      <Aurora colorA="#1355b8" colorB="#38bdf8" colorC="#7c5cff" colorSpace="oklab" intensity={65} speed={2} curtainCount={3} height={130} waviness={40} />
      <FloatingParticles count={700} particleSize={1} speed={0.06} twinkle={0.8} particleColor="#e2e8f0" cursorStrength={0.5} opacity={0.75} />
    </Shader>
  );
}
