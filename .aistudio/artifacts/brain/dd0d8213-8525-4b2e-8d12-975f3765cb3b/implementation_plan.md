# InterViews Web: ivtools X11 GUI Toolkit & Vector Drawing Studio

Port of the classic X11 InterViews / ivtools C++ framework (`src/IV-X11`, `src/IV-look`, `src/InterViews`) to modern TypeScript, HTML5 Canvas, WebGL/CSS, featuring a comprehensive InterViews GUI component showcase, an interactive Box & Glue layout engine, and an `idraw`-class vector graphic editor with SVG, JSON, and PNG export.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during interactive clarification and form the foundation of this architectural plan:

- **Confirmed Decision 1 (Primary Application)**: Full InterViews GUI toolkit and interactive component showcase, integrated with the `idraw` vector drawing engine.
- **Confirmed Decision 2 (Visual Aesthetic)**: Modernized canvas drawing tool with high-contrast, polished Dark and Light workstation themes.
- **Confirmed Decision 3 (Export Formats)**: Modern standard vector SVG, complete JSON scene format (import/export), and high-resolution raster PNG export.

---

## 1. Overview & Core Concept

- **What It Does**: Transpiles and reimagines Stanford's seminal X11 InterViews / Unidraw C++ GUI architecture (`IV-X11`, `IV-look`, `InterViews`) into a browser-native web application. It delivers both:
  1. **InterViews GUI Toolkit Showcase**: Live interactive library of InterViews Glyphs (TeX-style Box & Glue layout solver with interactive spring/strut elasticity, Bevels, Buttons, Sliders, Steppers, Menus, Dialogs, and Field Editors).
  2. **idraw Vector Drawing Studio**: A full-featured vector graphics workstation built on the InterViews `Graphic` / `Transformer` / `Canvas` object model, supporting precision shapes, B-splines, text, grouping, affine transforms, styling, snap grid, and layering.
- **Target Audience / Persona**: Engineers, computer scientists, retrocomputing enthusiasts, UI architects, and vector graphics creators who appreciate the foundational architecture of 1990s workstation GUI toolkits and need an accessible, modern vector tool in the browser.
- **Key Value**: Preserves and operationalizes the pioneering object-oriented concepts of InterViews (Glyphs, TeX boxes & glue, affine graphic transformers, damage/repair canvases) with zero-install convenience, snappy HTML5 2D Canvas rendering, and modern export workflows.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Interactive Workspace Navigation**:
   - The user seamlessly switches between three interconnected modes:
     - **Vector Drawing Studio (`idraw`)**: Active drawing canvas with tool palettes, inspector, rulers, layers, and transform controls.
     - **InterViews Toolkit Showcase (`IV-look`)**: Interactive catalog demonstrating every InterViews widget class with live property manipulation and source architecture annotations.
     - **Box & Glue Layout Lab**: Visualizer for the classic Linton & Calder TeX-inspired spring/strut layout algorithm, allowing users to stretch and compress container boxes while watching glue expand according to natural, stretch, and shrink limits.
2. **Precision Vector Creation & Manipulation**:
   - Select tools: Select/Pick, Direct Move, Scale, Rotate, Reshape/Node Edit, Magnify/Pan.
   - Shape primitives: Rectangles, Rounded Rects, Circles, Ellipses, Lines, Multi-segment Polylines, Polygons, Open & Closed B-Spline curves, and Multi-line Text.
   - Operations: Group/Ungroup, Bring to Front, Send to Back, Step Forward/Backward, Duplicate, Align (Left/Center/Right/Top/Middle/Bottom), Distribute.
   - Styling: Fill color/pattern, Stroke color, Line thickness (1px–24px), Dash patterns (Solid, Dashed, Dotted, Dash-Dot), Arrowheads (Start/End).
3. **Template Loading & Export Flow**:
   - Load built-in architectural vector templates (System Architecture Diagram, Logic Circuit, Flowchart, UI Layout).
   - Export vector art as clean, standards-compliant SVG with preserved grouping and paths.
   - Export high-resolution PNG with optional transparent or solid canvas backing.
   - Save and Load complete native JSON scenes with lossless round-tripping.

### Visual Identity & Theme
- **Aesthetic Direction**: Modernized workstation CAD / creative IDE. Clean lines, razor-sharp 1px borders, subtle surface elevations, uncluttered typography, and zero-pill discipline.
- **Color Palette**:
  - *Dark Workstation Theme (Default)*: Canvas background `#12151B`, surface panels `#1A1E26`, secondary surface `#242933`, borders `#2E3543`, text primary `#F1F5F9`, muted text `#94A3B8`, active accent `#38BDF8` (Sky blue) / `#6366F1` (Indigo).
  - *Light Workstation Theme*: Canvas background `#F8FAFC`, surface panels `#FFFFFF`, secondary surface `#F1F5F9`, borders `#E2E8F0`, text primary `#0F172A`, muted text `#64748B`, active accent `#0284C7`.
- **Typography & Hierarchy**:
  - Primary UI & Navigation: `Plus Jakarta Sans` / modern system neo-grotesque (clean, professional, compact).
  - Coordinates, Metrics, Angles & Dimensions: `JetBrains Mono` / tabular numerals (`tabular-nums font-mono`).
