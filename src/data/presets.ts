import {
  AnchorPin,
  FlowSettings,
  FlowVector,
  ImageAdjustments,
  LutPresetId,
  ProjectScene,
} from '../types/studio';

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  tint: 0,
  exposure: 0,
  vignette: 15,
  sharpness: 12,
  grain: 0,
  blur: 0,
  rotation: 0,
  fineAngle: 0,
  flipH: false,
  flipV: false,
  aspectRatio: 'original',
  lutPreset: 'none',
  textOverlay: {
    enabled: false,
    text: 'KINETIX MOTION STUDY',
    subtext: '24 FPS · CONTINUOUS VECTOR FIELD',
    x: 0.06,
    y: 0.88,
    fontSize: 28,
    color: '#F8FAFC',
    opacity: 0.9,
  },
};

export const DEFAULT_FLOW_SETTINGS: FlowSettings = {
  isPlaying: true,
  speed: 1.0,
  amplitude: 38,
  loopMode: 'seamless-crossfade',
  showOverlays: true,
  showVelocityField: false,
  activeFlowTool: 'path-arrow',
  brushRadius: 0.09,
  vectorStrength: 1.15,
  particleOverlay: 'none',
  particleDensity: 45,
};

export interface LutDefinition {
  id: LutPresetId;
  name: string;
  tag: string;
  adjustments: Partial<ImageAdjustments>;
  swatch: string;
}

export const LUT_PRESETS: LutDefinition[] = [
  {
    id: 'none',
    name: 'Neutral Studio',
    tag: 'RAW',
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      tint: 0,
      vignette: 12,
    },
    swatch: 'from-slate-600 to-slate-800',
  },
  {
    id: 'emerald-canyon',
    name: 'Emerald Canyon',
    tag: 'NATURE',
    adjustments: {
      brightness: 4,
      contrast: 18,
      saturation: 22,
      warmth: -8,
      tint: -12,
      vignette: 26,
    },
    swatch: 'from-emerald-600 to-teal-900',
  },
  {
    id: 'teal-amber',
    name: 'Cinema Teal & Amber',
    tag: 'FILM',
    adjustments: {
      brightness: -2,
      contrast: 24,
      saturation: 14,
      warmth: 16,
      tint: -8,
      vignette: 32,
    },
    swatch: 'from-cyan-600 to-amber-600',
  },
  {
    id: 'leica-mono',
    name: 'Leica Silver Mono',
    tag: 'B&W',
    adjustments: {
      brightness: 2,
      contrast: 36,
      saturation: -100,
      warmth: 0,
      tint: 0,
      vignette: 38,
      grain: 22,
    },
    swatch: 'from-zinc-300 to-zinc-900',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Glacial',
    tag: 'COOL',
    adjustments: {
      brightness: 8,
      contrast: 14,
      saturation: -18,
      warmth: -28,
      tint: -6,
      vignette: 20,
    },
    swatch: 'from-sky-400 to-indigo-900',
  },
  {
    id: 'kodachrome',
    name: 'Kodachrome 64',
    tag: 'ANALOG',
    adjustments: {
      brightness: 3,
      contrast: 22,
      saturation: 28,
      warmth: 22,
      tint: 8,
      vignette: 28,
      grain: 16,
    },
    swatch: 'from-amber-500 to-rose-700',
  },
  {
    id: 'golden-hour',
    name: 'Solstice Amber',
    tag: 'WARM',
    adjustments: {
      brightness: 6,
      contrast: 12,
      saturation: 20,
      warmth: 34,
      tint: 10,
      vignette: 22,
    },
    swatch: 'from-yellow-400 to-orange-700',
  },
  {
    id: 'velvet-nocturne',
    name: 'Velvet Nocturne',
    tag: 'MOODY',
    adjustments: {
      brightness: -10,
      contrast: 28,
      saturation: -8,
      warmth: -16,
      tint: 14,
      vignette: 45,
    },
    swatch: 'from-indigo-700 to-slate-950',
  },
];

export interface AutoFlowTemplate {
  id: string;
  name: string;
  subtitle: string;
  vectors: FlowVector[];
  pins: AnchorPin[];
  recommendedParticle: FlowSettings['particleOverlay'];
}

