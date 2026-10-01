import React, { useState } from 'react';
import {
  AspectRatioOption,
  ImageAdjustments,
  LutPresetId,
  ProjectScene,
} from '../types/studio';
import { DEFAULT_ADJUSTMENTS, LUT_PRESETS } from '../data/presets';
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  ImagePlus,
  Palette,
  RotateCcw,
  RotateCw,
  Sliders,
  Type,
  Wand2,
  ArrowRight,
} from 'lucide-react';

interface ImageToolPanelProps {
  adjustments: ImageAdjustments;
  onChangeAdjustments: (next: ImageAdjustments) => void;
  onResetAdjustments: () => void;
  onUploadImageFile: (file: File) => void;
  scenes: ProjectScene[];
  activeSceneId: string;
  onSelectScene: (scene: ProjectScene) => void;
  onSwitchToFlow: () => void;
}

type ImageSubTab = 'adjust' | 'luts' | 'transform' | 'typography';

export const ImageToolPanel: React.FC<ImageToolPanelProps> = ({
  adjustments,
  onChangeAdjustments,
  onResetAdjustments,
  onUploadImageFile,
  scenes,
  activeSceneId,
  onSelectScene,
  onSwitchToFlow,
}) => {
  const [subTab, setSubTab] = useState<ImageSubTab>('adjust');

  const updateField = <K extends keyof ImageAdjustments>(
    key: K,
    value: ImageAdjustments[K]
  ) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: value,
    });
  };

  const handleApplyLut = (lutId: LutPresetId) => {
    const found = LUT_PRESETS.find((l) => l.id === lutId);
    if (!found) return;
    onChangeAdjustments({
      ...adjustments,
      ...found.adjustments,
      lutPreset: lutId,
    });
  };

  const renderSlider = (
    label: string,
    key: keyof ImageAdjustments,
    min: number,
    max: number,
    unit = ''
  ) => {
    const val = adjustments[key] as number;
    const defaultVal = DEFAULT_ADJUSTMENTS[key] as number;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-slate-200">
              {val > 0 && min < 0 ? `+${val}` : val}
              {unit}
            </span>
            {val !== defaultVal && (
              <button
                type="button"
                onClick={() => updateField(key, defaultVal as never)}
                className="text-[10px] text-sky-400 hover:underline"
                title="Reset parameter"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={val}
          onChange={(e) => updateField(key, Number(e.target.value) as never)}
          className="studio-slider"
        />
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 border-l border-white/[0.08] bg-[#0E1017] flex flex-col h-full overflow-hidden">
      {/* Top Image Add / Upload Action Box */}
      <div className="p-4 border-b border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Image Studio Tool
            </h2>
            <p className="text-xs text-slate-400">
              Add your image, grade tones, then animate in Flow
            </p>
          </div>
          <button
            type="button"
            onClick={onResetAdjustments}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-[#161925] border border-white/10 rounded-md transition-colors whitespace-nowrap"
            title="Reset all image edits"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Primary Add Image Upload Button + Send to Flow Button */}
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#161A29] hover:bg-[#1E2438] border border-sky-400/30 text-xs font-semibold text-sky-300 transition-colors whitespace-nowrap">
            <ImagePlus className="w-4 h-4 shrink-0" />
            <span>+ Add Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadImageFile(file);
                  e.target.value = '';
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={onSwitchToFlow}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <span>Animate in Flow</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {/* Quick Media Strip for switching active image */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Loaded Studio Images ({scenes.length})</span>
            <span>Click to switch</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {scenes.map((scene) => {
              const isSelected = scene.id === activeSceneId;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onSelectScene(scene)}
                  className={`group relative w-14 h-10 rounded-md overflow-hidden border shrink-0 transition-all ${
                    isSelected
                      ? 'border-sky-400 ring-1 ring-sky-400/50'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                  title={scene.title}
                >
                  <img
                    src={scene.imageSrc}
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Segmented Control Sub-Navigation */}
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.06]">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#090A0F] rounded-lg border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSubTab('adjust')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'adjust'
                ? 'bg-[#181C2A] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('luts')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'luts'
                ? 'bg-[#181C2A] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Looks</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('transform')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'transform'
                ? 'bg-[#181C2A] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('typography')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'typography'
                ? 'bg-[#181C2A] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {subTab === 'adjust' && (
          <>
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-200 pb-1 border-b border-white/[0.06]">
                01. Luminance & Exposure
              </div>
              {renderSlider('Exposure', 'exposure', -50, 50)}
              {renderSlider('Brightness', 'brightness', -100, 100)}
              {renderSlider('Contrast', 'contrast', -100, 100)}
            </div>

            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold text-slate-200 pb-1 border-b border-white/[0.06]">
                02. Color Balance
              </div>
              {renderSlider('Saturation', 'saturation', -100, 100)}
              {renderSlider('Temperature (Warmth)', 'warmth', -100, 100)}
              {renderSlider('Tint (Green / Magenta)', 'tint', -100, 100)}
            </div>

            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold text-slate-200 pb-1 border-b border-white/[0.06]">
                03. Optics & Film Texture
              </div>
              {renderSlider('Optical Vignette', 'vignette', 0, 100, '%')}
              {renderSlider('Analog Film Grain', 'grain', 0, 100, '%')}
              {renderSlider('Atmospheric Soft Blur', 'blur', 0, 20, 'px')}
            </div>
          </>
        )}

        {subTab === 'luts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Curated Color Grade Profiles</span>
              <span className="font-mono tabular-nums">8 Looks</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {LUT_PRESETS.map((lut) => {
                const active = adjustments.lutPreset === lut.id;
                return (
                  <button
                    key={lut.id}
                    type="button"
                    onClick={() => handleApplyLut(lut.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      active
                        ? 'bg-[#171C2B] border-sky-400 text-white'
                        : 'bg-[#121520] border-white/[0.07] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-full h-7 rounded-md bg-gradient-to-r ${lut.swatch} mb-2 flex items-center justify-end px-2`}
                    >
                      <span className="text-[10px] font-mono text-white/90">
                        {lut.tag}
                      </span>
                    </div>
                    <span className="text-xs font-semibold truncate">
                      {lut.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {subTab === 'transform' && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-200">
                01. Aspect Ratio Framing
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(
                  ['original', '16:9', '4:3', '1:1', '9:16'] as AspectRatioOption[]
                ).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => updateField('aspectRatio', ratio)}
                    className={`py-2 px-1.5 rounded-md text-xs font-mono tabular-nums border transition-colors whitespace-nowrap ${
                      adjustments.aspectRatio === ratio
                        ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-semibold'
                        : 'bg-[#131622] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {ratio === 'original' ? 'Orig' : ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-200">
                02. Orientation & Mirror
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateField('rotation', (adjustments.rotation + 270) % 360)
                  }
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#131622] hover:bg-[#191D2D] border border-white/10 text-xs text-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rotate -90°</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateField('rotation', (adjustments.rotation + 90) % 360)
                  }
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#131622] hover:bg-[#191D2D] border border-white/10 text-xs text-slate-200"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate +90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('flipH', !adjustments.flipH)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs ${
                    adjustments.flipH
                      ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                      : 'bg-[#131622] border-white/10 text-slate-200'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('flipV', !adjustments.flipV)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs ${
                    adjustments.flipV
                      ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                      : 'bg-[#131622] border-white/10 text-slate-200'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {renderSlider('Horizon Straighten', 'fineAngle', -45, 45, '°')}
            </div>
          </div>
        )}

        {subTab === 'typography' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Editorial Title Overlay
              </span>
              <button
                type="button"
                onClick={() =>
                  updateField('textOverlay', {
                    ...adjustments.textOverlay,
                    enabled: !adjustments.textOverlay.enabled,
                  })
                }
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                  adjustments.textOverlay.enabled
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-[#131622] border-white/10 text-slate-400'
                }`}
              >
                {adjustments.textOverlay.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Primary Headline
                </label>
                <input
                  type="text"
                  value={adjustments.textOverlay.text}
                  onChange={(e) =>
                    updateField('textOverlay', {
                      ...adjustments.textOverlay,
                      enabled: true,
                      text: e.target.value,
                    })
                  }
                  placeholder="Enter display title..."
                  className="w-full px-3 py-2 rounded-lg bg-[#131622] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Secondary Caption / Metadata
                </label>
                <input
                  type="text"
                  value={adjustments.textOverlay.subtext}
                  onChange={(e) =>
                    updateField('textOverlay', {
                      ...adjustments.textOverlay,
                      enabled: true,
                      subtext: e.target.value,
                    })
                  }
                  placeholder="Enter subtitle..."
                  className="w-full px-3 py-2 rounded-lg bg-[#131622] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Font Size</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {adjustments.textOverlay.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={64}
                  value={adjustments.textOverlay.fontSize}
                  onChange={(e) =>
                    updateField('textOverlay', {
                      ...adjustments.textOverlay,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="studio-slider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Horizontal X</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {Math.round(adjustments.textOverlay.x * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.03}
                    max={0.8}
                    step={0.01}
                    value={adjustments.textOverlay.x}
                    onChange={(e) =>
                      updateField('textOverlay', {
                        ...adjustments.textOverlay,
                        x: Number(e.target.value),
                      })
                    }
                    className="studio-slider"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Vertical Y</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {Math.round(adjustments.textOverlay.y * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.94}
                    step={0.01}
                    value={adjustments.textOverlay.y}
                    onChange={(e) =>
                      updateField('textOverlay', {
                        ...adjustments.textOverlay,
                        y: Number(e.target.value),
                      })
                    }
                    className="studio-slider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
