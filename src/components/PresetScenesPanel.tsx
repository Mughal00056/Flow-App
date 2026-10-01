import React from 'react';
import { ProjectScene } from '../types/studio';
import { ImagePlus, Layers, Play, Trash2 } from 'lucide-react';

interface PresetScenesPanelProps {
  scenes: ProjectScene[];
  activeSceneId: string;
  onSelectScene: (scene: ProjectScene) => void;
  onDeleteCustomScene: (id: string) => void;
  onUploadImageFile: (file: File) => void;
  onOpenFlowEditor: () => void;
}

export const PresetScenesPanel: React.FC<PresetScenesPanelProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onDeleteCustomScene,
  onUploadImageFile,
  onOpenFlowEditor,
}) => {
  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 border-l border-white/[0.08] bg-[#0E1017] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Preset Scenes & Library
          </h2>
          <p className="text-xs text-slate-400">
            Curated flow studies & your uploaded photos
          </p>
        </div>

        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap">
          <ImagePlus className="w-3.5 h-3.5" />
          <span>+ Add Photo</span>
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {scenes.map((scene) => {
          const isSelected = scene.id === activeSceneId;
          return (
            <div
              key={scene.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isSelected
                  ? 'bg-[#151928] border-sky-400'
                  : 'bg-[#11141E] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div
                onClick={() => onSelectScene(scene)}
                className="relative h-36 w-full bg-black cursor-pointer overflow-hidden group"
              >
                <img
                  src={scene.imageSrc}
                  alt={scene.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-300">
                      <span>{scene.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {scene.resolution}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-0.5">
                      {scene.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2.5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {scene.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-xs">
                  <div className="text-slate-400 font-mono tabular-nums">
                    <span>{scene.vectors.length} Vectors</span>
                    <span aria-hidden="true"> · </span>
                    <span>{scene.pins.length} Pins</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {scene.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomScene(scene.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove uploaded image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectScene(scene);
                        onOpenFlowEditor();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-medium transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Load & Animate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