export const AUTO_FLOW_TEMPLATES: AutoFlowTemplate[] = [
  {
    id: 'waterfall-cascade',
    name: 'Waterfall Cascade',
    subtitle: 'Vertical center plunge + outward pool ripple',
    recommendedParticle: 'mist-drift',
    vectors: [
      {
        id: 'wf-1',
        kind: 'path',
        strength: 1.4,
        radius: 0.11,
        points: [
          { x: 0.48, y: 0.14 },
          { x: 0.48, y: 0.36 },
          { x: 0.49, y: 0.58 },
          { x: 0.49, y: 0.76 },
        ],
      },
      {
        id: 'wf-2',
        kind: 'path',
        strength: 1.25,
        radius: 0.1,
        points: [
          { x: 0.54, y: 0.18 },
          { x: 0.54, y: 0.42 },
          { x: 0.53, y: 0.66 },
        ],
      },
      {
        id: 'wf-3',
        kind: 'path',
        strength: 0.95,
        radius: 0.11,
        points: [
          { x: 0.46, y: 0.82 },
          { x: 0.34, y: 0.88 },
          { x: 0.22, y: 0.92 },
        ],
      },
      {
        id: 'wf-4',
        kind: 'path',
        strength: 0.95,
        radius: 0.11,
        points: [
          { x: 0.54, y: 0.82 },
          { x: 0.66, y: 0.88 },
          { x: 0.78, y: 0.92 },
        ],
      },
    ],
    pins: [
      { id: 'wfp-1', x: 0.28, y: 0.3, radius: 0.11 },
      { id: 'wfp-2', x: 0.28, y: 0.55, radius: 0.11 },
      { id: 'wfp-3', x: 0.7, y: 0.3, radius: 0.11 },
      { id: 'wfp-4', x: 0.7, y: 0.55, radius: 0.11 },
    ],
  },
  {
    id: 'sky-cloud-drift',
    name: 'Sky & Horizon Drift',
    subtitle: 'Upper atmosphere glide + frozen foreground',
    recommendedParticle: 'none',
    vectors: [
      {
        id: 'sky-1',
        kind: 'path',
        strength: 1.2,
        radius: 0.13,
        points: [
          { x: 0.18, y: 0.2 },
          { x: 0.42, y: 0.18 },
          { x: 0.68, y: 0.2 },
          { x: 0.86, y: 0.22 },
        ],
      },
      {
        id: 'sky-2',
        kind: 'path',
        strength: 1.0,
        radius: 0.12,
        points: [
          { x: 0.15, y: 0.34 },
          { x: 0.45, y: 0.32 },
          { x: 0.78, y: 0.34 },
        ],
      },
      {
        id: 'sky-3',
        kind: 'path',
        strength: 0.75,
        radius: 0.11,
        points: [
          { x: 0.24, y: 0.82 },
          { x: 0.52, y: 0.82 },
          { x: 0.78, y: 0.82 },
        ],
      },
    ],
    pins: [
      { id: 'skyp-1', x: 0.25, y: 0.56, radius: 0.12 },
      { id: 'skyp-2', x: 0.5, y: 0.52, radius: 0.13 },
      { id: 'skyp-3', x: 0.75, y: 0.56, radius: 0.12 },
    ],
  },
  {
    id: 'rising-steam-curl',
    name: 'Rising Thermal Plume',
    subtitle: 'Upward S-curve convection with locked base',
    recommendedParticle: 'rising-steam',
    vectors: [
      {
        id: 'stm-1',
        kind: 'path',
        strength: 1.3,
        radius: 0.11,
        points: [
          { x: 0.48, y: 0.56 },
          { x: 0.44, y: 0.42 },
          { x: 0.53, y: 0.26 },
          { x: 0.47, y: 0.12 },
        ],
      },
      {
        id: 'stm-2',
        kind: 'path',
        strength: 1.1,
        radius: 0.1,
        points: [
          { x: 0.55, y: 0.54 },
          { x: 0.6, y: 0.38 },
          { x: 0.56, y: 0.2 },
        ],
      },
    ],
    pins: [
      { id: 'stmp-1', x: 0.36, y: 0.72, radius: 0.12 },
      { id: 'stmp-2', x: 0.5, y: 0.76, radius: 0.13 },
      { id: 'stmp-3', x: 0.64, y: 0.72, radius: 0.12 },
    ],
  },
  {
    id: 'ocean-wave-surge',
    name: 'Coastal Wave Surge',
    subtitle: 'Diagonal surf momentum toward shoreline',
    recommendedParticle: 'mist-drift',
    vectors: [
      {
        id: 'wv-1',
        kind: 'path',
        strength: 1.35,
        radius: 0.13,
        points: [
          { x: 0.18, y: 0.24 },
          { x: 0.36, y: 0.42 },
          { x: 0.54, y: 0.58 },
        ],
      },
      {
        id: 'wv-2',
        kind: 'path',
        strength: 1.25,
        radius: 0.13,
        points: [
          { x: 0.42, y: 0.18 },
          { x: 0.58, y: 0.36 },
          { x: 0.74, y: 0.52 },
        ],
      },
      {
        id: 'wv-3',
        kind: 'path',
        strength: 1.1,
        radius: 0.12,
        points: [
          { x: 0.15, y: 0.54 },
          { x: 0.32, y: 0.68 },
          { x: 0.48, y: 0.78 },
        ],
      },
    ],
    pins: [
      { id: 'wvp-1', x: 0.75, y: 0.82, radius: 0.13 },
      { id: 'wvp-2', x: 0.86, y: 0.68, radius: 0.12 },
      { id: 'wvp-3', x: 0.62, y: 0.88, radius: 0.12 },
    ],
  },
];

