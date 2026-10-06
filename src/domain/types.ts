export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TerminalFunction =
  | 'power_pos_24v'
  | 'power_neg_0v'
  | 'phase_l1'
  | 'phase_l2'
  | 'phase_l3'
  | 'neutral'
  | 'pe'
  | 'coil_pos'
  | 'coil_neg'
  | 'contact_in'
  | 'contact_out'
  | 'motor_in'
  | 'lamp_in'
  | 'lamp_out'
  | 'passive';

export type WireType =
  | 'control_dc'
  | 'power_ac_l1'
  | 'power_ac_l2'
  | 'power_ac_l3'
  | 'neutral'
  | 'pe'
  | 'general';

export interface Terminal {
  id: string; // e.g. "cmp_1:A1"
  componentId: string;
  name: string; // e.g. "A1", "13", "L1"
  label?: string;
  relX: number;
  relY: number;
  function: TerminalFunction;
}

export interface TerminalRef {
  type: 'terminal' | 'junction';
  id: string; // terminal ID or junction ID
  componentId?: string; // present when type === 'terminal'
  terminalName?: string;
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
  points: Point[]; // polyline points from start to end (including ends)
  wireType?: WireType;
  color?: string;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
  wireIds: string[];
}

export type ComponentCategory =
  | 'power'
  | 'protection'
  | 'switches'
  | 'pushbuttons'
  | 'coils'
  | 'contacts'
  | 'signaling'
  | 'motors'
  | 'terminals';

export type ComponentType =
  | 'power_24v'
  | 'power_0v'
  | 'power_3p_pe'
  | 'disconnector_3p'
  | 'circuit_breaker_1p'
  | 'thermal_relay_power'
  | 'thermal_relay_aux_nc'
  | 'thermal_relay_aux_no'
  | 'pushbutton_no'
  | 'pushbutton_nc'
  | 'emergency_stop_nc'
  | 'switch_selector_2pos'
  | 'coil_contactor'
  | 'coil_timer_ton'
  | 'coil_timer_tof'
  | 'contact_aux_no'
  | 'contact_aux_nc'
  | 'contact_power_3p'
  | 'contact_timed_no'
  | 'contact_timed_nc'
  | 'pilot_light'
  | 'buzzer'
  | 'motor_3p'
  | 'terminal_block';

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  deviceId: string; // Logical device ID linking coils, contacts, indicators
  tag: string; // Visible label, e.g. "KM1", "S1", "F2", "H1"
  terminals: Terminal[];
  params: {
    color?: string; // For pilots (e.g. 'green' | 'red' | 'yellow' | 'blue' | 'white')
    delayMs?: number; // For timers TON/TOF (e.g. 5000)
    delayUnit?: 's' | 'ms';
    labelPosition?: 'top' | 'bottom' | 'left' | 'right';
    tripped?: boolean; // For thermal relays / breakers
    isPressed?: boolean; // For pushbuttons
    isLatched?: boolean; // For emergency stops
    isClosed?: boolean; // For manual switches
    [key: string]: any;
  };
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
}

export interface Device {
  id: string;
  tag: string;
  kind:
    | 'contactor'
    | 'relay'
    | 'timer_ton'
    | 'timer_tof'
    | 'thermal_relay'
    | 'pushbutton'
    | 'emergency_stop'
    | 'switch'
    | 'circuit_breaker'
    | 'motor'
    | 'pilot_light'
    | 'buzzer';
  name: string;
  coilComponentId?: string;
  contactComponentIds: string[];
  params: Record<string, any>;
}

export interface Sheet {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  components: ComponentInstance[];
  wires: Wire[];
  junctions: Junction[];
  annotations: Annotation[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface Project {
  metadata: ProjectMetadata;
  devices: Record<string, Device>; // deviceId -> Device
  sheets: Sheet[];
  activeSheetId: string;
}

// SIMULATION TYPES
export type PotentialLevel =
  | 'NONE'
  | 'DC_POS_24V'
  | 'DC_NEG_0V'
  | 'AC_L1'
  | 'AC_L2'
  | 'AC_L3'
  | 'AC_NEUTRAL'
  | 'PE'
  | 'CONFLICT';

export interface NodePotential {
  has24V: boolean;
  has0V: boolean;
  hasL1: boolean;
  hasL2: boolean;
  hasL3: boolean;
  hasN: boolean;
  hasPE: boolean;
  isConflict: boolean;
}

export interface DeviceRuntimeState {
  deviceId: string;
  isEnergized: boolean;
  isClosed: boolean;
  isTripped: boolean;
  timerElapsedMs: number;
  timerTargetMs: number;
  timerActive: boolean;
  motorState: 'STOPPED' | 'RUNNING_CW' | 'RUNNING_CCW' | 'FAULT';
  motorRpm?: number;
  pilotLit?: boolean;
  buzzerActive?: boolean;
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface SimulationDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  componentIds?: string[];
  wireIds?: string[];
  timestampMs: number;
}

export interface SimulationEvent {
  id: string;
  simulatedTimeMs: number;
  category: 'coil' | 'contact' | 'timer' | 'protection' | 'motor' | 'operator' | 'system';
  deviceId?: string;
  componentTag?: string;
  description: string;
}

export interface SimulationState {
  running: boolean;
  paused: boolean;
  simulatedTimeMs: number;
  stepMs: number; // default 10ms
  speedMultiplier: 0.25 | 0.5 | 1 | 2;
  deviceStates: Record<string, DeviceRuntimeState>; // deviceId -> state
  terminalPotentials: Record<string, NodePotential>; // terminalId -> potential
  wireEnergized: Record<string, boolean>; // wireId -> energized boolean
  junctionPotentials: Record<string, NodePotential>; // junctionId -> potential
  diagnostics: SimulationDiagnostic[];
  events: SimulationEvent[];
}
