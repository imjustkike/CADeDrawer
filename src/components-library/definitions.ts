import { ComponentDefinition } from './types';
import { ComponentType } from '../domain/types';

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  // === ALIMENTACIÓN ===
  power_24v: {
    type: 'power_24v',
    category: 'power',
    name: 'Alimentación +24V CC',
    defaultTagPrefix: '+24V',
    description: 'Borne de potencial positivo +24 V de mando',
    width: 40,
    height: 30,
    ports: [
      { name: 'L+', label: '+24V', relX: 20, relY: 30, function: 'power_pos_24v' },
    ],
    defaultParams: {},
    deviceKind: 'power',
  },

  power_0v: {
    type: 'power_0v',
    category: 'power',
    name: 'Alimentación 0V CC',
    defaultTagPrefix: '0V',
    description: 'Borne de retorno 0 V (Masa) de mando',
    width: 40,
    height: 30,
    ports: [
      { name: 'M', label: '0V', relX: 20, relY: 0, function: 'power_neg_0v' },
    ],
    defaultParams: {},
    deviceKind: 'power',
  },

  power_3p_pe: {
    type: 'power_3p_pe',
    category: 'power',
    name: 'Alimentación Trifásica (L1, L2, L3, PE)',
    defaultTagPrefix: 'RED',
    description: 'Red trifásica 400V con conductor de protección',
    width: 80,
    height: 30,
    ports: [
      { name: 'L1', label: 'L1', relX: 10, relY: 30, function: 'phase_l1' },
      { name: 'L2', label: 'L2', relX: 30, relY: 30, function: 'phase_l2' },
      { name: 'L3', label: 'L3', relX: 50, relY: 30, function: 'phase_l3' },
      { name: 'PE', label: 'PE', relX: 70, relY: 30, function: 'pe' },
    ],
    defaultParams: {},
    deviceKind: 'power',
  },

  // === PROTECCIÓN & SECCIONAMIENTO ===
  disconnector_3p: {
    type: 'disconnector_3p',
    category: 'protection',
    name: 'Seccionador Tripolar (Q1)',
    defaultTagPrefix: 'Q1',
    description: 'Interruptor seccionador tripolar con palanca manual',
    width: 60,
    height: 60,
    ports: [
      { name: '1', label: '1', relX: 10, relY: 0, function: 'contact_in' },
      { name: '3', label: '3', relX: 30, relY: 0, function: 'contact_in' },
      { name: '5', label: '5', relX: 50, relY: 0, function: 'contact_in' },
      { name: '2', label: '2', relX: 10, relY: 60, function: 'contact_out' },
      { name: '4', label: '4', relX: 30, relY: 60, function: 'contact_out' },
      { name: '6', label: '6', relX: 50, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isClosed: true },
    deviceKind: 'circuit_breaker',
  },

  circuit_breaker_1p: {
    type: 'circuit_breaker_1p',
    category: 'protection',
    name: 'Magnetotérmico Unipolar (F1)',
    defaultTagPrefix: 'F1',
    description: 'Interruptor automático magnetotérmico 1P de control',
    width: 40,
    height: 60,
    ports: [
      { name: '1', label: '1', relX: 20, relY: 0, function: 'contact_in' },
      { name: '2', label: '2', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isClosed: true, tripped: false },
    deviceKind: 'circuit_breaker',
  },

  thermal_relay_power: {
    type: 'thermal_relay_power',
    category: 'protection',
    name: 'Relé Térmico Potencia (F2)',
    defaultTagPrefix: 'F2',
    description: 'Bloque bimetálico tripolar con disparo térmico simulado y rearme',
    width: 60,
    height: 60,
    ports: [
      { name: '1', label: '1', relX: 10, relY: 0, function: 'contact_in' },
      { name: '3', label: '3', relX: 30, relY: 0, function: 'contact_in' },
      { name: '5', label: '5', relX: 50, relY: 0, function: 'contact_in' },
      { name: '2', label: '2', relX: 10, relY: 60, function: 'contact_out' },
      { name: '4', label: '4', relX: 30, relY: 60, function: 'contact_out' },
      { name: '6', label: '6', relX: 50, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { tripped: false },
    deviceKind: 'thermal_relay',
  },

  thermal_relay_aux_nc: {
    type: 'thermal_relay_aux_nc',
    category: 'protection',
    name: 'Contacto NC Térmico (95-96)',
    defaultTagPrefix: 'F2',
    description: 'Contacto de seguridad normalmente cerrado del relé térmico',
    width: 40,
    height: 60,
    ports: [
      { name: '95', label: '95', relX: 20, relY: 0, function: 'contact_in' },
      { name: '96', label: '96', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'thermal_relay',
  },

  thermal_relay_aux_no: {
    type: 'thermal_relay_aux_no',
    category: 'protection',
    name: 'Contacto NA Térmico (97-98)',
    defaultTagPrefix: 'F2',
    description: 'Contacto de señalización normalmente abierto del relé térmico',
    width: 40,
    height: 60,
    ports: [
      { name: '97', label: '97', relX: 20, relY: 0, function: 'contact_in' },
      { name: '98', label: '98', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'thermal_relay',
  },

  // === PULSADORES & INTERRUPTORES ===
  pushbutton_no: {
    type: 'pushbutton_no',
    category: 'pushbuttons',
    name: 'Pulsador NA (Marcha - S1)',
    defaultTagPrefix: 'S1',
    description: 'Pulsador normalmente abierto momentáneo (13-14)',
    width: 40,
    height: 60,
    ports: [
      { name: '13', label: '13', relX: 20, relY: 0, function: 'contact_in' },
      { name: '14', label: '14', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isPressed: false },
    deviceKind: 'pushbutton',
  },

  pushbutton_nc: {
    type: 'pushbutton_nc',
    category: 'pushbuttons',
    name: 'Pulsador NC (Paro - S0)',
    defaultTagPrefix: 'S0',
    description: 'Pulsador normalmente cerrado momentáneo (11-12)',
    width: 40,
    height: 60,
    ports: [
      { name: '11', label: '11', relX: 20, relY: 0, function: 'contact_in' },
      { name: '12', label: '12', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isPressed: false },
    deviceKind: 'pushbutton',
  },

  emergency_stop_nc: {
    type: 'emergency_stop_nc',
    category: 'pushbuttons',
    name: 'Parada de Emergencia (S_EMERG)',
    defaultTagPrefix: 'S_EMERG',
    description: 'Pulsador de seta con enclavamiento mecánico (11-12)',
    width: 40,
    height: 60,
    ports: [
      { name: '11', label: '11', relX: 20, relY: 0, function: 'contact_in' },
      { name: '12', label: '12', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isLatched: false },
    deviceKind: 'emergency_stop',
  },

  switch_selector_2pos: {
    type: 'switch_selector_2pos',
    category: 'switches',
    name: 'Selector 2 Posiciones (SA1)',
    defaultTagPrefix: 'SA1',
    description: 'Interruptor rotativo mantenido de 2 posiciones',
    width: 40,
    height: 60,
    ports: [
      { name: '1', label: '1', relX: 20, relY: 0, function: 'contact_in' },
      { name: '2', label: '2', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: { isClosed: false },
    deviceKind: 'switch',
  },

  // === BOBINAS DE RELÉ & CONTACTOR ===
  coil_contactor: {
    type: 'coil_contactor',
    category: 'coils',
    name: 'Bobina Contactor / Relé (KM1)',
    defaultTagPrefix: 'KM1',
    description: 'Bobina electromagnética de contactor con bornes A1-A2',
    width: 40,
    height: 60,
    ports: [
      { name: 'A1', label: 'A1', relX: 20, relY: 0, function: 'coil_pos' },
      { name: 'A2', label: 'A2', relX: 20, relY: 60, function: 'coil_neg' },
    ],
    defaultParams: {},
    deviceKind: 'contactor',
  },

  coil_timer_ton: {
    type: 'coil_timer_ton',
    category: 'coils',
    name: 'Temporizador a la Conexión TON (KT1)',
    defaultTagPrefix: 'KT1',
    description: 'Bobina de relé temporizado con retardo a la activación (TON)',
    width: 50,
    height: 60,
    ports: [
      { name: 'A1', label: 'A1', relX: 25, relY: 0, function: 'coil_pos' },
      { name: 'A2', label: 'A2', relX: 25, relY: 60, function: 'coil_neg' },
    ],
    defaultParams: { delayMs: 3000, delayUnit: 's' },
    deviceKind: 'timer_ton',
  },

  coil_timer_tof: {
    type: 'coil_timer_tof',
    category: 'coils',
    name: 'Temporizador a la Desconexión TOF (KT2)',
    defaultTagPrefix: 'KT2',
    description: 'Bobina de relé temporizado con retardo a la desactivación (TOF)',
    width: 50,
    height: 60,
    ports: [
      { name: 'A1', label: 'A1', relX: 25, relY: 0, function: 'coil_pos' },
      { name: 'A2', label: 'A2', relX: 25, relY: 60, function: 'coil_neg' },
    ],
    defaultParams: { delayMs: 3000, delayUnit: 's' },
    deviceKind: 'timer_tof',
  },

  // === CONTACTOS AUXILIARES & POTENCIA ===
  contact_aux_no: {
    type: 'contact_aux_no',
    category: 'contacts',
    name: 'Contacto Auxiliar NA (13-14)',
    defaultTagPrefix: 'KM1',
    description: 'Contacto normalmente abierto asociado a la bobina del dispositivo',
    width: 40,
    height: 60,
    ports: [
      { name: '13', label: '13', relX: 20, relY: 0, function: 'contact_in' },
      { name: '14', label: '14', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'contactor',
  },

  contact_aux_nc: {
    type: 'contact_aux_nc',
    category: 'contacts',
    name: 'Contacto Auxiliar NC (11-12 / 21-22)',
    defaultTagPrefix: 'KM1',
    description: 'Contacto normalmente cerrado para enclavamiento eléctrico',
    width: 40,
    height: 60,
    ports: [
      { name: '11', label: '11', relX: 20, relY: 0, function: 'contact_in' },
      { name: '12', label: '12', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'contactor',
  },

  contact_power_3p: {
    type: 'contact_power_3p',
    category: 'contacts',
    name: 'Contactos Principales Tripolares',
    defaultTagPrefix: 'KM1',
    description: 'Bloque de 3 polos principales de potencia (1-2, 3-4, 5-6)',
    width: 60,
    height: 60,
    ports: [
      { name: '1', label: '1', relX: 10, relY: 0, function: 'contact_in' },
      { name: '3', label: '3', relX: 30, relY: 0, function: 'contact_in' },
      { name: '5', label: '5', relX: 50, relY: 0, function: 'contact_in' },
      { name: '2', label: '2', relX: 10, relY: 60, function: 'contact_out' },
      { name: '4', label: '4', relX: 30, relY: 60, function: 'contact_out' },
      { name: '6', label: '6', relX: 50, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'contactor',
  },

  contact_timed_no: {
    type: 'contact_timed_no',
    category: 'contacts',
    name: 'Contacto Temporizado NA (67-68)',
    defaultTagPrefix: 'KT1',
    description: 'Contacto con retardo de apertura o cierre',
    width: 40,
    height: 60,
    ports: [
      { name: '67', label: '67', relX: 20, relY: 0, function: 'contact_in' },
      { name: '68', label: '68', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'timer_ton',
  },

  contact_timed_nc: {
    type: 'contact_timed_nc',
    category: 'contacts',
    name: 'Contacto Temporizado NC (55-56)',
    defaultTagPrefix: 'KT1',
    description: 'Contacto normalmente cerrado con retardo temporizado',
    width: 40,
    height: 60,
    ports: [
      { name: '55', label: '55', relX: 20, relY: 0, function: 'contact_in' },
      { name: '56', label: '56', relX: 20, relY: 60, function: 'contact_out' },
    ],
    defaultParams: {},
    deviceKind: 'timer_ton',
  },

  // === SEÑALIZACIÓN & ACTUADORES ===
  pilot_light: {
    type: 'pilot_light',
    category: 'signaling',
    name: 'Piloto de Señalización (H1)',
    defaultTagPrefix: 'H1',
    description: 'Lámpara indicadora óptica (X1-X2)',
    width: 40,
    height: 60,
    ports: [
      { name: 'X1', label: 'X1', relX: 20, relY: 0, function: 'lamp_in' },
      { name: 'X2', label: 'X2', relX: 20, relY: 60, function: 'lamp_out' },
    ],
    defaultParams: { color: 'green' },
    deviceKind: 'pilot_light',
  },

  buzzer: {
    type: 'buzzer',
    category: 'signaling',
    name: 'Zumbador / Bocina (HA1)',
    defaultTagPrefix: 'HA1',
    description: 'Avisador acústico de alarma (X1-X2)',
    width: 40,
    height: 60,
    ports: [
      { name: 'X1', label: 'X1', relX: 20, relY: 0, function: 'lamp_in' },
      { name: 'X2', label: 'X2', relX: 20, relY: 60, function: 'lamp_out' },
    ],
    defaultParams: {},
    deviceKind: 'buzzer',
  },

  // === MOTORES ===
  motor_3p: {
    type: 'motor_3p',
    category: 'motors',
    name: 'Motor Asíncrono Trifásico (M1)',
    defaultTagPrefix: 'M1',
    description: 'Motor jaula de ardilla con bornes U1, V1, W1 y PE',
    width: 80,
    height: 80,
    ports: [
      { name: 'U1', label: 'U1', relX: 20, relY: 0, function: 'motor_in' },
      { name: 'V1', label: 'V1', relX: 40, relY: 0, function: 'motor_in' },
      { name: 'W1', label: 'W1', relX: 60, relY: 0, function: 'motor_in' },
      { name: 'PE', label: 'PE', relX: 75, relY: 40, function: 'pe' },
    ],
    defaultParams: { powerKw: 2.2, rpmNominal: 1450 },
    deviceKind: 'motor',
  },

  // === BORNES DE CONEXIÓN ===
  terminal_block: {
    type: 'terminal_block',
    category: 'terminals',
    name: 'Borne de Paso (X1)',
    defaultTagPrefix: 'X1',
    description: 'Borne pasante de regleta de conexiones',
    width: 30,
    height: 40,
    ports: [
      { name: '1', label: '1', relX: 15, relY: 0, function: 'passive' },
      { name: '2', label: '2', relX: 15, relY: 40, function: 'passive' },
    ],
    defaultParams: {},
    deviceKind: 'terminal_block',
  },
};

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  power: { label: 'Alimentación', icon: 'Zap' },
  protection: { label: 'Protección', icon: 'ShieldAlert' },
  switches: { label: 'Interruptores', icon: 'ToggleLeft' },
  pushbuttons: { label: 'Pulsadores', icon: 'CircleDot' },
  coils: { label: 'Bobinas y Relés', icon: 'Cpu' },
  contacts: { label: 'Contactos', icon: 'GitCommit' },
  signaling: { label: 'Señalización', icon: 'Lightbulb' },
  motors: { label: 'Motores', icon: 'Gauge' },
  terminals: { label: 'Bornes', icon: 'Waypoints' },
};
