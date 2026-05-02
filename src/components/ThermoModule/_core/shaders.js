/**
 * GPU shaders for the Thermodynamics Sandbox.
 *
 *   • PhononMaterial      → Level 1 energy-transfer particles
 *   • IRWavefrontMaterial → Level 2 expanding infrared shell
 *   • FlowMaterial        → Level 3 water flowing through pipe
 *   • LossParticleMaterial→ Level 3 useful vs. lost heat particles
 *
 * Each shader is fed its state through `uniforms`. React drives them by
 * mutating `material.uniforms.uX.value` inside `useFrame` — no JSX updates,
 * no re-renders. This is the 120-fps path.
 */

import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────
// PHONON (Level 1): instanced glowing particles traveling from
// hot body to cold body along a parabolic arc.
// ──────────────────────────────────────────────────────────────

export class PhononMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 22 },
                uColorHot: { value: new THREE.Color('#ff7040') },
                uColorCold: { value: new THREE.Color('#40d0ff') },
            },
            vertexShader: /* glsl */`
                attribute vec3 aStart;
                attribute vec3 aEnd;
                attribute float aBirth;
                attribute float aLifetime;
                attribute float aArc;

                uniform float uTime;
                uniform float uSize;

                varying float vAge;
                varying float vAlive;

                void main() {
                    float age = (uTime - aBirth) / aLifetime;
                    vAge = age;
                    vAlive = step(0.0, age) * (1.0 - step(1.0, age));

                    // Parabolic arc: lerp base + lifted hump
                    vec3 base = mix(aStart, aEnd, clamp(age, 0.0, 1.0));
                    float hump = 4.0 * aArc * age * (1.0 - age);
                    base.y += hump;

                    vec4 mv = modelViewMatrix * vec4(base, 1.0);
                    gl_Position = projectionMatrix * mv;

                    // Distance-attenuated point size; grow when close to camera.
                    gl_PointSize = uSize * (1.0 / max(0.5, -mv.z)) * vAlive;
                }
            `,
            fragmentShader: /* glsl */`
                uniform vec3 uColorHot;
                uniform vec3 uColorCold;

                varying float vAge;
                varying float vAlive;

                void main() {
                    if (vAlive < 0.5) discard;

                    // Soft circular sprite
                    vec2 uv = gl_PointCoord - 0.5;
                    float d = length(uv);
                    if (d > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.0, d);

                    // Hue cools as particle ages: hot → cold
                    vec3 col = mix(uColorHot, uColorCold, vAge);
                    float glow = pow(alpha, 1.6);
                    gl_FragColor = vec4(col * (1.0 + glow * 0.8), glow);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }
}

// ──────────────────────────────────────────────────────────────
// IR WAVEFRONT (Level 2): expanding spherical shell originating
// from the kettle. Thin-shell mask in fragment, animated radius.
// ──────────────────────────────────────────────────────────────

export class IRWavefrontMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uRadius: { value: 0.1 },
                uThickness: { value: 0.25 },
                uIntensity: { value: 1.0 },
                uOrigin: { value: new THREE.Vector3(0, 0.5, 0) },
            },
            vertexShader: /* glsl */`
                varying vec3 vWorldPos;
                void main() {
                    vec4 world = modelMatrix * vec4(position, 1.0);
                    vWorldPos = world.xyz;
                    gl_Position = projectionMatrix * viewMatrix * world;
                }
            `,
            fragmentShader: /* glsl */`
                uniform float uTime;
                uniform float uRadius;
                uniform float uThickness;
                uniform float uIntensity;
                uniform vec3 uOrigin;

                varying vec3 vWorldPos;

                // Cheap 3D noise for turbulence
                float hash(vec3 p) {
                    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                }
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                        f.z);
                }

                void main() {
                    float r = length(vWorldPos - uOrigin);

                    // Thin-shell mask: bright at the wavefront, dark elsewhere
                    float shell = smoothstep(uThickness, 0.0, abs(r - uRadius));

                    // Turbulent perturbation
                    float n = noise(vWorldPos * 1.8 + uTime * 0.4);
                    shell *= 0.7 + 0.5 * n;

                    // Black-body-ish color ramp with radius (hotter = whiter at front)
                    float heat = 1.0 - smoothstep(0.0, 6.0, uRadius);
                    vec3 white = vec3(1.0, 0.95, 0.85);
                    vec3 orange = vec3(1.0, 0.55, 0.2);
                    vec3 red = vec3(0.95, 0.2, 0.1);
                    vec3 col = mix(red, orange, heat);
                    col = mix(col, white, heat * shell);

                    float a = shell * uIntensity;
                    if (a < 0.01) discard;
                    gl_FragColor = vec4(col * (1.0 + shell * 1.2), a);
                }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
    }
}

