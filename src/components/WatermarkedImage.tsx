import React, { useEffect, useState, useRef } from 'react';

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  watermarkSrc?: string;
  watermarkOpacity?: number;
  watermarkScale?: number;
}

export default function WatermarkedImage({
  src,
  watermarkSrc = '/images/acil_logo.png',
  watermarkOpacity = 0.30,
  watermarkScale = 0.66,
  alt,
  className,
  ...props
}: WatermarkedImageProps) {
  const [finalSrc, setFinalSrc] = useState<string>(src);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const generate = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load main image
        const mainImg = new Image();
        mainImg.crossOrigin = 'anonymous'; // Important for external URLs
        
        await new Promise((resolve, reject) => {
          mainImg.onload = resolve;
          mainImg.onerror = reject;
          mainImg.src = src;
        });

        // Set canvas dimensions
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;

        // Draw main image
        ctx.drawImage(mainImg, 0, 0);

        // Load watermark
        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          wmImg.onload = resolve;
          wmImg.onerror = reject;
          wmImg.src = watermarkSrc;
        });

        // Calculate watermark dimensions based on main image width
        const wmWidth = mainImg.width * watermarkScale;
        const scale = wmWidth / wmImg.width;
        const wmHeight = wmImg.height * scale;

        // Center position
        const x = (mainImg.width - wmWidth) / 2;
        const y = (mainImg.height - wmHeight) / 2;

        ctx.globalAlpha = watermarkOpacity;
        if (typeof ctx.filter !== 'undefined') {
          ctx.filter = 'grayscale(100%)';
        }

        // Draw watermark
        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);

        // Export to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        if (isMounted) {
          setFinalSrc(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate watermarked image:', err);
        // Fallback to original image if drawing fails
        if (isMounted) setFinalSrc(src);
      }
    };

    if (src) {
      generate();
    }

    return () => {
      isMounted = false;
    };
  }, [src, watermarkSrc, watermarkOpacity, watermarkScale]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <img src={finalSrc} alt={alt} className={className} {...props} />
    </>
  );
}
