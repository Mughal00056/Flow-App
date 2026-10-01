import React, { useRef, useState, useCallback } from 'react';
import {
  ActiveMenuFeature,
  AnchorPin,
  FlowSettings,
  FlowVector,
  FreezeStroke,
  ImageAdjustments,
  ProjectScene,
} from './types/studio';
import {
  AutoFlowTemplate,
  AUTO_FLOW_TEMPLATES,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_FLOW_SETTINGS,
  INITIAL_PRESET_SCENES,
} from './data/presets';
import { StudioCanvas } from './components/StudioCanvas';
import { ImageToolPanel } from './components/ImageToolPanel';
import { FlowAnimationPanel } from './components/FlowAnimationPanel';
import { PresetScenesPanel } from './components/PresetScenesPanel';
import { ExportStudioPanel } from './components/ExportStudioPanel';

export default function App() {
  // Feature Menu state ('image-tool' | 'flow-animation' | 'preset-scenes' | 'export-studio')
  const [activeMenu, setActiveMenu] =
    useState<ActiveMenuFeature>('flow-animation');

  // Scenes library (includes curated presets + user-added images)
  const [scenes, setScenes] = useState<ProjectScene[]>(INITIAL_PRESET_SCENES);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    INITIAL_PRESET_SCENES[0].id
  );

  // Active workspace image & editing state
  const [imageSrc, setImageSrc] = useState<string>(
    INITIAL_PRESET_SCENES[0].imageSrc
  );
  const [imageTitle, setImageTitle] = useState<string>(
    INITIAL_PRESET_SCENES[0].title
  );
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    INITIAL_PRESET_SCENES[0].adjustments
  );
  const [vectors, setVectors] = useState<FlowVector[]>(
    INITIAL_PRESET_SCENES[0].vectors
  );
  const [pins, setPins] = useState<AnchorPin[]>(INITIAL_PRESET_SCENES[0].pins);
  const [freezeStrokes, setFreezeStrokes] = useState<FreezeStroke[]>(
    INITIAL_PRESET_SCENES[0].freezeStrokes
  );
  const [flowSettings, setFlowSettings] = useState<FlowSettings>({
    ...DEFAULT_FLOW_SETTINGS,
    ...INITIAL_PRESET_SCENES[0].flowSettings,
  });

  // Export & Recording state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecordingExport, setIsRecordingExport] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  // Load a scene from the preset/custom gallery
  const handleSelectScene = useCallback((scene: ProjectScene) => {
    setActiveSceneId(scene.id);
    setImageSrc(scene.imageSrc);
    setImageTitle(scene.title);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...scene.adjustments });
    setVectors(scene.vectors);
    setPins(scene.pins);
    setFreezeStrokes(scene.freezeStrokes);
    setFlowSettings((prev) => ({
      ...prev,
      ...scene.flowSettings,
      isPlaying: true,
    }));
  }, []);

  // Upload a new image from the user's device (works from Top Bar, Image Tool, Drag & Drop, or Preset Library)
  const handleUploadImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const cleanTitle =
        file.name.replace(/\.[^/.]+$/, '').slice(0, 32) || 'Custom Studio Image';
      const newSceneId = `custom-${Date.now()}`;

      // Give newly added images a subtle default sky/center flow vector so Flow works out of the box, while keeping it editable
      const initialVectors: FlowVector[] = [
        {
          id: `init-vec-${Date.now()}`,
          kind: 'path',
          strength: 1.15,
          radius: 0.12,
          points: [
            { x: 0.32, y: 0.48 },
            { x: 0.48, y: 0.48 },
            { x: 0.66, y: 0.48 },
          ],
        },
      ];

      const newScene: ProjectScene = {
        id: newSceneId,
        title: cleanTitle,
        category: 'User Upload · Custom Canvas',
        resolution: 'Custom Hi-Res',
        description:
          'Custom uploaded image ready for non-destructive color grading in Image Tool and vector motion in Flow Animation.',
        imageSrc: dataUrl,
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        vectors: initialVectors,
        pins: [],
        freezeStrokes: [],
        flowSettings: {
          speed: 1.0,
          amplitude: 38,
          loopMode: 'seamless-crossfade',
          particleOverlay: 'none',
        },
        isCustom: true,
      };

      setScenes((prev) => [newScene, ...prev]);
      setActiveSceneId(newScene.id);
      setImageSrc(dataUrl);
      setImageTitle(cleanTitle);
      setAdjustments({ ...DEFAULT_ADJUSTMENTS });
      setVectors(initialVectors);
      setPins([]);
      setFreezeStrokes([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDeleteCustomScene = useCallback(
    (id: string) => {
      setScenes((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        if (activeSceneId === id && remaining.length > 0) {
          handleSelectScene(remaining[0]);
        }
        return remaining;
      });
    },
    [activeSceneId, handleSelectScene]
  );

  // Flow Vector & Pin handlers
  const handleAddVector = useCallback((vector: FlowVector) => {
    setVectors((prev) => [...prev, vector]);
  }, []);

  const handleDeleteVector = useCallback((id: string) => {
    setVectors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleUndoLastVector = useCallback(() => {
    setVectors((prev) => prev.slice(0, -1));
  }, []);

  const handleClearVectors = useCallback(() => {
    setVectors([]);
  }, []);

  const handleAddPin = useCallback((pin: AnchorPin) => {
    setPins((prev) => [...prev, pin]);
  }, []);

  const handleDeletePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleAddFreezeStroke = useCallback((stroke: FreezeStroke) => {
    setFreezeStrokes((prev) => [...prev, stroke]);
  }, []);

  const handleClearPinsAndMask = useCallback(() => {
    setPins([]);
    setFreezeStrokes([]);
  }, []);

  const handleApplyTemplate = useCallback((template: AutoFlowTemplate) => {
    setVectors(template.vectors);
    setPins(template.pins);
    setFreezeStrokes([]);
    setFlowSettings((prev) => ({
      ...prev,
      isPlaying: true,
      particleOverlay: template.recommendedParticle,
    }));
  }, []);

  // Export Master Frame PNG
  const handleExportSnapshotPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeName = imageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${safeName || 'kinetix-flow'}-frame.png`;
    link.href = dataUrl;
    link.click();
  }, [imageTitle]);

  // Export Real-Time WebM Video Loop
  const handleRecordVideoLoop = useCallback(
    (durationSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas || isRecordingExport) return;

      // Ensure flow is playing while recording
      setFlowSettings((prev) => ({ ...prev, isPlaying: true }));
      setIsRecordingExport(true);
      setRecordingProgress(0);

      try {
        const stream = canvas.captureStream(60);
        const mimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];
        const supportedMime =
          mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

        const recorder = supportedMime
          ? new MediaRecorder(stream, {
              mimeType: supportedMime,
              videoBitsPerSecond: 8_000_000,
            })
          : new MediaRecorder(stream);

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const safeName = imageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          a.href = url;
          a.download = `${safeName || 'kinetix-flow'}-loop.webm`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          setIsRecordingExport(false);
          setRecordingProgress(0);
        };

        recorder.start(100);
        const startMs = performance.now();
        const totalMs = durationSec * 1000;

        const timer = setInterval(() => {
          const elapsed = performance.now() - startMs;
          const pct = Math.min(1, elapsed / totalMs);
          setRecordingProgress(pct);
          if (elapsed >= totalMs) {
            clearInterval(timer);
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
        }, 80);
      } catch {
        // Fallback to PNG snapshot if MediaRecorder is restricted
        handleExportSnapshotPng();
        setIsRecordingExport(false);
      }
    },
    [imageTitle, isRecordingExport, handleExportSnapshotPng]
  );

  // Save / Load Flow Rig JSON
  const handleExportProjectJson = useCallback(() => {
    const payload = {
      title: imageTitle,
      adjustments,
      vectors,
      pins,
      freezeStrokes,
      flowSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.flow.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, [imageTitle, adjustments, vectors, pins, freezeStrokes, flowSettings]);

  const handleImportProjectJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.adjustments) setAdjustments(parsed.adjustments);
        if (Array.isArray(parsed.vectors)) setVectors(parsed.vectors);
        if (Array.isArray(parsed.pins)) setPins(parsed.pins);
        if (Array.isArray(parsed.freezeStrokes))
          setFreezeStrokes(parsed.freezeStrokes);
        if (parsed.flowSettings) {
          setFlowSettings((prev) => ({ ...prev, ...parsed.flowSettings }));
        }
      } catch {
        // Ignore malformed JSON
      }
    };
    reader.readAsText(file);
  }, []);

  const menuLinks: { id: ActiveMenuFeature; label: string }[] = [
    { id: 'image-tool', label: 'Image Tool' },
    { id: 'flow-animation', label: 'Flow Animation' },
    { id: 'preset-scenes', label: 'Preset Scenes' },
    { id: 'export-studio', label: 'Export Studio' },
  ];

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#090A0F] text-[#F3F4F6] overflow-hidden">
      {/* Hidden global file input for "+ Add Image" action */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUploadImageFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Top Navigation Bar — Strictly adheres to the 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-[#0B0D14] shrink-0 z-20">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveMenu('flow-animation');
          }}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          Kinetix Flow
        </a>

        {/* Zone 2: Feature Menu Navigation Links (Clean Typography with Active/Hover Underline) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {menuLinks.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-white font-semibold underline decoration-sky-400 decoration-2 underline-offset-8'
                    : 'text-slate-400 hover:text-slate-100 hover:underline hover:underline-offset-8'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 2 Primary Actions (Add Image + Export Loop) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveMenu('image-tool');
              fileInputRef.current?.click();
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-[#161925] border border-white/15 rounded-lg hover:bg-[#1E2233] transition-colors whitespace-nowrap"
          >
            Add Image
          </button>
          <button
            type="button"
            onClick={() => setActiveMenu('export-studio')}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap"
          >
            Export Loop
          </button>
        </div>
      </header>

      {/* Mobile Feature Menu Strip (visible only below md breakpoint) */}
      <div className="flex md:hidden items-center justify-around px-3 py-2 border-b border-white/[0.08] bg-[#0E1017] shrink-0">
        {menuLinks.map((item) => {
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveMenu(item.id)}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-sky-300 underline decoration-sky-400 decoration-2 underline-offset-4 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main Studio Workspace: Live Interactive Canvas + Active Feature Inspector */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <StudioCanvas
          activeMenu={activeMenu}
          imageSrc={imageSrc}
          imageTitle={imageTitle}
          adjustments={adjustments}
          vectors={vectors}
          pins={pins}
          freezeStrokes={freezeStrokes}
          flowSettings={flowSettings}
          onAddVector={handleAddVector}
          onDeleteVector={handleDeleteVector}
          onAddPin={handleAddPin}
          onDeletePin={handleDeletePin}
          onAddFreezeStroke={handleAddFreezeStroke}
          onTogglePlay={() =>
            setFlowSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
          }
          onToggleOverlays={() =>
            setFlowSettings((prev) => ({
              ...prev,
              showOverlays: !prev.showOverlays,
            }))
          }
          onUploadImageFile={handleUploadImageFile}
          canvasRef={canvasRef}
          isRecordingExport={isRecordingExport}
        />

        {activeMenu === 'image-tool' && (
          <ImageToolPanel
            adjustments={adjustments}
            onChangeAdjustments={setAdjustments}
            onResetAdjustments={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS })}
            onUploadImageFile={handleUploadImageFile}
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={handleSelectScene}
            onSwitchToFlow={() => setActiveMenu('flow-animation')}
          />
        )}

        {activeMenu === 'flow-animation' && (
          <FlowAnimationPanel
            flowSettings={flowSettings}
            onChangeFlowSettings={setFlowSettings}
            vectorsCount={vectors.length}
            pinsCount={pins.length}
            freezeCount={freezeStrokes.length}
            onUndoLastVector={handleUndoLastVector}
            onClearVectors={handleClearVectors}
            onClearPinsAndMask={handleClearPinsAndMask}
            onApplyTemplate={handleApplyTemplate}
          />
        )}

        {activeMenu === 'preset-scenes' && (
          <PresetScenesPanel
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={handleSelectScene}
            onDeleteCustomScene={handleDeleteCustomScene}
            onUploadImageFile={handleUploadImageFile}
            onOpenFlowEditor={() => setActiveMenu('flow-animation')}
          />
        )}

        {activeMenu === 'export-studio' && (
          <ExportStudioPanel
            imageTitle={imageTitle}
            adjustments={adjustments}
            vectors={vectors}
            pins={pins}
            flowSettings={flowSettings}
            onExportSnapshotPng={handleExportSnapshotPng}
            onRecordVideoLoop={handleRecordVideoLoop}
            isRecordingExport={isRecordingExport}
            recordingProgress={recordingProgress}
            onExportProjectJson={handleExportProjectJson}
            onImportProjectJson={handleImportProjectJson}
          />
        )}
      </main>
    </div>
  );
}
