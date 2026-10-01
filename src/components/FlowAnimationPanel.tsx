import React from 'react';
import {
  AnchorPin,
  FlowSettings,
  FlowToolMode,
  FlowVector,
  LoopAlgorithm,
  ParticleOverlayType,
} from '../types/studio';
import { AUTO_FLOW_TEMPLATES, AutoFlowTemplate } from '../data/presets';
import {
  Anchor,
  Brush,
  Compass,
  Eraser,
  Flame,
  Grid,
  MoveUpRight,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Undo2,
  Waves,
  Wind,
} from 'lucide-react';

interface FlowAnimationPanelProps {
  flowSettings: FlowSettings;
  onChangeFlowSettings: (next: FlowSettings) => void;
  vectorsCount: number;
  pinsCount: number;
  freezeCount: number;
  onUndoLastVector: () => void;
  onClearVectors: () => void;
  onClearPinsAndMask: () => void;
  onApplyTemplate: (template: AutoFlowTemplate) => void;
}

export const FlowAnimationPanel: React.FC<FlowAnimationPanelProps> = ({
  flowSettings,
  onChangeFlowSettings,
  vectorsCount,
  pinsCount,
  freezeCount,
  onUndoLastVector,
  onClearVectors,
  onClearPinsAndMask,
  onApplyTemplate,
}) => {
  const updateSetting = <K extends keyof FlowSettings>(
    key: K,
    value: FlowSettings[K]
  ) => {
    onChangeFlowSettings({
      ...flowSettings,
      [key]: value,
    });
  };

  const tools: {
    id: FlowToolMode;
    label: string;
    hint: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'path-arrow',
      label: 'Flow Path',
      hint: 'Draw directional motion arrows',
      icon: <MoveUpRight className="w-4 h-4" />,
      accent: 'border-sky-400 bg-sky-500/15 text-sky-300',
    },
    {
      id: 'motion-brush',
      label: 'Motion Brush',
      hint: 'Paint wide fluid flow streams',
      icon: <Wind className="w-4 h-4" />,
      accent: 'border-sky-400 bg-sky-500/15 text-sky-300',
    },
    {
      id: 'anchor-pin',
      label: 'Anchor Pin',
      hint: 'Click to freeze stationary points',
      icon: <Anchor className="w-4 h-4" />,
      accent: 'border-emerald-400 bg-emerald-500/15 text-emerald-300',
    },
    {
      id: 'freeze-brush',
      label: 'Freeze Mask',
      hint: 'Brush over areas to lock still',
      icon: <ShieldAlert className="w-4 h-4" />,
      accent: 'border-rose-400 bg-rose-500/15 text-rose-300',
    },
    {
      id: 'unfreeze-eraser',
      label: 'Unfreeze',
      hint: 'Restore motion to masked areas',
      icon: <Brush className="w-4 h-4" />,
      accent: 'border-amber-400 bg-amber-500/15 text-amber-300',
    },
    {
      id: 'delete-vector',
      label: 'Remove Item',
      hint: 'Click any vector or pin to delete',
      icon: <Eraser className="w-4 h-4" />,
      accent: 'border-red-400 bg-red-500/15 text-red-300',
    },
  ];

  const loopModes: { id: LoopAlgorithm; label: string; desc: string }[] = [
    {
      id: 'seamless-crossfade',
      label: 'Seamless Flow',
      desc: 'Dual-phase continuous directional displacement',
    },
    {
      id: 'harmonic-wave',
      label: 'Harmonic Ripple',
      desc: 'Traveling sinusoidal fluid waves along vectors',
    },
    {
      id: 'pulse-bounce',
      label: 'Elastic Pulse',
      desc: 'Smooth rhythmic back-and-forth oscillation',
    },
    {
      id: 'vortex-curl',
      label: 'Vortex Swirl',
      desc: 'Rotational curl turbulence along vector field',
    },
  ];

  const particleOptions: { id: ParticleOverlayType; label: string }[] = [
    { id: 'none', label: 'Off' },
    { id: 'mist-drift', label: 'Canyon Mist' },
    { id: 'rising-steam', label: 'Thermal Steam' },
    { id: 'golden-embers', label: 'Golden Embers' },
    { id: 'rain-streaks', label: 'Rain Streaks' },
    { id: 'alpine-snow', label: 'Alpine Snow' },
  ];

  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 border-l border-white/[0.08] bg-[#0E1017] flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Flow Animation Studio
          </h2>
          <p className="text-xs text-slate-400">
            Draw motion vectors & anchor pins directly on canvas
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndoLastVector}
            disabled={vectorsCount === 0}
            className="p-1.5 rounded-md bg-[#161925] border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            title="Undo last flow vector"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClearVectors}
            disabled={vectorsCount === 0}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#161925] border border-white/10 text-xs text-slate-300 hover:text-rose-300 disabled:opacity-40 transition-colors whitespace-nowrap"
            title="Clear all flow vectors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Flow</span>
          </button>
        </div>
      </div>

      {/* Scrollable Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 01. Interactive Vector & Mask Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              01. Canvas Flow & Freeze Tools
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              {vectorsCount} vec · {pinsCount} pin
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => {
              const active = flowSettings.activeFlowTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => updateSetting('activeFlowTool', tool.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    active
                      ? tool.accent
                      : 'bg-[#121520] border-white/[0.07] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{tool.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {tool.label}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {tool.hint}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tool Radius & Strength Sliders */}
          <div className="pt-2 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Influence Radius</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {Math.round(flowSettings.brushRadius * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.04}
                max={0.22}
                step={0.01}
                value={flowSettings.brushRadius}
                onChange={(e) =>
                  updateSetting('brushRadius', parseFloat(e.target.value))
                }
                className="studio-slider"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Vector Velocity Strength</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {flowSettings.vectorStrength.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.2}
                step={0.05}
                value={flowSettings.vectorStrength}
                onChange={(e) =>
                  updateSetting('vectorStrength', parseFloat(e.target.value))
                }
                className="studio-slider"
              />
            </div>

            {(pinsCount > 0 || freezeCount > 0) && (
              <button
                type="button"
                onClick={onClearPinsAndMask}
                className="w-full py-1.5 px-3 rounded-md bg-[#151824] hover:bg-[#1C2030] border border-white/10 text-xs text-slate-300 transition-colors"
              >
                Reset Anchor Pins & Freeze Mask ({pinsCount + freezeCount})
              </button>
            )}
          </div>
        </div>

        {/* 02. Motion Kinematics & Loop Mode */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              02. Loop Kinematics
            </span>
            <button
              type="button"
              onClick={() =>
                updateSetting(
                  'showVelocityField',
                  !flowSettings.showVelocityField
                )
              }
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                flowSettings.showVelocityField
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#131622] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Field Grid</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {loopModes.map((m) => {
              const active = flowSettings.loopMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateSetting('loopMode', m.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    active
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-[#121520] border-white/[0.07] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Animation Cycle Speed</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {flowSettings.speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.8}
                step={0.05}
                value={flowSettings.speed}
                onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                className="studio-slider"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Displacement Amplitude</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {flowSettings.amplitude} px
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={90}
                step={2}
                value={flowSettings.amplitude}
                onChange={(e) =>
                  updateSetting('amplitude', parseInt(e.target.value, 10))
                }
                className="studio-slider"
              />
            </div>
          </div>
        </div>

        {/* 03. One-Click Auto-Flow Templates */}
        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              03. Instant Auto-Flow Rigs
            </span>
            <span className="text-[11px] text-slate-400">1-Click Setup</span>
          </div>
          <div className="space-y-1.5">
            {AUTO_FLOW_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121520] hover:bg-[#171C2B] border border-white/[0.07] hover:border-sky-400/40 text-left transition-all group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate">
                    {tpl.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {tpl.subtitle}
                  </div>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-sky-400 shrink-0">
                  Apply →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 04. Atmospheric Flow Particles */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="text-xs font-semibold text-slate-200">
            04. Atmospheric Particle Synthesis
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {particleOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSetting('particleOverlay', opt.id)}
                className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors truncate ${
                  flowSettings.particleOverlay === opt.id
                    ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                    : 'bg-[#121520] border-white/[0.07] text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {flowSettings.particleOverlay !== 'none' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Particle Density</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {flowSettings.particleDensity} units
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={flowSettings.particleDensity}
                onChange={(e) =>
                  updateSetting('particleDensity', parseInt(e.target.value, 10))
                }
                className="studio-slider"
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
