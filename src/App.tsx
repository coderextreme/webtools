/**
 * InterViews Web Main Application
 * Integrates the X11 ivtools architecture into modern TypeScript,
 * HTML5 Canvas, and React.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Graphic } from './iv/core/graphic';
import { RectGraphic, EllipseGraphic, LineGraphic, PolyGraphic, BSplineGraphic, TextGraphic, GroupGraphic } from './iv/core/primitives';
import { exportToJSON, importFromJSON } from './iv/core/serializer';
import { TEMPLATES } from './iv/core/templates';
import { Header, WorkspaceTab } from './components/Header';
import { ToolPalette, DrawingTool } from './components/ToolPalette';
import { DrawCanvas } from './components/DrawCanvas';
import { Inspector } from './components/Inspector';
import { ToolkitShowcase } from './components/ToolkitShowcase';
import { BoxLayoutLab } from './components/BoxLayoutLab';
import { ExportModal } from './components/ExportModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('idraw');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('select');

  // Graphics scene state
  const [graphics, setGraphics] = useState<Graphic[]>(() => {
    // Start with the Cloud Architecture template
    return TEMPLATES[0].createGraphics();
  });
  const [selectedGraphics, setSelectedGraphics] = useState<Graphic[]>([]);

  // Canvas View Controls
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  // Undo / Redo History
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isUndoRedoAction = useRef(false);

  // Push current state to undo stack
  const pushUndoSnapshot = useCallback(() => {
    if (isUndoRedoAction.current) return;
    const json = exportToJSON(graphics);
    setUndoStack((prev) => [...prev.slice(-25), json]);
    setRedoStack([]);
  }, [graphics]);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    isUndoRedoAction.current = true;
    const currentJson = exportToJSON(graphics);
    const previousJson = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentJson]);

    const res = importFromJSON(previousJson);
    setGraphics(res.graphics);
    setSelectedGraphics([]);
    setTimeout(() => {
      isUndoRedoAction.current = false;
    }, 50);
  }, [undoStack, graphics]);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    isUndoRedoAction.current = true;
    const currentJson = exportToJSON(graphics);
    const nextJson = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, currentJson]);

    const res = importFromJSON(nextJson);
    setGraphics(res.graphics);
    setSelectedGraphics([]);
    setTimeout(() => {
      isUndoRedoAction.current = false;
    }, 50);
  }, [redoStack, graphics]);

  // Add Graphic to Scene
  const handleAddGraphic = useCallback((g: Graphic) => {
    pushUndoSnapshot();
    setGraphics((prev) => [...prev, g]);
    setSelectedGraphics([g]);
  }, [pushUndoSnapshot]);

  // Update Selected Graphic
  const handleUpdateGraphic = useCallback((updater: (g: Graphic) => void) => {
    setGraphics((prev) => {
      const next = [...prev];
      for (const sel of selectedGraphics) {
        updater(sel);
      }
      return next;
    });
  }, [selectedGraphics]);

  // Select Graphic
  const handleSelectGraphic = useCallback((g: Graphic | null, multi = false) => {
    if (!g) {
      setSelectedGraphics([]);
      return;
    }
    if (multi) {
      setSelectedGraphics((prev) => {
        if (prev.some((item) => item.id === g.id)) {
          return prev.filter((item) => item.id !== g.id);
        }
        return [...prev, g];
      });
    } else {
      setSelectedGraphics([g]);
    }
  }, []);

  // Select Multiple (e.g. from marquee box)
  const handleSelectMultiple = useCallback((list: Graphic[]) => {
    setSelectedGraphics(list);
  }, []);

  // Delete Selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const selIds = new Set(selectedGraphics.map((g) => g.id));
    setGraphics((prev) => prev.filter((g) => !selIds.has(g.id)));
    setSelectedGraphics([]);
  }, [selectedGraphics, pushUndoSnapshot]);

  // Duplicate Selected
  const handleDuplicateSelected = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const clones: Graphic[] = [];
    for (const g of selectedGraphics) {
      const cloned = g.clone();
      cloned.transformer.translate(20, 20);
      clones.push(cloned);
    }
    setGraphics((prev) => [...prev, ...clones]);
    setSelectedGraphics(clones);
  }, [selectedGraphics, pushUndoSnapshot]);

  // Bring to Front
  const handleBringToFront = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const selIds = new Set(selectedGraphics.map((g) => g.id));
    const unselected = graphics.filter((g) => !selIds.has(g.id));
    const selected = graphics.filter((g) => selIds.has(g.id));
    setGraphics([...unselected, ...selected]);
  }, [selectedGraphics, graphics, pushUndoSnapshot]);

  // Send to Back
  const handleSendToBack = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const selIds = new Set(selectedGraphics.map((g) => g.id));
    const unselected = graphics.filter((g) => !selIds.has(g.id));
    const selected = graphics.filter((g) => selIds.has(g.id));
    setGraphics([...selected, ...unselected]);
  }, [selectedGraphics, graphics, pushUndoSnapshot]);

  // Step Forward
  const handleStepForward = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const next = [...graphics];
    for (const sel of selectedGraphics) {
      const idx = next.findIndex((g) => g.id === sel.id);
      if (idx < next.length - 1) {
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
      }
    }
    setGraphics(next);
  }, [selectedGraphics, graphics, pushUndoSnapshot]);

  // Step Backward
  const handleStepBackward = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    const next = [...graphics];
    for (const sel of selectedGraphics) {
      const idx = next.findIndex((g) => g.id === sel.id);
      if (idx > 0) {
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
      }
    }
    setGraphics(next);
  }, [selectedGraphics, graphics, pushUndoSnapshot]);

  // Align Selected Graphics
  const handleAlign = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (selectedGraphics.length === 0) return;
      pushUndoSnapshot();

      // Find collective reference bounds
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const g of selectedGraphics) {
        const b = g.getBounds();
        if (b.x < minX) minX = b.x;
        if (b.x + b.width > maxX) maxX = b.x + b.width;
        if (b.y < minY) minY = b.y;
        if (b.y + b.height > maxY) maxY = b.y + b.height;
      }

      handleUpdateGraphic((g) => {
        const b = g.getBounds();
        let dx = 0;
        let dy = 0;
        if (alignment === 'left') dx = minX - b.x;
        if (alignment === 'right') dx = maxX - (b.x + b.width);
        if (alignment === 'center') dx = minX + (maxX - minX) / 2 - (b.x + b.width / 2);
        if (alignment === 'top') dy = minY - b.y;
        if (alignment === 'bottom') dy = maxY - (b.y + b.height);
        if (alignment === 'middle') dy = minY + (maxY - minY) / 2 - (b.y + b.height / 2);
        g.transformer.translate(dx, dy);
      });
    },
    [selectedGraphics, pushUndoSnapshot, handleUpdateGraphic]
  );

  // Group Selected
  const handleGroup = useCallback(() => {
    if (selectedGraphics.length < 2) return;
    pushUndoSnapshot();
    const selIds = new Set(selectedGraphics.map((g) => g.id));
    const groupChildren = graphics.filter((g) => selIds.has(g.id));
    const remaining = graphics.filter((g) => !selIds.has(g.id));

    const group = new GroupGraphic(groupChildren, 'Group');
    setGraphics([...remaining, group]);
    setSelectedGraphics([group]);
  }, [selectedGraphics, graphics, pushUndoSnapshot]);

  // Ungroup
  const handleUngroup = useCallback(() => {
    pushUndoSnapshot();
    const nextGraphics: Graphic[] = [];
    const newlySelected: Graphic[] = [];

    for (const g of graphics) {
      if (selectedGraphics.some((s) => s.id === g.id) && g instanceof GroupGraphic) {
        nextGraphics.push(...g.children);
        newlySelected.push(...g.children);
      } else {
        nextGraphics.push(g);
      }
    }

    setGraphics(nextGraphics);
    setSelectedGraphics(newlySelected);
  }, [graphics, selectedGraphics, pushUndoSnapshot]);

  // Rotate 90° Clockwise
  const handleRotate90 = useCallback(() => {
    if (selectedGraphics.length === 0) return;
    pushUndoSnapshot();
    handleUpdateGraphic((g) => {
      const b = g.getBounds();
      g.transformer.rotate(Math.PI / 2, b.x + b.width / 2, b.y + b.height / 2);
    });
  }, [selectedGraphics, pushUndoSnapshot, handleUpdateGraphic]);

  // Toggle Visibility / Lock in Layer Stack
  const handleToggleVisibility = useCallback((g: Graphic) => {
    setGraphics((prev) =>
      prev.map((item) => {
        if (item.id === g.id) {
          item.visible = !item.visible;
        }
        return item;
      })
    );
  }, []);

  const handleToggleLock = useCallback((g: Graphic) => {
    setGraphics((prev) =>
      prev.map((item) => {
        if (item.id === g.id) {
          item.locked = !item.locked;
        }
        return item;
      })
    );
  }, []);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    pushUndoSnapshot();
    setGraphics([]);
    setSelectedGraphics([]);
  }, [pushUndoSnapshot]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        handleDuplicateSelected();
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        if (e.shiftKey) handleUngroup();
        else handleGroup();
        e.preventDefault();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
        e.preventDefault();
        return;
      }

      // Tool Switch Shortcuts
      const key = e.key.toLowerCase();
      if (key === 'v') setCurrentTool('select');
      if (key === 'a') setCurrentTool('reshape');
      if (key === 'r') setCurrentTool('rect');
      if (key === 'u') setCurrentTool('roundrect');
      if (key === 'o') setCurrentTool('ellipse');
      if (key === 'l') setCurrentTool('line');
      if (key === 'p') setCurrentTool('polyline');
      if (key === 'g') setCurrentTool('polygon');
      if (key === 's') setCurrentTool('bspline');
      if (key === 'c') setCurrentTool('bspline-closed');
      if (key === 't') setCurrentTool('text');
      if (key === 'h') setCurrentTool('pan');
      if (key === 'z' && !e.ctrlKey && !e.metaKey) setCurrentTool('zoom');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    handleDeleteSelected,
    handleGroup,
    handleUngroup,
  ]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'architecture') {
            setIsDocsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onClearCanvas={handleClearCanvas}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        zoomLevel={zoomLevel}
        onResetZoom={() => setZoomLevel(1)}
      />

      {/* Main Workspace Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentTab === 'idraw' && (
          <>
            {/* Left Tool Palette */}
            <ToolPalette
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
            />

            {/* Center Canvas */}
            <DrawCanvas
              graphics={graphics}
              selectedGraphics={selectedGraphics}
              currentTool={currentTool}
              isDarkTheme={isDarkTheme}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoomLevel={zoomLevel}
              onSelectGraphic={handleSelectGraphic}
              onSelectMultiple={handleSelectMultiple}
              onAddGraphic={handleAddGraphic}
              onUpdateGraphic={handleUpdateGraphic}
              onToolComplete={() => {
                if (currentTool !== 'select' && currentTool !== 'pan') {
                  setCurrentTool('select');
                }
              }}
            />

            {/* Right Property Inspector Dock */}
            <Inspector
              selectedGraphics={selectedGraphics}
              allGraphics={graphics}
              onUpdateGraphic={handleUpdateGraphic}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onAlign={handleAlign}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
              onRotate90={handleRotate90}
              onSelectGraphic={(g, multi) => handleSelectGraphic(g, multi)}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
            />
          </>
        )}

        {/* IV-look GUI Toolkit Component Showcase */}
        {currentTab === 'toolkit' && <ToolkitShowcase />}

        {/* TeX Box & Glue Interactive Layout Visualizer */}
        {currentTab === 'boxglue' && <BoxLayoutLab />}
      </div>

      {/* Export & Import Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        graphics={graphics}
        isDarkTheme={isDarkTheme}
        onImportScene={(imported) => {
          pushUndoSnapshot();
          setGraphics(imported);
          setSelectedGraphics([]);
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={(tmplGraphics) => {
          pushUndoSnapshot();
          setGraphics(tmplGraphics);
          setSelectedGraphics([]);
        }}
      />

      {/* Architecture Reference Modal */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
