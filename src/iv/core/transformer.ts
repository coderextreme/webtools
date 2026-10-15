/**
 * InterViews 2D Affine Transformer
 * Faithful port of InterViews::Transformer (IV-X11 / src/InterViews/transformer.c)
 * Represents a 2D affine transformation matrix:
 * [ a  b  0 ]
 * [ c  d  0 ]
 * [ tx ty 1 ]
 * mapping (x, y) -> (a*x + c*y + tx, b*x + d*y + ty)
 */

export interface Point {
  x: number;
  y: number;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Transformer {
  // Matrix coefficients
  public a: number;
  public b: number;
  public c: number;
  public d: number;
  public tx: number;
  public ty: number;

  constructor(
    a = 1,
    b = 0,
    c = 0,
    d = 1,
    tx = 0,
    ty = 0
  ) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
  }

  public static identity(): Transformer {
    return new Transformer(1, 0, 0, 1, 0, 0);
  }

  public clone(): Transformer {
    return new Transformer(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }

  public set(a: number, b: number, c: number, d: number, tx: number, ty: number): this {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  public copyFrom(other: Transformer): this {
    this.a = other.a;
    this.b = other.b;
    this.c = other.c;
    this.d = other.d;
    this.tx = other.tx;
    this.ty = other.ty;
    return this;
  }

  /**
   * Translates the transformation by (dx, dy)
   */
  public translate(dx: number, dy: number): this {
    this.tx += this.a * dx + this.c * dy;
    this.ty += this.b * dx + this.d * dy;
    return this;
  }

  /**
   * Scales by (sx, sy) relative to origin or optional center point
   */
  public scale(sx: number, sy: number, cx = 0, cy = 0): this {
    if (cx !== 0 || cy !== 0) {
      this.translate(cx, cy);
      this.a *= sx;
      this.b *= sx;
      this.c *= sy;
      this.d *= sy;
      this.translate(-cx, -cy);
    } else {
      this.a *= sx;
      this.b *= sx;
      this.c *= sy;
      this.d *= sy;
    }
    return this;
  }

  /**
   * Rotates by angle in radians relative to origin or optional center point
   */
  public rotate(angleRad: number, cx = 0, cy = 0): this {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    if (cx !== 0 || cy !== 0) {
      this.translate(cx, cy);
      const a = this.a * cos + this.c * sin;
      const b = this.b * cos + this.d * sin;
      const c = -this.a * sin + this.c * cos;
      const d = -this.b * sin + this.d * cos;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.translate(-cx, -cy);
    } else {
      const a = this.a * cos + this.c * sin;
      const b = this.b * cos + this.d * sin;
      const c = -this.a * sin + this.c * cos;
      const d = -this.b * sin + this.d * cos;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
    }
    return this;
  }

  /**
   * Multiplies this matrix by another (this = this * other)
   */
  public multiply(other: Transformer): this {
    const a = this.a * other.a + this.c * other.b;
    const b = this.b * other.a + this.d * other.b;
    const c = this.a * other.c + this.c * other.d;
    const d = this.b * other.c + this.d * other.d;
    const tx = this.a * other.tx + this.c * other.ty + this.tx;
    const ty = this.b * other.tx + this.d * other.ty + this.ty;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  /**
   * Premultiplies this matrix by another (this = other * this)
   */
  public premultiply(other: Transformer): this {
    const a = other.a * this.a + other.c * this.b;
    const b = other.b * this.a + other.d * this.b;
    const c = other.a * this.c + other.c * this.d;
    const d = other.b * this.c + other.d * this.d;
    const tx = other.a * this.tx + other.c * this.ty + other.tx;
    const ty = other.b * this.tx + other.d * this.ty + other.ty;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  /**
   * Transforms a single point (x, y) -> (x', y')
   */
  public transformPoint(p: Point): Point {
    return {
      x: this.a * p.x + this.c * p.y + this.tx,
      y: this.b * p.x + this.d * p.y + this.ty,
    };
  }

  /**
   * Transforms an array of points
   */
  public transformPoints(points: Point[]): Point[] {
    return points.map((p) => this.transformPoint(p));
  }

  /**
   * Determinant of matrix
   */
  public det(): number {
    return this.a * this.d - this.b * this.c;
  }

  /**
   * Inverts the transformation matrix
   */
  public inverse(): Transformer {
    const det = this.det();
    if (Math.abs(det) < 1e-12) {
      return Transformer.identity();
    }
    const invDet = 1 / det;
    return new Transformer(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.ty - this.d * this.tx) * invDet,
      (this.b * this.tx - this.a * this.ty) * invDet
    );
  }

  /**
   * Applies this transform directly to a Canvas 2D context
   */
  public applyToContext(ctx: CanvasRenderingContext2D): void {
    ctx.transform(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }

  /**
   * Converts to SVG transform string
   */
  public toSVG(): string {
    return `matrix(${this.a.toFixed(6)}, ${this.b.toFixed(6)}, ${this.c.toFixed(6)}, ${this.d.toFixed(6)}, ${this.tx.toFixed(2)}, ${this.ty.toFixed(2)})`;
  }
}
