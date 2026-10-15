/**
 * InterViews idraw Tool Palette
 * Ported from src/IV-look/ and idraw tool selection panel
 */

import React from 'react';
import {
  MousePointer,
  Square,
  Circle,
  Slash,
  Spline,
  Type,
  Hand,
  ZoomIn,
  Edit3,
  Pentagon,
  Minus,
} from 'lucide-react';

export type DrawingTool =
  | 'select'
  | 'reshape'
  | 'rect'
  | 'roundrect'
  | 'ellipse'
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'bspline'
  | 'bspline-closed'
  | 'text'
  | 'pan'
  | 'zoom';

export interface ToolPaletteProps {
  currentTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
}

interface ToolDefinition {
  id: DrawingTool;
  name: string;
  shortcut: string;
  icon: React.ReactNode;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ currentTool, onSelectTool }) => {
  const tools: ToolDefinition[] = [
    {
      id: 'select',
      name: 'Select & Transform',
      shortcut: 'V',
      icon: <MousePointer className="w-4 h-4" />,
    },
    {
      id: 'reshape',
      name: 'Reshape / Node Edit',
      shortcut: 'A',
      icon: <Edit3 className="w-4 h-4" />,
    },
    {
      id: 'rect',
      name: 'Rectangle',
      shortcut: 'R',
      icon: <Square className="w-4 h-4" />,
    },
    {
      id: 'roundrect',
      name: 'Rounded Rectangle',
      shortcut: 'U',
      icon: <div className="w-4 h-3.5 border-2 border-current rounded-xs" />,
    },
    {
      id: 'ellipse',
      name: 'Circle & Ellipse',
      shortcut: 'O',
      icon: <Circle className="w-4 h-4" />,
    },
    {
      id: 'line',
      name: 'Line Segment',
      shortcut: 'L',
      icon: <Slash className="w-4 h-4" />,
    },
    {
      id: 'polyline',
      name: 'Polyline (Open)',
      shortcut: 'P',
      icon: <Minus className="w-4 h-4 stroke-[3]" />,
    },
    {
      id: 'polygon',
      name: 'Polygon (Closed)',
      shortcut: 'G',
      icon: <Pentagon className="w-4 h-4" />,
    },
    {
      id: 'bspline',
      name: 'Open B-Spline Curve',
      shortcut: 'S',
      icon: <Spline className="w-4 h-4" />,
    },
    {
      id: 'bspline-closed',
      name: 'Closed B-Spline',
      shortcut: 'C',
      icon: <div className="relative"><Spline className="w-4 h-4" /><div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current" /></div>,
    },
    {
      id: 'text',
      name: 'Text Label',
      shortcut: 'T',
      icon: <Type className="w-4 h-4" />,
    },
    {
      id: 'pan',
      name: 'Pan Hand',
      shortcut: 'H',
      icon: <Hand className="w-4 h-4" />,
    },
    {
      id: 'zoom',
      name: 'Zoom Magnifier',
      shortcut: 'Z',
      icon: <ZoomIn className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 select-none shrink-0 z-20">
      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
        Tools
      </div>
      <div className="flex flex-col gap-1 w-full px-2">
        {tools.map((tool) => {
          const isActive = currentTool === tool.id;
          return (
            <button
              key={tool.id}
              title={`${tool.name} (${tool.shortcut})`}
              onClick={() => onSelectTool(tool.id)}
              className={`w-10 h-10 rounded-xs flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {tool.icon}
              <span className={`text-[8px] font-mono leading-none mt-0.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                {tool.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
