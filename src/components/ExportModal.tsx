/**
 * InterViews idraw Document Export Modal
 * Provides standard vector SVG generation, complete JSON scene format (import & export),
 * and high-resolution raster PNG export.
 */

import React, { useState } from 'react';
import { Graphic } from '../iv/core/graphic';
import { exportToSVG, exportToJSON, exportToPNG, importFromJSON } from '../iv/core/serializer';
import { IVDialog, IVButton } from '../iv/look/widgets';
import { Download, Copy, Check, FileJson, Image, Code2, Upload } from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphics: Graphic[];
  isDarkTheme: boolean;
  onImportScene: (graphics: Graphic[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  graphics,
  isDarkTheme,
  onImportScene,
}) => {
  const [activeTab, setActiveTab] = useState<'svg' | 'json' | 'png'>('svg');
  const [copied, setCopied] = useState<boolean>(false);
  const [pngScale, setPngScale] = useState<number>(2);
  const [pngTransparent, setPngTransparent] = useState<boolean>(false);

  // Compute SVG and JSON
  const svgContent = exportToSVG(graphics, 1200, 800, isDarkTheme ? '#12151B' : '#F8FAFC');
  const jsonContent = exportToJSON(graphics, 'InterViews_Drawing', 1200, 800, isDarkTheme ? '#12151B' : '#F8FAFC');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interviews_drawing.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interviews_scene.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const bg = pngTransparent ? null : isDarkTheme ? '#12151B' : '#FFFFFF';
    const dataUrl = exportToPNG(graphics, 1200, 800, pngScale, bg);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `interviews_drawing_${pngScale}x.png`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importFromJSON(text);
        if (res.graphics.length > 0) {
          onImportScene(res.graphics);
          onClose();
        }
      } catch (err) {
        console.error('Failed to import JSON scene', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <IVDialog title="Export &amp; Import Art" isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="flex flex-col gap-4 text-xs">
        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('svg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-medium cursor-pointer transition-colors ${
              activeTab === 'svg'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Vector SVG</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-medium cursor-pointer transition-colors ${
              activeTab === 'json'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>InterViews JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('png')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-medium cursor-pointer transition-colors ${
              activeTab === 'png'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Raster PNG</span>
          </button>
        </div>

        {/* Tab 1: SVG */}
        {activeTab === 'svg' && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-400">
              Export standard W3C Scalable Vector Graphics (.svg) preserving paths, text, affine transforms, and stroke styles.
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xs font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed">
                {svgContent}
              </pre>
              <button
                onClick={() => handleCopy(svgContent)}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xs flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy SVG'}</span>
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <IVButton variant="secondary" onClick={onClose}>
                Close
              </IVButton>
              <IVButton variant="primary" onClick={handleDownloadSVG}>
                <Download className="w-3.5 h-3.5" />
                <span>Download .svg</span>
              </IVButton>
            </div>
          </div>
        )}

        {/* Tab 2: JSON */}
        {activeTab === 'json' && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-400">
              Lossless InterViews scene format containing all primitive graphics, affine matrices, and layer hierarchies.
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xs font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed">
                {jsonContent}
              </pre>
              <button
                onClick={() => handleCopy(jsonContent)}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xs flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xs border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Scene (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <div className="flex gap-2">
                <IVButton variant="secondary" onClick={onClose}>
                  Close
                </IVButton>
                <IVButton variant="primary" onClick={handleDownloadJSON}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </IVButton>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PNG */}
        {activeTab === 'png' && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-400">
              Render high-resolution raster PNG images using HTML5 Canvas 2D rasterizer.
            </p>
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xs">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-300">Resolution Scale:</span>
                <div className="flex gap-2">
                  {[1, 2, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setPngScale(scale)}
                      className={`px-3 py-1 rounded-xs border font-mono cursor-pointer ${
                        pngScale === scale
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {scale}x ({1200 * scale} &times; {800 * scale})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-300">Background:</span>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={pngTransparent}
                    onChange={(e) => setPngTransparent(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span className="text-slate-300">Transparent Background</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <IVButton variant="secondary" onClick={onClose}>
                Close
              </IVButton>
              <IVButton variant="primary" onClick={handleDownloadPNG}>
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG ({pngScale}x)</span>
              </IVButton>
            </div>
          </div>
        )}
      </div>
    </IVDialog>
  );
};
