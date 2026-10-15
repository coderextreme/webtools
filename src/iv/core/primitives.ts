/**
 * InterViews Concrete Graphic Primitives
 * Ported from src/InterViews/rect.c, ellipse.c, line.c, polygon.c, bspline.c, text.c, picture.c
 */

import { Graphic, GraphicStyle, StrokeDashType } from './graphic';
import { Point, RectBounds, Transformer } from './transformer';
import { drawBSpline, bsplineToSVGPath } from './bspline';

/* =========================================================================
   1. RECTANGLE GRAPHIC
   ========================================================================= */
export class RectGraphic extends Graphic {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public rx: number; // corner radius

  constructor(x: number, y: number, width: number, height: number, rx = 0, style?: Partial<GraphicStyle>) {
    super('Rectangle', style);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rx = rx;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    if (this.rx > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(this.x, this.y, this.width, this.height, this.rx);
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
    }

    if (this.style.fillColor && this.style.fillColor !== 'none') {
      ctx.fillStyle = this.style.fillColor;
      ctx.fill();
    }

    if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      this.applyDashPattern(ctx);
      ctx.stroke();
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    return {
      x: this.width >= 0 ? this.x : this.x + this.width,
      y: this.height >= 0 ? this.y : this.y + this.height,
      width: Math.abs(this.width),
      height: Math.abs(this.height),
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    const b = this.getLocalBounds();
    const isInside =
      px >= b.x - tolerance &&
      px <= b.x + b.width + tolerance &&
      py >= b.y - tolerance &&
      py <= b.y + b.height + tolerance;

    if (!isInside) return false;

    // If filled, any point inside is a hit
    if (this.style.fillColor && this.style.fillColor !== 'none') {
      return true;
    }

    // Otherwise check distance to borders
    const nearLeft = Math.abs(px - b.x) <= tolerance;
    const nearRight = Math.abs(px - (b.x + b.width)) <= tolerance;
    const nearTop = Math.abs(py - b.y) <= tolerance;
    const nearBottom = Math.abs(py - (b.y + b.height)) <= tolerance;

    return nearLeft || nearRight || nearTop || nearBottom;
  }

  public clone(): RectGraphic {
    const r = new RectGraphic(this.x, this.y, this.width, this.height, this.rx, { ...this.style });
    r.transformer = this.transformer.clone();
    r.name = this.name;
    return r;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const fill = this.style.fillColor || 'none';
    const stroke = this.style.strokeColor || 'none';
    const sw = this.style.strokeWidth;
    const dash = this.getSvgDash();

    return `<rect x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}" rx="${this.rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash} opacity="${this.style.opacity}" transform="${transform}" />`;
  }

  private getSvgDash(): string {
    if (this.style.strokeDash === 'dashed') return 'stroke-dasharray="8 4"';
    if (this.style.strokeDash === 'dotted') return 'stroke-dasharray="2 4"';
    if (this.style.strokeDash === 'dash-dot') return 'stroke-dasharray="8 4 2 4"';
    return '';
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'RectGraphic',
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rx: this.rx,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   2. ELLIPSE / CIRCLE GRAPHIC
   ========================================================================= */
export class EllipseGraphic extends Graphic {
  public cx: number;
  public cy: number;
  public rx: number;
  public ry: number;

  constructor(cx: number, cy: number, rx: number, ry: number, style?: Partial<GraphicStyle>) {
    super('Ellipse', style);
    this.cx = cx;
    this.cy = cy;
    this.rx = Math.abs(rx);
    this.ry = Math.abs(ry);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    ctx.ellipse(this.cx, this.cy, Math.max(1, this.rx), Math.max(1, this.ry), 0, 0, Math.PI * 2);

    if (this.style.fillColor && this.style.fillColor !== 'none') {
      ctx.fillStyle = this.style.fillColor;
      ctx.fill();
    }

    if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      this.applyDashPattern(ctx);
      ctx.stroke();
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    return {
      x: this.cx - this.rx,
      y: this.cy - this.ry,
      width: this.rx * 2,
      height: this.ry * 2,
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    const rx = Math.max(1, this.rx);
    const ry = Math.max(1, this.ry);
    const dx = px - this.cx;
    const dy = py - this.cy;
    const norm = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

    if (this.style.fillColor && this.style.fillColor !== 'none') {
      return norm <= 1.05;
    }

    // Distance to edge
    const rOuter = 1 + tolerance / Math.min(rx, ry);
    const rInner = Math.max(0, 1 - tolerance / Math.min(rx, ry));
    return norm <= rOuter * rOuter && norm >= rInner * rInner;
  }

  public clone(): EllipseGraphic {
    const e = new EllipseGraphic(this.cx, this.cy, this.rx, this.ry, { ...this.style });
    e.transformer = this.transformer.clone();
    e.name = this.name;
    return e;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const fill = this.style.fillColor || 'none';
    const stroke = this.style.strokeColor || 'none';
    const sw = this.style.strokeWidth;
    let dash = '';
    if (this.style.strokeDash === 'dashed') dash = 'stroke-dasharray="8 4"';
    if (this.style.strokeDash === 'dotted') dash = 'stroke-dasharray="2 4"';
    if (this.style.strokeDash === 'dash-dot') dash = 'stroke-dasharray="8 4 2 4"';

    return `<ellipse cx="${this.cx}" cy="${this.cy}" rx="${this.rx}" ry="${this.ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash} opacity="${this.style.opacity}" transform="${transform}" />`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'EllipseGraphic',
      id: this.id,
      name: this.name,
      cx: this.cx,
      cy: this.cy,
      rx: this.rx,
      ry: this.ry,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   3. LINE GRAPHIC
   ========================================================================= */
export class LineGraphic extends Graphic {
  public x1: number;
  public y1: number;
  public x2: number;
  public y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number, style?: Partial<GraphicStyle>) {
    super('Line', { ...style, fillColor: 'none' });
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);

    if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      ctx.lineCap = 'round';
      this.applyDashPattern(ctx);
      ctx.stroke();
    }

    if (this.style.arrowStart) {
      this.drawArrowhead(ctx, { x: this.x2, y: this.y2 }, { x: this.x1, y: this.y1 }, this.style.arrowSize);
    }
    if (this.style.arrowEnd) {
      this.drawArrowhead(ctx, { x: this.x1, y: this.y1 }, { x: this.x2, y: this.y2 }, this.style.arrowSize);
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    const minX = Math.min(this.x1, this.x2);
    const minY = Math.min(this.y1, this.y2);
    const maxX = Math.max(this.x1, this.x2);
    const maxY = Math.max(this.y1, this.y2);
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      return Math.hypot(px - this.x1, py - this.y1) <= tolerance;
    }
    let t = ((px - this.x1) * dx + (py - this.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = this.x1 + t * dx;
    const projY = this.y1 + t * dy;
    return Math.hypot(px - projX, py - projY) <= tolerance;
  }

  public clone(): LineGraphic {
    const l = new LineGraphic(this.x1, this.y1, this.x2, this.y2, { ...this.style });
    l.transformer = this.transformer.clone();
    l.name = this.name;
    return l;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const stroke = this.style.strokeColor || 'black';
    const sw = this.style.strokeWidth;
    let dash = '';
    if (this.style.strokeDash === 'dashed') dash = 'stroke-dasharray="8 4"';
    if (this.style.strokeDash === 'dotted') dash = 'stroke-dasharray="2 4"';
    if (this.style.strokeDash === 'dash-dot') dash = 'stroke-dasharray="8 4 2 4"';

    return `<line x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${this.y2}" stroke="${stroke}" stroke-width="${sw}" ${dash} opacity="${this.style.opacity}" transform="${transform}" />`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'LineGraphic',
      id: this.id,
      name: this.name,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   4. POLYGON / POLYLINE GRAPHIC
   ========================================================================= */
export class PolyGraphic extends Graphic {
  public points: Point[];
  public closed: boolean;

  constructor(points: Point[], closed = false, style?: Partial<GraphicStyle>) {
    super(closed ? 'Polygon' : 'Polyline', style);
    this.points = points.map((p) => ({ ...p }));
    this.closed = closed;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length < 2) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    if (this.closed) {
      ctx.closePath();
      if (this.style.fillColor && this.style.fillColor !== 'none') {
        ctx.fillStyle = this.style.fillColor;
        ctx.fill();
      }
    }

    if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.applyDashPattern(ctx);
      ctx.stroke();
    }

    if (!this.closed && this.points.length >= 2) {
      if (this.style.arrowStart) {
        this.drawArrowhead(ctx, this.points[1], this.points[0], this.style.arrowSize);
      }
      if (this.style.arrowEnd) {
        const last = this.points.length - 1;
        this.drawArrowhead(ctx, this.points[last - 1], this.points[last], this.style.arrowSize);
      }
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    if (this.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    if (this.points.length < 2) return false;

    // Check distance to any edge segment
    for (let i = 0; i < this.points.length - 1; i++) {
      if (this.distToSegment(px, py, this.points[i], this.points[i + 1]) <= tolerance) {
        return true;
      }
    }
    if (this.closed && this.points.length >= 3) {
      if (this.distToSegment(px, py, this.points[this.points.length - 1], this.points[0]) <= tolerance) {
        return true;
      }
      // Check inside polygon using ray casting if filled
      if (this.style.fillColor && this.style.fillColor !== 'none' && this.pointInPoly(px, py)) {
        return true;
      }
    }
    return false;
  }

  private distToSegment(px: number, py: number, p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - p1.x, py - p1.y);
    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (p1.x + t * dx), py - (p1.y + t * dy));
  }

  private pointInPoly(px: number, py: number): boolean {
    let inside = false;
    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      const xi = this.points[i].x;
      const yi = this.points[i].y;
      const xj = this.points[j].x;
      const yj = this.points[j].y;
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public clone(): PolyGraphic {
    const p = new PolyGraphic(this.points, this.closed, { ...this.style });
    p.transformer = this.transformer.clone();
    p.name = this.name;
    return p;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const pts = this.points.map((p) => `${p.x},${p.y}`).join(' ');
    const fill = this.closed ? this.style.fillColor || 'none' : 'none';
    const stroke = this.style.strokeColor || 'black';
    const sw = this.style.strokeWidth;
    const tag = this.closed ? 'polygon' : 'polyline';
    return `<${tag} points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${this.style.opacity}" transform="${transform}" />`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'PolyGraphic',
      id: this.id,
      name: this.name,
      points: this.points,
      closed: this.closed,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   5. B-SPLINE GRAPHIC
   ========================================================================= */
export class BSplineGraphic extends Graphic {
  public controlPoints: Point[];
  public closed: boolean;

  constructor(controlPoints: Point[], closed = false, style?: Partial<GraphicStyle>) {
    super(closed ? 'Closed B-Spline' : 'Open B-Spline', style);
    this.controlPoints = controlPoints.map((p) => ({ ...p }));
    this.closed = closed;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.controlPoints.length < 2) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    drawBSpline(ctx, this.controlPoints, this.closed);

    if (this.closed && this.style.fillColor && this.style.fillColor !== 'none') {
      ctx.fillStyle = this.style.fillColor;
      ctx.fill();
    }

    if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.applyDashPattern(ctx);
      ctx.stroke();
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    if (this.controlPoints.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of this.controlPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    const b = this.getLocalBounds();
    return (
      px >= b.x - tolerance * 2 &&
      px <= b.x + b.width + tolerance * 2 &&
      py >= b.y - tolerance * 2 &&
      py <= b.y + b.height + tolerance * 2
    );
  }

  public clone(): BSplineGraphic {
    const s = new BSplineGraphic(this.controlPoints, this.closed, { ...this.style });
    s.transformer = this.transformer.clone();
    s.name = this.name;
    return s;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const d = bsplineToSVGPath(this.controlPoints, this.closed);
    const fill = this.closed ? this.style.fillColor || 'none' : 'none';
    const stroke = this.style.strokeColor || 'black';
    const sw = this.style.strokeWidth;
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${this.style.opacity}" transform="${transform}" />`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'BSplineGraphic',
      id: this.id,
      name: this.name,
      controlPoints: this.controlPoints,
      closed: this.closed,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   6. TEXT GRAPHIC
   ========================================================================= */
export class TextGraphic extends Graphic {
  public text: string;
  public x: number;
  public y: number;
  public fontSize: number;
  public fontFamily: string;
  public fontWeight: string;
  public align: 'left' | 'center' | 'right';

  constructor(
    text: string,
    x: number,
    y: number,
    fontSize = 16,
    fontFamily = 'Plus Jakarta Sans, sans-serif',
    style?: Partial<GraphicStyle>
  ) {
    super('Text', { ...style, strokeColor: 'none', strokeWidth: 0, fillColor: style?.fillColor || '#F1F5F9' });
    this.text = text;
    this.x = x;
    this.y = y;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.fontWeight = 'normal';
    this.align = 'left';
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.text) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha = this.style.opacity;

    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = this.align;
    ctx.textBaseline = 'top';

    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.3;

    lines.forEach((line, index) => {
      const lineY = this.y + index * lineHeight;
      if (this.style.fillColor && this.style.fillColor !== 'none') {
        ctx.fillStyle = this.style.fillColor;
        ctx.fillText(line, this.x, lineY);
      }
      if (this.style.strokeColor && this.style.strokeColor !== 'none' && this.style.strokeWidth > 0) {
        ctx.strokeStyle = this.style.strokeColor;
        ctx.lineWidth = this.style.strokeWidth;
        ctx.strokeText(line, this.x, lineY);
      }
    });

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.3;
    const estWidth = Math.max(...lines.map((l) => l.length * this.fontSize * 0.6), 20);
    const estHeight = lines.length * lineHeight;

    let startX = this.x;
    if (this.align === 'center') startX = this.x - estWidth / 2;
    if (this.align === 'right') startX = this.x - estWidth;

    return {
      x: startX,
      y: this.y,
      width: estWidth,
      height: estHeight,
    };
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    const b = this.getLocalBounds();
    return (
      px >= b.x - tolerance &&
      px <= b.x + b.width + tolerance &&
      py >= b.y - tolerance &&
      py <= b.y + b.height + tolerance
    );
  }

  public clone(): TextGraphic {
    const t = new TextGraphic(this.text, this.x, this.y, this.fontSize, this.fontFamily, { ...this.style });
    t.fontWeight = this.fontWeight;
    t.align = this.align;
    t.transformer = this.transformer.clone();
    t.name = this.name;
    return t;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const fill = this.style.fillColor || '#000000';
    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.3;

    const tspans = lines
      .map((line, i) => `<tspan x="${this.x}" y="${this.y + (i + 1) * lineHeight}">${line}</tspan>`)
      .join('');

    return `<text x="${this.x}" y="${this.y}" font-family="${this.fontFamily}" font-size="${this.fontSize}" font-weight="${this.fontWeight}" fill="${fill}" text-anchor="${this.align === 'center' ? 'middle' : this.align}" transform="${transform}">${tspans}</text>`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'TextGraphic',
      id: this.id,
      name: this.name,
      text: this.text,
      x: this.x,
      y: this.y,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      align: this.align,
      style: { ...this.style },
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}

/* =========================================================================
   7. GROUP / PICTURE GRAPHIC
   ========================================================================= */
export class GroupGraphic extends Graphic {
  public children: Graphic[];

  constructor(children: Graphic[] = [], name = 'Group') {
    super(name, { fillColor: 'none', strokeColor: 'none' });
    this.children = children;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    this.transformer.applyToContext(ctx);
    ctx.globalAlpha *= this.style.opacity;

    for (const child of this.children) {
      child.draw(ctx);
    }

    ctx.restore();
  }

  public getLocalBounds(): RectBounds {
    if (this.children.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of this.children) {
      const b = child.getBounds();
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
  }

  public containsLocalPoint(px: number, py: number, tolerance: number): boolean {
    for (const child of this.children) {
      if (child.containsPoint(px, py, tolerance)) {
        return true;
      }
    }
    return false;
  }

  public clone(): GroupGraphic {
    const clonedChildren = this.children.map((c) => c.clone());
    const g = new GroupGraphic(clonedChildren, this.name);
    g.transformer = this.transformer.clone();
    return g;
  }

  public toSVG(): string {
    const transform = this.transformer.toSVG();
    const childrenSvg = this.children.map((c) => c.toSVG()).join('\n  ');
    return `<g transform="${transform}">\n  ${childrenSvg}\n</g>`;
  }

  public toJSON(): Record<string, any> {
    return {
      type: 'GroupGraphic',
      id: this.id,
      name: this.name,
      children: this.children.map((c) => c.toJSON()),
      matrix: [this.transformer.a, this.transformer.b, this.transformer.c, this.transformer.d, this.transformer.tx, this.transformer.ty],
    };
  }
}
