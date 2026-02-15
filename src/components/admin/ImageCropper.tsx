import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  src: string;
  aspectRatio?: number;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

const ImageCropper = ({
  src,
  aspectRatio = 3 / 4,
  onCropComplete,
  onCancel,
  open,
}: ImageCropperProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      imgRef.current = e.currentTarget;
      const { width, height } = e.currentTarget;
      const cropHeight = width / aspectRatio;

      let initial: PixelCrop;
      if (cropHeight <= height) {
        initial = {
          unit: 'px',
          width,
          height: cropHeight,
          x: 0,
          y: Math.round((height - cropHeight) / 2),
        };
      } else {
        const newWidth = height * aspectRatio;
        initial = {
          unit: 'px',
          width: newWidth,
          height,
          x: Math.round((width - newWidth) / 2),
          y: 0,
        };
      }
      setCrop(initial);
      setCompletedCrop(initial);
    },
    [aspectRatio],
  );

  const handleConfirm = useCallback(async () => {
    const image = imgRef.current;
    if (!completedCrop || !image) return;

    setProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) onCropComplete(blob);
          setProcessing(false);
        },
        'image/webp',
        0.88,
      );
    } catch {
      setProcessing(false);
    }
  }, [completedCrop, onCropComplete]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-display text-lg">
            Recadrer l'image
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-body mb-2">
          Ajustez le cadre au ratio 3∶4 attendu pour la grille boutique.
        </p>

        <div className="flex justify-center bg-muted/30 rounded overflow-hidden max-h-[60vh]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={src}
              alt="Aperçu"
              onLoad={onImageLoad}
              className="max-h-[58vh] w-auto"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !completedCrop}>
            {processing && <Loader2 size={14} className="animate-spin mr-2" />}
            Valider le recadrage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
