import { Sheet, ComponentInstance, NodePotential } from '../domain/types';
import { SimCompiledCircuit, SimGraphNode, SimGraphEdge } from './types';

export function createEmptyPotential(): NodePotential {
  return {
    has24V: false,
    has0V: false,
    hasL1: false,
    hasL2: false,
    hasL3: false,
    hasN: false,
    hasPE: false,
    isConflict: false,
  };
}

export function compileSheetToCircuit(sheet: Sheet): SimCompiledCircuit {
  const nodes = new Map<string, SimGraphNode>();
  const adjacency = new Map<string, Array<{ targetId: string; edge: SimGraphEdge }>>();
  const terminalToNodeId = new Map<string, string>();
  const deviceComponents = new Map<string, { coilId?: string; contactIds: string[]; powerContactIds: string[] }>();

  function addNode(id: string, node: SimGraphNode) {
    nodes.set(id, node);
    if (!adjacency.has(id)) {
      adjacency.set(id, []);
    }
  }

  function addEdge(fromId: string, toId: string, edge: SimGraphEdge) {
    if (!adjacency.has(fromId)) adjacency.set(fromId, []);
    if (!adjacency.has(toId)) adjacency.set(toId, []);

    adjacency.get(fromId)!.push({ targetId: toId, edge });
    adjacency.get(toId)!.push({ targetId: fromId, edge });
  }

  // 1. Add all Component Terminals as graph nodes
  for (const comp of sheet.components) {
    const devId = comp.deviceId || comp.id;
    if (!deviceComponents.has(devId)) {
      deviceComponents.set(devId, { contactIds: [], powerContactIds: [] });
    }
    const devInfo = deviceComponents.get(devId)!;

    if (comp.type.startsWith('coil_')) {
      devInfo.coilId = comp.id;
    } else if (comp.type === 'contact_power_3p') {
      devInfo.powerContactIds.push(comp.id);
    } else if (comp.type.startsWith('contact_') || comp.type.startsWith('thermal_relay_aux_')) {
      devInfo.contactIds.push(comp.id);
    }

    for (const term of comp.terminals) {
      const termNodeId = term.id;
      terminalToNodeId.set(termNodeId, termNodeId);
      addNode(termNodeId, {
        id: termNodeId,
        type: 'terminal',
        componentId: comp.id,
        terminalName: term.name,
        function: term.function,
        potential: createEmptyPotential(),
      });
    }
  }

  // 2. Add all Junctions as graph nodes
  for (const jnc of sheet.junctions) {
    addNode(jnc.id, {
      id: jnc.id,
      type: 'junction',
      potential: createEmptyPotential(),
    });
  }

  // 3. Add all Wires as graph edges
  for (const wire of sheet.wires) {
    const fromId = wire.from.id;
    const toId = wire.to.id;

    if (nodes.has(fromId) && nodes.has(toId)) {
      addEdge(fromId, toId, {
        fromId,
        toId,
        isClosed: true,
        type: 'wire',
      });
    }
  }

  return {
    nodes,
    adjacency,
    terminalToNodeId,
    deviceComponents,
  };
}