export const INITIAL_PRESET_SCENES: ProjectScene[] = [
  {
    id: 'scene-waterfall-canyon',
    title: 'Emerald Canyon Cascade',
    category: 'Hydrology · Plunge Flow',
    resolution: '1920 × 1080',
    description:
      'Vertical waterfall displacement paired with radial turquoise river currents and basalt cliff stabilization pins.',
    imageSrc: '/src/assets/images/preset_waterfall_canyon_1790836347322.jpg',
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      contrast: 10,
      saturation: 12,
      vignette: 18,
      lutPreset: 'emerald-canyon',
    },
    vectors: AUTO_FLOW_TEMPLATES[0].vectors,
    pins: AUTO_FLOW_TEMPLATES[0].pins,
    freezeStrokes: [],
    flowSettings: {
      speed: 1.1,
      amplitude: 42,
      loopMode: 'seamless-crossfade',
      particleOverlay: 'mist-drift',
      particleDensity: 40,
    },
  },
  {
    id: 'scene-aurora-mountain',
    title: 'Twilight Aurora Peak',
    category: 'Atmospheric · Sky & Reflection',
    resolution: '1920 × 1080',
    description:
      'Sweeping aurora borealis sky ribbons and mirrored alpine lake ripples while the snow-capped summit stays anchored.',
    imageSrc: '/src/assets/images/preset_aurora_mountain_1790836360740.jpg',
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      contrast: 14,
      saturation: 16,
      warmth: -8,
      vignette: 22,
      lutPreset: 'nordic-frost',
    },
    vectors: AUTO_FLOW_TEMPLATES[1].vectors,
    pins: AUTO_FLOW_TEMPLATES[1].pins,
    freezeStrokes: [],
    flowSettings: {
      speed: 0.85,
      amplitude: 36,
      loopMode: 'seamless-crossfade',
      particleOverlay: 'alpine-snow',
      particleDensity: 30,
    },
  },
  {
    id: 'scene-espresso-steam',
    title: 'Artisan Espresso Plume',
    category: 'Still Life · Thermal Cinemagraph',
    resolution: '1600 × 1200',
    description:
      'Delicate S-curve thermal convection vectors animating rising espresso steam above a stationary stoneware cup.',
    imageSrc: '/src/assets/images/preset_espresso_steam_1790836371987.jpg',
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      contrast: 18,
      warmth: 12,
      vignette: 28,
      lutPreset: 'kodachrome',
    },
    vectors: AUTO_FLOW_TEMPLATES[2].vectors,
    pins: AUTO_FLOW_TEMPLATES[2].pins,
    freezeStrokes: [],
    flowSettings: {
      speed: 0.95,
      amplitude: 34,
      loopMode: 'harmonic-wave',
      particleOverlay: 'rising-steam',
      particleDensity: 35,
    },
  },
  {
    id: 'scene-coastal-waves',
    title: 'Volcanic Coastal Surge',
    category: 'Aerial · Ocean Dynamics',
    resolution: '1920 × 1080',
    description:
      'High-contrast turquoise surf vectors rolling onto frozen black volcanic sand in a continuous tidal loop.',
    imageSrc: '/src/assets/images/preset_coastal_waves_1790836385147.jpg',
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      contrast: 16,
      saturation: 10,
      vignette: 20,
      lutPreset: 'teal-amber',
    },
    vectors: AUTO_FLOW_TEMPLATES[3].vectors,
    pins: AUTO_FLOW_TEMPLATES[3].pins,
    freezeStrokes: [],
    flowSettings: {
      speed: 1.05,
      amplitude: 40,
      loopMode: 'seamless-crossfade',
      particleOverlay: 'mist-drift',
      particleDensity: 30,
    },
  },
];
