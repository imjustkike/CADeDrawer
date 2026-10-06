import { Sheet, ComponentInstance, NodePotential, SimulationDiagnostic, SimulationEvent, DeviceRuntimeState } from '../domain/types';
import { SimCompiledCircuit, SimGraphNode, SimulationStepResult } from './types';
import { createEmptyPotential } from './compiler';

const MAX_SOLVER_ITERATIONS = 25;

export function solveCircuitStep(
  circuit: SimCompiledCircuit,
  sheet: Sheet,
  prevDeviceStates: Record<string, DeviceRuntimeState>,
  dtMs: number,
  currentSimTimeMs: number
): SimulationStepResult {
  const diagnostics: SimulationDiagnostic[] = [];
  const events: SimulationEvent[] = [];

  // Deep clone device states to work with
  const currentDeviceStates: Record<string, DeviceRuntimeState> = {};

  // Initialize device states for all components in sheet
  for (const comp of sheet.components) {
    const devId = comp.deviceId || comp.id;
    if (!currentDeviceStates[devId]) {
      const prev = prevDeviceStates[devId];
      currentDeviceStates[devId] = {
        deviceId: devId,
        isEnergized: prev ? prev.isEnergized : false,
        isClosed: comp.params?.isClosed ?? false,
        isTripped: comp.params?.tripped ?? false,
        timerElapsedMs: prev ? prev.timerElapsedMs : 0,
        timerTargetMs: comp.params?.delayMs ?? 3000,
        timerActive: prev ? prev.timerActive : false,
        motorState: prev ? prev.motorState : 'STOPPED',
        motorRpm: prev ? prev.motorRpm : 0,
        pilotLit: prev ? prev.pilotLit : false,
        buzzerActive: prev ? prev.buzzerActive : false,
      };
    }
  }

  // 1. Advance Timers based on prior energization and dtMs
  for (const comp of sheet.components) {
    const devId = comp.deviceId || comp.id;
    const devState = currentDeviceStates[devId];
    if (!devState) continue;

    if (comp.type === 'coil_timer_ton') {
      const target = comp.params?.delayMs ?? 3000;
      devState.timerTargetMs = target;
      if (devState.isEnergized) {
        if (!devState.timerActive) {
          devState.timerElapsedMs += dtMs;
          if (devState.timerElapsedMs >= target) {
            devState.timerActive = true;
            events.push({
              id: `evt_${Date.now()}_${Math.random()}`,
              simulatedTimeMs: currentSimTimeMs,
              category: 'timer',
              deviceId: devId,
              componentTag: comp.tag,
              description: `Temporizador TON (${comp.tag}) temporizado alcanzado (${(target / 1000).toFixed(1)}s)`,
            });
          }
        }
      } else {
        if (devState.timerElapsedMs > 0 || devState.timerActive) {
          devState.timerElapsedMs = 0;
          devState.timerActive = false;
        }
      }
    } else if (comp.type === 'coil_timer_tof') {
      const target = comp.params?.delayMs ?? 3000;
      devState.timerTargetMs = target;
      if (devState.isEnergized) {
        devState.timerActive = true;
        devState.timerElapsedMs = 0;
      } else {
        if (devState.timerActive) {
          devState.timerElapsedMs += dtMs;
          if (devState.timerElapsedMs >= target) {
            devState.timerActive = false;
            devState.timerElapsedMs = target;
            events.push({
              id: `evt_${Date.now()}_${Math.random()}`,
              simulatedTimeMs: currentSimTimeMs,
              category: 'timer',
              deviceId: devId,
              componentTag: comp.tag,
              description: `Temporizador TOF (${comp.tag}) retardo a la desconexión finalizado`,
            });
          }
        }
      }
    }
  }

  // 2. Fixed-Point Relaxation Loop for discrete contact/coil convergence
  let iteration = 0;
  let hasChanged = true;
  let converged = true;

  const terminalPotentials: Record<string, NodePotential> = {};
  const junctionPotentials: Record<string, NodePotential> = {};
  const wireEnergized: Record<string, boolean> = {};

  while (hasChanged && iteration < MAX_SOLVER_ITERATIONS) {
    iteration++;
    hasChanged = false;

    // Reset potentials on all graph nodes
    for (const node of circuit.nodes.values()) {
      node.potential = createEmptyPotential();
    }

    // A. Identify conduction state of all internal component branches
    const internalConductingEdges: Array<[string, string]> = [];

    for (const comp of sheet.components) {
      const devId = comp.deviceId || comp.id;
      const devState = currentDeviceStates[devId];
      const p = comp.params || {};

      switch (comp.type) {
        case 'pushbutton_no':
          if (p.isPressed) {
            internalConductingEdges.push([`${comp.id}:13`, `${comp.id}:14`]);
          }
          break;

        case 'pushbutton_nc':
          if (!p.isPressed) {
            internalConductingEdges.push([`${comp.id}:11`, `${comp.id}:12`]);
          }
          break;

        case 'emergency_stop_nc':
          if (!p.isLatched) {
            internalConductingEdges.push([`${comp.id}:11`, `${comp.id}:12`]);
          }
          break;

        case 'switch_selector_2pos':
          if (p.isClosed) {
            internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
          }
          break;

        case 'circuit_breaker_1p':
          if (p.isClosed && !p.tripped && !devState?.isTripped) {
            internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
          }
          break;

        case 'disconnector_3p':
          if (p.isClosed) {
            internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
            internalConductingEdges.push([`${comp.id}:3`, `${comp.id}:4`]);
            internalConductingEdges.push([`${comp.id}:5`, `${comp.id}:6`]);
          }
          break;

        case 'thermal_relay_power':
          if (!p.tripped && !devState?.isTripped) {
            internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
            internalConductingEdges.push([`${comp.id}:3`, `${comp.id}:4`]);
            internalConductingEdges.push([`${comp.id}:5`, `${comp.id}:6`]);
          }
          break;

        case 'thermal_relay_aux_nc':
          if (!p.tripped && !devState?.isTripped) {
            internalConductingEdges.push([`${comp.id}:95`, `${comp.id}:96`]);
          }
          break;

        case 'thermal_relay_aux_no':
          if (p.tripped || devState?.isTripped) {
            internalConductingEdges.push([`${comp.id}:97`, `${comp.id}:98`]);
          }
          break;

        case 'contact_aux_no':
          if (devState && devState.isEnergized) {
            internalConductingEdges.push([`${comp.id}:13`, `${comp.id}:14`]);
          }
          break;

        case 'contact_aux_nc':
          if (devState && !devState.isEnergized) {
            internalConductingEdges.push([`${comp.id}:11`, `${comp.id}:12`]);
          }
          break;

        case 'contact_power_3p':
          if (devState && devState.isEnergized) {
            internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
            internalConductingEdges.push([`${comp.id}:3`, `${comp.id}:4`]);
            internalConductingEdges.push([`${comp.id}:5`, `${comp.id}:6`]);
          }
          break;

        case 'contact_timed_no':
          if (devState && devState.timerActive) {
            internalConductingEdges.push([`${comp.id}:67`, `${comp.id}:68`]);
          }
          break;

        case 'contact_timed_nc':
          if (devState && !devState.timerActive) {
            internalConductingEdges.push([`${comp.id}:55`, `${comp.id}:56`]);
          }
          break;

        case 'terminal_block':
          internalConductingEdges.push([`${comp.id}:1`, `${comp.id}:2`]);
          break;
      }
    }

    // B. Inject Power Sources
    for (const comp of sheet.components) {
      if (comp.type === 'power_24v') {
        const node = circuit.nodes.get(`${comp.id}:L+`);
        if (node) node.potential.has24V = true;
      } else if (comp.type === 'power_0v') {
        const node = circuit.nodes.get(`${comp.id}:M`);
        if (node) node.potential.has0V = true;
      } else if (comp.type === 'power_3p_pe') {
        const nL1 = circuit.nodes.get(`${comp.id}:L1`);
        const nL2 = circuit.nodes.get(`${comp.id}:L2`);
        const nL3 = circuit.nodes.get(`${comp.id}:L3`);
        const nPE = circuit.nodes.get(`${comp.id}:PE`);
        if (nL1) nL1.potential.hasL1 = true;
        if (nL2) nL2.potential.hasL2 = true;
        if (nL3) nL3.potential.hasL3 = true;
        if (nPE) nPE.potential.hasPE = true;
      }
    }

    // C. Build graph adjacency with active conductive edges (Wires + internal closed contacts)
    const activeAdjacency = new Map<string, Set<string>>();
    for (const nodeId of circuit.nodes.keys()) {
      activeAdjacency.set(nodeId, new Set());
    }

    // Add all wires
    for (const wire of sheet.wires) {
      const u = wire.from.id;
      const v = wire.to.id;
      if (activeAdjacency.has(u) && activeAdjacency.has(v)) {
        activeAdjacency.get(u)!.add(v);
        activeAdjacency.get(v)!.add(u);
      }
    }

    // Add internal conducting edges
    for (const [u, v] of internalConductingEdges) {
      if (activeAdjacency.has(u) && activeAdjacency.has(v)) {
        activeAdjacency.get(u)!.add(v);
        activeAdjacency.get(v)!.add(u);
      }
    }

    // D. Equipotential Connected Component BFS Propagation
    const visited = new Set<string>();

    for (const startNodeId of circuit.nodes.keys()) {
      if (visited.has(startNodeId)) continue;

      const cluster: string[] = [];
      const queue: string[] = [startNodeId];
      visited.add(startNodeId);

      const netPotential: NodePotential = createEmptyPotential();

      while (queue.length > 0) {
        const currId = queue.shift()!;
        cluster.push(currId);

        const currNode = circuit.nodes.get(currId);
        if (currNode) {
          if (currNode.potential.has24V) netPotential.has24V = true;
          if (currNode.potential.has0V) netPotential.has0V = true;
          if (currNode.potential.hasL1) netPotential.hasL1 = true;
          if (currNode.potential.hasL2) netPotential.hasL2 = true;
          if (currNode.potential.hasL3) netPotential.hasL3 = true;
          if (currNode.potential.hasN) netPotential.hasN = true;
          if (currNode.potential.hasPE) netPotential.hasPE = true;
        }

        const neighbors = activeAdjacency.get(currId);
        if (neighbors) {
          for (const nextId of neighbors) {
            if (!visited.has(nextId)) {
              visited.add(nextId);
              queue.push(nextId);
            }
          }
        }
      }

      // Detect potential conflicts / short circuits in this net
      if (netPotential.has24V && netPotential.has0V) {
        netPotential.isConflict = true;
      }
      if ((netPotential.hasL1 && netPotential.hasL2) || (netPotential.hasL1 && netPotential.hasL3) || (netPotential.hasL2 && netPotential.hasL3)) {
        netPotential.isConflict = true;
      }

      // Broadcast net potential to all nodes in cluster
      for (const nodeId of cluster) {
        const node = circuit.nodes.get(nodeId);
        if (node) {
          node.potential = { ...netPotential };
        }
      }
    }

    // E. Evaluate Load components and propose state updates
    for (const comp of sheet.components) {
      const devId = comp.deviceId || comp.id;
      const devState = currentDeviceStates[devId];
      if (!devState) continue;

      if (comp.type === 'coil_contactor' || comp.type === 'coil_timer_ton' || comp.type === 'coil_timer_tof') {
        const pA1 = circuit.nodes.get(`${comp.id}:A1`)?.potential;
        const pA2 = circuit.nodes.get(`${comp.id}:A2`)?.potential;

        const isPowered = !!(
          (pA1?.has24V && pA2?.has0V) ||
          (pA1?.has0V && pA2?.has24V)
        );

        if (devState.isEnergized !== isPowered) {
          devState.isEnergized = isPowered;
          hasChanged = true;

          events.push({
            id: `evt_${Date.now()}_${Math.random()}`,
            simulatedTimeMs: currentSimTimeMs,
            category: 'coil',
            deviceId: devId,
            componentTag: comp.tag,
            description: isPowered
              ? `Bobina ${comp.tag} ACTIVADA (24V CC)`
              : `Bobina ${comp.tag} DESACTIVADA`,
          });
        }
      } else if (comp.type === 'pilot_light') {
        const pX1 = circuit.nodes.get(`${comp.id}:X1`)?.potential;
        const pX2 = circuit.nodes.get(`${comp.id}:X2`)?.potential;

        const isLit = !!(
          (pX1?.has24V && pX2?.has0V) ||
          (pX1?.has0V && pX2?.has24V)
        );

        if (devState.pilotLit !== isLit) {
          devState.pilotLit = isLit;
          hasChanged = true;
        }
      } else if (comp.type === 'buzzer') {
        const pX1 = circuit.nodes.get(`${comp.id}:X1`)?.potential;
        const pX2 = circuit.nodes.get(`${comp.id}:X2`)?.potential;

        const isBuzz = !!(
          (pX1?.has24V && pX2?.has0V) ||
          (pX1?.has0V && pX2?.has24V)
        );

        if (devState.buzzerActive !== isBuzz) {
          devState.buzzerActive = isBuzz;
          hasChanged = true;
        }
      } else if (comp.type === 'motor_3p') {
        const pU1 = circuit.nodes.get(`${comp.id}:U1`)?.potential;
        const pV1 = circuit.nodes.get(`${comp.id}:V1`)?.potential;
        const pW1 = circuit.nodes.get(`${comp.id}:W1`)?.potential;

        let targetMotorState: 'STOPPED' | 'RUNNING_CW' | 'RUNNING_CCW' | 'FAULT' = 'STOPPED';

        if (pU1?.hasL1 && pV1?.hasL2 && pW1?.hasL3) {
          targetMotorState = 'RUNNING_CW';
        } else if (pU1?.hasL3 && pV1?.hasL2 && pW1?.hasL1) {
          targetMotorState = 'RUNNING_CCW';
        } else if (
          (pU1?.hasL1 || pU1?.hasL2 || pU1?.hasL3) &&
          (pV1?.hasL1 || pV1?.hasL2 || pV1?.hasL3) &&
          (pW1?.hasL1 || pW1?.hasL2 || pW1?.hasL3)
        ) {
          targetMotorState = 'RUNNING_CW';
        } else if (pU1?.hasL1 || pV1?.hasL2 || pW1?.hasL3) {
          targetMotorState = 'FAULT'; // Missing phase (Falta de fase)
        }

        if (devState.motorState !== targetMotorState) {
          devState.motorState = targetMotorState;
          devState.motorRpm = targetMotorState === 'RUNNING_CW' || targetMotorState === 'RUNNING_CCW' ? 1450 : 0;
          hasChanged = true;

          events.push({
            id: `evt_${Date.now()}_${Math.random()}`,
            simulatedTimeMs: currentSimTimeMs,
            category: 'motor',
            deviceId: devId,
            componentTag: comp.tag,
            description: `Motor ${comp.tag} estado: ${targetMotorState}`,
          });
        }
      }
    }
  }

  if (iteration >= MAX_SOLVER_ITERATIONS) {
    converged = false;
    diagnostics.push({
      id: `diag_osc_${Date.now()}`,
      severity: 'error',
      title: 'Bucle Oscilante / Estado Inestable',
      message: 'Se ha detectado una oscilación cíclica sin estado estacionario (límite de iteraciones alcanzado).',
      timestampMs: currentSimTimeMs,
    });
  }

  // 3. Export potentials and wire energized status for visual rendering
  for (const [nodeId, node] of circuit.nodes.entries()) {
    if (node.type === 'terminal') {
      terminalPotentials[nodeId] = { ...node.potential };
    } else if (node.type === 'junction') {
      junctionPotentials[nodeId] = { ...node.potential };
    }

    if (node.potential.isConflict) {
      diagnostics.push({
        id: `diag_conflict_${nodeId}`,
        severity: 'error',
        title: 'Cortocircuito / Conflicto de Potenciales',
        message: `Se ha producido un cortocircuito entre alimentaciones distintas en el nodo ${nodeId}.`,
        timestampMs: currentSimTimeMs,
      });
    }
  }

  for (const wire of sheet.wires) {
    const potFrom = circuit.nodes.get(wire.from.id)?.potential;
    const potTo = circuit.nodes.get(wire.to.id)?.potential;
    const isEnergized = !!(
      (potFrom && (potFrom.has24V || potFrom.has0V || potFrom.hasL1 || potFrom.hasL2 || potFrom.hasL3)) ||
      (potTo && (potTo.has24V || potTo.has0V || potTo.hasL1 || potTo.hasL2 || potTo.hasL3))
    );
    wireEnergized[wire.id] = isEnergized;
  }

  return {
    deviceStates: currentDeviceStates,
    terminalPotentials,
    junctionPotentials,
    wireEnergized,
    diagnostics,
    events,
    converged,
    iterations: iteration,
  };
}