// ──────────────────────────────────────────────────────────────
// FLOW (Level 3): water inside the glass pipe. Scrolling noise
// texture, hue interpolates T_in → T_out along pipe axis.
// ──────────────────────────────────────────────────────────────

export class FlowMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uFlowSpeed: { value: 1.0 },
                uTin: { value: 15 },
                uTout: { value: 35 },
                uBoiling: { value: 0 },        // 0..1 — 1 = steaming
                uPipeLength: { value: 4.0 },
            },
            vertexShader: /* glsl */`
                varying vec2 vUv;
                varying vec3 vPos;
                void main() {
                    vUv = uv;
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform float uTime;
                uniform float uFlowSpeed;
                uniform float uTin;
                uniform float uTout;
                uniform float uBoiling;
                uniform float uPipeLength;

                varying vec2 vUv;
                varying vec3 vPos;

                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                float noise(vec2 p) {
                    vec2 i = floor(p); vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
                }

                vec3 tempColor(float t) {
                    // t ∈ [0,1] maps cold → hot
                    vec3 cold = vec3(0.2, 0.55, 1.0);
                    vec3 warm = vec3(0.3, 1.0, 0.7);
                    vec3 hot  = vec3(1.0, 0.45, 0.15);
                    if (t < 0.5) return mix(cold, warm, t * 2.0);
                    return mix(warm, hot, (t - 0.5) * 2.0);
                }

                void main() {
                    // Axial coordinate: vUv.y in [0,1] along length
                    float along = vUv.y;

                    // Scroll noise in flow direction to suggest motion
                    vec2 flowUv = vec2(vUv.x * 6.0, vUv.y * 4.0 - uTime * uFlowSpeed * 0.8);
                    float n = noise(flowUv) * 0.5 + noise(flowUv * 2.3) * 0.3;

                    // Temperature gradient along pipe
                    float tNorm = clamp((mix(uTin, uTout, along) - 10.0) / 95.0, 0.0, 1.0);
                    vec3 baseCol = tempColor(tNorm);

                    // Streaking streamlines
                    float streak = 0.85 + 0.15 * smoothstep(0.3, 0.7, n);

                    vec3 col = baseCol * streak;

                    // Boiling: add white bubble noise + brighten
                    if (uBoiling > 0.01) {
                        float bubble = smoothstep(0.72, 0.95, noise(flowUv * 4.0 + uTime));
                        col = mix(col, vec3(1.0, 1.0, 1.0), bubble * uBoiling * 0.85);
                    }

                    gl_FragColor = vec4(col, 0.88);
                }
            `,
            transparent: true,
        });
    }
}

// ──────────────────────────────────────────────────────────────
// LOSS PARTICLES (Level 3): instanced points emitted from heater.
// aFate = 0 → captured (curves into pipe, blue fade)
// aFate = 1 → lost      (arcs outward, red fade)
// ──────────────────────────────────────────────────────────────

export class LossParticleMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 26 },
                uCaptured: { value: new THREE.Color('#00f0ff') },
                uLost: { value: new THREE.Color('#ff4030') },
            },
            vertexShader: /* glsl */`
                attribute vec3 aStart;
                attribute vec3 aTargetCaptured; // where captured particles go (pipe inlet)
                attribute vec3 aTargetLost;     // where lost particles go (sky)
                attribute float aBirth;
                attribute float aLifetime;
                attribute float aFate;          // 0 captured, 1 lost

                uniform float uTime;
                uniform float uSize;

                varying float vAge;
                varying float vFate;
                varying float vAlive;

                void main() {
                    float age = (uTime - aBirth) / aLifetime;
                    vAge = age;
                    vFate = aFate;
                    vAlive = step(0.0, age) * (1.0 - step(1.0, age));

                    vec3 target = mix(aTargetCaptured, aTargetLost, aFate);
                    vec3 pos = mix(aStart, target, clamp(age, 0.0, 1.0));

                    // Lost particles arc upward; captured ones curve slightly inward
                    float arc = sin(age * 3.14159) * (aFate > 0.5 ? 0.8 : 0.15);
                    pos.y += arc;

                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = uSize * (1.0 / max(0.5, -mv.z)) * vAlive;
                }
            `,
            fragmentShader: /* glsl */`
                uniform vec3 uCaptured;
                uniform vec3 uLost;

                varying float vAge;
                varying float vFate;
                varying float vAlive;

                void main() {
                    if (vAlive < 0.5) discard;
                    vec2 uv = gl_PointCoord - 0.5;
                    float d = length(uv);
                    if (d > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.0, d);

                    vec3 col = mix(uCaptured, uLost, vFate);
                    // Fade as particle ages
                    float fade = 1.0 - smoothstep(0.5, 1.0, vAge);
                    gl_FragColor = vec4(col * (1.0 + alpha * 0.6), alpha * fade);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }
}
