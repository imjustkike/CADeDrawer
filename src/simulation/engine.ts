import { Sheet, SimulationState, DeviceRuntimeState, SimulationDiagnostic, SimulationEvent } from '../domain/types';
import { compileSheetToCircuit } from './compiler';
import { solveCircuitStep } from './solver';
import { SimCompiledCircuit } from './types';

export type SimulationListener = (state: SimulationState) => void;

export class SimulationEngine {
  private sheet: Sheet | null = null;
  private circuit: SimCompiledCircuit | null = null;
  private state: SimulationState;
  private listeners: Set<SimulationListener> = new Set();
  private timerHandle: number | null = null;
  private lastTimestamp: number = 0;

  constructor() {
    this.state = {
      running: false,
      paused: false,
      simulatedTimeMs: 0,
      stepMs: 10,
      speedMultiplier: 1,
      deviceStates: {},
      terminalPotentials: {},
      junctionPotentials: {},
      wireEnergized: {},
      diagnostics: [],
      events: [],
    };
  }

  public setSheet(sheet: Sheet) {
    this.sheet = sheet;
    this.circuit = compileSheetToCircuit(sheet);
    this.evaluate();
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  public getState(): SimulationState {
    return {
      ...this.state,
      deviceStates: { ...this.state.deviceStates },
      terminalPotentials: { ...this.state.terminalPotentials },
      junctionPotentials: { ...this.state.junctionPotentials },
      wireEnergized: { ...this.state.wireEnergized },
      diagnostics: [...this.state.diagnostics],
      events: [...this.state.events],
    };
  }

  public start() {
    if (this.state.running) return;
    this.state.running = true;
    this.state.paused = false;
    this.lastTimestamp = performance.now();
    this.scheduleNextTick();
    this.notify();
  }

  public pause() {
    this.state.paused = true;
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.notify();
  }

  public resume() {
    if (!this.state.running) {
      this.start();
      return;
    }
    this.state.paused = false;
    this.lastTimestamp = performance.now();
    this.scheduleNextTick();
    this.notify();
  }

  public reset() {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.state.running = false;
    this.state.paused = false;
    this.state.simulatedTimeMs = 0;
    this.state.deviceStates = {};
    this.state.diagnostics = [];
    this.state.events = [];

    if (this.sheet) {
      // Reset momentary inputs and latches
      for (const comp of this.sheet.components) {
        if (comp.type === 'pushbutton_no' || comp.type === 'pushbutton_nc') {
          comp.params.isPressed = false;
        }
      }
      this.circuit = compileSheetToCircuit(this.sheet);
    }

    this.evaluate();
  }

  public setSpeed(multiplier: 0.25 | 0.5 | 1 | 2) {
    this.state.speedMultiplier = multiplier;
    this.notify();
  }

  public step() {
    this.tick(this.state.stepMs);
  }

  private scheduleNextTick() {
    if (!this.state.running || this.state.paused) return;

    // Real-world interval adjusted by speedMultiplier
    const intervalMs = this.state.stepMs / this.state.speedMultiplier;

    this.timerHandle = window.setTimeout(() => {
      this.tick(this.state.stepMs);
      this.scheduleNextTick();
    }, intervalMs);
  }

  public tick(dtMs: number) {
    if (!this.sheet || !this.circuit) return;

    this.state.simulatedTimeMs += dtMs;
    const result = solveCircuitStep(
      this.circuit,
      this.sheet,
      this.state.deviceStates,
      dtMs,
      this.state.simulatedTimeMs
    );

    this.state.deviceStates = result.deviceStates;
    this.state.terminalPotentials = result.terminalPotentials;
    this.state.junctionPotentials = result.junctionPotentials;
    this.state.wireEnergized = result.wireEnergized;

    // Merge new events and diagnostics (limit buffer size to 200)
    if (result.events.length > 0) {
      this.state.events = [...this.state.events, ...result.events].slice(-200);
    }
    this.state.diagnostics = result.diagnostics;

    // Sync state back to components in sheet for UI rendering
    for (const comp of this.sheet.components) {
      const devId = comp.deviceId || comp.id;
      const devState = result.deviceStates[devId];
      if (devState) {
        comp.params = {
          ...comp.params,
          isEnergized: devState.isEnergized,
          timerElapsedMs: devState.timerElapsedMs,
          timerActive: devState.timerActive,
          motorState: devState.motorState,
          motorRpm: devState.motorRpm,
          pilotLit: devState.pilotLit,
          buzzerActive: devState.buzzerActive,
        };
      }
    }

    this.notify();
  }

  public evaluate() {
    if (!this.sheet || !this.circuit) return;
    const result = solveCircuitStep(
      this.circuit,
      this.sheet,
      this.state.deviceStates,
      0,
      this.state.simulatedTimeMs
    );

    this.state.deviceStates = result.deviceStates;
    this.state.terminalPotentials = result.terminalPotentials;
    this.state.junctionPotentials = result.junctionPotentials;
    this.state.wireEnergized = result.wireEnergized;
    this.state.diagnostics = result.diagnostics;

    for (const comp of this.sheet.components) {
      const devId = comp.deviceId || comp.id;
      const devState = result.deviceStates[devId];
      if (devState) {
        comp.params = {
          ...comp.params,
          isEnergized: devState.isEnergized,
          timerElapsedMs: devState.timerElapsedMs,
          timerActive: devState.timerActive,
          motorState: devState.motorState,
          motorRpm: devState.motorRpm,
          pilotLit: devState.pilotLit,
          buzzerActive: devState.buzzerActive,
        };
      }
    }

    this.notify();
  }

  // Interactive component handlers during simulation
  public setComponentParam(componentId: string, paramKey: string, value: any) {
    if (!this.sheet) return;
    const comp = this.sheet.components.find((c) => c.id === componentId);
    if (!comp) return;

    comp.params[paramKey] = value;
    const devId = comp.deviceId || comp.id;

    // If param is thermal trip or breaker trip, update device
    if (paramKey === 'tripped' && this.state.deviceStates[devId]) {
      this.state.deviceStates[devId].isTripped = value;
    }

    this.evaluate();
  }

  public setMomentaryPress(componentId: string, isDown: boolean) {
    if (!this.sheet) return;
    const comp = this.sheet.components.find((c) => c.id === componentId);
    if (!comp) return;

    comp.params.isPressed = isDown;
    this.evaluate();
  }
}
