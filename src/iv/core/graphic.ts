/**
 * InterViews Graphic Base Class
 * Ported from InterViews::Graphic (IV-X11 / src/InterViews/graphic.c)
 * Base class for all 2D displayable objects with affine transformations,
 * stroke/fill styles, hit-testing, and bounding box computation.
 */

import { Point, RectBounds, Transformer } from './transformer';

export type StrokeDashType = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

export interface GraphicStyle {
  fillColor: string; // hex, rgba, or 'none'
  strokeColor: string; // hex, rgba, or 'none'
  strokeWidth: number;
  strokeDash: StrokeDashType;
  opacity: number;
  arrowStart: boolean;
  arrowEnd: boolean;
  arrowSize: number;
  rx?: number; // corner radius for rects
}

export const DEFAULT_STYLE: GraphicStyle = {
  fillColor: '#38BDF820', // subtle transparent sky blue
  strokeColor: '#38BDF8',
  strokeWidth: 2,
  strokeDash: 'solid',
  opacity: 1,
  arrowStart: false,
  arrowEnd: false,
  arrowSize: 10,
  rx: 0,
};

export abstract class Graphic {
  public id: string;
  public name: string;
  public transformer: Transformer;
  public style: GraphicStyle;
  public visible = true;
  public locked = false;

  constructor(name = 'Graphic', style: Partial<GraphicStyle> = {}) {
    this.id = 'iv_' + Math.random().toString(36).substring(2, 9);
    this.name = name;
    this.transformer = Transformer.identity();
    this.style = { ...DEFAULT_STYLE, ...style };
  }

  /**
   * Applies the stroke dash pattern to the 2D context
   */
  public applyDashPattern(ctx: CanvasRenderingContext2D): void {
    const sw = Math.max(1, this.style.strokeWidth);
    switch (this.style.strokeDash) {
      case 'dashed':
        ctx.setLineDash([sw * 4, sw * 2]);
        break;
      case 'dotted':
        ctx.setLineDash([sw, sw * 2]);
        break;
      case 'dash-dot':
        ctx.setLineDash([sw * 4, sw * 2, sw, sw * 2]);
        break;
      case 'solid':
      default:
        ctx.setLineDash([]);
        break;
    }
  }

  /**
   * Helper to draw arrowheads at line endpoints
   */
  protected drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    size: number
  ): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - size * Math.cos(angle - Math.PI / 6),
      to.y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - size * Math.cos(angle + Math.PI / 6),
      to.y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = this.style.strokeColor;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Abstract drawing method implemented by all primitive graphics
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void;

  /**
   * Computes the tight axis-aligned bounding box of the untransformed geometry
   */
  public abstract getLocalBounds(): RectBounds;

  /**
   * Computes the bounding box after applying the Graphic's affine transformer
   */
  public getBounds(): RectBounds {
    const local = this.getLocalBounds();
    const corners: Point[] = [
      { x: local.x, y: local.y },
      { x: local.x + local.width, y: local.y },
      { x: local.x + local.width, y: local.y + local.height },
      { x: local.x, y: local.y + local.height },
    ];
    const transformed = this.transformer.transformPoints(corners);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of transformed) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const pad = (this.style.strokeWidth || 1) / 2;
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }

  /**
   * Hit test against a world coordinate point
   */
  public containsPoint(worldX: number, worldY: number, tolerance = 6): boolean {
    if (!this.visible) return false;
    // Transform point into local coordinate space
    const inv = this.transformer.inverse();
    const local = inv.transformPoint({ x: worldX, y: worldY });
    return this.containsLocalPoint(local.x, local.y, tolerance);
  }

  /**
   * Hit test in untransformed local space
   */
  public abstract containsLocalPoint(x: number, y: number, tolerance: number): boolean;

  /**
   * Creates an exact clone
   */
  public abstract clone(): Graphic;

  /**
   * Serializes to SVG snippet
   */
  public abstract toSVG(): string;

  /**
   * Serializes to plain JSON representation
   */
  public abstract toJSON(): Record<string, any>;
}