- **Layout Rhythm**: Full-width workstation layout (1440px baseline responsive down to tablet). Left tool palette ($56\text{px}$), top command bar ($44\text{px}$), center infinite/paged canvas with measurement rulers and zoom controls, right property inspector ($280\text{px}$) with collapsible panels.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct InterViews Object Model Transpilation in TypeScript**
  - *Chosen Approach*: Implement a TypeScript core library replicating `InterViews::Graphic`, `InterViews::Transformer`, `InterViews::Canvas`, and `InterViews::Glyph` (`Box`, `Glue`, `MonoGlyph`, `Bevel`, `Button`).
  - *Why*: Authentically captures the original C++ ivtools mental model while running at 60 FPS in standard browser canvas and DOM contexts without requiring WebAssembly compilation of ancient X11 headers.
  - *Alternatives Considered*: Compiling ivtools C++ via Emscripten and X11 emulators was evaluated, but would produce a sluggish, bloated multi-megabyte binary lacking responsive touch/trackpad input and modern DOM integration.

- **Decision 2: Dual Rendering Architecture (Canvas for `idraw`, React/DOM for `IV-look`)**
  - *Chosen Approach*: The high-performance drawing canvas uses HTML5 Canvas 2D with affine transform matrices for sub-pixel precision and fluid 60fps manipulation. The widget showcase and layout lab render genuine InterViews glyph models using both Canvas and modern CSS flex/grid to illustrate how InterViews concepts map to modern web layouts.
  - *Why*: Guarantees blazing-fast interactive drawing even with hundreds of vector elements, while giving the widget showcase native accessibility, keyboard navigation, and theme reactivity.

- **Decision 3: Standalone Client-Side Architecture with Lossless Persistence**
  - *Chosen Approach*: 100% client-side execution with local storage auto-save, JSON import/export, SVG generation, and PNG rasterization using HTML5 canvas.
  - *Why*: Instant startup, zero network dependencies, complete data privacy, and full offline capability.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        InterViews Web Workspace                        │
├────────────────────────────────┬───────────────────────────────────────┤
│ Top Command Bar                │ Mode Switcher: idraw | Widgets | TeX  │
├───────────────┬────────────────┴───────────────────────┬───────────────┤
│ Left Toolbar  │ Center Viewport                        │ Right Panel   │
│               │                                        │               │
│ • Select/Move │  ┌──────────────────────────────────┐  │ • Properties  │
│ • Rect/Round  │  │ Interactive HTML5 Canvas         │  │   - Fill/Stroke│
│ • Circle/Oval │  │ • Affine Matrix Transforms       │  │   - Geometry  │
│ • Line/Poly   │  │ • Rulers & Grid Snapping         │  │   - Dash/Arrow│
│ • B-Splines   │  │ • Bounding Box & Anchor Handles  │  │ • Alignment   │
│ • Text Tool   │  │ • Multi-Selection Marquee        │  │ • Layer Order │
│ • Zoom/Pan    │  └──────────────────────────────────┘  │ • Export Hub  │
└───────────────┴────────────────────────────────────────┴───────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
 ┌───────────────────────────┐           ┌───────────────────────────┐
 │   InterViews Core Engine  │           │      IV-look Toolkit      │
 │ • Graphic Hierarchy       │           │ • Bevels (Raised/Inset)   │
 │ • Transformer (2D Affine) │           │ • Steppers & Sliders      │
 │ • Damage / Repair Canvas  │           │ • TeX Box & Glue Solver   │
 │ • SVG / JSON Serializer   │           │ • Menus & Modal Dialogs   │
 └───────────────────────────┘           └───────────────────────────┘
```

### Component Hierarchy & Modules
1. **`src/iv/core/` (InterViews Core Engine)**:
   - `transformer.ts`: 2D Affine Matrix class (translate, rotate, scale, shear, inverse, point transformation).
   - `graphic.ts`: Base `Graphic` class with parent/child tree, bounding box calculation, stroke/fill styling, and canvas rendering.
   - `primitives.ts`: Derived graphics (`RectGraphic`, `EllipseGraphic`, `LineGraphic`, `PolyGraphic`, `BSplineGraphic`, `TextGraphic`, `GroupGraphic`).
   - `bspline.ts`: Classic InterViews uniform B-spline curve calculation algorithm.
2. **`src/iv/look/` (IV-look GUI Toolkit)**:
   - `boxglue.ts`: Stanford TeX Box & Glue layout solver (Glue with natural size, stretchability, shrinkability; HBox and VBox layout calculators).
   - `widgets.tsx`: Authentic implementations of InterViews widgets with modern polish (Bevel border wrapper, PushButton, CheckBox, RadioButton, Slider, Stepper, FieldEditor, PulldownMenu).
3. **`src/components/` (Application Shell & Views)**:
   - `Header.tsx`: Top bar contract with app title, view switcher, undo/redo, theme toggle, and export trigger.
   - `DrawCanvas.tsx`: Active canvas engine with pan/zoom, coordinate transformation, drag handles, live previews, snapping.
   - `ToolPalette.tsx`: Left tool selector with keyboard shortcuts.
   - `Inspector.tsx`: Fill, stroke, line style, typography, layer ordering, and alignment controls.
   - `ToolkitShowcase.tsx`: Interactive gallery of all InterViews components with live playground and technical reference.
   - `BoxLayoutLab.tsx`: Interactive visual sandbox demonstrating TeX Box & Glue mechanics with spring animations.
   - `ExportModal.tsx`: SVG, JSON, and PNG download modal with live preview and code copy.
