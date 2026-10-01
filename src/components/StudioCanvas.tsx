import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActiveMenuFeature,
  AnchorPin,
  FlowSettings,
  FlowVector,
  FreezeStroke,
  ImageAdjustments,
  NormalizedPoint,
} from '../types/studio';
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  SplitSquareHorizontal,
  Upload,
  Sparkles,
} from 'lucide-react';

interface StudioCanvasProps {
  activeMenu: ActiveMenuFeature;
  imageSrc: string;
  imageTitle: string;
  adjustments: ImageAdjustments;
  vectors: FlowVector[];
  pins: AnchorPin[];
  freezeStrokes: FreezeStroke[];
  flowSettings: FlowSettings;
  onAddVector: (vector: FlowVector) => void;
  onDeleteVector: (id: string) => void;
  onAddPin: (pin: AnchorPin) => void;
  onDeletePin: (id: string) => void;
  onAddFreezeStroke: (stroke: FreezeStroke) => void;
  onTogglePlay: () => void;
  onToggleOverlays: () => void;
  onUploadImageFile: (file: File) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isRecordingExport: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

const GRID_W = 96;
const GRID_H = 64;

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  activeMenu,
  imageSrc,
  imageTitle,
  adjustments,
  vectors,
  pins,
  freezeStrokes,
  flowSettings,
  onAddVector,
  onDeleteVector,
  onAddPin,
  onDeletePin,
  onAddFreezeStroke,
  onTogglePlay,
  onToggleOverlays,
  onUploadImageFile,
  canvasRef,
  isRecordingExport,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const baseImageDataRef = useRef<ImageData | null>(null);
  const rawImageDataRef = useRef<ImageData | null>(null);
  const outImageDataRef = useRef<ImageData | null>(null);

  // Precomputed velocity field on GRID_W x GRID_H
  const fieldVxRef = useRef<Float32Array>(new Float32Array(GRID_W * GRID_H));
  const fieldVyRef = useRef<Float32Array>(new Float32Array(GRID_W * GRID_H));
  const fieldFreezeRef = useRef<Float32Array>(new Float32Array(GRID_W * GRID_H));

