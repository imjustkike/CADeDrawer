import { ComponentType, ComponentCategory, TerminalFunction } from '../domain/types';

export interface PortTemplate {
  name: string;
  label?: string;
  relX: number;
  relY: number;
  function: TerminalFunction;
}

export interface ComponentDefinition {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  defaultTagPrefix: string;
  description: string;
  width: number;
  height: number;
  ports: PortTemplate[];
  defaultParams: Record<string, any>;
  deviceKind:
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
    | 'buzzer'
    | 'terminal_block'
    | 'power';
}
