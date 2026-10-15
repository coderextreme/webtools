/**
 * InterViews Graphic Serializer & Exporter
 * Handles JSON scene import/export, standalone SVG document generation,
 * and high-resolution PNG rendering.
 */

import { Graphic } from './graphic';
import {
  RectGraphic,
  EllipseGraphic,
  LineGraphic,
  PolyGraphic,
  BSplineGraphic,
  TextGraphic,
  GroupGraphic,
} from './primitives';
import { Transformer } from './transformer';

export interface SceneDocument {
  version: string;
  app: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  graphics: Record<string, any>[];
}

/**
 * Deserializes JSON objects back into concrete Graphic instances
 */
export function deserializeGraphic(data: Record<string, any>): Graphic | null {
  if (!data || !data.type) return null;

  let g: Graphic | null = null;

  switch (data.type) {
    case 'RectGraphic':
      g = new RectGraphic(data.x, data.y, data.width, data.height, data.rx || 0, data.style);
      break;
    case 'EllipseGraphic':
      g = new EllipseGraphic(data.cx, data.cy, data.rx, data.ry, data.style);
      break;
    case 'LineGraphic':
      g = new LineGraphic(data.x1, data.y1, data.x2, data.y2, data.style);
      break;
    case 'PolyGraphic':
      g = new PolyGraphic(data.points, data.closed, data.style);
      break;
    case 'BSplineGraphic':
      g = new BSplineGraphic(data.controlPoints, data.closed, data.style);
      break;
    case 'TextGraphic':
      const tg = new TextGraphic(data.text, data.x, data.y, data.fontSize, data.fontFamily, data.style);
      tg.fontWeight = data.fontWeight || 'normal';
      tg.align = data.align || 'left';
      g = tg;
      break;
    case 'GroupGraphic':
      const children: Graphic[] = [];
      if (Array.isArray(data.children)) {
        for (const c of data.children) {
          const childG = deserializeGraphic(c);
          if (childG) children.push(childG);
        }
      }
      g = new GroupGraphic(children, data.name || 'Group');
      break;
    default:
      return null;
  }

  if (g) {
    if (data.id) g.id = data.id;
    if (data.name) g.name = data.name;
    if (data.visible !== undefined) g.visible = data.visible;
    if (data.locked !== undefined) g.locked = data.locked;
    if (Array.isArray(data.matrix) && data.matrix.length === 6) {
      g.transformer = new Transformer(
        data.matrix[0],
        data.matrix[1],
        data.matrix[2],
        data.matrix[3],
        data.matrix[4],
        data.matrix[5]
      );
    }
  }

  return g;
}

/**
 * Exports scene graphics to a standalone standard SVG document
 */
export function exportToSVG(
  graphics: Graphic[],
  width: number,
  height: number,
  backgroundColor = 'transparent'
): string {
  const bgRect =
    backgroundColor && backgroundColor !== 'transparent'
      ? `<rect width="${width}" height="${height}" fill="${backgroundColor}" />\n`
      : '';

  const body = graphics
    .filter((g) => g.visible)
    .map((g) => '  ' + g.toSVG())
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
  </defs>
  ${bgRect}
${body}
</svg>`;
}

/**
 * Exports scene graphics to a full JSON scene file
 */
export function exportToJSON(
  graphics: Graphic[],
  name = 'InterViews_Drawing',
  width = 1200,
  height = 800,
  backgroundColor = '#12151B'
): string {
  const doc: SceneDocument = {
    version: '1.0.0',
    app: 'InterViews Web / ivtools',
    name,
    width,
    height,
    backgroundColor,
    graphics: graphics.map((g) => g.toJSON()),
  };
  return JSON.stringify(doc, null, 2);
}

/**
 * Imports a JSON scene string into Graphics array
 */
export function importFromJSON(jsonString: string): {
  graphics: Graphic[];
  width: number;
  height: number;
  backgroundColor: string;
} {
  const data: SceneDocument = JSON.parse(jsonString);
  const graphics: Graphic[] = [];
  if (Array.isArray(data.graphics)) {
    for (const item of data.graphics) {
      const g = deserializeGraphic(item);
      if (g) graphics.push(g);
    }
  }
  return {
    graphics,
    width: data.width || 1200,
    height: data.height || 800,
    backgroundColor: data.backgroundColor || '#12151B',
  };
}

/**
 * Renders graphics onto an offscreen canvas and returns a high-resolution PNG data URL
 */
export function exportToPNG(
  graphics: Graphic[],
  width: number,
  height: number,
  scale = 2,
  backgroundColor: string | null = '#12151B'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  for (const g of graphics) {
    if (g.visible) {
      g.draw(ctx);
    }
  }

  return canvas.toDataURL('image/png');
}
