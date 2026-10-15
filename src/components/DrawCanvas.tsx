/**
 * InterViews idraw Canvas Component
 * Direct manipulation vector graphics engine with affine transforms,
 * 8-handle bounding-box scaling, rotation, node reshaping, rulers,
 * grid snapping, rubberband marquee selection, and comprehensive
 * single-touch & multi-touch (pinch-to-zoom & two-finger pan) input support.
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan offset (world origin relative to viewport)
  const [panOffset, setPanOffset] = useState<Point>({ x: 50, y: 50 });
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [worldCursor, setWorldCursor] = useState<Point>({ x: 0, y: 0 });

  // In-progress multi-point drawing (for polylines, polygons, B-splines)
  const [inProgressPoints, setInProgressPoints] = useState<Point[]>([]);

  // Text edit input
  const [editingText, setEditingText] = useState<{
    graphic?: TextGraphic;
    worldPos: Point;
    text: string;
  } | null>(null);

  // Active mouse / single-touch dragging state
  const dragStateRef = useRef<DragState | null>(null);
  const isSpacePressedRef = useRef(false);

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

  // Keep track of touch devices for generous hit tolerance
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setIsTouchDevice(true);
    }
  }, []);

  // Converts client event coordinates to world space
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const wx = (sx - panOffset.x) / zoomLevel;
      const wy = (sy - panOffset.y) / zoomLevel;
      return { x: wx, y: wy };
    },
    [panOffset, zoomLevel]
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
    if (selectedGraphics.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const g of selectedGraphics) {
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
  }, [selectedGraphics]);

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
      const handleSize = (isTouchDevice ? 11 : 7) / zoomLevel;
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
      const rotDist = (isTouchDevice ? 28 : 20) / zoomLevel;
      const rotX = bx + bw / 2;
      const rotY = by - rotDist;

      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(rotX, rotY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rotX, rotY, handleSize / 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

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
          ctx.arc(transPt.x, transPt.y, (isTouchDevice ? 7 : 5) / zoomLevel, 0, Math.PI * 2);
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

  // Renders InterViews CAD measurement rulers along top and left edges
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
      // Top tick
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, 0);
      ctx.lineTo(cursorPos.x, rulerSize);
      ctx.stroke();
      // Left tick
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
    const tol = (isTouch ? 16 : 8) / zoomLevel;

    const bx = bounds.x;
    const by = bounds.y;
    const bw = bounds.width;
    const bh = bounds.height;

    // Rotation handle
    const rotDist = (isTouch ? 28 : 20) / zoomLevel;
    if (Math.hypot(worldPt.x - (bx + bw / 2), worldPt.y - (by - rotDist)) <= tol * 1.2) {
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

    // Pan Tool or Space Key
    if (currentTool === 'pan' || isSpacePressedRef.current) {
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
    if (['polyline', 'polygon', 'bspline', 'bspline-closed'].includes(currentTool)) {
      const closeRadius = (isTouch ? 20 : 12) / zoomLevel;
      if (inProgressPoints.length >= 2 && Math.hypot(snapped.x - inProgressPoints[0].x, snapped.y - inProgressPoints[0].y) <= closeRadius) {
        completeMultiPointShape();
        return;
      }
      setInProgressPoints((prev) => [...prev, snapped]);
      return;
    }

    // Text Tool Creation
    if (currentTool === 'text') {
      setEditingText({
        worldPos: snapped,
        text: 'InterViews Text',
      });
      return;
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

    // Hit Test Graphics in scene (reverse order: top to bottom)
    const hitTolerance = (isTouch ? 16 : 8) / zoomLevel;
    let hitGraphic: Graphic | null = null;
    for (let i = graphics.length - 1; i >= 0; i--) {
      const g = graphics[i];
      if (g.visible && !g.locked && g.containsPoint(worldPt.x, worldPt.y, hitTolerance)) {
        hitGraphic = g;
        break;
      }
    }

    if (currentTool === 'select' || currentTool === 'reshape') {
      if (hitGraphic) {
        const isAlreadySelected = selectedGraphics.some((g) => g.id === hitGraphic!.id);
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
        };
      } else {
        // Clicked/Tapped on empty space: Marquee selection or deselect
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

    // Creation Tools (Rect, RoundRect, Ellipse, Line)
    let newGraphic: Graphic | null = null;
    if (currentTool === 'rect') {
      newGraphic = new RectGraphic(snapped.x, snapped.y, 0, 0, 0);
    } else if (currentTool === 'roundrect') {
      newGraphic = new RectGraphic(snapped.x, snapped.y, 0, 0, 8);
    } else if (currentTool === 'ellipse') {
      newGraphic = new EllipseGraphic(snapped.x, snapped.y, 0, 0);
    } else if (currentTool === 'line') {
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
        g.width = dx;
        g.height = dy;
      } else if (g instanceof EllipseGraphic) {
        g.rx = Math.abs(dx);
        g.ry = Math.abs(dy);
      } else if (g instanceof LineGraphic) {
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
      if (h.includes('w')) {
        newW = Math.max(5, b.width - dx);
      }
      if (h.includes('n')) {
        newH = Math.max(5, b.height - dy);
      }

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

    if (drag.mode === 'marquee') {
      const mx = Math.min(drag.startX, drag.currentX);
      const my = Math.min(drag.startY, drag.currentY);
      const mw = Math.abs(drag.currentX - drag.startX);
      const mh = Math.abs(drag.currentY - drag.startY);

      if (mw > 6 && mh > 6) {
        const hits = graphics.filter((g) => {
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

    if (drag.mode === 'create') {
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
        // Start multi-touch pinch/pan gesture
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
          const newZoom = Math.max(0.2, Math.min(6, zoomLevel * ratio));

          // Compute zoom center relative to canvas
          const rect = canvas.getBoundingClientRect();
          const canvasMidX = mid.x - rect.left;
          const canvasMidY = mid.y - rect.top;

          // Pan delta from midpoint shift
          const dx = mid.x - pinch.lastMidpoint.x;
          const dy = mid.y - pinch.lastMidpoint.y;

          // Update pan to keep anchor under fingers
          setPanOffset((prev) => ({
            x: canvasMidX - (canvasMidX - prev.x) * (newZoom / zoomLevel) + dx,
            y: canvasMidY - (canvasMidY - prev.y) * (newZoom / zoomLevel) + dy,
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
  }, [zoomLevel, panOffset, onZoomChange]);

  // Mouse Event Handlers (Desktop Mouse)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startInteraction(e.clientX, e.clientY, false, e.shiftKey);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    moveInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    endInteraction();
  };

  // Completes multi-point shape (polyline, polygon, B-spline)
  const completeMultiPointShape = () => {
    if (inProgressPoints.length < 2) {
      setInProgressPoints([]);
      return;
    }

    let g: Graphic | null = null;
    if (currentTool === 'polyline') {
      g = new PolyGraphic(inProgressPoints, false);
    } else if (currentTool === 'polygon') {
      g = new PolyGraphic(inProgressPoints, true);
    } else if (currentTool === 'bspline') {
      g = new BSplineGraphic(inProgressPoints, false);
    } else if (currentTool === 'bspline-closed') {
      g = new BSplineGraphic(inProgressPoints, true);
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
      // Zoom centered at cursor
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
      // Scroll pan
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [editingText, inProgressPoints, currentTool]);

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
            className="flex items-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-md min-h-[36px] cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Finish Shape</span>
          </button>
          <button
            onClick={() => setInProgressPoints([])}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md min-h-[36px] cursor-pointer"
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

      {/* Text Editing Inline Modal */}
      {editingText && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm w-full flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-300 uppercase">Insert Text</span>
            <textarea
              autoFocus
              value={editingText.text}
              onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 font-mono outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEditingText(null)}
                className="px-4 py-2 min-h-[44px] text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingText.text.trim()) {
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
                }}
                className="px-5 py-2 min-h-[44px] text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg cursor-pointer flex items-center justify-center"
              >
                Place Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
