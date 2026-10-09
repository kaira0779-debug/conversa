import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageViewerModalProps {
  src: string;
  alt?: string;
  prompt?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  src,
  alt = 'Imagen',
  prompt,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    // Bloquea scroll del body
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(3, z + (e.deltaY < 0 ? 0.15 : -0.15))));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      (e.currentTarget as any)._initialDist = dist;
      (e.currentTarget as any)._initialZoom = zoom;
    } else if (e.touches.length === 1) {
      setDragging(true);
      setStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const initialDist = (e.currentTarget as any)._initialDist;
      const initialZoom = (e.currentTarget as any)._initialZoom;
      if (initialDist) {
        setZoom(Math.max(0.5, Math.min(3, (dist / initialDist) * initialZoom)));
      }
    } else if (dragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - start.x,
        y: e.touches[0].clientY - start.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    (window as any)._initialDist = undefined;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversa-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-md flex flex-col animate-fade-in"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 pt-safe z-10 bg-gradient-to-b from-black/70 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-[#EDE7F0]/80 font-medium truncate max-w-[60%]">
          {alt}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-2 rounded-full bg-[#1A1430]/80 text-[#EDE7F0] hover:bg-[#2A2145] transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-2 rounded-full bg-[#1A1430]/80 text-[#EDE7F0] hover:bg-[#2A2145] transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-[#1A1430]/80 text-[#EDE7F0] hover:bg-[#2A2145] transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#E8825A] text-[#0D0A1A] hover:bg-[#E8825A]/90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden p-2"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
            touchAction: 'none',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          className="select-none"
        />
      </div>

      {/* Prompt */}
      {prompt && (
        <div
          className="p-4 bg-gradient-to-t from-black/70 to-transparent pb-safe"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] text-[#EDE7F0]/60 italic line-clamp-2 max-w-2xl mx-auto text-center">
            "{prompt}"
          </p>
        </div>
      )}
    </div>
  );
};