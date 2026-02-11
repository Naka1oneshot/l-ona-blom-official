import { useState, useCallback, useRef } from 'react';

/**
 * MediaPipe Pose landmark indices (33 landmarks).
 * We use a subset for garment placement.
 */
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  NOSE: 0,
} as const;

export interface PoseLandmarks {
  /** Normalised landmarks (0-1) from MediaPipe */
  raw: Array<{ x: number; y: number; z: number; visibility?: number }>;
  /** Derived helper points in normalised coords */
  shoulderCenter: { x: number; y: number };
  hipCenter: { x: number; y: number };
  shoulderWidth: number;
  torsoHeight: number;
  legHeight: number;
}

export interface GarmentPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Compute garment placement from pose landmarks.
 * All inputs are normalised (0-1); outputs are in canvas pixel coords.
 */
export function computePlacement(
  pose: PoseLandmarks,
  type: 'top' | 'bottom' | 'dress' | 'accessory',
  canvasW: number,
  canvasH: number,
  offsets?: { ox?: number; oy?: number; defaultScale?: number },
): GarmentPlacement {
  const { shoulderCenter, hipCenter, shoulderWidth, torsoHeight, legHeight } = pose;
  const ox = Number(offsets?.ox ?? 0);
  const oy = Number(offsets?.oy ?? 0);
  const adminScale = offsets?.defaultScale;

  let x: number, y: number, w: number, h: number, sc: number;

  switch (type) {
    case 'top': {
      // Cover from shoulders to hips, width = shoulder span * 1.6
      w = shoulderWidth * 1.6 * canvasW;
      h = torsoHeight * 1.1 * canvasH;
      x = shoulderCenter.x * canvasW - w / 2;
      y = (shoulderCenter.y - 0.03) * canvasH;
      sc = adminScale ?? 1;
      break;
    }
    case 'bottom': {
      // Cover from hips down to ankles
      w = shoulderWidth * 1.4 * canvasW;
      h = legHeight * 1.05 * canvasH;
      x = hipCenter.x * canvasW - w / 2;
      y = hipCenter.y * canvasH;
      sc = adminScale ?? 1;
      break;
    }
    case 'dress': {
      // Cover from shoulders to ankles
      w = shoulderWidth * 1.6 * canvasW;
      h = (torsoHeight + legHeight) * 1.05 * canvasH;
      x = shoulderCenter.x * canvasW - w / 2;
      y = (shoulderCenter.y - 0.03) * canvasH;
      sc = adminScale ?? 1;
      break;
    }
    case 'accessory':
    default: {
      // Small item near wrist / center
      w = shoulderWidth * 0.5 * canvasW;
      h = w;
      x = shoulderCenter.x * canvasW - w / 2;
      y = shoulderCenter.y * canvasH - h;
      sc = adminScale ?? 0.6;
      break;
    }
  }

  return {
    x: x + ox,
    y: y + oy,
    width: w,
    height: h,
    scaleX: sc,
    scaleY: sc,
  };
}

/**
 * React hook that lazily loads MediaPipe PoseLandmarker and detects
 * pose from an HTMLImageElement. Runs entirely client-side.
 */
export function usePoseDetection() {
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [detecting, setDetecting] = useState(false);
  const landmarkerRef = useRef<any>(null);

  const detect = useCallback(async (imageElement: HTMLImageElement) => {
    setDetecting(true);
    try {
      // Lazy-load MediaPipe
      const vision = await import('@mediapipe/tasks-vision');
      const { PoseLandmarker, FilesetResolver } = vision;

      if (!landmarkerRef.current) {
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
      }

      const result = landmarkerRef.current.detect(imageElement);
      const lms = result?.landmarks?.[0];

      if (!lms || lms.length < 29) {
        // Pose detection failed — return null so caller uses fallback
        setLandmarks(null);
        return null;
      }

      const ls = lms[LM.LEFT_SHOULDER];
      const rs = lms[LM.RIGHT_SHOULDER];
      const lh = lms[LM.LEFT_HIP];
      const rh = lms[LM.RIGHT_HIP];
      const la = lms[LM.LEFT_ANKLE];
      const ra = lms[LM.RIGHT_ANKLE];

      const shoulderCenter = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const hipCenter = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      const shoulderWidth = Math.abs(ls.x - rs.x);
      const torsoHeight = hipCenter.y - shoulderCenter.y;
      const ankleY = (la.y + ra.y) / 2;
      const legHeight = ankleY - hipCenter.y;

      const parsed: PoseLandmarks = {
        raw: lms,
        shoulderCenter,
        hipCenter,
        shoulderWidth,
        torsoHeight,
        legHeight,
      };

      setLandmarks(parsed);
      return parsed;
    } catch (err) {
      console.warn('Pose detection failed, using fallback placement', err);
      setLandmarks(null);
      return null;
    } finally {
      setDetecting(false);
    }
  }, []);

  return { landmarks, detecting, detect };
}
