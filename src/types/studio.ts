export type ActiveMenuFeature =
  | 'image-tool'
  | 'flow-animation'
  | 'preset-scenes'
  | 'export-studio';

export type AspectRatioOption = 'original' | '16:9' | '4:3' | '1:1' | '9:16';

export type LutPresetId =
  | 'none'
  | 'leica-mono'
  | 'teal-amber'
  | 'nordic-frost'
  | 'kodachrome'
  | 'emerald-canyon'
  | 'golden-hour'
  | 'velvet-nocturne';

export interface TextOverlayConfig {
  enabled: boolean;
  text: string;
  subtext: string;
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  fontSize: number; // px at 1000w reference
  color: string;
  opacity: number;
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100 (default 0)
  contrast: number; // -100 to 100 (default 0)
  saturation: number; // -100 to 100 (default 0)
  warmth: number; // -100 to 100 (default 0)
  tint: number; // -100 to 100 (default 0)
  exposure: number; // -100 to 100 (default 0)
  vignette: number; // 0 to 100 (default 15)
  sharpness: number; // 0 to 100 (default 10)
  grain: number; // 0 to 100 (default 0)
  blur: number; // 0 to 20 (default 0)
  rotation: number; // 0, 90, 180, 270
  fineAngle: number; // -45 to 45
  flipH: boolean;
  flipV: boolean;
  aspectRatio: AspectRatioOption;
  lutPreset: LutPresetId;
  textOverlay: TextOverlayConfig;
}

export interface NormalizedPoint {
  x: number; // 0..1
  y: number; // 0..1
}

export interface FlowVector {
  id: string;
  points: NormalizedPoint[];
  strength: number; // 0.2 to 2.5
  radius: number; // 0.04 to 0.25 normalized influence radius
  kind: 'path' | 'brush';
}

export interface AnchorPin {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  radius: number; // 0.04 to 0.18 normalized freeze radius
}

export interface FreezeStroke {
  id: string;
  points: NormalizedPoint[];
  radius: number; // 0.02 to 0.15
  mode: 'freeze' | 'unfreeze';
}

export type FlowToolMode =
  | 'path-arrow'
  | 'motion-brush'
  | 'anchor-pin'
  | 'freeze-brush'
  | 'unfreeze-eraser'
  | 'delete-vector';

export type LoopAlgorithm =
  | 'seamless-crossfade'
  | 'harmonic-wave'
  | 'pulse-bounce'
  | 'vortex-curl';

export type ParticleOverlayType =
  | 'none'
  | 'mist-drift'
  | 'rising-steam'
  | 'golden-embers'
  | 'rain-streaks'
  | 'alpine-snow';

export interface FlowSettings {
  isPlaying: boolean;
  speed: number; // 0.2 to 3.0
  amplitude: number; // 5 to 100
  loopMode: LoopAlgorithm;
  showOverlays: boolean;
  showVelocityField: boolean;
  activeFlowTool: FlowToolMode;
  brushRadius: number; // 0.03 to 0.20
  vectorStrength: number; // 0.4 to 2.0
  particleOverlay: ParticleOverlayType;
  particleDensity: number; // 10 to 100
}

export interface ProjectScene {
  id: string;
  title: string;
  category: string;
  resolution: string;
  description: string;
  imageSrc: string;
  adjustments: ImageAdjustments;
  vectors: FlowVector[];
  pins: AnchorPin[];
  freezeStrokes: FreezeStroke[];
  flowSettings: Partial<FlowSettings>;
  isCustom?: boolean;
}
