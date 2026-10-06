import { NodePotential, SimulationDiagnostic, SimulationEvent, DeviceRuntimeState, Sheet } from '../domain/types';

export interface SimGraphNode {
  id: string; // terminal ID (e.g. "cmp_1:13") or junction ID (e.g. "jnc_1")
  type: 'terminal' | 'junction';
  componentId?: string;
  terminalName?: string;
  function?: string;
  netId?: number;
  potential: NodePotential;
}

export interface SimGraphEdge {
  fromId: string;
  toId: string;
  isClosed: boolean;
  type: 'wire' | 'internal_contact' | 'junction_link';
}

export interface SimCompiledCircuit {
  nodes: Map<string, SimGraphNode>;
  adjacency: Map<string, Array<{ targetId: string; edge: SimGraphEdge }>>;
  terminalToNodeId: Map<string, string>;
  deviceComponents: Map<string, { coilId?: string; contactIds: string[]; powerContactIds: string[] }>;
}

export interface SimulationStepResult {
  deviceStates: Record<string, DeviceRuntimeState>;
  terminalPotentials: Record<string, NodePotential>;
  junctionPotentials: Record<string, NodePotential>;
  wireEnergized: Record<string, boolean>;
  diagnostics: SimulationDiagnostic[];
  events: SimulationEvent[];
  converged: boolean;
  iterations: number;
}
