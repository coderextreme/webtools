/**
 * InterViews Built-In Drawing Templates
 * Pre-engineered vector graphics demonstrating technical drafting, logic schematics,
 * and system architecture in InterViews idraw format.
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

export interface DrawingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createGraphics: () => Graphic[];
}

export const TEMPLATES: DrawingTemplate[] = [
  {
    id: 'system_architecture',
    name: 'Distributed Cloud Architecture',
    description: 'API Gateway, microservice workers, distributed cache, and relational cluster with message queues.',
    category: 'System Design',
    createGraphics: () => {
      const g: Graphic[] = [];

      // Boundary box
      g.push(
        new RectGraphic(60, 40, 840, 520, 8, {
          fillColor: '#1E293B30',
          strokeColor: '#334155',
          strokeWidth: 2,
          strokeDash: 'dashed',
        })
      );
      g.push(
        new TextGraphic('Virtual Private Cloud (VPC) - us-east-1', 80, 55, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#94A3B8',
        })
      );

      // Client node
      g.push(
        new RectGraphic(100, 160, 140, 70, 6, {
          fillColor: '#0F172A',
          strokeColor: '#38BDF8',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Client App / SPA\nWeb & Mobile', 170, 182, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#F8FAFC',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Arrow Client -> Gateway
      g.push(
        new LineGraphic(240, 195, 320, 195, {
          strokeColor: '#38BDF8',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );
      g.push(
        new TextGraphic('HTTPS / WSS', 280, 175, 10, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#7DD3FC',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // API Gateway
      g.push(
        new RectGraphic(320, 140, 160, 110, 6, {
          fillColor: '#0F172A',
          strokeColor: '#818CF8',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('API Gateway\nRate Limiter & Auth\nTLS Termination', 400, 165, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#EEF2FF',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Arrow Gateway -> Service A
      g.push(
        new LineGraphic(480, 175, 560, 140, {
          strokeColor: '#818CF8',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Arrow Gateway -> Service B
      g.push(
        new LineGraphic(480, 215, 560, 250, {
          strokeColor: '#818CF8',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Microservice 1: Core Worker
      g.push(
        new RectGraphic(560, 100, 150, 70, 4, {
          fillColor: '#0F172A',
          strokeColor: '#34D399',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Vector Engine\nInterViews Core', 635, 122, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#ECFDF5',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Microservice 2: Session Manager
      g.push(
        new RectGraphic(560, 220, 150, 70, 4, {
          fillColor: '#0F172A',
          strokeColor: '#34D399',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Session Service\nToken Registry', 635, 242, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#ECFDF5',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Redis Cache Node (Ellipse)
      g.push(
        new EllipseGraphic(800, 135, 65, 45, {
          fillColor: '#0F172A',
          strokeColor: '#F87171',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Redis Cache\nIn-Memory', 800, 122, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#FEF2F2',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // PostgreSQL DB Node (Cylinder simulated by rect + ellipses)
      g.push(
        new RectGraphic(740, 220, 120, 80, 6, {
          fillColor: '#0F172A',
          strokeColor: '#FBBF24',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('PostgreSQL\nPrimary Cluster', 800, 250, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#FEF3C7',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Wire: Service A -> Redis
      g.push(
        new LineGraphic(710, 135, 735, 135, {
          strokeColor: '#F87171',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Wire: Service B -> DB
      g.push(
        new LineGraphic(710, 255, 740, 255, {
          strokeColor: '#FBBF24',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Event Bus curve at bottom
      g.push(
        new BSplineGraphic(
          [
            { x: 200, y: 440 },
            { x: 380, y: 390 },
            { x: 580, y: 450 },
            { x: 780, y: 400 },
          ],
          false,
          {
            strokeColor: '#A855F7',
            strokeWidth: 3,
            strokeDash: 'dashed',
            arrowEnd: true,
            arrowSize: 10,
          }
        )
      );
      g.push(
        new TextGraphic('Event Streaming Bus (Kafka / RabbitMQ)', 480, 470, 13, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#D8B4FE',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      return g;
    },
  },

  {
    id: 'digital_logic',
    name: 'Digital Logic Circuit',
    description: 'NAND, XOR, and Inverter schematic with digital bus signals and truth-table verification nodes.',
    category: 'Electronics',
    createGraphics: () => {
      const g: Graphic[] = [];

      // Circuit Title
      g.push(
        new TextGraphic('Full Adder Sub-Circuit (Gate Level)', 100, 40, 18, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#38BDF8',
        })
      );

      // Input A wire
      g.push(
        new LineGraphic(80, 120, 220, 120, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Input A', 40, 112, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#CBD5E1',
        })
      );

      // Input B wire
      g.push(
        new LineGraphic(80, 160, 220, 160, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Input B', 40, 152, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#CBD5E1',
        })
      );

      // XOR Gate 1 (represented with curved B-Spline + lines)
      g.push(
        new BSplineGraphic(
          [
            { x: 220, y: 110 },
            { x: 260, y: 140 },
            { x: 220, y: 170 },
          ],
          false,
          {
            strokeColor: '#38BDF8',
            strokeWidth: 2,
          }
        )
      );
      g.push(
        new BSplineGraphic(
          [
            { x: 230, y: 110 },
            { x: 290, y: 115 },
            { x: 310, y: 140 },
            { x: 290, y: 165 },
            { x: 230, y: 170 },
          ],
          false,
          {
            strokeColor: '#38BDF8',
            strokeWidth: 2,
            fillColor: '#38BDF815',
          }
        )
      );
      g.push(
        new TextGraphic('XOR_1', 255, 134, 11, 'JetBrains Mono, monospace', {
          fillColor: '#7DD3FC',
        })
      );

      // XOR Output Wire
      g.push(
        new LineGraphic(310, 140, 440, 140, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 6,
        })
      );
      g.push(
        new TextGraphic('Sum (S)', 450, 132, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#34D399',
        })
      );

      // AND Gate for Carry
      g.push(
        new RectGraphic(230, 230, 60, 50, 0, {
          fillColor: '#F59E0B15',
          strokeColor: '#F59E0B',
          strokeWidth: 2,
        })
      );
      g.push(
        new EllipseGraphic(290, 255, 25, 25, {
          fillColor: '#F59E0B15',
          strokeColor: '#F59E0B',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('AND_1', 260, 250, 11, 'JetBrains Mono, monospace', {
          fillColor: '#FCD34D',
        })
      );

      // Input taps down to AND gate
      g.push(
        new LineGraphic(150, 120, 150, 240, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new LineGraphic(150, 240, 230, 240, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new EllipseGraphic(150, 120, 3, 3, {
          fillColor: '#38BDF8',
          strokeColor: '#38BDF8',
          strokeWidth: 1,
        })
      );

      g.push(
        new LineGraphic(180, 160, 180, 270, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new LineGraphic(180, 270, 230, 270, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
        })
      );
      g.push(
        new EllipseGraphic(180, 160, 3, 3, {
          fillColor: '#38BDF8',
          strokeColor: '#38BDF8',
          strokeWidth: 1,
        })
      );

      // AND Output wire
      g.push(
        new LineGraphic(315, 255, 440, 255, {
          strokeColor: '#94A3B8',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 6,
        })
      );
      g.push(
        new TextGraphic('Carry (C_out)', 450, 247, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#F59E0B',
        })
      );

      return g;
    },
  },

  {
    id: 'algorithm_flowchart',
    name: 'Algorithm Flowchart',
    description: 'Decision diamonds, process blocks, and state transition branches.',
    category: 'Algorithms',
    createGraphics: () => {
      const g: Graphic[] = [];

      // Start pill
      g.push(
        new RectGraphic(260, 50, 140, 50, 25, {
          fillColor: '#10B98125',
          strokeColor: '#10B981',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('START', 330, 66, 14, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#D1FAE5',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Arrow down
      g.push(
        new LineGraphic(330, 100, 330, 150, {
          strokeColor: '#64748B',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Initialize Process
      g.push(
        new RectGraphic(230, 150, 200, 60, 4, {
          fillColor: '#0F172A',
          strokeColor: '#38BDF8',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Init InterViews Canvas\n& Affine Transformer', 330, 168, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#F0F9FF',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Arrow down
      g.push(
        new LineGraphic(330, 210, 330, 260, {
          strokeColor: '#64748B',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );

      // Decision diamond (polygon)
      g.push(
        new PolyGraphic(
          [
            { x: 330, y: 260 },
            { x: 430, y: 310 },
            { x: 330, y: 360 },
            { x: 230, y: 310 },
          ],
          true,
          {
            fillColor: '#F59E0B20',
            strokeColor: '#F59E0B',
            strokeWidth: 2,
          }
        )
      );
      g.push(
        new TextGraphic('Damage Region\nNon-Empty?', 330, 298, 11, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#FEF3C7',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Branch: Yes (down)
      g.push(
        new LineGraphic(330, 360, 330, 420, {
          strokeColor: '#10B981',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );
      g.push(
        new TextGraphic('YES', 345, 380, 11, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#34D399',
        })
      );

      // Redraw Graphic
      g.push(
        new RectGraphic(230, 420, 200, 60, 4, {
          fillColor: '#0F172A',
          strokeColor: '#10B981',
          strokeWidth: 2,
        })
      );
      g.push(
        new TextGraphic('Repair Damage\nRender Graphic Tree', 330, 438, 12, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#F0FDF4',
        })
      );
      (g[g.length - 1] as TextGraphic).align = 'center';

      // Branch: No (loop right back up)
      g.push(
        new LineGraphic(430, 310, 520, 310, {
          strokeColor: '#F43F5E',
          strokeWidth: 2,
        })
      );
      g.push(
        new LineGraphic(520, 310, 520, 180, {
          strokeColor: '#F43F5E',
          strokeWidth: 2,
        })
      );
      g.push(
        new LineGraphic(520, 180, 430, 180, {
          strokeColor: '#F43F5E',
          strokeWidth: 2,
          arrowEnd: true,
          arrowSize: 8,
        })
      );
      g.push(
        new TextGraphic('NO (Wait Event)', 445, 295, 11, 'Plus Jakarta Sans, sans-serif', {
          fillColor: '#FB7185',
        })
      );

      return g;
    },
  },
];
