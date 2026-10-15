/**
 * InterViews idraw Canvas Component
 * Direct manipulation vector graphics engine with affine transforms,
 * 8-handle bounding-box scaling, rotation, node reshaping, rulers,
 * grid snapping, and rubberband marquee selection.
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

export interface DrawCanvasProps {
  graphics: Graphic[];
  selectedGraphics: Graphic[];
  currentTool: DrawingTool;
  isDarkTheme: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize?: number;
  zoomLevel: number;
  onSelectGraphic: (g: Graphic | null, multi?: boolean) => void;
  onSelectMultiple: (graphics: Graphic[]) => void;
  onAddGraphic: (g: Graphic) => void;
  onUpdateGraphic: (updater: (g: Graphic) => void) => void;
  onToolComplete?: () => void;
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
  initialMatrices?: number[][];
  activeGraphic?: Graphic;
  polyPoints?: Point[];
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
  onSelectGraphic,
  onSelectMultiple,
  onAddGraphic,
  onUpdateGraphic,
  onToolComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan offset (world origin relative to viewport)
  const [panOffset, setPanOffset] = useState<Point>({ x: 60, y: 60 });
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

  // Active mouse dragging state
  const dragStateRef = useRef<DragState | null>(null);
  const isSpacePressedRef = useRef(false);

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
        ctx.arc(p.x, p.y, 4 / zoomLevel, 0, Math.PI * 2);
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

      // Handle definitions
      const handleSize = 7 / zoomLevel;
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
      const rotDist = 20 / zoomLevel;
      const rotX = bx + bw / 2;
      const rotY = by - rotDist;

      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(rotX, rotY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rotX, rotY, handleSize / 1.8, 0, Math.PI * 2);
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
          ctx.arc(transPt.x, transPt.y, 5 / zoomLevel, 0, Math.PI * 2);
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
  ]);

  // Renders InterViews CAD measurement rulers along top and left edges
  const renderRulers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const rulerSize = 20;

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
        ctx.moveTo(sx, rulerSize - 6);
        ctx.lineTo(sx, rulerSize);
        ctx.stroke();
        ctx.fillText(wx.toString(), sx + 2, 2);
      }
    }

    // Left Ruler graduations
    const startWorldY = Math.floor((-panOffset.y / zoomLevel) / tickStep) * tickStep;
    const endWorldY = startWorldY + (height / zoomLevel) + tickStep;

    for (let wy = startWorldY; wy <= endWorldY; wy += tickStep) {
      const sy = wy * zoomLevel + panOffset.y;
      if (sy >= rulerSize && sy <= height) {
        ctx.beginPath();
        ctx.moveTo(rulerSize - 6, sy);
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

  // Hit-test handles
  const hitTestHandles = (worldPt: Point): HandleType | null => {
    const bounds = getSelectedBounds();
    if (!bounds) return null;
    const tol = 8 / zoomLevel;

    const bx = bounds.x;
    const by = bounds.y;
    const bw = bounds.width;
    const bh = bounds.height;

    // Rotation handle
    const rotDist = 20 / zoomLevel;
    if (Math.hypot(worldPt.x - (bx + bw / 2), worldPt.y - (by - rotDist)) <= tol) {
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

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const snapped = snapPoint(worldPt);

    // Pan Tool or Middle Mouse Button or Space Key
    if (currentTool === 'pan' || e.button === 1 || isSpacePressedRef.current) {
      dragStateRef.current = {
        mode: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      };
      return;
    }

    // Polyline / Polygon / B-Spline Multi-Point Placement
    if (['polyline', 'polygon', 'bspline', 'bspline-closed'].includes(currentTool)) {
      // Check if clicking near start point to close
      if (inProgressPoints.length >= 2 && Math.hypot(snapped.x - inProgressPoints[0].x, snapped.y - inProgressPoints[0].y) <= 12 / zoomLevel) {
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
    const handleHit = hitTestHandles(worldPt);
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
      };
      return;
    }

    // Hit Test Graphics in scene (reverse order: top to bottom)
    let hitGraphic: Graphic | null = null;
    for (let i = graphics.length - 1; i >= 0; i--) {
      const g = graphics[i];
      if (g.visible && !g.locked && g.containsPoint(worldPt.x, worldPt.y, 8 / zoomLevel)) {
        hitGraphic = g;
        break;
      }
    }

    if (currentTool === 'select' || currentTool === 'reshape') {
      if (hitGraphic) {
        const isAlreadySelected = selectedGraphics.some((g) => g.id === hitGraphic!.id);
        if (!isAlreadySelected && !e.shiftKey) {
          onSelectGraphic(hitGraphic);
        } else if (e.shiftKey) {
          onSelectGraphic(hitGraphic, true);
        }

        // Start Moving Graphic
        dragStateRef.current = {
          mode: 'move',
          startX: snapped.x,
          startY: snapped.y,
          currentX: snapped.x,
          currentY: snapped.y,
        };
      } else {
        // Clicked on empty space: Marquee selection
        if (!e.shiftKey) {
          onSelectGraphic(null);
        }
        dragStateRef.current = {
          mode: 'marquee',
          startX: worldPt.x,
          startY: worldPt.y,
          currentX: worldPt.x,
          currentY: worldPt.y,
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
      };
      onAddGraphic(newGraphic);
      onSelectGraphic(newGraphic);
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const worldPt = screenToWorld(e.clientX, e.clientY);
    setWorldCursor(worldPt);

    const drag = dragStateRef.current;
    if (!drag) return;

    const snapped = snapPoint(worldPt);
    drag.currentX = worldPt.x;
    drag.currentY = worldPt.y;

    if (drag.mode === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
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
      let newX = b.x;
      let newY = b.y;

      if (h.includes('e')) newW = Math.max(5, b.width + dx);
      if (h.includes('s')) newH = Math.max(5, b.height + dy);
      if (h.includes('w')) {
        newW = Math.max(5, b.width - dx);
        newX = b.x + dx;
      }
      if (h.includes('n')) {
        newH = Math.max(5, b.height - dy);
        newY = b.y + dy;
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

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    const drag = dragStateRef.current;
    if (!drag) return;

    if (drag.mode === 'marquee') {
      const mx = Math.min(drag.startX, drag.currentX);
      const my = Math.min(drag.startY, drag.currentY);
      const mw = Math.abs(drag.currentX - drag.startX);
      const mh = Math.abs(drag.currentY - drag.startY);

      if (mw > 4 && mh > 4) {
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
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      // Zoom centered at cursor
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * zoomFactor,
        y: mouseY - (mouseY - prev.y) * zoomFactor,
      }));
    } else {
      // Scroll pan
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
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
    <div ref={containerRef} className="relative flex-1 h-full w-full overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair select-none"
      />

      {/* Floating Coordinate Status Badge */}
      <div className="absolute bottom-3 left-4 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-xs text-[11px] font-mono tabular-nums text-slate-400 flex items-center gap-3 select-none pointer-events-none z-10 backdrop-blur-xs">
        <span>X: {Math.round(worldCursor.x)}px</span>
        <span>Y: {Math.round(worldCursor.y)}px</span>
        <span className="text-sky-400">Tool: {currentTool}</span>
        {inProgressPoints.length > 0 && (
          <span className="text-amber-400">Points: {inProgressPoints.length} (Enter to finish)</span>
        )}
      </div>

      {/* Text Editing Inline Modal */}
      {editingText && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-xs shadow-2xl max-w-sm w-full flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-300 uppercase">Insert Text</span>
            <textarea
              autoFocus
              value={editingText.text}
              onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xs p-2 text-sm text-slate-100 font-mono outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingText(null)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
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
                className="px-4 py-1 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xs cursor-pointer"
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
