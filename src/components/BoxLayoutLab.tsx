/**
 * InterViews TeX Box & Glue Interactive Layout Lab
 * Visualizes the 1989 Linton & Calder TeX-inspired spring/strut layout algorithm
 * that laid the foundation for modern graphical layout engines.
 */

import React, { useState } from 'react';
import { solveBoxGlue, BoxItem, CommonGlues } from '../iv/look/boxglue';
import { IVSlider, IVButton } from '../iv/look/widgets';
import { Plus, Trash2, Sliders, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';

const INITIAL_ITEMS: BoxItem[] = [
  {
    id: 'box_1',
    name: 'Toolbox A',
    type: 'box',
    glue: { natural: 120, stretch: 0, shrink: 20 },
    color: '#38BDF8',
  },
  {
    id: 'glue_1',
    name: 'Spring 1',
    type: 'glue',
    glue: { natural: 40, stretch: 100, shrink: 20 },
    color: '#818CF8',
  },
  {
    id: 'box_2',
    name: 'Inspector B',
    type: 'box',
    glue: { natural: 140, stretch: 0, shrink: 30 },
    color: '#34D399',
  },
  {
    id: 'glue_2',
    name: 'Spring 2 (2x Stiff)',
    type: 'glue',
    glue: { natural: 30, stretch: 200, shrink: 10 },
    color: '#FBBF24',
  },
  {
    id: 'box_3',
    name: 'Palette C',
    type: 'box',
    glue: { natural: 100, stretch: 0, shrink: 10 },
    color: '#F87171',
  },
];

export const BoxLayoutLab: React.FC = () => {
  const [containerWidth, setContainerWidth] = useState<number>(680);
  const [items, setItems] = useState<BoxItem[]>(INITIAL_ITEMS);

  // Compute solver solution
  const solution = solveBoxGlue(containerWidth, items);

  const addItem = (type: 'box' | 'glue') => {
    const id = 'item_' + Date.now();
    if (type === 'box') {
      setItems((prev) => [
        ...prev,
        {
          id,
          name: `Box ${prev.length + 1}`,
          type: 'box',
          glue: { natural: 100, stretch: 0, shrink: 20 },
          color: '#38BDF8',
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id,
          name: `Spring ${prev.length + 1}`,
          type: 'glue',
          glue: { natural: 40, stretch: 100, shrink: 20 },
          color: '#A855F7',
        },
      ]);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItemGlue = (id: string, natural: number, stretch: number, shrink: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, glue: { natural, stretch, shrink } } : it
      )
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 flex flex-col gap-6 text-slate-200">
      {/* Introduction */}
      <div className="flex flex-col gap-2 max-w-4xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <ArrowRightLeft className="w-4 h-4" />
          <span>InterViews Linton &amp; Calder TeX Box-and-Glue Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Springs &amp; Struts: TeX Box &amp; Glue Layout Solver
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          In 1989 at Stanford, Mark Linton and Paul Calder revolutionized workstation graphical interfaces by applying Donald Knuth&apos;s TeX typographical algorithm to 2D UI composition. Instead of brittle pixel coordinates, containers (<strong className="text-slate-200">HBox</strong>, <strong className="text-slate-200">VBox</strong>) evaluate <strong className="text-sky-300">Natural Size</strong>, <strong className="text-emerald-300">Stretchability (Springs)</strong>, and <strong className="text-amber-300">Shrinkability (Struts)</strong>.
        </p>
      </div>

      {/* Main Interactive Sandbox */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-6 max-w-6xl shadow-xl">
        {/* Container Width Slider Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-xs border border-slate-800">
          <div className="flex-1 max-w-md">
            <IVSlider
              label="Container Allocation Width (Drag to stretch/compress)"
              min={360}
              max={1000}
              step={10}
              unit="px"
              value={containerWidth}
              onChange={setContainerWidth}
            />
          </div>

          <div className="flex items-center gap-2">
            <IVButton
              size="sm"
              variant="secondary"
              onClick={() => addItem('box')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Box</span>
            </IVButton>
            <IVButton
              size="sm"
              variant="secondary"
              onClick={() => addItem('glue')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spring (Glue)</span>
            </IVButton>
            <IVButton
              size="sm"
              variant="secondary"
              onClick={() => setItems(INITIAL_ITEMS)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </IVButton>
          </div>
        </div>

        {/* Diagnostic Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
            <div className="text-[10px] text-slate-500 uppercase">Container Size</div>
            <div className="text-sm font-bold text-sky-400 tabular-nums">{containerWidth}px</div>
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
            <div className="text-[10px] text-slate-500 uppercase">Natural Sum</div>
            <div className="text-sm font-bold text-slate-200 tabular-nums">{solution.totalNatural}px</div>
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
            <div className="text-[10px] text-slate-500 uppercase">Excess / Deficit (&Delta;)</div>
            <div
              className={`text-sm font-bold tabular-nums ${
                solution.delta >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {solution.delta > 0 ? `+${solution.delta}px (Stretch)` : `${solution.delta}px (Shrink)`}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
            <div className="text-[10px] text-slate-500 uppercase">Total Stretchability</div>
            <div className="text-sm font-bold text-indigo-400 tabular-nums">&Sigma; {solution.totalStretch}</div>
          </div>
        </div>

        {/* Live Visual Spring & Box Canvas / Layout View */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rendered InterViews HBox Output
          </span>
          <div className="w-full overflow-x-auto pb-3 scrollbar-thin">
            <div
              style={{ width: `${containerWidth}px` }}
              className="h-28 bg-slate-950 border-2 border-t-white/20 border-l-white/20 border-b-black/80 border-r-black/80 rounded-xs relative overflow-hidden transition-all duration-75 flex shadow-inner shrink-0"
            >
            {solution.items.map((it) => {
              const isGlue = it.type === 'glue';
              return (
                <div
                  key={it.id}
                  style={{ width: `${it.allocatedSize}px` }}
                  className={`h-full relative flex flex-col items-center justify-center p-1 border-r border-slate-800/80 transition-all duration-75 ${
                    isGlue ? 'bg-indigo-950/20' : 'bg-slate-900'
                  }`}
                >
                  {isGlue ? (
                    // Physical SVG Spring Coil Visualization!
                    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden px-1">
                      <svg className="w-full h-8 text-sky-400" preserveAspectRatio="none" viewBox="0 0 100 24">
                        <path
                          d="M 0 12 Q 10 2, 20 12 T 40 12 T 60 12 T 80 12 L 100 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[10px] font-mono text-sky-300 font-bold tabular-nums">
                        {Math.round(it.allocatedSize || 0)}px
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        (k={it.glue.stretch})
                      </span>
                    </div>
                  ) : (
                    // Rigid Box Item
                    <div
                      style={{ borderColor: it.color }}
                      className="w-full h-full border-2 rounded-xs flex flex-col items-center justify-center p-1 bg-slate-950/80 shadow-xs"
                    >
                      <span className="text-xs font-bold text-slate-100 truncate w-full text-center">
                        {it.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                        {Math.round(it.allocatedSize || 0)}px
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        nat: {it.glue.natural}px
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Item Configuration Cards */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            HBox Children (Boxes &amp; Glues)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: it.color || '#38BDF8' }}
                    />
                    <span className="text-xs font-bold text-slate-200">{it.name}</span>
                  </div>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Natural Size:</span>
                    <input
                      type="number"
                      value={it.glue.natural}
                      onChange={(e) =>
                        updateItemGlue(
                          it.id,
                          parseFloat(e.target.value) || 0,
                          it.glue.stretch,
                          it.glue.shrink
                        )
                      }
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-xs text-right text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Stretch Factor:</span>
                    <input
                      type="number"
                      value={it.glue.stretch}
                      onChange={(e) =>
                        updateItemGlue(
                          it.id,
                          it.glue.natural,
                          parseFloat(e.target.value) || 0,
                          it.glue.shrink
                        )
                      }
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-xs text-right text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Shrink Limit:</span>
                    <input
                      type="number"
                      value={it.glue.shrink}
                      onChange={(e) =>
                        updateItemGlue(
                          it.id,
                          it.glue.natural,
                          it.glue.stretch,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded-xs text-right text-slate-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
