/**
 * InterViews idraw Property Inspector
 * Real-time property inspector for styling, geometry, alignment,
 * layer stack, and typography.
 */

import React from 'react';
import { Graphic, StrokeDashType } from '../iv/core/graphic';
import { TextGraphic, RectGraphic } from '../iv/core/primitives';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Layers,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  Group,
  Ungroup,
  RotateCw,
} from 'lucide-react';
import { IVSlider, IVStepper } from '../iv/look/widgets';

export interface InspectorProps {
  selectedGraphics: Graphic[];
  allGraphics: Graphic[];
  onUpdateGraphic: (updater: (g: Graphic) => void) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onGroup: () => void;
  onUngroup: () => void;
  onRotate90: () => void;
  onSelectGraphic: (g: Graphic, multi?: boolean) => void;
  onToggleVisibility: (g: Graphic) => void;
  onToggleLock: (g: Graphic) => void;
}

const PRESET_COLORS = [
  '#38BDF8', // Sky
  '#818CF8', // Indigo
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F87171', // Rose
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#F1F5F9', // Slate Light
  '#64748B', // Slate Muted
  '#0F172A', // Slate Dark
  '#000000', // Black
];

export const Inspector: React.FC<InspectorProps> = ({
  selectedGraphics,
  allGraphics,
  onUpdateGraphic,
  onDeleteSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack,
  onStepForward,
  onStepBackward,
  onAlign,
  onGroup,
  onUngroup,
  onRotate90,
  onSelectGraphic,
  onToggleVisibility,
  onToggleLock,
}) => {
  const hasSelection = selectedGraphics.length > 0;
  const primary = hasSelection ? selectedGraphics[0] : null;

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 z-20 text-xs overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Inspector
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {hasSelection ? `${selectedGraphics.length} Selected` : 'No Selection'}
        </span>
      </div>

      {hasSelection && primary ? (
        <div className="p-4 flex flex-col gap-5">
          {/* Item Identification */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="font-medium text-slate-100">{primary.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{primary.constructor.name}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Rotate 90° Clockwise"
                onClick={onRotate90}
                className="p-1 rounded-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                title="Duplicate (Ctrl+D)"
                onClick={onDuplicateSelected}
                className="p-1 rounded-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                title="Delete (Del)"
                onClick={onDeleteSelected}
                className="p-1 rounded-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Alignment (Active when 1 or more selected) */}
          <div className="flex flex-col gap-2">
            <span className="font-medium text-slate-400 text-[11px]">Alignment</span>
            <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xs border border-slate-800">
              <button
                title="Align Left"
                onClick={() => onAlign('left')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                title="Align Center"
                onClick={() => onAlign('center')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                title="Align Right"
                onClick={() => onAlign('right')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                title="Align Top"
                onClick={() => onAlign('top')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </button>
              <button
                title="Align Middle"
                onClick={() => onAlign('middle')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <div className="w-3.5 h-0.5 bg-current" />
              </button>
              <button
                title="Align Bottom"
                onClick={() => onAlign('bottom')}
                className="p-1.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Group / Ungroup */}
          <div className="flex gap-2">
            <button
              onClick={onGroup}
              disabled={selectedGraphics.length < 2}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Group className="w-3 h-3" />
              <span>Group</span>
            </button>
            <button
              onClick={onUngroup}
              disabled={selectedGraphics.every((g) => g.constructor.name !== 'GroupGraphic')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 rounded-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Ungroup className="w-3 h-3" />
              <span>Ungroup</span>
            </button>
          </div>

          {/* Fill Color */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-400 text-[11px]">Fill</span>
              <button
                onClick={() =>
                  onUpdateGraphic((g) => {
                    g.style.fillColor = g.style.fillColor === 'none' ? '#38BDF825' : 'none';
                  })
                }
                className="text-[10px] text-sky-400 hover:underline cursor-pointer"
              >
                {primary.style.fillColor === 'none' ? 'Enable Fill' : 'No Fill'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary.style.fillColor === 'none' ? '#000000' : primary.style.fillColor.slice(0, 7)}
                onChange={(e) =>
                  onUpdateGraphic((g) => {
                    g.style.fillColor = e.target.value;
                  })
                }
                className="w-7 h-7 rounded-xs bg-slate-950 border border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={primary.style.fillColor}
                onChange={(e) =>
                  onUpdateGraphic((g) => {
                    g.style.fillColor = e.target.value;
                  })
                }
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded-xs font-mono text-[11px] text-slate-100"
              />
            </div>

            {/* Color Swatches */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={`fill-${c}`}
                  style={{ backgroundColor: c }}
                  onClick={() =>
                    onUpdateGraphic((g) => {
                      g.style.fillColor = c;
                    })
                  }
                  className="w-4 h-4 rounded-xs border border-white/20 hover:scale-110 transition-transform cursor-pointer"
                />
              ))}
            </div>
          </div>

          {/* Stroke Style */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-400 text-[11px]">Stroke</span>
              <button
                onClick={() =>
                  onUpdateGraphic((g) => {
                    g.style.strokeColor = g.style.strokeColor === 'none' ? '#38BDF8' : 'none';
                  })
                }
                className="text-[10px] text-sky-400 hover:underline cursor-pointer"
              >
                {primary.style.strokeColor === 'none' ? 'Enable Stroke' : 'No Stroke'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary.style.strokeColor === 'none' ? '#000000' : primary.style.strokeColor.slice(0, 7)}
                onChange={(e) =>
                  onUpdateGraphic((g) => {
                    g.style.strokeColor = e.target.value;
                  })
                }
                className="w-7 h-7 rounded-xs bg-slate-950 border border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={primary.style.strokeColor}
                onChange={(e) =>
                  onUpdateGraphic((g) => {
                    g.style.strokeColor = e.target.value;
                  })
                }
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded-xs font-mono text-[11px] text-slate-100"
              />
            </div>

            {/* Stroke Width */}
            <IVSlider
              label="Line Width"
              min={1}
              max={24}
              step={1}
              unit="px"
              value={primary.style.strokeWidth}
              onChange={(val) =>
                onUpdateGraphic((g) => {
                  g.style.strokeWidth = val;
                })
              }
            />

            {/* Stroke Dash Pattern */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-slate-400">Dash Pattern</span>
              <div className="grid grid-cols-4 gap-1">
                {(['solid', 'dashed', 'dotted', 'dash-dot'] as StrokeDashType[]).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() =>
                      onUpdateGraphic((g) => {
                        g.style.strokeDash = pattern;
                      })
                    }
                    className={`py-1 text-[10px] uppercase font-mono rounded-xs border cursor-pointer ${
                      primary.style.strokeDash === pattern
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {pattern === 'dash-dot' ? 'D-Dot' : pattern}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrowheads */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={primary.style.arrowStart}
                  onChange={(e) =>
                    onUpdateGraphic((g) => {
                      g.style.arrowStart = e.target.checked;
                    })
                  }
                  className="rounded-xs accent-sky-500"
                />
                <span className="text-slate-300 text-[11px]">Start Arrow</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={primary.style.arrowEnd}
                  onChange={(e) =>
                    onUpdateGraphic((g) => {
                      g.style.arrowEnd = e.target.checked;
                    })
                  }
                  className="rounded-xs accent-sky-500"
                />
                <span className="text-slate-300 text-[11px]">End Arrow</span>
              </label>
            </div>
          </div>

          {/* Opacity */}
          <IVSlider
            label="Opacity"
            min={0.05}
            max={1}
            step={0.05}
            unit=""
            value={primary.style.opacity}
            onChange={(val) =>
              onUpdateGraphic((g) => {
                g.style.opacity = val;
              })
            }
          />

          {/* Specific Text Settings */}
          {primary instanceof TextGraphic && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="font-medium text-slate-400 text-[11px]">Text Properties</span>
              <textarea
                value={primary.text}
                onChange={(e) =>
                  onUpdateGraphic((g) => {
                    if (g instanceof TextGraphic) g.text = e.target.value;
                  })
                }
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xs p-1.5 text-slate-100 font-mono text-xs outline-hidden"
              />
              <IVStepper
                label="Font Size"
                value={primary.fontSize}
                min={8}
                max={96}
                step={2}
                unit="px"
                onChange={(val) =>
                  onUpdateGraphic((g) => {
                    if (g instanceof TextGraphic) g.fontSize = val;
                  })
                }
              />
            </div>
          )}

          {/* Corner Radius for Rect */}
          {primary instanceof RectGraphic && (
            <div className="pt-2 border-t border-slate-800">
              <IVSlider
                label="Corner Radius"
                min={0}
                max={50}
                step={1}
                unit="px"
                value={primary.rx}
                onChange={(val) =>
                  onUpdateGraphic((g) => {
                    if (g instanceof RectGraphic) g.rx = val;
                  })
                }
              />
            </div>
          )}

          {/* Layer Ordering */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="font-medium text-slate-400 text-[11px]">Layer Order</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                title="Bring to Front"
                onClick={onBringToFront}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <MoveUp className="w-3 h-3 text-sky-400" />
                <span className="text-[10px]">Top</span>
              </button>
              <button
                title="Step Forward"
                onClick={onStepForward}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
                <span className="text-[10px]">Up</span>
              </button>
              <button
                title="Step Backward"
                onClick={onStepBackward}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
                <span className="text-[10px]">Down</span>
              </button>
              <button
                title="Send to Back"
                onClick={onSendToBack}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <MoveDown className="w-3 h-3 text-sky-400" />
                <span className="text-[10px]">Bottom</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500 py-12 flex flex-col items-center gap-2">
          <Layers className="w-8 h-8 stroke-1 text-slate-600" />
          <p className="text-xs">Select any graphic shape on canvas to edit its properties, colors, and order.</p>
        </div>
      )}

      {/* Scene Layers Stack */}
      <div className="mt-auto border-t border-slate-800 p-3 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Layers ({allGraphics.length})
          </span>
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {allGraphics.length === 0 ? (
            <span className="text-[11px] text-slate-600 italic">No graphics on canvas</span>
          ) : (
            [...allGraphics].reverse().map((g) => {
              const isSelected = selectedGraphics.some((s) => s.id === g.id);
              return (
                <div
                  key={g.id}
                  onClick={(e) => onSelectGraphic(g, e.shiftKey)}
                  className={`flex items-center justify-between px-2 py-1 rounded-xs transition-colors cursor-pointer text-[11px] ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                      : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span className="truncate max-w-[120px] font-mono">{g.name}</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleVisibility(g)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {g.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                    </button>
                    <button
                      onClick={() => onToggleLock(g)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {g.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