  // Interactive drawing state
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<NormalizedPoint[]>([]);
  const [cursorPos, setCursorPos] = useState<NormalizedPoint | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 450,
  });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 1920,
    height: 1080,
  });
  const [compareSplit, setCompareSplit] = useState<boolean>(false);
  const [splitX, setSplitX] = useState<number>(0.5);
  const [zoom, setZoom] = useState<number>(1);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);

  const particlesRef = useRef<Particle[]>([]);

  // 1. Load source image whenever imageSrc changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      loadedImageRef.current = img;
      setNaturalSize({
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
      });
      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageError(true);
    };

    img.src = imageSrc;
  }, [imageSrc]);

  // 2. Build color-graded base buffer whenever imageLoaded or adjustments change
  useEffect(() => {
    const img = loadedImageRef.current;
    if (!img || !imageLoaded) return;

    // Determine target aspect ratio & working buffer size (max 760px on longest side for 60fps real-time pixel displacement)
    let srcW = img.naturalWidth || 1280;
    let srcH = img.naturalHeight || 720;

    let targetRatio = srcW / srcH;
    if (adjustments.aspectRatio === '16:9') targetRatio = 16 / 9;
    else if (adjustments.aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (adjustments.aspectRatio === '1:1') targetRatio = 1;
    else if (adjustments.aspectRatio === '9:16') targetRatio = 9 / 16;

    const maxDim = 720;
    let workW = maxDim;
    let workH = Math.round(maxDim / targetRatio);
    if (workH > maxDim) {
      workH = maxDim;
      workW = Math.round(maxDim * targetRatio);
    }
    // Ensure even dimensions
    workW = Math.max(320, workW - (workW % 2));
    workH = Math.max(240, workH - (workH % 2));

    setDimensions({ width: workW, height: workH });

    if (!baseCanvasRef.current) {
      baseCanvasRef.current = document.createElement('canvas');
    }
    if (!rawCanvasRef.current) {
      rawCanvasRef.current = document.createElement('canvas');
    }

    const baseCanvas = baseCanvasRef.current;
    const rawCanvas = rawCanvasRef.current;
    baseCanvas.width = workW;
    baseCanvas.height = workH;
    rawCanvas.width = workW;
    rawCanvas.height = workH;

    const ctx = baseCanvas.getContext('2d', { willReadFrequently: true });
    const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !rawCtx) return;

    // Compute center-crop rectangle from source image
    let cropW = srcW;
    let cropH = srcH;
    const currentRatio = srcW / srcH;
    if (currentRatio > targetRatio) {
      cropW = srcH * targetRatio;
    } else {
      cropH = srcW / targetRatio;
    }
    const cropX = (srcW - cropW) * 0.5;
    const cropY = (srcH - cropH) * 0.5;

    // Draw raw unedited reference for split comparison
    rawCtx.clearRect(0, 0, workW, workH);
    rawCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, workW, workH);
    rawImageDataRef.current = rawCtx.getImageData(0, 0, workW, workH);

    // Draw transformed image onto baseCanvas
    ctx.save();
    ctx.clearRect(0, 0, workW, workH);
    ctx.translate(workW / 2, workH / 2);

    const totalAngleRad =
      ((adjustments.rotation + adjustments.fineAngle) * Math.PI) / 180;
    ctx.rotate(totalAngleRad);

    // Zoom slightly when fineAngle is non-zero to avoid dark corners
    const fineScale =
      Math.abs(adjustments.fineAngle) > 0.2
        ? 1 + Math.abs(adjustments.fineAngle) * 0.012
        : 1;
    ctx.scale(
      (adjustments.flipH ? -1 : 1) * fineScale,
      (adjustments.flipV ? -1 : 1) * fineScale
    );

    if (adjustments.blur > 0) {
      ctx.filter = `blur(${adjustments.blur * 0.5}px)`;
    }

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropW,
      cropH,
      -workW / 2,
      -workH / 2,
      workW,
      workH
    );
    ctx.restore();

    // Apply pixel-level Color Grading (Brightness, Contrast, Saturation, Exposure, Warmth, Tint, Grain, Vignette)
    const imgData = ctx.getImageData(0, 0, workW, workH);
    const data = imgData.data;

    const brightOffset = adjustments.brightness * 1.8 + adjustments.exposure * 2.1;
    const contrastFactor =
      (259 * (adjustments.contrast * 1.6 + 255)) /
      (255 * (259 - adjustments.contrast * 1.6));
    const satFactor = 1 + adjustments.saturation / 100;
    const warmthR = adjustments.warmth * 0.85;
    const warmthB = -adjustments.warmth * 0.85;
    const tintG = -adjustments.tint * 0.65;
    const grainAmt = adjustments.grain * 0.55;
    const vigStrength = adjustments.vignette / 100;

    const halfW = workW * 0.5;
    const halfH = workH * 0.5;
    const invHalfW = 1 / halfW;
    const invHalfH = 1 / halfH;

    for (let y = 0; y < workH; y++) {
      const dy = (y - halfH) * invHalfH;
      const dy2 = dy * dy;
      for (let x = 0; x < workW; x++) {
        const idx = (y * workW + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        // 1. Brightness & Exposure
        r += brightOffset;
        g += brightOffset;
        b += brightOffset;

        // 2. Contrast
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        // 3. Warmth & Tint
        r += warmthR;
        b += warmthB;
        g += tintG;

        // 4. Saturation
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma + (r - luma) * satFactor;
        g = luma + (g - luma) * satFactor;
        b = luma + (b - luma) * satFactor;

        // 5. Vignette
        if (vigStrength > 0.01) {
          const dx = (x - halfW) * invHalfW;
          const distSq = dx * dx + dy2;
          const vig = Math.max(0.15, 1 - distSq * vigStrength * 0.68);
          r *= vig;
          g *= vig;
          b *= vig;
        }

        // 6. Film Grain
        if (grainAmt > 0.5) {
          const noise = (Math.random() - 0.5) * grainAmt;
          r += noise;
          g += noise;
          b += noise;
        }

        data[idx] = r < 0 ? 0 : r > 255 ? 255 : r;
        data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Optional Text Overlay baked into baseCanvas so it can either stay crisp or be part of export
    if (adjustments.textOverlay.enabled && adjustments.textOverlay.text.trim()) {
      ctx.save();
      ctx.globalAlpha = adjustments.textOverlay.opacity;
      const scaleRatio = workW / 900;
      const mainPx = Math.max(14, Math.round(adjustments.textOverlay.fontSize * scaleRatio));
      ctx.font = `700 ${mainPx}px "Syne", sans-serif`;
      ctx.fillStyle = adjustments.textOverlay.color;
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 12;
      const tx = adjustments.textOverlay.x * workW;
      const ty = adjustments.textOverlay.y * workH;
      ctx.fillText(adjustments.textOverlay.text, tx, ty);

      if (adjustments.textOverlay.subtext.trim()) {
        const subPx = Math.max(10, Math.round(mainPx * 0.44));
        ctx.font = `500 ${subPx}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(248, 250, 252, 0.82)';
        ctx.fillText(adjustments.textOverlay.subtext, tx, ty + subPx * 1.65);
      }
      ctx.restore();
    }

    const finalBase = ctx.getImageData(0, 0, workW, workH);
    baseImageDataRef.current = finalBase;
    outImageDataRef.current = new ImageData(workW, workH);
  }, [imageLoaded, adjustments]);

  // 3. Recompute 2D Velocity Vector Field whenever vectors, pins, or freezeStrokes change
  useEffect(() => {
    const vxArr = fieldVxRef.current;
    const vyArr = fieldVyRef.current;
    const freezeArr = fieldFreezeRef.current;

    vxArr.fill(0);
    vyArr.fill(0);
    freezeArr.fill(1); // 1 = free to move, 0 = frozen

    // A. Compute freeze attenuation from AnchorPins and FreezeStrokes
    for (let gy = 0; gy < GRID_H; gy++) {
      const ny = (gy + 0.5) / GRID_H;
      for (let gx = 0; gx < GRID_W; gx++) {
        const nx = (gx + 0.5) / GRID_W;
        const gIdx = gy * GRID_W + gx;

        let mobility = 1.0;

        // Anchor pins dampen movement smoothly around their radius
        for (let p = 0; p < pins.length; p++) {
          const pin = pins[p];
          const dx = nx - pin.x;
          const dy = ny - pin.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pin.radius) {
            const t = dist / pin.radius;
            const factor = t * t * (3 - 2 * t); // smoothstep 0..1
            mobility = Math.min(mobility, factor);
          }
        }

        // Freeze strokes either lock (0) or unlock (1)
        for (let s = 0; s < freezeStrokes.length; s++) {
          const stroke = freezeStrokes[s];
          const pts = stroke.points;
          for (let i = 0; i < pts.length; i++) {
            const dx = nx - pts[i].x;
            const dy = ny - pts[i].y;
            const dist = Math.hypot(dx, dy);
            if (dist < stroke.radius) {
              const t = dist / stroke.radius;
              if (stroke.mode === 'freeze') {
                mobility = Math.min(mobility, t * t);
              } else {
                mobility = Math.max(mobility, 1 - t * 0.5);
              }
            }
          }
        }

        // Subtle boundary attenuation at image edges (top/bottom/left/right 3%) so borders never tear
        const edgeDist = Math.min(nx, 1 - nx, ny, 1 - ny);
        if (edgeDist < 0.035) {
          mobility *= edgeDist / 0.035;
        }

        freezeArr[gIdx] = mobility;
      }
    }

    // B. Accumulate velocity from each FlowVector segment
    for (let gy = 0; gy < GRID_H; gy++) {
      const ny = (gy + 0.5) / GRID_H;
      for (let gx = 0; gx < GRID_W; gx++) {
        const nx = (gx + 0.5) / GRID_W;
        const gIdx = gy * GRID_W + gx;
        const mobility = freezeArr[gIdx];
        if (mobility <= 0.005) continue;

        let sumVx = 0;
        let sumVy = 0;
        let totalWeight = 0;

        for (let v = 0; v < vectors.length; v++) {
          const vec = vectors[v];
          const pts = vec.points;
          if (pts.length < 2) continue;

          const rad = vec.radius || 0.1;
          const radSq = rad * rad;

          for (let i = 0; i < pts.length - 1; i++) {
            const ax = pts[i].x;
            const ay = pts[i].y;
            const bx = pts[i + 1].x;
            const by = pts[i + 1].y;

            const segDx = bx - ax;
            const segDy = by - ay;
            const segLenSq = segDx * segDx + segDy * segDy;
            if (segLenSq < 1e-7) continue;

            // Project point onto segment
            let proj = ((nx - ax) * segDx + (ny - ay) * segDy) / segLenSq;
            if (proj < 0) proj = 0;
            else if (proj > 1) proj = 1;

            const closestX = ax + proj * segDx;
            const closestY = ay + proj * segDy;

            const distSq =
              (nx - closestX) * (nx - closestX) +
              (ny - closestY) * (ny - closestY);

            if (distSq < radSq) {
              const dist = Math.sqrt(distSq);
              const falloff = 1 - dist / rad;
              const weight = falloff * falloff * vec.strength;

              const segLen = Math.sqrt(segLenSq);
              const dirX = segDx / segLen;
              const dirY = segDy / segLen;

              sumVx += dirX * weight;
              sumVy += dirY * weight;
              totalWeight += weight;
            }
          }
        }

        if (totalWeight > 0) {
          // Normalize soft saturation so overlapping arrows don't explode velocity
          const normScale = Math.min(1.6, totalWeight) / totalWeight;
          vxArr[gIdx] = sumVx * normScale * mobility;
          vyArr[gIdx] = sumVy * normScale * mobility;
        }
      }
    }
  }, [vectors, pins, freezeStrokes]);

  // 4. Initialize atmospheric particles when particleOverlay or density changes
  useEffect(() => {
    if (flowSettings.particleOverlay === 'none') {
      particlesRef.current = [];
      return;
    }
    const count = flowSettings.particleDensity;
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: 1.5 + Math.random() * 3.5,
        alpha: 0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = list;
  }, [flowSettings.particleOverlay, flowSettings.particleDensity]);

  // 5. Main 60 FPS Animation & Overlay Render Loop
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();
    let frameCount = 0;
    let lastFpsCheck = performance.now();

    const renderFrame = (now: number) => {
      frameCount++;
      if (now - lastFpsCheck >= 600) {
        const currentFps = Math.min(
          60,
          Math.round((frameCount * 1000) / (now - lastFpsCheck))
        );
        setFpsDisplay(currentFps);
        frameCount = 0;
        lastFpsCheck = now;
      }

      const canvas = canvasRef.current;
      const baseData = baseImageDataRef.current;
      const outData = outImageDataRef.current;

      if (canvas && baseData && outData) {
        const w = baseData.width;
        const h = baseData.height;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const elapsedSec = (now - startTime) * 0.001;
          const shouldAnimate =
            flowSettings.isPlaying &&
            vectors.length > 0 &&
            flowSettings.amplitude > 0;

          if (shouldAnimate) {
            const srcPixels = baseData.data;
            const dstPixels = outData.data;
            const vxGrid = fieldVxRef.current;
            const vyGrid = fieldVyRef.current;

            const amp = flowSettings.amplitude * (w / 720);
            const speed = flowSettings.speed;
            const loopMode = flowSettings.loopMode;

            // Dual-phase seamless cycle variables
            const cycle = (elapsedSec * speed * 0.38) % 1.0;
            const cycle2 = (cycle + 0.5) % 1.0;
            // Triangle cross-fade weight: 0 at cycle=0 and cycle=1, 1 at cycle=0.5
            const w1 = 1.0 - Math.abs(2.0 * cycle - 1.0);
            const w2 = 1.0 - w1;

            const shift1 = (cycle - 0.5) * amp * 1.45;
            const shift2 = (cycle2 - 0.5) * amp * 1.45;
            const wavePhase = elapsedSec * speed * 3.8;

            const scaleX = (GRID_W - 1) / w;
            const scaleY = (GRID_H - 1) / h;

            for (let y = 0; y < h; y++) {
              const gyFloat = y * scaleY;
              const gy0 = gyFloat | 0;
              const gy1 = gy0 + 1 < GRID_H ? gy0 + 1 : gy0;
              const fy = gyFloat - gy0;
              const row0 = gy0 * GRID_W;
              const row1 = gy1 * GRID_W;
              const rowOffset = y * w;

              for (let x = 0; x < w; x++) {
                const gxFloat = x * scaleX;
                const gx0 = gxFloat | 0;
                const gx1 = gx0 + 1 < GRID_W ? gx0 + 1 : gx0;
                const fx = gxFloat - gx0;

                // Bilinear lookup of velocity (vx, vy)
                const idx00 = row0 + gx0;
                const idx10 = row0 + gx1;
                const idx01 = row1 + gx0;
                const idx11 = row1 + gx1;

                const vx0 = vxGrid[idx00] + (vxGrid[idx10] - vxGrid[idx00]) * fx;
                const vx1 = vxGrid[idx01] + (vxGrid[idx11] - vxGrid[idx01]) * fx;
                const vx = vx0 + (vx1 - vx0) * fy;

                const vy0 = vyGrid[idx00] + (vyGrid[idx10] - vyGrid[idx00]) * fx;
                const vy1 = vyGrid[idx01] + (vyGrid[idx11] - vyGrid[idx01]) * fx;
                const vy = vy0 + (vy1 - vy0) * fy;

                const dstIdx = (rowOffset + x) * 4;

                if (vx === 0 && vy === 0) {
                  dstPixels[dstIdx] = srcPixels[dstIdx];
                  dstPixels[dstIdx + 1] = srcPixels[dstIdx + 1];
                  dstPixels[dstIdx + 2] = srcPixels[dstIdx + 2];
                  dstPixels[dstIdx + 3] = 255;
                  continue;
                }

                if (loopMode === 'seamless-crossfade') {
                  // Sample Phase 1
                  let sx1 = Math.round(x - vx * shift1);
                  let sy1 = Math.round(y - vy * shift1);
                  if (sx1 < 0) sx1 = 0;
                  else if (sx1 >= w) sx1 = w - 1;
                  if (sy1 < 0) sy1 = 0;
                  else if (sy1 >= h) sy1 = h - 1;

                  // Sample Phase 2
                  let sx2 = Math.round(x - vx * shift2);
                  let sy2 = Math.round(y - vy * shift2);
                  if (sx2 < 0) sx2 = 0;
                  else if (sx2 >= w) sx2 = w - 1;
                  if (sy2 < 0) sy2 = 0;
                  else if (sy2 >= h) sy2 = h - 1;

                  const sIdx1 = (sy1 * w + sx1) * 4;
                  const sIdx2 = (sy2 * w + sx2) * 4;

                  dstPixels[dstIdx] =
                    srcPixels[sIdx1] * w1 + srcPixels[sIdx2] * w2;
                  dstPixels[dstIdx + 1] =
                    srcPixels[sIdx1 + 1] * w1 + srcPixels[sIdx2 + 1] * w2;
                  dstPixels[dstIdx + 2] =
                    srcPixels[sIdx1 + 2] * w1 + srcPixels[sIdx2 + 2] * w2;
                  dstPixels[dstIdx + 3] = 255;
                } else if (loopMode === 'harmonic-wave') {
                  const spatial = (x * vx + y * vy) * 0.08;
                  const wave = Math.sin(wavePhase - spatial) * amp * 0.48;
                  let sx = Math.round(x - vx * wave);
                  let sy = Math.round(y - vy * wave);
                  if (sx < 0) sx = 0;
                  else if (sx >= w) sx = w - 1;
                  if (sy < 0) sy = 0;
                  else if (sy >= h) sy = h - 1;

                  const sIdx = (sy * w + sx) * 4;
                  dstPixels[dstIdx] = srcPixels[sIdx];
                  dstPixels[dstIdx + 1] = srcPixels[sIdx + 1];
                  dstPixels[dstIdx + 2] = srcPixels[sIdx + 2];
                  dstPixels[dstIdx + 3] = 255;
                } else if (loopMode === 'pulse-bounce') {
                  const bounce = Math.sin(wavePhase * 0.7) * amp * 0.6;
                  let sx = Math.round(x - vx * bounce);
                  let sy = Math.round(y - vy * bounce);
                  if (sx < 0) sx = 0;
                  else if (sx >= w) sx = w - 1;
                  if (sy < 0) sy = 0;
                  else if (sy >= h) sy = h - 1;

                  const sIdx = (sy * w + sx) * 4;
                  dstPixels[dstIdx] = srcPixels[sIdx];
                  dstPixels[dstIdx + 1] = srcPixels[sIdx + 1];
                  dstPixels[dstIdx + 2] = srcPixels[sIdx + 2];
                  dstPixels[dstIdx + 3] = 255;
                } else {
                  // vortex-curl
                  const angle = Math.sin(wavePhase * 0.65) * 1.2;
                  const cosA = Math.cos(angle);
                  const sinA = Math.sin(angle);
                  const rvx = vx * cosA - vy * sinA;
                  const rvy = vx * sinA + vy * cosA;
                  let sx = Math.round(x - rvx * amp * 0.5);
                  let sy = Math.round(y - rvy * amp * 0.5);
                  if (sx < 0) sx = 0;
                  else if (sx >= w) sx = w - 1;
                  if (sy < 0) sy = 0;
                  else if (sy >= h) sy = h - 1;

                  const sIdx = (sy * w + sx) * 4;
                  dstPixels[dstIdx] = srcPixels[sIdx];
                  dstPixels[dstIdx + 1] = srcPixels[sIdx + 1];
                  dstPixels[dstIdx + 2] = srcPixels[sIdx + 2];
                  dstPixels[dstIdx + 3] = 255;
                }
              }
            }
            ctx.putImageData(outData, 0, 0);
          } else {
            ctx.putImageData(baseData, 0, 0);
          }

          // Render Atmospheric Particles along flow field
          if (
            flowSettings.particleOverlay !== 'none' &&
            particlesRef.current.length > 0
          ) {
            ctx.save();
            const pts = particlesRef.current;
            const pType = flowSettings.particleOverlay;
            const vxGrid = fieldVxRef.current;
            const vyGrid = fieldVyRef.current;

            for (let i = 0; i < pts.length; i++) {
              const p = pts[i];
              const gx = Math.min(
                GRID_W - 1,
                Math.max(0, Math.floor(p.x * GRID_W))
              );
              const gy = Math.min(
                GRID_H - 1,
                Math.max(0, Math.floor(p.y * GRID_H))
              );
              const localVx = vxGrid[gy * GRID_W + gx];
              const localVy = vyGrid[gy * GRID_W + gx];

              if (flowSettings.isPlaying) {
                const spd = 0.0025 * flowSettings.speed;
                let defaultDx = 0.0005;
                let defaultDy = -0.0008;
                if (pType === 'rain-streaks') {
                  defaultDx = -0.001;
                  defaultDy = 0.007;
                } else if (pType === 'alpine-snow') {
                  defaultDx = Math.sin(elapsedSec + p.phase) * 0.001;
                  defaultDy = 0.0022;
                } else if (pType === 'mist-drift') {
                  defaultDx = 0.0015;
                  defaultDy = Math.sin(elapsedSec * 0.8 + p.phase) * 0.0004;
                }

                p.x += localVx * spd + defaultDx;
                p.y += localVy * spd + defaultDy;

                if (p.x < 0) p.x += 1;
                if (p.x > 1) p.x -= 1;
                if (p.y < 0) p.y += 1;
                if (p.y > 1) p.y -= 1;
              }

              const px = p.x * w;
              const py = p.y * h;

              if (pType === 'mist-drift' || pType === 'rising-steam') {
                const rad = p.size * (pType === 'mist-drift' ? 9 : 7);
                const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
                grad.addColorStop(0, `rgba(241, 245, 249, ${p.alpha * 0.28})`);
                grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py, rad, 0, Math.PI * 2);
                ctx.fill();
              } else if (pType === 'golden-embers') {
                ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha * 0.85})`;
                ctx.shadowColor = '#F59E0B';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
              } else if (pType === 'rain-streaks') {
                ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.55})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px - 3, py + p.size * 5);
                ctx.stroke();
              } else if (pType === 'alpine-snow') {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.restore();
          }

          // Split-Screen Before / After Comparison
          if (compareSplit && rawCanvasRef.current && !isRecordingExport) {
            const splitPx = Math.round(splitX * w);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, splitPx, h);
            ctx.clip();
            ctx.drawImage(rawCanvasRef.current, 0, 0);
            ctx.restore();

            // Divider line
            ctx.save();
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(splitPx, 0);
            ctx.lineTo(splitPx, h);
            ctx.stroke();

            // Handle circle
            ctx.fillStyle = '#090A0F';
            ctx.beginPath();
            ctx.arc(splitPx, h * 0.5, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Interactive Vector & Pin Overlays (hidden during video export)
          if (
            flowSettings.showOverlays &&
            !isRecordingExport &&
            activeMenu === 'flow-animation'
          ) {
            ctx.save();

            // 1. Optional Velocity Grid visualization
            if (flowSettings.showVelocityField) {
              const vxGrid = fieldVxRef.current;
              const vyGrid = fieldVyRef.current;
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
              ctx.lineWidth = 1;
              for (let gy = 2; gy < GRID_H; gy += 4) {
                for (let gx = 2; gx < GRID_W; gx += 4) {
                  const idx = gy * GRID_W + gx;
                  const vx = vxGrid[idx];
                  const vy = vyGrid[idx];
                  if (Math.hypot(vx, vy) > 0.05) {
                    const cx = (gx / GRID_W) * w;
                    const cy = (gy / GRID_H) * h;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + vx * 14, cy + vy * 14);
                    ctx.stroke();
                  }
                }
              }
            }

            // 2. Freeze Mask Strokes visualization
            for (let s = 0; s < freezeStrokes.length; s++) {
              const stroke = freezeStrokes[s];
              if (stroke.mode !== 'freeze' || stroke.points.length === 0) continue;
              ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
              for (let i = 0; i < stroke.points.length; i += 2) {
                const pt = stroke.points[i];
                ctx.beginPath();
                ctx.arc(
                  pt.x * w,
                  pt.y * h,
                  stroke.radius * w * 0.65,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }
            }

            // 3. Anchor Pins
            for (let p = 0; p < pins.length; p++) {
              const pin = pins[p];
              const px = pin.x * w;
              const py = pin.y * h;
              const rPx = pin.radius * w * 0.55;

              ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.arc(px, py, rPx, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillStyle = '#10B981';
              ctx.strokeStyle = '#052E16';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(px, py, 5.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // 4. Flow Vectors (Paths & Motion Brush strokes)
            const drawVectorPath = (
              pts: NormalizedPoint[],
              isBrush: boolean,
              isPreview = false
            ) => {
              if (pts.length < 2) return;

              if (isBrush) {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
                ctx.lineWidth = flowSettings.brushRadius * w;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(pts[0].x * w, pts[0].y * h);
                for (let i = 1; i < pts.length; i++) {
                  ctx.lineTo(pts[i].x * w, pts[i].y * h);
                }
                ctx.stroke();
              }

              // Core directional spine
              ctx.strokeStyle = isPreview ? '#F59E0B' : '#38BDF8';
              ctx.lineWidth = 2.2;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(pts[0].x * w, pts[0].y * h);
              for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x * w, pts[i].y * h);
              }
              ctx.stroke();

              // Animated pulse bead moving along path
              const beadT = (elapsedSec * flowSettings.speed * 0.9) % 1;
              const segIdx = Math.min(
                pts.length - 2,
                Math.floor(beadT * (pts.length - 1))
              );
              const localT = beadT * (pts.length - 1) - segIdx;
              const bx =
                (pts[segIdx].x +
                  (pts[segIdx + 1].x - pts[segIdx].x) * localT) *
                w;
              const by =
                (pts[segIdx].y +
                  (pts[segIdx + 1].y - pts[segIdx].y) * localT) *
                h;

              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(bx, by, 3, 0, Math.PI * 2);
              ctx.fill();

              // Arrowhead at end
              const last = pts[pts.length - 1];
              const prev = pts[pts.length - 2];
              const angle = Math.atan2(
                (last.y - prev.y) * h,
                (last.x - prev.x) * w
              );
              const tipX = last.x * w;
              const tipY = last.y * h;
              const headLen = 9;

              ctx.fillStyle = isPreview ? '#F59E0B' : '#38BDF8';
              ctx.beginPath();
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(
                tipX - headLen * Math.cos(angle - Math.PI / 6),
                tipY - headLen * Math.sin(angle - Math.PI / 6)
              );
              ctx.lineTo(
                tipX - headLen * Math.cos(angle + Math.PI / 6),
                tipY - headLen * Math.sin(angle + Math.PI / 6)
              );
              ctx.closePath();
              ctx.fill();
            };

            for (let v = 0; v < vectors.length; v++) {
              drawVectorPath(
                vectors[v].points,
                vectors[v].kind === 'brush',
                false
              );
            }

            // Currently drawing stroke preview
            if (isDrawingRef.current && currentPointsRef.current.length > 1) {
              const tool = flowSettings.activeFlowTool;
              if (tool === 'path-arrow' || tool === 'motion-brush') {
                drawVectorPath(
                  currentPointsRef.current,
                  tool === 'motion-brush',
                  true
                );
              }
            }

            // Cursor Radius Ring
            if (cursorPos) {
              const cx = cursorPos.x * w;
              const cy = cursorPos.y * h;
              const tool = flowSettings.activeFlowTool;
              let ringColor = 'rgba(56, 189, 248, 0.7)';
              if (tool === 'anchor-pin') ringColor = 'rgba(16, 185, 129, 0.8)';
              else if (tool === 'freeze-brush')
                ringColor = 'rgba(244, 63, 94, 0.8)';
              else if (tool === 'delete-vector')
                ringColor = 'rgba(239, 68, 68, 0.9)';

              ctx.strokeStyle = ringColor;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(
                cx,
                cy,
                flowSettings.brushRadius * w * 0.55,
                0,
                Math.PI * 2
              );
              ctx.stroke();
            }

            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [
    flowSettings,
    vectors,
    pins,
    freezeStrokes,
    activeMenu,
    compareSplit,
    splitX,
    cursorPos,
    isRecordingExport,
    canvasRef,
  ]);

  // Helper: map mouse/pointer event to normalized 0..1 coordinates on canvas
  const getNormalizedPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): NormalizedPoint => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0.5, y: 0.5 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      return { x, y };
    },
    [canvasRef]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedPoint(e);

    // If Split-Screen Compare is active and user clicks near the divider line, drag the split!
    if (compareSplit && Math.abs(pt.x - splitX) < 0.06) {
      isDrawingRef.current = true;
      setSplitX(pt.x);
      return;
    }

    if (activeMenu !== 'flow-animation') return;

    const tool = flowSettings.activeFlowTool;

    if (tool === 'anchor-pin') {
      onAddPin({
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: pt.x,
        y: pt.y,
        radius: flowSettings.brushRadius,
      });
      return;
    }

    if (tool === 'delete-vector') {
      // Find nearest vector or pin within 0.06 normalized distance and delete it
      let deleted = false;
      for (const pin of pins) {
        if (Math.hypot(pin.x - pt.x, pin.y - pt.y) < 0.055) {
          onDeletePin(pin.id);
          deleted = true;
          break;
        }
      }
      if (!deleted) {
        for (const vec of vectors) {
          const hit = vec.points.some(
            (p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 0.06
          );
          if (hit) {
            onDeleteVector(vec.id);
            break;
          }
        }
      }
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [pt];
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedPoint(e);
    setCursorPos(pt);

    if (!isDrawingRef.current) return;

    if (compareSplit && activeMenu !== 'flow-animation') {
      setSplitX(pt.x);
      return;
    }

    const pts = currentPointsRef.current;
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 0.018) {
      pts.push(pt);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pts = currentPointsRef.current;
    currentPointsRef.current = [];

    if (activeMenu !== 'flow-animation' || pts.length < 2) return;

    const tool = flowSettings.activeFlowTool;
    if (tool === 'path-arrow' || tool === 'motion-brush') {
      onAddVector({
        id: `vec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: pts,
        strength: flowSettings.vectorStrength,
        radius:
          tool === 'motion-brush'
            ? Math.max(0.08, flowSettings.brushRadius * 1.35)
            : flowSettings.brushRadius,
        kind: tool === 'motion-brush' ? 'brush' : 'path',
      });
    } else if (tool === 'freeze-brush' || tool === 'unfreeze-eraser') {
      onAddFreezeStroke({
        id: `frz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: pts,
        radius: flowSettings.brushRadius,
        mode: tool === 'freeze-brush' ? 'freeze' : 'unfreeze',
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUploadImageFile(file);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col bg-[#07080C] studio-canvas-bg overflow-hidden select-none"
    >
      {/* Top Floating Canvas Sub-Header (Metadata & Quick View Controls) */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.07] bg-[#0B0D14]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
          <span className="font-medium text-slate-200 truncate">{imageTitle}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {naturalSize.width} × {naturalSize.height}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-sky-400">
            {vectors.length} Flow Vectors
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-emerald-400">
            {pins.length} Anchor Pins
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="hidden sm:inline font-mono tabular-nums text-slate-400">
            {fpsDisplay} FPS
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCompareSplit((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              compareSplit
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                : 'bg-[#131622] border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Toggle Before/After Split Comparison"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            <span>Compare Split</span>
          </button>

          {activeMenu === 'flow-animation' && (
            <button
              type="button"
              onClick={onToggleOverlays}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                flowSettings.showOverlays
                  ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                  : 'bg-[#131622] border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Show or Hide Vector Paths & Anchor Pins"
            >
              {flowSettings.showOverlays ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Vectors</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1 bg-[#131622] border border-white/10 rounded-md px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
              className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono tabular-nums text-slate-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
              className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="text-[10px] text-sky-400 hover:underline pl-1"
              >
                Fit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        {imageError ? (
          /* Resilient Zero-Broken-Image Policy Fallback */
          <div className="flex flex-col items-center justify-center max-w-md p-8 rounded-xl bg-[#121521] border border-white/10 text-center">
            <Sparkles className="w-10 h-10 text-sky-400 mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">
              Ready for Your Image Canvas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload any photo from your device or select a curated scene from Preset Scenes to start editing and animating flow vectors.
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Select Image File</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadImageFile(file);
                }}
              />
            </label>
          </div>
        ) : (
          <div
            className="relative shadow-2xl rounded-lg overflow-hidden border border-white/15 bg-black transition-transform duration-150"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                setCursorPos(null);
                handlePointerUp();
              }}
              className={`block max-w-full max-h-[calc(100vh-230px)] w-auto h-auto object-contain ${
                activeMenu === 'flow-animation'
                  ? 'cursor-crosshair'
                  : compareSplit
                  ? 'cursor-ew-resize'
                  : 'cursor-default'
              }`}
            />

            {/* Split comparison slider range control when Compare Split is active */}
            {compareSplit && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-[11px] text-slate-200">
                <span className="text-slate-400">Original</span>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  value={splitX}
                  onChange={(e) => setSplitX(parseFloat(e.target.value))}
                  className="w-28 studio-slider"
                />
                <span className="text-sky-400">Edited + Flow</span>
              </div>
            )}

            {/* Recording indicator overlay */}
            {isRecordingExport && (
              <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-600/90 text-white text-xs font-medium shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Recording Flow Loop...</span>
              </div>
            )}
          </div>
        )}

        {/* Drag & Drop File Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-4 rounded-xl border-2 border-dashed border-sky-400 bg-sky-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none">
            <Upload className="w-10 h-10 text-sky-300 mb-2" />
            <p className="text-sm font-semibold text-white">
              Drop Image to Load into Studio & Flow Engine
            </p>
            <p className="text-xs text-sky-200/80 mt-1">
              Supports JPG, PNG, WebP high-resolution photography
            </p>
          </div>
        )}
      </div>

      {/* Bottom Transport & Mode Guidance Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-t border-white/[0.07] bg-[#0B0D14] z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              flowSettings.isPlaying
                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                : 'bg-[#181C2A] text-slate-200 border border-white/10 hover:bg-[#22283B]'
            }`}
          >
            {flowSettings.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Flow</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Flow</span>
              </>
            )}
          </button>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Speed</span>
            <span className="font-mono tabular-nums text-slate-200">
              {flowSettings.speed.toFixed(2)}x
            </span>
            <span aria-hidden="true">·</span>
            <span>Amplitude</span>
            <span className="font-mono tabular-nums text-slate-200">
              {flowSettings.amplitude}px
            </span>
          </div>
        </div>

        {/* Contextual Tip based on active feature menu */}
        <div className="text-xs text-slate-400 truncate">
          {activeMenu === 'flow-animation' ? (
            <span>
              Drag on the canvas to draw <strong className="text-sky-300 font-medium">Flow Arrows</strong>, or drop <strong className="text-emerald-300 font-medium">Anchor Pins</strong> to freeze stationary edges.
            </span>
          ) : activeMenu === 'image-tool' ? (
            <span>
              Add or drop an image anytime · Adjust color grading, geometry, or LUTs, then switch to <strong className="text-sky-300 font-medium">Flow Animation</strong> in the top menu.
            </span>
          ) : (
            <span>
              Real-time dual-phase displacement loop active · Switch tabs in the top menu anytime.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
