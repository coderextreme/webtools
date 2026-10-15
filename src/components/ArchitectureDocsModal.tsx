/**
 * InterViews Architecture & Historical Reference Modal
 */

import React from 'react';
import { IVDialog, IVButton } from '../iv/look/widgets';
import { Cpu, Terminal, BookOpen, Layers, GitBranch, ExternalLink } from 'lucide-react';

export interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <IVDialog
      title="InterViews & ivtools Architecture Reference"
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="flex flex-col gap-5 text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[70vh] pr-2">
        {/* Origin Section */}
        <div className="flex flex-col gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xs">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Stanford University InterViews &amp; ivtools Heritage</span>
          </div>
          <p>
            <strong>InterViews</strong> was an influential object-oriented graphical user interface system developed in the late 1980s and 1990s at Stanford University by <span className="text-slate-100 font-semibold">Mark Linton</span> and <span className="text-slate-100 font-semibold">Paul Calder</span>, alongside <span className="text-slate-100 font-semibold">John Vlissides</span> (one of the famed &ldquo;Gang of Four&rdquo; authors of <em>Design Patterns: Elements of Reusable Object-Oriented Software</em>).
          </p>
          <p>
            Vlissides created <strong>Unidraw</strong> and <strong>idraw</strong> on top of InterViews, pioneering many of the design patterns we use today: <em>Composite</em> (Graphic hierarchy), <em>Flyweight</em> (Glyphs), <em>Command</em> (Undo/Redo actions), and <em>Observer</em>.
          </p>
        </div>

        {/* Directory Mapping Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>ivtools Source Directory Porting Map</span>
          </div>
          <div className="border border-slate-800 rounded-xs overflow-hidden">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2">C++ ivtools Source</th>
                  <th className="p-2">Original Role in X11</th>
                  <th className="p-2">Web Port Implementation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                <tr>
                  <td className="p-2 text-sky-400 font-bold">src/IV-X11/</td>
                  <td className="p-2">X11 Display, Window, Canvas, Event loop</td>
                  <td className="p-2 text-emerald-400">HTML5 Canvas 2D + React event dispatch</td>
                </tr>
                <tr>
                  <td className="p-2 text-sky-400 font-bold">src/IV-look/</td>
                  <td className="p-2">Bevels, Buttons, Sliders, Steppers, Menus</td>
                  <td className="p-2 text-emerald-400">src/iv/look/widgets.tsx (Workstation GUI)</td>
                </tr>
                <tr>
                  <td className="p-2 text-sky-400 font-bold">src/InterViews/</td>
                  <td className="p-2">Graphic, Transformer, Box, Glue, B-Spline</td>
                  <td className="p-2 text-emerald-400">src/iv/core/ (2D Affine Math, B-Splines)</td>
                </tr>
                <tr>
                  <td className="p-2 text-sky-400 font-bold">src/idraw/</td>
                  <td className="p-2">Workstation PostScript vector drawing tool</td>
                  <td className="p-2 text-emerald-400">src/components/DrawCanvas.tsx + SVG/JSON/PNG</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Architectural Innovations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs flex flex-col gap-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>TeX Box &amp; Glue Layout</span>
            </span>
            <p className="text-slate-400 text-xs">
              Long before CSS Flexbox existed, Linton &amp; Calder proved that user interfaces could be specified declaratively using Donald Knuth&apos;s mathematical formulation of natural size, stretchability (&ldquo;Springs&rdquo;), and shrinkability (&ldquo;Struts&rdquo;).
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs flex flex-col gap-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hierarchical Affine Transforms</span>
            </span>
            <p className="text-slate-400 text-xs">
              Every Graphic maintains an internal 2D affine transformer matrix ($a, b, c, d, tx, ty$). Grouped graphics composite their transformations recursively, enabling arbitrary translation, rotation, and non-uniform scaling.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <a
            href="https://github.com/vectaport/ivtools"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sky-400 hover:underline text-xs"
          >
            <span>Original ivtools GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <IVButton variant="primary" onClick={onClose}>
            Done
          </IVButton>
        </div>
      </div>
    </IVDialog>
  );
};
