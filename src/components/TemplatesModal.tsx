/**
 * InterViews idraw Templates Modal
 * Browse and load pre-built architectural vector drawings
 */

import React from 'react';
import { TEMPLATES } from '../iv/core/templates';
import { Graphic } from '../iv/core/graphic';
import { IVDialog, IVButton } from '../iv/look/widgets';
import { Cpu, Network, GitFork, ArrowRight } from 'lucide-react';

export interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (graphics: Graphic[]) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'system_architecture':
        return <Network className="w-5 h-5 text-sky-400" />;
      case 'digital_logic':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'algorithm_flowchart':
      default:
        return <GitFork className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <IVDialog title="Drawing Templates &amp; Schematics" isOpen={isOpen} onClose={onClose} width="max-w-xl">
      <div className="flex flex-col gap-4 text-xs">
        <p className="text-slate-400">
          Load pre-constructed technical diagrams and schematics demonstrating the full fidelity of the InterViews vector drawing engine.
        </p>

        <div className="flex flex-col gap-3">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xs flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xs shrink-0 mt-0.5">
                  {getIcon(tmpl.id)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{tmpl.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">{tmpl.description}</p>
                </div>
              </div>

              <IVButton
                variant="primary"
                size="sm"
                onClick={() => {
                  onLoadTemplate(tmpl.createGraphics());
                  onClose();
                }}
              >
                <span>Load</span>
                <ArrowRight className="w-3 h-3" />
              </IVButton>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <IVButton variant="secondary" onClick={onClose}>
            Close
          </IVButton>
        </div>
      </div>
    </IVDialog>
  );
};
