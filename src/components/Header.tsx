/**
 * InterViews Web Top Navigation Header
 * Strictly follows the Top Bar Contract:
 * [Brand wordmark] - [4 single-line nav links] - [1 primary action + controls]
 */

import React from 'react';
import {
  Download,
  FolderOpen,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Grid,
  Magnet,
  Maximize2,
  Trash2,
} from 'lucide-react';

export type WorkspaceTab = 'idraw' | 'toolkit' | 'boxglue' | 'architecture';

export interface HeaderProps {
  currentTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenTemplates: () => void;
  onClearCanvas: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoomLevel: number;
  onResetZoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isDarkTheme,
  onToggleTheme,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenTemplates,
  onClearCanvas,
  snapToGrid,
  onToggleSnap,
  showGrid,
  onToggleGrid,
  zoomLevel,
  onResetZoom,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-2.5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xs select-none z-30 shrink-0">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded-xs bg-sky-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-xs">
          IV
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          InterViews Web
        </span>
        <span className="hidden xl:inline text-[11px] text-slate-400 font-mono">
          ivtools X11 Port
        </span>
      </div>

      {/* Zone 2: 4 Single-Line Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={() => onTabChange('idraw')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
            currentTab === 'idraw'
              ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          idraw Canvas
        </button>

        <button
          onClick={() => onTabChange('toolkit')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
            currentTab === 'toolkit'
              ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          IV-look Toolkit
        </button>

        <button
          onClick={() => onTabChange('boxglue')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
            currentTab === 'boxglue'
              ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          TeX Box &amp; Glue
        </button>

        <button
          onClick={() => onTabChange('architecture')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
            currentTab === 'architecture'
              ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          Architecture
        </button>
      </nav>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Tools for idraw */}
        {currentTab === 'idraw' && (
          <div className="hidden sm:flex items-center gap-1 border-r border-slate-800 pr-2.5 mr-1">
            <button
              title="Undo (Ctrl+Z)"
              disabled={!canUndo}
              onClick={onUndo}
              className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              title="Redo (Ctrl+Y)"
              disabled={!canRedo}
              onClick={onRedo}
              className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
              onClick={onToggleGrid}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                showGrid ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
              onClick={onToggleSnap}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                snapToGrid ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
            <button
              title="Reset Zoom to 100%"
              onClick={onResetZoom}
              className="px-2 py-1 text-[11px] font-mono tabular-nums text-slate-300 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3 text-slate-400" />
              <span>{Math.round(zoomLevel * 100)}%</span>
            </button>
            <button
              title="Templates"
              onClick={onOpenTemplates}
              className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              title="Clear Canvas"
              onClick={onClearCanvas}
              className="p-1.5 rounded-xs text-slate-300 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          onClick={onToggleTheme}
          className="p-1.5 rounded-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          {isDarkTheme ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Primary CTA Action Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xs transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Art</span>
        </button>
      </div>
    </header>
  );
};
