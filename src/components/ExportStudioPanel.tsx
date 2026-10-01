import React, { useState } from 'react';
import {
  AnchorPin,
  FlowSettings,
  FlowVector,
  ImageAdjustments,
} from '../types/studio';
import {
  Camera,
  CheckCircle2,
  Download,
  FileJson,
  Film,
  Loader2,
  Upload,
} from 'lucide-react';

interface ExportStudioPanelProps {
  imageTitle: string;
  adjustments: ImageAdjustments;
  vectors: FlowVector[];
  pins: AnchorPin[];
  flowSettings: FlowSettings;
  onExportSnapshotPng: () => void;
  onRecordVideoLoop: (durationSec: number) => void;
  isRecordingExport: boolean;
  recordingProgress: number;
  onExportProjectJson: () => void;
  onImportProjectJson: (file: File) => void;
}

export const ExportStudioPanel: React.FC<ExportStudioPanelProps> = ({
  imageTitle,
  adjustments,
  vectors,
  pins,
  flowSettings,
  onExportSnapshotPng,
  onRecordVideoLoop,
  isRecordingExport,
  recordingProgress,
  onExportProjectJson,
  onImportProjectJson,
}) => {
  const [durationSec, setDurationSec] = useState<number>(4);
  const [lastExportNotice, setLastExportNotice] = useState<string | null>(null);

  const handleSnapshot = () => {
    onExportSnapshotPng();
    setLastExportNotice('PNG Master Frame saved to downloads.');
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 border-l border-white/[0.08] bg-[#0E1017] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/[0.08]">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Export & Render Studio
        </h2>
        <p className="text-xs text-slate-400">
          Render seamless video loops, master frames, or project rigs
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary Specs Table */}
        <div className="p-3.5 rounded-xl bg-[#121520] border border-white/[0.07] space-y-2">
          <div className="text-xs font-semibold text-slate-200 pb-1.5 border-b border-white/[0.06]">
            Active Sequence Specifications
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Source Title</span>
            <span className="text-slate-200 font-medium truncate max-w-[180px]">
              {imageTitle}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Loop Algorithm</span>
            <span className="text-sky-300 font-mono">{flowSettings.loopMode}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Flow Rig Density</span>
            <span className="text-slate-200 font-mono tabular-nums">
              {vectors.length} vectors · {pins.length} pins
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Color Grade Profile</span>
            <span className="text-slate-200 font-mono uppercase">
              {adjustments.lutPreset}
            </span>
          </div>
        </div>

        {/* 01. Animated WebM Video Loop Export */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-200">
            01. Render Motion Loop Video (WebM 60fps)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Captures the live vector-displaced canvas stream without editor UI overlays.
          </p>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-300">Loop Duration</span>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 6].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={isRecordingExport}
                  onClick={() => setDurationSec(sec)}
                  className={`py-2 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                    durationSec === sec
                      ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-semibold'
                      : 'bg-[#121520] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {sec}.0 Seconds
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isRecordingExport}
            onClick={() => onRecordVideoLoop(durationSec)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 text-xs font-semibold transition-colors"
          >
            {isRecordingExport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Rendering Loop ({Math.round(recordingProgress * 100)}%)...
                </span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Render & Download Video Loop (.webm)</span>
              </>
            )}
          </button>
        </div>

        {/* 02. High-Res Still PNG Export */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="text-xs font-semibold text-slate-200">
            02. Color-Graded Still Frame (.png)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Exports the current color-graded canvas frame as a lossless PNG image.
          </p>
          <button
            type="button"
            onClick={handleSnapshot}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#161A28] hover:bg-[#1E2336] border border-white/15 text-slate-100 text-xs font-semibold transition-colors"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Download PNG Master Frame</span>
          </button>
        </div>

        {/* 03. Save / Load Flow Rig JSON */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="text-xs font-semibold text-slate-200">
            03. Flow Rig Project File (.json)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Save your drawn motion vectors, anchor pins, and color grade adjustments to disk or restore a saved rig.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onExportProjectJson();
                setLastExportNotice('Flow Rig JSON exported.');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#121520] hover:bg-[#181C2B] border border-white/10 text-xs text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Save Rig</span>
            </button>

            <label className="cursor-pointer flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#121520] hover:bg-[#181C2B] border border-white/10 text-xs text-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Rig</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onImportProjectJson(f);
                    setLastExportNotice('Flow Rig JSON restored.');
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {lastExportNotice && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{lastExportNotice}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
