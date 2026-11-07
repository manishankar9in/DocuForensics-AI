import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { documentApi } from '../../services/documentApi';

export interface BoundingBoxHighlight {
  bbox: [number, number, number, number]; // [x0, y0, x1, y1] normalized coords
  label?: string;
  isTarget?: boolean;
  severity?: 'critical' | 'warning' | 'info' | 'success';
}

interface DocumentViewerCanvasProps {
  documentId: string;
  totalPages: number;
  activeHighlights?: BoundingBoxHighlight[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const DocumentViewerCanvas: React.FC<DocumentViewerCanvasProps> = ({
  documentId,
  totalPages = 1,
  activeHighlights = [],
  currentPage = 1,
  onPageChange,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [page, setPage] = useState<number>(currentPage);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setImgLoaded(false);
      onPageChange?.(newPage);
    }
  };

  const previewUrl = documentApi.getPreviewUrl(documentId, page, 150);

  return (
    <div className="flex flex-col h-full bg-primary-bg rounded-[10px] border border-border overflow-hidden select-none">
      {/* Controls Header */}
      <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-3 sm:px-4 shrink-0">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-text">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 bg-secondary-bg hover:bg-surface-elevated border border-border rounded-[6px] disabled:opacity-30 text-secondary-text hover:text-primary-text transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs px-2.5 py-1 bg-secondary-bg border border-border rounded-[6px] text-primary-text font-bold">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 bg-secondary-bg hover:bg-surface-elevated border border-border rounded-[6px] disabled:opacity-30 text-secondary-text hover:text-primary-text transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-text">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="p-1.5 bg-secondary-bg hover:bg-surface-elevated border border-border rounded-[6px] text-secondary-text hover:text-primary-text transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs w-12 text-center text-primary-text font-semibold">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(220, z + 15))}
            className="p-1.5 bg-secondary-bg hover:bg-surface-elevated border border-border rounded-[6px] text-secondary-text hover:text-primary-text transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1.5 bg-secondary-bg hover:bg-surface-elevated border border-border rounded-[6px] ml-1 text-secondary-text hover:text-primary-text transition-colors"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-primary-bg"
      >
        <div
          className="relative bg-white shadow-2xl rounded-sm border border-border transition-all duration-150"
          style={{ width: `${zoom}%`, maxWidth: '960px' }}
        >
          {/* Document Render Image */}
          <img
            src={previewUrl}
            alt={`Document Page ${page}`}
            className="w-full h-auto block select-none"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Coordinate Bounding Boxes Layer */}
          {imgLoaded &&
            activeHighlights.map((hl, idx) => {
              const [x0, y0, x1, y1] = hl.bbox;
              const leftPercent = x0 * 100;
              const topPercent = y0 * 100;
              const widthPercent = Math.max(1, (x1 - x0) * 100);
              const heightPercent = Math.max(1, (y1 - y0) * 100);

              const sev = hl.severity || 'info';
              const isTarget = hl.isTarget;

              let borderColor = 'border-status-info';
              let bgColor = 'bg-status-info/20';
              let badgeBg = 'bg-status-info text-white';

              if (sev === 'critical' || isTarget) {
                borderColor = 'border-status-critical';
                bgColor = 'bg-status-critical/20';
                badgeBg = 'bg-status-critical text-white';
              } else if (sev === 'warning') {
                borderColor = 'border-status-warning';
                bgColor = 'bg-status-warning/20';
                badgeBg = 'bg-status-warning text-black font-bold';
              }

              return (
                <div
                  key={idx}
                  className={`absolute transition-all pointer-events-none border-2 ${borderColor} ${bgColor} ${
                    isTarget ? 'shadow-lg ring-2 ring-status-critical/60 animate-pulse' : ''
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                >
                  {hl.label && (
                    <span
                      className={`absolute -top-5 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-auto ${badgeBg}`}
                    >
                      {hl.label}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
