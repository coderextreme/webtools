/**
 * InterViews IV-look Component Showcase
 * Comprehensive interactive showcase of Stanford InterViews / ivtools GUI widgets:
 * Bevels, Buttons, Checkboxes, Radios, Sliders, Steppers, Field Editors, Menus, Dialogs.
 */

import React, { useState } from 'react';
import {
  Bevel,
  IVButton,
  IVCheckbox,
  IVRadio,
  IVSlider,
  IVStepper,
  IVFieldEditor,
  IVPulldown,
  IVDialog,
} from '../iv/look/widgets';
import {
  Sparkles,
  Layers,
  Sliders,
  Terminal,
  MousePointer,
  CheckSquare,
  Code2,
  Cpu,
  BookOpen,
} from 'lucide-react';

export const ToolkitShowcase: React.FC = () => {
  // Interactive widget states
  const [bevelDepth, setBevelDepth] = useState<number>(3);
  const [checkboxState, setCheckboxState] = useState<boolean>(true);
  const [secondaryCheck, setSecondaryCheck] = useState<boolean>(false);
  const [radioValue, setRadioValue] = useState<string>('motif');
  const [sliderVal1, setSliderVal1] = useState<number>(64);
  const [sliderVal2, setSliderVal2] = useState<number>(25);
  const [stepperVal, setStepperVal] = useState<number>(100);
  const [fieldVal, setFieldVal] = useState<string>('Stanford InterViews v3.1');
  const [multiFieldVal, setMultiFieldVal] = useState<string>(
    'InterViews is an object-oriented GUI library written in C++ for X11, created by Mark Linton and Paul Calder.'
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Event dispatcher log
  const [eventLogs, setEventLogs] = useState<string[]>([
    'InterViews session initialized.',
    'IV-look widget hierarchy mapped to DOM.',
  ]);

  const logEvent = (msg: string) => {
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 15),
    ]);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 flex flex-col gap-8 text-slate-200">
      {/* Hero Intro */}
      <div className="flex flex-col gap-2 max-w-4xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <Cpu className="w-4 h-4" />
          <span>InterViews IV-look Component Architecture</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          X11 GUI Toolkit &amp; Widget Component Showcase
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          The <strong className="text-slate-200">IV-look</strong> layer of ivtools provides the visual appearance and interaction policy for the InterViews object-oriented GUI system. In InterViews, every visual item is a lightweight <strong className="text-sky-300">Glyph</strong> composed through Box and Glue layout, Bevel framing, and Event responders.
        </p>
      </div>

      {/* Grid of Interactive Showcase Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Section 1: 3D Bevel Framers */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">InterViews::Bevel Framers</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/bevel.c</span>
          </div>
          <p className="text-xs text-slate-400">
            Bevels render simulated 3D workstation depth by casting directional light and shadow along widget perimeters.
          </p>

          <IVSlider
            label="Bevel Depth"
            min={1}
            max={6}
            step={1}
            unit="px"
            value={bevelDepth}
            onChange={(val) => {
              setBevelDepth(val);
              logEvent(`Bevel depth adjusted to ${val}px`);
            }}
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Bevel styleType="raised" depth={bevelDepth} className="p-4 bg-slate-800 text-center">
              <div className="text-xs font-bold text-slate-100">Raised Bevel</div>
              <div className="text-[10px] text-slate-400 mt-1">Light top/left, shadow bottom/right</div>
            </Bevel>

            <Bevel styleType="inset" depth={bevelDepth} className="p-4 text-center">
              <div className="text-xs font-bold text-slate-100">Inset Bevel</div>
              <div className="text-[10px] text-slate-400 mt-1">Shadow top/left, light bottom/right</div>
            </Bevel>

            <Bevel styleType="chiseled" depth={bevelDepth} className="p-4 bg-slate-850 text-center">
              <div className="text-xs font-bold text-slate-100">Chiseled Frame</div>
              <div className="text-[10px] text-slate-400 mt-1">Grooved workstation channel</div>
            </Bevel>

            <Bevel styleType="flat" depth={bevelDepth} className="p-4 bg-slate-800/40 text-center">
              <div className="text-xs font-bold text-slate-100">Flat Outline</div>
              <div className="text-[10px] text-slate-400 mt-1">Uniform boundary rule</div>
            </Bevel>
          </div>
        </div>

        {/* Section 2: Interactive Buttons */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">InterViews::Button &amp; Action</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/button.c</span>
          </div>
          <p className="text-xs text-slate-400">
            Buttons combine a label Glyph with a pressed-state detector that inverts the light/shadow bevel angle and executes a polymorphic Action.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <IVButton
              variant="primary"
              onClick={() => logEvent('Clicked Primary Action Button')}
            >
              Primary Action
            </IVButton>

            <IVButton
              variant="secondary"
              onClick={() => logEvent('Clicked Workstation Button')}
            >
              Workstation Push
            </IVButton>

            <IVButton
              variant="danger"
              onClick={() => logEvent('Clicked Dangerous Action')}
            >
              Discard
            </IVButton>

            <IVButton disabled>Disabled Button</IVButton>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <IVButton
              variant="secondary"
              size="sm"
              onClick={() => logEvent('Small Button Clicked')}
            >
              Small (sm)
            </IVButton>
            <IVButton
              variant="secondary"
              size="md"
              onClick={() => logEvent('Medium Button Clicked')}
            >
              Medium (md)
            </IVButton>
            <IVButton
              variant="secondary"
              size="lg"
              onClick={() => logEvent('Large Button Clicked')}
            >
              Large (lg)
            </IVButton>
          </div>
        </div>

        {/* Section 3: Checkbox & Radio Buttons */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">Choice Selectors: Check &amp; Radio</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/choice.c</span>
          </div>
          <p className="text-xs text-slate-400">
            InterViews maintains Boolean and Mutual-Exclusion states using connected Tell/Action observables.
          </p>

          <div className="flex flex-col gap-3 pt-1">
            <IVCheckbox
              label="Enable Affine Coordinate Clipping"
              checked={checkboxState}
              onChange={(c) => {
                setCheckboxState(c);
                logEvent(`Coordinate Clipping toggled: ${c}`);
              }}
            />
            <IVCheckbox
              label="Show Damage Bounds Overlay"
              checked={secondaryCheck}
              onChange={(c) => {
                setSecondaryCheck(c);
                logEvent(`Damage Bounds overlay toggled: ${c}`);
              }}
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400">Look &amp; Feel Preset:</span>
            <div className="flex items-center gap-4">
              <IVRadio
                name="look_feel"
                value="motif"
                label="OSF / Motif"
                checked={radioValue === 'motif'}
                onChange={(val) => {
                  setRadioValue(val);
                  logEvent(`Selected Look: ${val}`);
                }}
              />
              <IVRadio
                name="look_feel"
                value="openlook"
                label="OpenLook"
                checked={radioValue === 'openlook'}
                onChange={(val) => {
                  setRadioValue(val);
                  logEvent(`Selected Look: ${val}`);
                }}
              />
              <IVRadio
                name="look_feel"
                value="modern"
                label="InterViews 3.x"
                checked={radioValue === 'modern'}
                onChange={(val) => {
                  setRadioValue(val);
                  logEvent(`Selected Look: ${val}`);
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Continuous Sliders & Steppers */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">InterViews::Slider &amp; Stepper</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/slider.c</span>
          </div>

          <IVSlider
            label="Raster DPI Resolution"
            min={10}
            max={300}
            step={5}
            unit=" dpi"
            value={sliderVal1}
            onChange={(val) => {
              setSliderVal1(val);
              logEvent(`DPI changed to ${val}`);
            }}
          />

          <IVSlider
            label="Stroke Miter Limit"
            min={1}
            max={50}
            step={1}
            unit="x"
            value={sliderVal2}
            onChange={(val) => {
              setSliderVal2(val);
              logEvent(`Miter limit set to ${val}`);
            }}
          />

          <IVStepper
            label="Damage Buffer Allocation"
            value={stepperVal}
            min={0}
            max={1000}
            step={10}
            unit=" KB"
            onChange={(val) => {
              setStepperVal(val);
              logEvent(`Buffer allocated: ${val} KB`);
            }}
          />
        </div>

        {/* Section 5: Field Editors & Text Inputs */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">InterViews::FieldEditor</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/feditor.c</span>
          </div>

          <IVFieldEditor
            label="Single-Line Document Header"
            value={fieldVal}
            onChange={(val) => {
              setFieldVal(val);
              logEvent(`Document header updated`);
            }}
          />

          <IVFieldEditor
            label="Multi-Line InterViews Description"
            multiline
            rows={3}
            value={multiFieldVal}
            onChange={(val) => setMultiFieldVal(val)}
          />
        </div>

        {/* Section 6: Pulldown Menus & Modal Dialogs */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">InterViews::Menu &amp; Dialog</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">src/IV-look/menu.c</span>
          </div>

          <p className="text-xs text-slate-400">
            Workstation menus feature accelerator shortcuts and drop shadows. Click the menus below to explore:
          </p>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xs">
            <IVPulldown
              title="File"
              items={[
                { id: 'new', label: 'New Drawing', shortcut: 'Ctrl+N', action: () => logEvent('Menu: New Drawing') },
                { id: 'open', label: 'Open Scene...', shortcut: 'Ctrl+O', action: () => logEvent('Menu: Open Scene') },
                { id: 'sep1', label: '', separator: true },
                { id: 'save', label: 'Save As JSON', shortcut: 'Ctrl+S', action: () => logEvent('Menu: Save JSON') },
                { id: 'export', label: 'Export PostScript / SVG', shortcut: 'Ctrl+E', action: () => logEvent('Menu: Export') },
              ]}
            />
            <IVPulldown
              title="Edit"
              items={[
                { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', action: () => logEvent('Menu: Undo') },
                { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', action: () => logEvent('Menu: Redo') },
                { id: 'sep2', label: '', separator: true },
                { id: 'cut', label: 'Cut Graphic', shortcut: 'Ctrl+X', action: () => logEvent('Menu: Cut') },
                { id: 'copy', label: 'Copy Graphic', shortcut: 'Ctrl+C', action: () => logEvent('Menu: Copy') },
                { id: 'paste', label: 'Paste Graphic', shortcut: 'Ctrl+V', action: () => logEvent('Menu: Paste') },
              ]}
            />
            <IVPulldown
              title="Structure"
              items={[
                { id: 'group', label: 'Group Elements', shortcut: 'Ctrl+G', action: () => logEvent('Menu: Group') },
                { id: 'ungroup', label: 'Ungroup', shortcut: 'Ctrl+U', action: () => logEvent('Menu: Ungroup') },
                { id: 'front', label: 'Bring to Front', shortcut: 'Home', action: () => logEvent('Menu: Bring to Front') },
                { id: 'back', label: 'Send to Back', shortcut: 'End', action: () => logEvent('Menu: Send to Back') },
              ]}
            />
          </div>

          <div className="pt-2">
            <IVButton
              variant="primary"
              onClick={() => {
                setDialogOpen(true);
                logEvent('Opened Workstation Dialog');
              }}
            >
              Trigger Workstation Modal Dialog
            </IVButton>
          </div>
        </div>
      </div>

      {/* Real-Time Event Dispatch Console */}
      <div className="max-w-6xl p-4 bg-slate-900 border border-slate-800 rounded-xs flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              InterViews Event Dispatch Terminal (Observable Log)
            </span>
          </div>
          <button
            onClick={() => setEventLogs([])}
            className="text-[10px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
          >
            Clear Log
          </button>
        </div>
        <div className="font-mono text-xs max-h-32 overflow-y-auto flex flex-col gap-1 pr-1 text-slate-400">
          {eventLogs.map((log, idx) => (
            <div key={idx} className="leading-tight">
              <span className="text-emerald-500 mr-2">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Dialog */}
      <IVDialog
        title="InterViews System Information"
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-300">
            You have invoked the native <strong className="text-sky-300">IVDialog</strong> class. In the original X11 InterViews implementation, dialogs were rendered inside an independent sub-window (X11 Subwindow) with grab-focus semantics.
          </p>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs font-mono text-xs text-slate-400">
            <div>Target: IV-look::Dialog</div>
            <div>Focus: WindowManager Grab Active</div>
            <div>Platform: HTML5 / Canvas / React 19</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <IVButton
              variant="secondary"
              onClick={() => setDialogOpen(false)}
            >
              Dismiss
            </IVButton>
            <IVButton
              variant="primary"
              onClick={() => {
                logEvent('Dialog confirmed with OK');
                setDialogOpen(false);
              }}
            >
              Acknowledge
            </IVButton>
          </div>
        </div>
      </IVDialog>
    </div>
  );
};
