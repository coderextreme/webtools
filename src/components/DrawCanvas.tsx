/**
 * InterViews idraw Canvas Component
 * Direct manipulation vector graphics engine with affine transforms,
 * 8-handle bounding-box scaling, rotation, node reshaping, rulers,
 * grid snapping, rubberband marquee selection, and comprehensive
 * single-touch & multi-touch (pinch-to-zoom & two-finger pan) input support.
 *
 * Fully verified for touch-drag creation of shapes (Rectangles, Circles/Ellipses, Lines)
 * and seamless mobile virtual keyboard invocation when creating or editing text.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Graphic } from '../iv/core/graphic';
import {
  RectGraphic,
  EllipseGraphic,
  LineGraphic,
  PolyGraphic,
  BSplineGraphic,
  TextGraphic,
} from '../iv/core/primitives';
import { Point, RectBounds } from '../iv/core/transformer';
import { DrawingTool } from './ToolPalette';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Sliders,
  Check,
  X,
  CornerDownLeft,
  Type,
} from 'lucide-react';

export interface DrawCanvasProps {
  graphics: Graphic[];
  selectedGraphics: Graphic[];
  currentTool: DrawingTool;
  isDarkTheme: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize?: number;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  onSelectGraphic: (g: Graphic | null, multi?: boolean) => void;
  onSelectMultiple: (graphics: Graphic[]) => void;
  onAddGraphic: (g: Graphic) => void;
  onUpdateGraphic: (updater: (g: Graphic) => void) => void;
  onToolComplete?: () => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  editingTextGraphic?: TextGraphic | null;
  onCloseTextEditor?: () => void;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot' | 'node';

interface DragState {
  mode: 'create' | 'move' | 'resize' | 'rotate' | 'reshape' | 'marquee' | 'pan';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  handle?: HandleType;
  nodeIndex?: number;
  initialBounds?: RectBounds;
  initialPoints?: Point[];
  activeGraphic?: Graphic;
  isTouch?: boolean;
  isClickOnSelectedTextBox?: boolean;
  clickedTextGraphic?: TextGraphic;
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({
  graphics,
  selectedGraphics,
  currentTool,
  isDarkTheme,
  showGrid,
  snapToGrid,
  gridSize = 20,
  zoomLevel,
  onZoomChange,
  onSelectGraphic,
  onSelectMultiple,
  onAddGraphic,
  onUpdateGraphic,
  onToolComplete,
  onToggleInspector,
  isInspectorOpen,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  editingTextGraphic,
  onCloseTextEditor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Pan offset (world origin relative to viewport)
  const [panOffset, setPanOffset] = useState<Point>({ x: 50, y: 50 });
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [worldCursor, setWorldCursor] = useState<Point>({ x: 0, y: 0 });

  // In-progress multi-point drawing (for polylines, polygons, B-splines)
  const [inProgressPoints, setInProgressPoints] = useState<Point[]>([]);

  // Text edit state: supports creating new text OR editing existing TextGraphic
  const [editingText, setEditingText] = useState<{
    graphic?: TextGraphic;
    worldPos: Point;
    text: string;
  } | null>(null);

  // Sync external request to edit a TextGraphic (e.g. from Inspector)
  useEffect(() => {
    if (editingTextGraphic) {
      setEditingText({
        graphic: editingTextGraphic,
        worldPos: { x: editingTextGraphic.x, y: editingTextGraphic.y },
        text: editingTextGraphic.text,
      });
    }
  }, [editingTextGraphic]);

  // Double tap detection for touch devices
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Active mouse / single-touch dragging state
  const dragStateRef = useRef<DragState | null>(null);
  const isSpacePressedRef = useRef(false);

  // Dynamic state refs to guarantee native touch listeners NEVER suffer from stale closures
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  const graphicsRef = useRef(graphics);
  graphicsRef.current = graphics;

  const selectedGraphicsRef = useRef(selectedGraphics);
  selectedGraphicsRef.current = selectedGraphics;

  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

  const inProgressPointsRef = useRef(inProgressPoints);
  inProgressPointsRef.current = inProgressPoints;

  // Multi-touch pinch & pan tracking refs
  const pinchRef = useRef<{
    active: boolean;
    initialDistance: number;
    initialMidpoint: Point;
    lastDistance: number;
    lastMidpoint: Point;
  }>({
    active: false,
    initialDistance: 0,
    initialMidpoint: { x: 0, y: 0 },
    lastDistance: 0,
    lastMidpoint: { x: 0, y: 0 },
  });

  // Track touch capability for larger handle hitboxes
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setIsTouchDevice(true);
    }
  }, []);

  // When editingText opens, auto-focus textarea and trigger mobile keyboard
  useEffect(() => {
    if (editingText) {
      // Immediate synchronous focus attempt
      textInputRef.current?.focus();
      textInputRef.current?.select();

      // Mobile Safari / WebKit micro-delay focus backup
      const t1 = setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }, 50);

      const t2 = setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [editingText]);

  // Converts client event coordinates to world space
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const curPan = panOffsetRef.current;
      const curZoom = zoomLevelRef.current;
      const wx = (sx - curPan.x) / curZoom;
      const wy = (sy - curPan.y) / curZoom;
      return { x: wx, y: wy };
    },
    []
  );

  // Snaps coordinate to grid if enabled
  const snapCoord = useCallback(
    (val: number): number => {
      if (!snapToGrid) return val;
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const snapPoint = useCallback(
    (p: Point): Point => {
      return { x: snapCoord(p.x), y: snapCoord(p.y) };
    },
    [snapCoord]
  );

  // Calculates bounding box of all currently selected graphics
  const getSelectedBounds = useCallback((): RectBounds | null => {
    const sel = selectedGraphicsRef.current;
    if (sel.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const g of sel) {
      const b = g.getBounds();
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Canvas background
    ctx.fillStyle = isDarkTheme ? '#12151B' : '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Viewport transform
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Render Grid
    if (showGrid) {
      const startX = Math.floor((-panOffset.x / zoomLevel) / gridSize) * gridSize;
      const endX = startX + (width / zoomLevel) + gridSize * 2;
      const startY = Math.floor((-panOffset.y / zoomLevel) / gridSize) * gridSize;
      const endY = startY + (height / zoomLevel) + gridSize * 2;

      ctx.fillStyle = isDarkTheme ? '#2E354380' : '#CBD5E180';
      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
        }
      }
    }

    // Render All Scene Graphics
    for (const g of graphics) {
      if (g.visible) {
        g.draw(ctx);
      }
    }

    // Render In-Progress Polyline / Polygon / B-Spline drawing preview
    if (inProgressPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2 / zoomLevel;
      ctx.setLineDash([4 / zoomLevel, 4 / zoomLevel]);
      ctx.beginPath();
      ctx.moveTo(inProgressPoints[0].x, inProgressPoints[0].y);
      for (let i = 1; i < inProgressPoints.length; i++) {
        ctx.lineTo(inProgressPoints[i].x, inProgressPoints[i].y);
      }
      ctx.lineTo(worldCursor.x, worldCursor.y);
      ctx.stroke();

      // Render point markers
      ctx.fillStyle = '#38BDF8';
      for (const p of inProgressPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, (isTouchDevice ? 6 : 4) / zoomLevel, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Selection Indicators & Transform Handles
    const bounds = getSelectedBounds();
    if (bounds) {
      ctx.save();
      const pad = 2 / zoomLevel;
      const bx = bounds.x - pad;
      const by = bounds.y - pad;
      const bw = bounds.width + pad * 2;
      const bh = bounds.height + pad * 2;

      // Selection bounding box marquee
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5 / zoomLevel;
      ctx.setLineDash([4 / zoomLevel, 3 / zoomLevel]);
      ctx.strokeRect(bx, by, bw, bh);

      // Handle definitions (larger on touch for thumb precision)
      const handleSize = (isTouchDevice ? 12 : 8) / zoomLevel;
      const handles: { type: HandleType; x: number; y: number }[] = [
        { type: 'nw', x: bx, y: by },
        { type: 'n', x: bx + bw / 2, y: by },
        { type: 'ne', x: bx + bw, y: by },
        { type: 'e', x: bx + bw, y: by + bh / 2 },
        { type: 'se', x: bx + bw, y: by + bh },
        { type: 's', x: bx + bw / 2, y: by + bh },
        { type: 'sw', x: bx, y: by + bh },
        { type: 'w', x: bx, y: by + bh / 2 },
      ];

      // Draw 8 bounding-box scaling handles
      ctx.fillStyle = isDarkTheme ? '#0F172A' : '#FFFFFF';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5 / zoomLevel;
      ctx.setLineDash([]);

      for (const h of handles) {
        ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      }

      // Draw Rotation Handle above the box
      const rotDist = (isTouchDevice ? 30 : 20) / zoomLevel;
      const rotX = bx + bw / 2;
      const rotY = by - rotDist;

      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(rotX, rotY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rotX, rotY, handleSize / 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

      // For selected TextGraphic, show a helpful indicator that clicking the box opens the text editor
      if (selectedGraphics.length === 1 && selectedGraphics[0] instanceof TextGraphic) {
        ctx.save();
        ctx.font = `${Math.max(10, 11 / zoomLevel)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('✎ Click box to edit text', bx + bw / 2, by + bh + 8 / zoomLevel);
        ctx.restore();
      }

      // If in Reshape mode, draw vertex nodes for the selected item
      if (currentTool === 'reshape' && selectedGraphics.length === 1) {
        const primary = selectedGraphics[0];
        let nodes: Point[] = [];
        if (primary instanceof PolyGraphic) nodes = primary.points;
        if (primary instanceof BSplineGraphic) nodes = primary.controlPoints;
        if (primary instanceof LineGraphic) nodes = [{ x: primary.x1, y: primary.y1 }, { x: primary.x2, y: primary.y2 }];

        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#FFFFFF';
        for (const pt of nodes) {
          const transPt = primary.transformer.transformPoint(pt);
          ctx.beginPath();
          ctx.arc(transPt.x, transPt.y, (isTouchDevice ? 8 : 5) / zoomLevel, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Render Drag Marquee Box (multi-select)
    const drag = dragStateRef.current;
    if (drag && drag.mode === 'marquee') {
      ctx.save();
      const mx = Math.min(drag.startX, drag.currentX);
      const my = Math.min(drag.startY, drag.currentY);
      const mw = Math.abs(drag.currentX - drag.startX);
      const mh = Math.abs(drag.currentY - drag.startY);

      ctx.fillStyle = '#38BDF820';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1 / zoomLevel;
      ctx.setLineDash([3 / zoomLevel, 3 / zoomLevel]);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.restore();
    }

    ctx.restore(); // Restore viewport transform

    // Render Top & Left Workstation Measurement Rulers
    renderRulers(ctx, width, height);

    ctx.restore(); // Restore dpr scale
  }, [
    graphics,
    selectedGraphics,
    currentTool,
    panOffset,
    zoomLevel,
    isDarkTheme,
    showGrid,
    gridSize,
    inProgressPoints,
    worldCursor,
    getSelectedBounds,
    isTouchDevice,
  ]);

  // Renders InterViews measurement rulers along top and left edges
  const renderRulers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const rulerSize = isTouchDevice ? 16 : 20;

    // Top Ruler Background
    ctx.fillStyle = isDarkTheme ? '#1E293B' : '#E2E8F0';
    ctx.fillRect(0, 0, width, rulerSize);
    // Left Ruler Background
    ctx.fillRect(0, 0, rulerSize, height);

    // Corner box
    ctx.fillStyle = isDarkTheme ? '#0F172A' : '#CBD5E1';
    ctx.fillRect(0, 0, rulerSize, rulerSize);

    // Dividers
    ctx.strokeStyle = isDarkTheme ? '#334155' : '#94A3B8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerSize);
    ctx.lineTo(width, rulerSize);
    ctx.moveTo(rulerSize, 0);
    ctx.lineTo(rulerSize, height);
    ctx.stroke();

    ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
    ctx.font = '9px monospace';
    ctx.textBaseline = 'top';

    // Top Ruler graduations
    const tickStep = zoomLevel > 2 ? 20 : zoomLevel > 0.5 ? 50 : 100;
    const startWorldX = Math.floor((-panOffset.x / zoomLevel) / tickStep) * tickStep;
    const endWorldX = startWorldX + (width / zoomLevel) + tickStep;

    for (let wx = startWorldX; wx <= endWorldX; wx += tickStep) {
      const sx = wx * zoomLevel + panOffset.x;
      if (sx >= rulerSize && sx <= width) {
        ctx.beginPath();
        ctx.moveTo(sx, rulerSize - 5);
        ctx.lineTo(sx, rulerSize);
        ctx.stroke();
        if (!isTouchDevice || wx % (tickStep * 2) === 0) {
          ctx.fillText(wx.toString(), sx + 2, 2);
        }
      }
    }

    // Left Ruler graduations
    const startWorldY = Math.floor((-panOffset.y / zoomLevel) / tickStep) * tickStep;
    const endWorldY = startWorldY + (height / zoomLevel) + tickStep;

    for (let wy = startWorldY; wy <= endWorldY; wy += tickStep) {
      const sy = wy * zoomLevel + panOffset.y;
      if (sy >= rulerSize && sy <= height) {
        ctx.beginPath();
        ctx.moveTo(rulerSize - 5, sy);
        ctx.lineTo(rulerSize, sy);
        ctx.stroke();
      }
    }

    // Cursor tracking markers on rulers
    if (cursorPos.x >= rulerSize && cursorPos.y >= rulerSize) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, 0);
      ctx.lineTo(cursorPos.x, rulerSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cursorPos.y);
      ctx.lineTo(rulerSize, cursorPos.y);
      ctx.stroke();
    }
  };

  // Hit-test handles (with touch-adapted tolerance)
  const hitTestHandles = (worldPt: Point, isTouch = false): HandleType | null => {
    const bounds = getSelectedBounds();
    if (!bounds) return null;
    const tol = (isTouch ? 18 : 8) / zoomLevelRef.current;

    const bx = bounds.x;
    const by = bounds.y;
    const bw = bounds.width;
    const bh = bounds.height;

    // Rotation handle
    const rotDist = (isTouch ? 30 : 20) / zoomLevelRef.current;
    if (Math.hypot(worldPt.x - (bx + bw / 2), worldPt.y - (by - rotDist)) <= tol * 1.25) {
      return 'rot';
    }

    if (Math.hypot(worldPt.x - bx, worldPt.y - by) <= tol) return 'nw';
    if (Math.hypot(worldPt.x - (bx + bw / 2), worldPt.y - by) <= tol) return 'n';
    if (Math.hypot(worldPt.x - (bx + bw), worldPt.y - by) <= tol) return 'ne';
    if (Math.hypot(worldPt.x - (bx + bw), worldPt.y - (by + bh / 2)) <= tol) return 'e';
    if (Math.hypot(worldPt.x - (bx + bw), worldPt.y - (by + bh)) <= tol) return 'se';
    if (Math.hypot(worldPt.x - (bx + bw / 2), worldPt.y - (by + bh)) <= tol) return 's';
    if (Math.hypot(worldPt.x - bx, worldPt.y - (by + bh)) <= tol) return 'sw';
    if (Math.hypot(worldPt.x - bx, worldPt.y - (by + bh / 2)) <= tol) return 'w';

    return null;
  };

  // Core Pointer / Touch Start Processing
  const startInteraction = (clientX: number, clientY: number, isTouch = false, shiftKey = false) => {
    const worldPt = screenToWorld(clientX, clientY);
    const snapped = snapPoint(worldPt);
    const activeTool = currentToolRef.current;
    const curGraphics = graphicsRef.current;
    const curSelected = selectedGraphicsRef.current;
    const curZoom = zoomLevelRef.current;

    // Check double-click/double-tap to edit text
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 350 && Math.hypot(clientX - lastTapRef.current.x, clientY - lastTapRef.current.y) < 25;
    lastTapRef.current = { time: now, x: clientX, y: clientY };

    // Pan Tool or Space Key
    if (activeTool === 'pan' || isSpacePressedRef.current) {
      dragStateRef.current = {
        mode: 'pan',
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
        isTouch,
      };
      return;
    }

    // Polyline / Polygon / B-Spline Multi-Point Placement
    if (['polyline', 'polygon', 'bspline', 'bspline-closed'].includes(activeTool)) {
      const closeRadius = (isTouch ? 24 : 14) / curZoom;
      const pts = inProgressPointsRef.current;
      if (pts.length >= 2 && Math.hypot(snapped.x - pts[0].x, snapped.y - pts[0].y) <= closeRadius) {
        completeMultiPointShape();
        return;
      }
      setInProgressPoints((prev) => [...prev, snapped]);
      return;
    }

    // Text Tool: either edit tapped existing text or create new text
    if (activeTool === 'text') {
      let targetText: TextGraphic | null = null;
      for (let i = curGraphics.length - 1; i >= 0; i--) {
        const g = curGraphics[i];
        if (g.visible && !g.locked && g instanceof TextGraphic && g.containsPoint(worldPt.x, worldPt.y, (isTouch ? 20 : 10) / curZoom)) {
          targetText = g;
          break;
        }
      }

      if (targetText) {
        onSelectGraphic(targetText);
        setEditingText({
          graphic: targetText,
          worldPos: { x: targetText.x, y: targetText.y },
          text: targetText.text,
        });
      } else {
        setEditingText({
          worldPos: snapped,
          text: 'InterViews Text',
        });
      }
      return;
    }

    // Check if user clicked on the selected box of a selected TextGraphic in the main window
    let isClickOnSelectedTextBox = false;
    let selectedTextGraphic: TextGraphic | null = null;

    if (
      curSelected.length === 1 &&
      curSelected[0] instanceof TextGraphic &&
      !shiftKey &&
      activeTool === 'select'
    ) {
      const selText = curSelected[0] as TextGraphic;
      const b = selText.getBounds();
      const tol = (isTouch ? 16 : 8) / curZoom;
      if (
        worldPt.x >= b.x - tol &&
        worldPt.x <= b.x + b.width + tol &&
        worldPt.y >= b.y - tol &&
        worldPt.y <= b.y + b.height + tol
      ) {
        isClickOnSelectedTextBox = true;
        selectedTextGraphic = selText;
      }
    }

    // Check Handle Hits on Selection
    const handleHit = hitTestHandles(worldPt, isTouch);
    if (handleHit) {
      const bounds = getSelectedBounds()!;
      dragStateRef.current = {
        mode: handleHit === 'rot' ? 'rotate' : 'resize',
        handle: handleHit,
        startX: worldPt.x,
        startY: worldPt.y,
        currentX: worldPt.x,
        currentY: worldPt.y,
        initialBounds: { ...bounds },
        isTouch,
      };
      return;
    }

    // If user clicked inside the selected box of a selected TextGraphic (not on resize/rotation handles)
    if (isClickOnSelectedTextBox && selectedTextGraphic) {
      dragStateRef.current = {
        mode: 'move',
        startX: snapped.x,
        startY: snapped.y,
        currentX: snapped.x,
        currentY: snapped.y,
        isTouch,
        isClickOnSelectedTextBox: true,
        clickedTextGraphic: selectedTextGraphic,
      };
      return;
    }

    // Hit Test Graphics in scene (reverse order: top to bottom)
    const hitTolerance = (isTouch ? 18 : 8) / curZoom;
    let hitGraphic: Graphic | null = null;
    for (let i = curGraphics.length - 1; i >= 0; i--) {
      const g = curGraphics[i];
      if (g.visible && !g.locked && g.containsPoint(worldPt.x, worldPt.y, hitTolerance)) {
        hitGraphic = g;
        break;
      }
    }

    // If double tap on a TextGraphic in Select tool, edit it directly!
    if (isDoubleTap && hitGraphic instanceof TextGraphic) {
      onSelectGraphic(hitGraphic);
      setEditingText({
        graphic: hitGraphic,
        worldPos: { x: hitGraphic.x, y: hitGraphic.y },
        text: hitGraphic.text,
      });
      return;
    }

    if (activeTool === 'select' || activeTool === 'reshape') {
      if (hitGraphic) {
        const isAlreadySelected = curSelected.some((g) => g.id === hitGraphic!.id);
        if (!isAlreadySelected && !shiftKey) {
          onSelectGraphic(hitGraphic);
        } else if (shiftKey) {
          onSelectGraphic(hitGraphic, true);
        }

        // Start Moving Graphic
        dragStateRef.current = {
          mode: 'move',
          startX: snapped.x,
          startY: snapped.y,
          currentX: snapped.x,
          currentY: snapped.y,
          isTouch,
          isClickOnSelectedTextBox: isAlreadySelected && hitGraphic instanceof TextGraphic,
          clickedTextGraphic: isAlreadySelected && hitGraphic instanceof TextGraphic ? hitGraphic : undefined,
        };
      } else {
        // Tapped empty space: Marquee or deselect
        if (!shiftKey) {
          onSelectGraphic(null);
        }
        dragStateRef.current = {
          mode: 'marquee',
          startX: worldPt.x,
          startY: worldPt.y,
          currentX: worldPt.x,
          currentY: worldPt.y,
          isTouch,
        };
      }
      return;
    }

    // Creation Tools: Rect, RoundRect, Ellipse, Line
    let newGraphic: Graphic | null = null;
    if (activeTool === 'rect') {
      newGraphic = new RectGraphic(snapped.x, snapped.y, 0, 0, 0);
    } else if (activeTool === 'roundrect') {
      newGraphic = new RectGraphic(snapped.x, snapped.y, 0, 0, 8);
    } else if (activeTool === 'ellipse') {
      newGraphic = new EllipseGraphic(snapped.x, snapped.y, 0, 0);
    } else if (activeTool === 'line') {
      newGraphic = new LineGraphic(snapped.x, snapped.y, snapped.x, snapped.y);
    }

    if (newGraphic) {
      dragStateRef.current = {
        mode: 'create',
        startX: snapped.x,
        startY: snapped.y,
        currentX: snapped.x,
        currentY: snapped.y,
        activeGraphic: newGraphic,
        isTouch,
      };
      onAddGraphic(newGraphic);
      onSelectGraphic(newGraphic);
    }
  };

  // Core Pointer / Touch Move Processing
  const moveInteraction = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });

    const worldPt = screenToWorld(clientX, clientY);
    setWorldCursor(worldPt);

    const drag = dragStateRef.current;
    if (!drag) return;

    const snapped = snapPoint(worldPt);
    drag.currentX = worldPt.x;
    drag.currentY = worldPt.y;

    if (drag.mode === 'pan') {
      const dx = clientX - drag.startX;
      const dy = clientY - drag.startY;
      drag.startX = clientX;
      drag.startY = clientY;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (drag.mode === 'create' && drag.activeGraphic) {
      const g = drag.activeGraphic;
      const dx = snapped.x - drag.startX;
      const dy = snapped.y - drag.startY;

      if (g instanceof RectGraphic) {
        // Normalize origin so user can drag in ANY quadrant (top-left, bottom-left, top-right, bottom-right)
        g.x = Math.min(drag.startX, snapped.x);
        g.y = Math.min(drag.startY, snapped.y);
        g.width = Math.max(1, Math.abs(dx));
        g.height = Math.max(1, Math.abs(dy));
      } else if (g instanceof EllipseGraphic) {
        // Bounding-box creation: center is midpoint between initial touch and current touch
        g.cx = (drag.startX + snapped.x) / 2;
        g.cy = (drag.startY + snapped.y) / 2;
        g.rx = Math.max(1, Math.abs(dx) / 2);
        g.ry = Math.max(1, Math.abs(dy) / 2);
      } else if (g instanceof LineGraphic) {
        g.x1 = drag.startX;
        g.y1 = drag.startY;
        g.x2 = snapped.x;
        g.y2 = snapped.y;
      }
      onUpdateGraphic(() => {});
      return;
    }

    if (drag.mode === 'move') {
      const dx = snapped.x - drag.startX;
      const dy = snapped.y - drag.startY;
      if (dx !== 0 || dy !== 0) {
        onUpdateGraphic((g) => {
          g.transformer.translate(dx, dy);
        });
        drag.startX = snapped.x;
        drag.startY = snapped.y;
      }
      return;
    }

    if (drag.mode === 'resize' && drag.initialBounds && drag.handle) {
      const b = drag.initialBounds;
      const h = drag.handle;
      const dx = worldPt.x - drag.startX;
      const dy = worldPt.y - drag.startY;

      let newW = b.width;
      let newH = b.height;

      if (h.includes('e')) newW = Math.max(5, b.width + dx);
      if (h.includes('s')) newH = Math.max(5, b.height + dy);
      if (h.includes('w')) newW = Math.max(5, b.width - dx);
      if (h.includes('n')) newH = Math.max(5, b.height - dy);

      const sx = newW / b.width;
      const sy = newH / b.height;

      onUpdateGraphic((g) => {
        g.transformer.scale(sx, sy, b.x, b.y);
      });
      return;
    }

    if (drag.mode === 'rotate' && drag.initialBounds) {
      const b = drag.initialBounds;
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const prevAngle = Math.atan2(drag.startY - cy, drag.startX - cx);
      const currAngle = Math.atan2(worldPt.y - cy, worldPt.x - cx);
      const deltaAngle = currAngle - prevAngle;

      onUpdateGraphic((g) => {
        g.transformer.rotate(deltaAngle, cx, cy);
      });
      drag.startX = worldPt.x;
      drag.startY = worldPt.y;
    }
  };

  // Core Pointer / Touch End Processing
  const endInteraction = () => {
    const drag = dragStateRef.current;
    if (!drag) return;

    // If user clicked/tapped on the selected box of a TextGraphic (released without dragging across canvas)
    if (drag.isClickOnSelectedTextBox && drag.clickedTextGraphic) {
      const dist = Math.hypot(drag.currentX - drag.startX, drag.currentY - drag.startY);
      if (dist < 5) {
        const tg = drag.clickedTextGraphic;
        setEditingText({
          graphic: tg,
          worldPos: { x: tg.x, y: tg.y },
          text: tg.text,
        });
        dragStateRef.current = null;
        return;
      }
    }

    if (drag.mode === 'marquee') {
      const mx = Math.min(drag.startX, drag.currentX);
      const my = Math.min(drag.startY, drag.currentY);
      const mw = Math.abs(drag.currentX - drag.startX);
      const mh = Math.abs(drag.currentY - drag.startY);

      if (mw > 6 && mh > 6) {
        const hits = graphicsRef.current.filter((g) => {
          const b = g.getBounds();
          return (
            b.x >= mx &&
            b.y >= my &&
            b.x + b.width <= mx + mw &&
            b.y + b.height <= my + mh
          );
        });
        onSelectMultiple(hits);
      }
    }

    if (drag.mode === 'create' && drag.activeGraphic) {
      const g = drag.activeGraphic;
      // If user tapped without dragging far, assign comfortable default dimensions
      if (g instanceof RectGraphic && g.width <= 6 && g.height <= 6) {
        g.width = 110;
        g.height = 70;
        onUpdateGraphic(() => {});
      } else if (g instanceof EllipseGraphic && g.rx <= 4 && g.ry <= 4) {
        g.rx = 45;
        g.ry = 45;
        onUpdateGraphic(() => {});
      } else if (g instanceof LineGraphic && Math.hypot(g.x2 - g.x1, g.y2 - g.y1) <= 6) {
        g.x2 = g.x1 + 100;
        g.y2 = g.y1 + 60;
        onUpdateGraphic(() => {});
      }

      onToolComplete?.();
    }

    dragStateRef.current = null;
  };

  // Dedicated Native Touch Listeners with Non-Passive preventDefault()
  // Handles Single-Touch & Multi-Touch (Pinch-to-Zoom and Two-Finger Pan)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        // Multi-touch pinch/pan gesture
        dragStateRef.current = null;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const mid: Point = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        pinchRef.current = {
          active: true,
          initialDistance: dist,
          initialMidpoint: mid,
          lastDistance: dist,
          lastMidpoint: mid,
        };
        return;
      }

      if (e.touches.length === 1 && !pinchRef.current.active) {
        const touch = e.touches[0];
        startInteraction(touch.clientX, touch.clientY, true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2 && pinchRef.current.active) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const mid: Point = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const pinch = pinchRef.current;
        if (pinch.lastDistance > 0) {
          const ratio = dist / pinch.lastDistance;
          const curZoom = zoomLevelRef.current;
          const newZoom = Math.max(0.2, Math.min(6, curZoom * ratio));

          // Center zoom at touch midpoint
          const rect = canvas.getBoundingClientRect();
          const canvasMidX = mid.x - rect.left;
          const canvasMidY = mid.y - rect.top;

          const dx = mid.x - pinch.lastMidpoint.x;
          const dy = mid.y - pinch.lastMidpoint.y;

          setPanOffset((prev) => ({
            x: canvasMidX - (canvasMidX - prev.x) * (newZoom / curZoom) + dx,
            y: canvasMidY - (canvasMidY - prev.y) * (newZoom / curZoom) + dy,
          }));

          onZoomChange?.(newZoom);
        }

        pinch.lastDistance = dist;
        pinch.lastMidpoint = mid;
        return;
      }

      if (e.touches.length === 1 && !pinchRef.current.active) {
        const touch = e.touches[0];
        moveInteraction(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length < 2 && pinchRef.current.active) {
        pinchRef.current.active = false;
        dragStateRef.current = null;
        return;
      }

      if (e.touches.length === 0) {
        endInteraction();
      }
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      pinchRef.current.active = false;
      dragStateRef.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onZoomChange]);

  // Mouse Event Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If double clicked with mouse on a TextGraphic, open text editor modal
    if (e.detail === 2) {
      const worldPt = screenToWorld(e.clientX, e.clientY);
      const curGraphics = graphicsRef.current;
      const curZoom = zoomLevelRef.current;
      for (let i = curGraphics.length - 1; i >= 0; i--) {
        const g = curGraphics[i];
        if (g.visible && !g.locked && g instanceof TextGraphic && g.containsPoint(worldPt.x, worldPt.y, 14 / curZoom)) {
          onSelectGraphic(g);
          setEditingText({
            graphic: g,
            worldPos: { x: g.x, y: g.y },
            text: g.text,
          });
          return;
        }
      }
    }
    startInteraction(e.clientX, e.clientY, false, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const curGraphics = graphicsRef.current;
    const curZoom = zoomLevelRef.current;
    for (let i = curGraphics.length - 1; i >= 0; i--) {
      const g = curGraphics[i];
      if (g.visible && !g.locked && g instanceof TextGraphic && g.containsPoint(worldPt.x, worldPt.y, 14 / curZoom)) {
        onSelectGraphic(g);
        setEditingText({
          graphic: g,
          worldPos: { x: g.x, y: g.y },
          text: g.text,
        });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    moveInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    endInteraction();
  };

  // Completes multi-point shape (polyline, polygon, B-spline)
  const completeMultiPointShape = () => {
    const pts = inProgressPointsRef.current;
    if (pts.length < 2) {
      setInProgressPoints([]);
      return;
    }

    const tool = currentToolRef.current;
    let g: Graphic | null = null;
    if (tool === 'polyline') {
      g = new PolyGraphic(pts, false);
    } else if (tool === 'polygon') {
      g = new PolyGraphic(pts, true);
    } else if (tool === 'bspline') {
      g = new BSplineGraphic(pts, false);
    } else if (tool === 'bspline-closed') {
      g = new BSplineGraphic(pts, true);
    }

    if (g) {
      onAddGraphic(g);
      onSelectGraphic(g);
    }
    setInProgressPoints([]);
    onToolComplete?.();
  };

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.2, Math.min(6, zoomLevel * zoomFactor));
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoomLevel),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoomLevel),
      }));
      onZoomChange?.(newZoom);
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Zoom Button Controls
  const zoomIn = () => {
    const newZoom = Math.min(6, zoomLevel * 1.25);
    onZoomChange?.(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.2, zoomLevel / 1.25);
    onZoomChange?.(newZoom);
  };

  const resetZoom = () => {
    onZoomChange?.(1);
    setPanOffset({ x: 50, y: 50 });
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        isSpacePressedRef.current = true;
      }
      if (editingText) return;
      if (e.key === 'Enter' && inProgressPoints.length >= 2) {
        completeMultiPointShape();
      } else if (e.key === 'Escape') {
        setInProgressPoints([]);
        onSelectGraphic(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingText, inProgressPoints]);

  // Insert newline at caret position and maintain focus
  const handleInsertNewline = () => {
    const el = textInputRef.current;
    if (!el) {
      setEditingText((prev) => (prev ? { ...prev, text: prev.text + '\n' } : null));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const val = el.value;
    const updated = val.substring(0, start) + '\n' + val.substring(end);
    setEditingText((prev) => (prev ? { ...prev, text: updated } : null));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + 1;
    });
  };

  // Saves either newly created text or updates existing text graphic
  const handleSaveText = () => {
    if (!editingText) return;

    if (editingText.graphic) {
      // Editing existing graphic
      const target = editingText.graphic;
      target.text = editingText.text;
      onUpdateGraphic((g) => {
        if (g.id === target.id && g instanceof TextGraphic) {
          g.text = editingText.text;
        }
      });
    } else if (editingText.text.trim()) {
      // Placing new graphic
      const tg = new TextGraphic(
        editingText.text,
        editingText.worldPos.x,
        editingText.worldPos.y
      );
      onAddGraphic(tg);
      onSelectGraphic(tg);
      onToolComplete?.();
    }
    setEditingText(null);
    onCloseTextEditor?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-slate-950 touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
        className="w-full h-full block cursor-crosshair select-none"
      />

      {/* Floating Coordinate Status Badge */}
      <div className="absolute top-7 left-7 hidden sm:flex items-center gap-3 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-xs text-[11px] font-mono tabular-nums text-slate-400 select-none pointer-events-none z-10 backdrop-blur-xs">
        <span>X: {Math.round(worldCursor.x)}px</span>
        <span>Y: {Math.round(worldCursor.y)}px</span>
        <span className="text-sky-400">Tool: {currentTool}</span>
      </div>

      {/* Touch-Friendly In-Progress Path Action Bar */}
      {inProgressPoints.length > 0 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 border border-sky-500/50 rounded-lg shadow-xl backdrop-blur-md">
          <span className="text-xs text-sky-300 font-medium">
            Points: {inProgressPoints.length}
          </span>
          <button
            onClick={completeMultiPointShape}
            className="flex items-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-md min-h-[38px] cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Finish Shape</span>
          </button>
          <button
            onClick={() => setInProgressPoints([])}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md min-h-[38px] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Quick HUD (Touch Ergonomics for Zoom, Undo/Redo & Inspector) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Undo / Redo for Mobile */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg backdrop-blur-md shadow-lg">
          <button
            title="Undo"
            disabled={!canUndo}
            onClick={onUndo}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 active:scale-95 transition-transform rounded-md cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            title="Redo"
            disabled={!canRedo}
            onClick={onRedo}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 active:scale-95 transition-transform rounded-md cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls Bar */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg backdrop-blur-md shadow-lg">
          <button
            title="Zoom Out"
            onClick={zoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-transform rounded-md cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            title="Reset Zoom (100%)"
            onClick={resetZoom}
            className="px-2 h-10 text-xs font-mono font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-slate-400" />
            <span className="tabular-nums">{Math.round(zoomLevel * 100)}%</span>
          </button>
          <button
            title="Zoom In"
            onClick={zoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-transform rounded-md cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile / Tablet Inspector Toggle Button */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className={`lg:hidden flex items-center gap-2 px-3.5 h-11 rounded-xl shadow-xl font-semibold text-xs transition-all cursor-pointer ${
              isInspectorOpen || selectedGraphics.length > 0
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900/95 text-slate-200 border border-slate-700 backdrop-blur-md'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Inspector</span>
            {selectedGraphics.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-sky-400 text-[10px] flex items-center justify-center font-mono">
                {selectedGraphics.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Multi-Line Text Editing Modal with Enter Key Support & Mobile Keyboard Optimization */}
      {editingText && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingText(null);
              onCloseTextEditor?.();
            }
          }}
          className="absolute inset-0 z-50 flex items-center sm:items-start justify-center bg-black/75 p-3 sm:p-5 sm:pt-16 backdrop-blur-xs select-text touch-auto overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-slate-700 p-5 sm:p-6 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col gap-4 select-text touch-auto my-auto sm:my-0 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    {editingText.graphic ? 'Edit Multi-Line Text' : 'Insert Multi-Line Text'}
                  </h3>
                  <p className="text-[11px] text-slate-400">InterViews idraw Vector Text Editor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingText(null);
                  onCloseTextEditor?.();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Toolbar: Insert Newline & Live Counters */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-3.5 py-2.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={handleInsertNewline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-sky-300 font-mono text-xs rounded-md border border-slate-700 cursor-pointer min-h-[36px] transition-colors"
                title="Insert a new line at cursor position (same as pressing Enter on keyboard)"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold">↵ New Line</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-200 font-semibold">
                  {editingText.text.split('\n').length} lines
                </span>
                <span>•</span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
                  {editingText.text.length} characters
                </span>
              </div>
            </div>

            {/* Generous Multi-line Textarea with Enter Key Enabled */}
            <textarea
              ref={textInputRef}
              autoFocus
              enterKeyHint="enter"
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="on"
              spellCheck="false"
              wrap="soft"
              value={editingText.text}
              onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
              onKeyDown={(e) => {
                e.stopPropagation();
                // Ctrl+Enter or Cmd+Enter submits as keyboard shortcut
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSaveText();
                  return;
                }
                // Plain Enter key naturally inserts a newline character in the textarea
              }}
              rows={10}
              className="w-full bg-slate-950 border-2 border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-xl p-4 text-base text-slate-100 font-mono leading-relaxed outline-hidden min-h-[220px] resize-y select-text shadow-inner placeholder:text-slate-600"
              style={{ width: '100%', userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'manipulation' }}
              placeholder={"Type your text here...\nPress the Enter key on your keyboard to start a new line.\nLine 2\nLine 3\nLine 4\nLine 5"}
            />

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-semibold text-xs">
                  Enter ↵
                </kbd>
                <span>key on keyboard inserts new line</span>
              </span>
              <span className="hidden sm:inline text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 text-xs">Ctrl+Enter</kbd> to save
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingText(null);
                  onCloseTextEditor?.();
                }}
                className="px-4 py-2 min-h-[44px] text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveText}
                className="px-5 py-2 min-h-[44px] text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingText.graphic ? 'Apply Changes' : 'Place Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
