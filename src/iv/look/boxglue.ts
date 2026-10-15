/**
 * InterViews TeX Box & Glue Layout Engine
 * Ported from InterViews::Box and InterViews::Glue (IV-look / src/InterViews/box.c, glue.c)
 * Invented by Mark Linton & Paul Calder (Stanford University).
 * Implements 1D spring-and-strut elasticity solver inspired by Donald Knuth's TeX.
 */

export interface GlueSpec {
  natural: number; // default unconstrained size in px
  stretch: number; // elasticity when container expands (spring constant)
  shrink: number;  // compressability when container narrows
}

export type BoxItemType = 'box' | 'glue';

export interface BoxItem {
  id: string;
  name: string;
  type: BoxItemType;
  glue: GlueSpec;
  color?: string;
  // Computed during solve:
  allocatedSize?: number;
  offset?: number;
}

export interface LayoutSolution {
  containerSize: number;
  totalNatural: number;
  totalStretch: number;
  totalShrink: number;
  delta: number; // containerSize - totalNatural
  items: BoxItem[];
}

/**
 * Solves 1D Box & Glue distribution
 */
export function solveBoxGlue(containerSize: number, items: BoxItem[]): LayoutSolution {
  let totalNatural = 0;
  let totalStretch = 0;
  let totalShrink = 0;

  for (const item of items) {
    totalNatural += item.glue.natural;
    totalStretch += item.glue.stretch;
    totalShrink += item.glue.shrink;
  }

  const delta = containerSize - totalNatural;
  let currentOffset = 0;

  const solvedItems: BoxItem[] = items.map((item) => {
    let size = item.glue.natural;

    if (delta > 0) {
      // Container is expanding: stretch springs
      if (totalStretch > 0 && item.glue.stretch > 0) {
        const expansion = (delta * item.glue.stretch) / totalStretch;
        size = item.glue.natural + expansion;
      }
    } else if (delta < 0) {
      // Container is compressing: shrink springs
      if (totalShrink > 0 && item.glue.shrink > 0) {
        const compression = (-delta * item.glue.shrink) / totalShrink;
        // Cannot shrink below natural - shrink limit
        const minAllowed = Math.max(0, item.glue.natural - item.glue.shrink);
        size = Math.max(minAllowed, item.glue.natural - compression);
      }
    }

    const allocatedSize = Math.max(0, size);
    const offset = currentOffset;
    currentOffset += allocatedSize;

    return {
      ...item,
      allocatedSize,
      offset,
    };
  });

  return {
    containerSize,
    totalNatural,
    totalStretch,
    totalShrink,
    delta,
    items: solvedItems,
  };
}

/**
 * Common standard Glues from InterViews IV-look
 */
export const CommonGlues = {
  // Rigid strut (fixed spacer, does not stretch or shrink)
  strut: (size = 16): GlueSpec => ({
    natural: size,
    stretch: 0,
    shrink: 0,
  }),

  // Infinite spring (takes up all available space, like flex: 1)
  spring: (natural = 0): GlueSpec => ({
    natural,
    stretch: 1000,
    shrink: 0,
  }),

  // Gentle spring (stretches moderately)
  gentleSpring: (natural = 24): GlueSpec => ({
    natural,
    stretch: 100,
    shrink: 12,
  }),

  // Stiff spring (stretches slowly)
  stiffSpring: (natural = 40): GlueSpec => ({
    natural,
    stretch: 20,
    shrink: 20,
  }),
};
