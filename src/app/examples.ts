import { Project, Sheet, ComponentInstance, Wire, Junction, Point, TerminalRef } from '../domain/types';
import { COMPONENT_DEFINITIONS } from '../components-library/definitions';
import { createWire, createDefaultSheet } from '../domain/project';

function makeComp(
  id: string,
  type: keyof typeof COMPONENT_DEFINITIONS,
  x: number,
  y: number,
  tag: string,
  deviceId: string,
  params: Record<string, any> = {},
  rotation: 0 | 90 | 180 | 270 = 0
): ComponentInstance {
  const def = COMPONENT_DEFINITIONS[type];
  const terminals = def.ports.map((p) => ({
    id: `${id}:${p.name}`,
    componentId: id,
    name: p.name,
    label: p.label || p.name,
    relX: p.relX,
    relY: p.relY,
    function: p.function,
  }));

  return {
    id,
    type,
    x,
    y,
    rotation,
    tag,
    deviceId,
    terminals,
    params: { ...def.defaultParams, ...params },
  };
}

function makeTerminalRef(comp: ComponentInstance, portName: string): TerminalRef {
  const port = comp.terminals.find((t) => t.name === portName);
  const relX = port ? port.relX : 20;
  const relY = port ? port.relY : 0;
  return {
    type: 'terminal',
    id: `${comp.id}:${portName}`,
    componentId: comp.id,
    terminalName: portName,
    x: comp.x + relX,
    y: comp.y + relY,
  };
}

function makeJunctionRef(jnc: Junction): TerminalRef {
  return {
    type: 'junction',
    id: jnc.id,
    x: jnc.x,
    y: jnc.y,
  };
}

/**
 * 1. MARCHA Y PARO CON AUTO-MANTENIMIENTO (Start/Stop with self-holding contact)
 */
export function createMarchaParoExample(): Project {
  const sheet = createDefaultSheet('sheet_mp', 'Mando Marcha-Paro');

  // Components
  const p24v = makeComp('p24', 'power_24v', 180, 80, '+24V', 'dev_p24');
  const p0v = makeComp('p0v', 'power_0v', 180, 520, '0V', 'dev_p0v');
  const s0 = makeComp('s0', 'pushbutton_nc', 180, 140, 'S0 (Paro)', 'dev_s0');
  const s1 = makeComp('s1', 'pushbutton_no', 180, 240, 'S1 (Marcha)', 'dev_s1');
  const km1_aux = makeComp('km1_aux', 'contact_aux_no', 280, 240, 'KM1 (13-14)', 'dev_km1');
  const km1_coil = makeComp('km1_coil', 'coil_contactor', 180, 360, 'KM1', 'dev_km1');
  const h1_pilot = makeComp('h1_pilot', 'pilot_light', 320, 360, 'H1 (Marcha)', 'dev_h1', { color: 'green' });

  // Junctions
  const j1: Junction = { id: 'jnc_1', x: 200, y: 220, wireIds: [] };
  const j2: Junction = { id: 'jnc_2', x: 200, y: 320, wireIds: [] };
  const j3: Junction = { id: 'jnc_3', x: 200, y: 440, wireIds: [] };

  sheet.components = [p24v, p0v, s0, s1, km1_aux, km1_coil, h1_pilot];
  sheet.junctions = [j1, j2, j3];

  // Wires
  sheet.wires = [
    // 24V to S0:11
    createWire(makeTerminalRef(p24v, 'L+'), makeTerminalRef(s0, '11'), [
      { x: 200, y: 110 },
      { x: 200, y: 140 },
    ]),
    // S0:12 to Junction 1
    createWire(makeTerminalRef(s0, '12'), makeJunctionRef(j1), [
      { x: 200, y: 200 },
      { x: 200, y: 220 },
    ]),
    // J1 to S1:13
    createWire(makeJunctionRef(j1), makeTerminalRef(s1, '13'), [
      { x: 200, y: 220 },
      { x: 200, y: 240 },
    ]),
    // J1 to KM1_aux:13
    createWire(makeJunctionRef(j1), makeTerminalRef(km1_aux, '13'), [
      { x: 200, y: 220 },
      { x: 300, y: 220 },
      { x: 300, y: 240 },
    ]),
    // S1:14 to Junction 2
    createWire(makeTerminalRef(s1, '14'), makeJunctionRef(j2), [
      { x: 200, y: 300 },
      { x: 200, y: 320 },
    ]),
    // KM1_aux:14 to Junction 2
    createWire(makeTerminalRef(km1_aux, '14'), makeJunctionRef(j2), [
      { x: 300, y: 300 },
      { x: 300, y: 320 },
      { x: 200, y: 320 },
    ]),
    // J2 to KM1_coil:A1
    createWire(makeJunctionRef(j2), makeTerminalRef(km1_coil, 'A1'), [
      { x: 200, y: 320 },
      { x: 200, y: 360 },
    ]),
    // J2 to H1_pilot:X1
    createWire(makeJunctionRef(j2), makeTerminalRef(h1_pilot, 'X1'), [
      { x: 200, y: 320 },
      { x: 340, y: 320 },
      { x: 340, y: 360 },
    ]),
    // KM1_coil:A2 to Junction 3
    createWire(makeTerminalRef(km1_coil, 'A2'), makeJunctionRef(j3), [
      { x: 200, y: 420 },
      { x: 200, y: 440 },
    ]),
    // H1_pilot:X2 to Junction 3
    createWire(makeTerminalRef(h1_pilot, 'X2'), makeJunctionRef(j3), [
      { x: 340, y: 420 },
      { x: 340, y: 440 },
      { x: 200, y: 440 },
    ]),
    // J3 to 0V:M
    createWire(makeJunctionRef(j3), makeTerminalRef(p0v, 'M'), [
      { x: 200, y: 440 },
      { x: 200, y: 520 },
    ]),
  ];

  sheet.annotations = [
    {
      id: 'ann_1',
      x: 140,
      y: 40,
      text: 'CIRCUITO 1: Marcha y Paro con Auto-mantenimiento',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    {
      id: 'ann_2',
      x: 140,
      y: 60,
      text: 'Pulsa S1 para enclavar KM1. Pulsa S0 para desconectar.',
      fontSize: 11,
      color: '#64748B',
    },
  ];

  return {
    metadata: {
      id: 'example_marcha_paro',
      name: '1. Marcha y Paro con Auto-mantenimiento',
      description: 'Estación de arranque y parada con realimentación auxiliar y piloto de marcha.',
      author: 'Circuit Studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    devices: {},
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}

/**
 * 2. ARRANQUE DIRECTO CON DISPARO TÉRMICO (Direct Start with Thermal Overload Relay)
 */
export function createArranqueDirectoTermicoExample(): Project {
  const sheet = createDefaultSheet('sheet_adt', 'Potencia y Control con Térmico');

  // Power section
  const red3p = makeComp('red3p', 'power_3p_pe', 100, 60, 'RED 400V', 'dev_red');
  const q1 = makeComp('q1', 'disconnector_3p', 110, 140, 'Q1 (Seccionador)', 'dev_q1');
  const km1_pow = makeComp('km1_pow', 'contact_power_3p', 110, 240, 'KM1 (Potencia)', 'dev_km1');
  const f2_pow = makeComp('f2_pow', 'thermal_relay_power', 110, 340, 'F2 (Relé Térmico)', 'dev_f2');
  const m1 = makeComp('m1', 'motor_3p', 100, 440, 'M1 (Motor 3~)', 'dev_m1');

  // Control section
  const p24 = makeComp('p24', 'power_24v', 360, 60, '+24V', 'dev_p24');
  const f2_nc = makeComp('f2_nc', 'thermal_relay_aux_nc', 360, 120, 'F2 (95-96)', 'dev_f2');
  const s_emerg = makeComp('s_emerg', 'emergency_stop_nc', 360, 200, 'S_EMERG', 'dev_emerg');
  const s0 = makeComp('s0', 'pushbutton_nc', 360, 280, 'S0 (Paro)', 'dev_s0');
  const s1 = makeComp('s1', 'pushbutton_no', 360, 360, 'S1 (Marcha)', 'dev_s1');
  const km1_aux = makeComp('km1_aux', 'contact_aux_no', 460, 360, 'KM1 (13-14)', 'dev_km1');
  const km1_coil = makeComp('km1_coil', 'coil_contactor', 360, 460, 'KM1', 'dev_km1');
  const h1_run = makeComp('h1_run', 'pilot_light', 480, 460, 'H1 (Marcha)', 'dev_h1', { color: 'green' });

  // Thermal trip signaling branch
  const f2_no = makeComp('f2_no', 'thermal_relay_aux_no', 580, 120, 'F2 (97-98)', 'dev_f2');
  const h2_trip = makeComp('h2_trip', 'pilot_light', 580, 460, 'H2 (Fallo Térmico)', 'dev_h2', { color: 'red' });

  const p0v = makeComp('p0v', 'power_0v', 360, 580, '0V', 'dev_p0v');

  // Junctions
  const j_ctrl_top: Junction = { id: 'j_ctrl_top', x: 380, y: 100, wireIds: [] };
  const j_s1_top: Junction = { id: 'j_s1_top', x: 380, y: 340, wireIds: [] };
  const j_s1_bot: Junction = { id: 'j_s1_bot', x: 380, y: 430, wireIds: [] };
  const j_ret_bot: Junction = { id: 'j_ret_bot', x: 380, y: 540, wireIds: [] };

  sheet.components = [
    red3p, q1, km1_pow, f2_pow, m1,
    p24, f2_nc, s_emerg, s0, s1, km1_aux, km1_coil, h1_run, f2_no, h2_trip, p0v
  ];
  sheet.junctions = [j_ctrl_top, j_s1_top, j_s1_bot, j_ret_bot];

  // Wires
  sheet.wires = [
    // Power: RED -> Q1
    createWire(makeTerminalRef(red3p, 'L1'), makeTerminalRef(q1, '1'), [{ x: 110, y: 90 }, { x: 120, y: 140 }]),
    createWire(makeTerminalRef(red3p, 'L2'), makeTerminalRef(q1, '3'), [{ x: 130, y: 90 }, { x: 140, y: 140 }]),
    createWire(makeTerminalRef(red3p, 'L3'), makeTerminalRef(q1, '5'), [{ x: 150, y: 90 }, { x: 160, y: 140 }]),
    // Q1 -> KM1
    createWire(makeTerminalRef(q1, '2'), makeTerminalRef(km1_pow, '1'), [{ x: 120, y: 200 }, { x: 120, y: 240 }]),
    createWire(makeTerminalRef(q1, '4'), makeTerminalRef(km1_pow, '3'), [{ x: 140, y: 200 }, { x: 140, y: 240 }]),
    createWire(makeTerminalRef(q1, '6'), makeTerminalRef(km1_pow, '5'), [{ x: 160, y: 200 }, { x: 160, y: 240 }]),
    // KM1 -> F2
    createWire(makeTerminalRef(km1_pow, '2'), makeTerminalRef(f2_pow, '1'), [{ x: 120, y: 300 }, { x: 120, y: 340 }]),
    createWire(makeTerminalRef(km1_pow, '4'), makeTerminalRef(f2_pow, '3'), [{ x: 140, y: 300 }, { x: 140, y: 340 }]),
    createWire(makeTerminalRef(km1_pow, '6'), makeTerminalRef(f2_pow, '5'), [{ x: 160, y: 300 }, { x: 160, y: 340 }]),
    // F2 -> M1
    createWire(makeTerminalRef(f2_pow, '2'), makeTerminalRef(m1, 'U1'), [{ x: 120, y: 400 }, { x: 120, y: 440 }]),
    createWire(makeTerminalRef(f2_pow, '4'), makeTerminalRef(m1, 'V1'), [{ x: 140, y: 400 }, { x: 140, y: 440 }]),
    createWire(makeTerminalRef(f2_pow, '6'), makeTerminalRef(m1, 'W1'), [{ x: 160, y: 400 }, { x: 160, y: 440 }]),

    // Control: +24V -> J_ctrl_top
    createWire(makeTerminalRef(p24, 'L+'), makeJunctionRef(j_ctrl_top), [{ x: 380, y: 90 }, { x: 380, y: 100 }]),
    // J_ctrl_top -> F2_NC:95
    createWire(makeJunctionRef(j_ctrl_top), makeTerminalRef(f2_nc, '95'), [{ x: 380, y: 100 }, { x: 380, y: 120 }]),
    // J_ctrl_top -> F2_NO:97
    createWire(makeJunctionRef(j_ctrl_top), makeTerminalRef(f2_no, '97'), [{ x: 380, y: 100 }, { x: 600, y: 100 }, { x: 600, y: 120 }]),
    // F2_NC:96 -> S_emerg:11
    createWire(makeTerminalRef(f2_nc, '96'), makeTerminalRef(s_emerg, '11'), [{ x: 380, y: 180 }, { x: 380, y: 200 }]),
    // S_emerg:12 -> S0:11
    createWire(makeTerminalRef(s_emerg, '12'), makeTerminalRef(s0, '11'), [{ x: 380, y: 260 }, { x: 380, y: 280 }]),
    // S0:12 -> J_s1_top
    createWire(makeTerminalRef(s0, '12'), makeJunctionRef(j_s1_top), [{ x: 380, y: 340 }, { x: 380, y: 340 }]),
    // J_s1_top -> S1:13 & KM1_aux:13
    createWire(makeJunctionRef(j_s1_top), makeTerminalRef(s1, '13'), [{ x: 380, y: 340 }, { x: 380, y: 360 }]),
    createWire(makeJunctionRef(j_s1_top), makeTerminalRef(km1_aux, '13'), [{ x: 380, y: 340 }, { x: 480, y: 340 }, { x: 480, y: 360 }]),
    // S1:14 & KM1_aux:14 -> J_s1_bot
    createWire(makeTerminalRef(s1, '14'), makeJunctionRef(j_s1_bot), [{ x: 380, y: 420 }, { x: 380, y: 430 }]),
    createWire(makeTerminalRef(km1_aux, '14'), makeJunctionRef(j_s1_bot), [{ x: 480, y: 420 }, { x: 480, y: 430 }, { x: 380, y: 430 }]),
    // J_s1_bot -> KM1:A1 & H1:X1
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(km1_coil, 'A1'), [{ x: 380, y: 430 }, { x: 380, y: 460 }]),
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(h1_run, 'X1'), [{ x: 380, y: 430 }, { x: 500, y: 430 }, { x: 500, y: 460 }]),
    // F2_NO:98 -> H2_trip:X1
    createWire(makeTerminalRef(f2_no, '98'), makeTerminalRef(h2_trip, 'X1'), [{ x: 600, y: 180 }, { x: 600, y: 460 }]),
    // Return: KM1:A2, H1:X2, H2:X2 -> J_ret_bot -> 0V
    createWire(makeTerminalRef(km1_coil, 'A2'), makeJunctionRef(j_ret_bot), [{ x: 380, y: 520 }, { x: 380, y: 540 }]),
    createWire(makeTerminalRef(h1_run, 'X2'), makeJunctionRef(j_ret_bot), [{ x: 500, y: 520 }, { x: 500, y: 540 }, { x: 380, y: 540 }]),
    createWire(makeTerminalRef(h2_trip, 'X2'), makeJunctionRef(j_ret_bot), [{ x: 600, y: 520 }, { x: 600, y: 540 }, { x: 380, y: 540 }]),
    createWire(makeJunctionRef(j_ret_bot), makeTerminalRef(p0v, 'M'), [{ x: 380, y: 540 }, { x: 380, y: 580 }]),
  ];

  sheet.annotations = [
    {
      id: 'ann_adt1',
      x: 80,
      y: 30,
      text: 'CIRCUITO 2: Arranque Directo con Relé Térmico',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    {
      id: 'ann_adt2',
      x: 80,
      y: 50,
      text: 'Esquema de Potencia (izq) y Mando 24V (dcha). Haz clic en F2 para simular disparo térmico.',
      fontSize: 11,
      color: '#64748B',
    },
  ];

  return {
    metadata: {
      id: 'example_arranque_directo_termico',
      name: '2. Arranque Directo con Disparo Térmico',
      description: 'Arranque directo de motor trifásico con protección por relé térmico y lámpara de fallo.',
      author: 'Circuit Studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    devices: {},
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}

/**
 * 3. INVERSIÓN DE GIRO CON ENCLAVAMIENTO (Reversing starter with cross interlocking)
 */
export function createInversionGiroExample(): Project {
  const sheet = createDefaultSheet('sheet_inv', 'Inversión de Giro');

  const p24 = makeComp('p24', 'power_24v', 260, 60, '+24V', 'dev_p24');
  const s0 = makeComp('s0', 'pushbutton_nc', 260, 120, 'S0 (Paro General)', 'dev_s0');

  // Forward branch (KM1 - Giro Derecha)
  const s1_fwd = makeComp('s1_fwd', 'pushbutton_no', 180, 200, 'S1 (Giro Der)', 'dev_s1');
  const km1_aux = makeComp('km1_aux', 'contact_aux_no', 100, 200, 'KM1 (13-14)', 'dev_km1');
  const km2_nc_lock = makeComp('km2_nc_lock', 'contact_aux_nc', 180, 280, 'KM2 (21-22)', 'dev_km2');
  const km1_coil = makeComp('km1_coil', 'coil_contactor', 180, 360, 'KM1 (Derecha)', 'dev_km1');

  // Reverse branch (KM2 - Giro Izquierda)
  const s2_rev = makeComp('s2_rev', 'pushbutton_no', 340, 200, 'S2 (Giro Izq)', 'dev_s2');
  const km2_aux = makeComp('km2_aux', 'contact_aux_no', 420, 200, 'KM2 (13-14)', 'dev_km2');
  const km1_nc_lock = makeComp('km1_nc_lock', 'contact_aux_nc', 340, 280, 'KM1 (21-22)', 'dev_km1');
  const km2_coil = makeComp('km2_coil', 'coil_contactor', 340, 360, 'KM2 (Izquierda)', 'dev_km2');

  const p0v = makeComp('p0v', 'power_0v', 260, 480, '0V', 'dev_p0v');

  // Junctions
  const j_top: Junction = { id: 'j_top', x: 280, y: 190, wireIds: [] };
  const j_fwd_top: Junction = { id: 'j_fwd_top', x: 200, y: 195, wireIds: [] };
  const j_fwd_bot: Junction = { id: 'j_fwd_bot', x: 200, y: 265, wireIds: [] };
  const j_rev_top: Junction = { id: 'j_rev_top', x: 360, y: 195, wireIds: [] };
  const j_rev_bot: Junction = { id: 'j_rev_bot', x: 360, y: 265, wireIds: [] };
  const j_bot: Junction = { id: 'j_bot', x: 280, y: 440, wireIds: [] };

  sheet.components = [p24, s0, s1_fwd, km1_aux, km2_nc_lock, km1_coil, s2_rev, km2_aux, km1_nc_lock, km2_coil, p0v];
  sheet.junctions = [j_top, j_fwd_top, j_fwd_bot, j_rev_top, j_rev_bot, j_bot];

  sheet.wires = [
    createWire(makeTerminalRef(p24, 'L+'), makeTerminalRef(s0, '11'), [{ x: 280, y: 90 }, { x: 280, y: 120 }]),
    createWire(makeTerminalRef(s0, '12'), makeJunctionRef(j_top), [{ x: 280, y: 180 }, { x: 280, y: 190 }]),
    // Split to fwd and rev
    createWire(makeJunctionRef(j_top), makeJunctionRef(j_fwd_top), [{ x: 280, y: 190 }, { x: 200, y: 190 }, { x: 200, y: 195 }]),
    createWire(makeJunctionRef(j_top), makeJunctionRef(j_rev_top), [{ x: 280, y: 190 }, { x: 360, y: 190 }, { x: 360, y: 195 }]),
    // FWD branch
    createWire(makeJunctionRef(j_fwd_top), makeTerminalRef(s1_fwd, '13'), [{ x: 200, y: 195 }, { x: 200, y: 200 }]),
    createWire(makeJunctionRef(j_fwd_top), makeTerminalRef(km1_aux, '13'), [{ x: 200, y: 195 }, { x: 120, y: 195 }, { x: 120, y: 200 }]),
    createWire(makeTerminalRef(s1_fwd, '14'), makeJunctionRef(j_fwd_bot), [{ x: 200, y: 260 }, { x: 200, y: 265 }]),
    createWire(makeTerminalRef(km1_aux, '14'), makeJunctionRef(j_fwd_bot), [{ x: 120, y: 260 }, { x: 120, y: 265 }, { x: 200, y: 265 }]),
    createWire(makeJunctionRef(j_fwd_bot), makeTerminalRef(km2_nc_lock, '11'), [{ x: 200, y: 265 }, { x: 200, y: 280 }]),
    createWire(makeTerminalRef(km2_nc_lock, '12'), makeTerminalRef(km1_coil, 'A1'), [{ x: 200, y: 340 }, { x: 200, y: 360 }]),
    // REV branch
    createWire(makeJunctionRef(j_rev_top), makeTerminalRef(s2_rev, '13'), [{ x: 360, y: 195 }, { x: 360, y: 200 }]),
    createWire(makeJunctionRef(j_rev_top), makeTerminalRef(km2_aux, '13'), [{ x: 360, y: 195 }, { x: 440, y: 195 }, { x: 440, y: 200 }]),
    createWire(makeTerminalRef(s2_rev, '14'), makeJunctionRef(j_rev_bot), [{ x: 360, y: 260 }, { x: 360, y: 265 }]),
    createWire(makeTerminalRef(km2_aux, '14'), makeJunctionRef(j_rev_bot), [{ x: 440, y: 260 }, { x: 440, y: 265 }, { x: 360, y: 265 }]),
    createWire(makeJunctionRef(j_rev_bot), makeTerminalRef(km1_nc_lock, '11'), [{ x: 360, y: 265 }, { x: 360, y: 280 }]),
    createWire(makeTerminalRef(km1_nc_lock, '12'), makeTerminalRef(km2_coil, 'A1'), [{ x: 360, y: 340 }, { x: 360, y: 360 }]),
    // Returns
    createWire(makeTerminalRef(km1_coil, 'A2'), makeJunctionRef(j_bot), [{ x: 200, y: 420 }, { x: 200, y: 440 }, { x: 280, y: 440 }]),
    createWire(makeTerminalRef(km2_coil, 'A2'), makeJunctionRef(j_bot), [{ x: 360, y: 420 }, { x: 360, y: 440 }, { x: 280, y: 440 }]),
    createWire(makeJunctionRef(j_bot), makeTerminalRef(p0v, 'M'), [{ x: 280, y: 440 }, { x: 280, y: 480 }]),
  ];

  sheet.annotations = [
    {
      id: 'ann_inv1',
      x: 100,
      y: 30,
      text: 'CIRCUITO 3: Inversión de Giro con Enclavamiento Cruzado',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    {
      id: 'ann_inv2',
      x: 100,
      y: 50,
      text: 'Los contactos NC de KM2 y KM1 impiden que ambos contactores entren a la vez.',
      fontSize: 11,
      color: '#64748B',
    },
  ];

  return {
    metadata: {
      id: 'example_inversion_giro',
      name: '3. Inversión de Giro con Enclavamientos',
      description: 'Mando para inversión de sentido de giro con seguridad por enclavamiento eléctrico cruzado.',
      author: 'Circuit Studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    devices: {},
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}

/**
 * 4. ARRANQUE ESTRELLA-TRIÁNGULO CON TEMPORIZADOR TON (Star-Delta Starter)
 */
export function createEstrellaTrianguloExample(): Project {
  const sheet = createDefaultSheet('sheet_yd', 'Estrella-Triángulo');

  const p24 = makeComp('p24', 'power_24v', 260, 50, '+24V', 'dev_p24');
  const s0 = makeComp('s0', 'pushbutton_nc', 260, 100, 'S0 (Paro)', 'dev_s0');
  const s1 = makeComp('s1', 'pushbutton_no', 260, 180, 'S1 (Marcha)', 'dev_s1');
  const km1_aux = makeComp('km1_aux', 'contact_aux_no', 160, 180, 'KM1 (13-14)', 'dev_km1');

  // Coils: KM1 (Principal), KT1 (Temporizador TON), KM2 (Estrella), KM3 (Triángulo)
  const km1_coil = makeComp('km1_coil', 'coil_contactor', 160, 360, 'KM1 (Principal)', 'dev_km1');
  const kt1_coil = makeComp('kt1_coil', 'coil_timer_ton', 260, 360, 'KT1 (Temporizador)', 'dev_kt1', { delayMs: 4000 });

  // Star branch (KM2 - Estrella, with KT1 NC timed contact and KM3 NC lock)
  const kt1_nc = makeComp('kt1_nc', 'contact_timed_nc', 360, 260, 'KT1 (55-56 NC)', 'dev_kt1');
  const km3_nc_lock = makeComp('km3_nc_lock', 'contact_aux_nc', 360, 320, 'KM3 (NC Encl.)', 'dev_km3');
  const km2_coil = makeComp('km2_coil', 'coil_contactor', 360, 400, 'KM2 (Estrella)', 'dev_km2');

  // Delta branch (KM3 - Triángulo, with KT1 NO timed contact and KM2 NC lock)
  const kt1_no = makeComp('kt1_no', 'contact_timed_no', 480, 260, 'KT1 (67-68 NA)', 'dev_kt1');
  const km2_nc_lock = makeComp('km2_nc_lock', 'contact_aux_nc', 480, 320, 'KM2 (NC Encl.)', 'dev_km2');
  const km3_coil = makeComp('km3_coil', 'coil_contactor', 480, 400, 'KM3 (Triángulo)', 'dev_km3');

  const p0v = makeComp('p0v', 'power_0v', 320, 520, '0V', 'dev_p0v');

  // Junctions
  const j_s1_top: Junction = { id: 'j_s1_top', x: 280, y: 160, wireIds: [] };
  const j_s1_bot: Junction = { id: 'j_s1_bot', x: 280, y: 240, wireIds: [] };
  const j_bot_ret: Junction = { id: 'j_bot_ret', x: 340, y: 480, wireIds: [] };

  sheet.components = [
    p24, s0, s1, km1_aux, km1_coil, kt1_coil,
    kt1_nc, km3_nc_lock, km2_coil,
    kt1_no, km2_nc_lock, km3_coil,
    p0v
  ];
  sheet.junctions = [j_s1_top, j_s1_bot, j_bot_ret];

  sheet.wires = [
    createWire(makeTerminalRef(p24, 'L+'), makeTerminalRef(s0, '11'), [{ x: 280, y: 80 }, { x: 280, y: 100 }]),
    createWire(makeTerminalRef(s0, '12'), makeJunctionRef(j_s1_top), [{ x: 280, y: 160 }, { x: 280, y: 160 }]),
    createWire(makeJunctionRef(j_s1_top), makeTerminalRef(s1, '13'), [{ x: 280, y: 160 }, { x: 280, y: 180 }]),
    createWire(makeJunctionRef(j_s1_top), makeTerminalRef(km1_aux, '13'), [{ x: 280, y: 160 }, { x: 180, y: 160 }, { x: 180, y: 180 }]),
    createWire(makeTerminalRef(s1, '14'), makeJunctionRef(j_s1_bot), [{ x: 280, y: 240 }, { x: 280, y: 240 }]),
    createWire(makeTerminalRef(km1_aux, '14'), makeJunctionRef(j_s1_bot), [{ x: 180, y: 240 }, { x: 180, y: 240 }, { x: 280, y: 240 }]),
    // Feeder from j_s1_bot to KM1, KT1, and branches
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(km1_coil, 'A1'), [{ x: 280, y: 240 }, { x: 180, y: 240 }, { x: 180, y: 360 }]),
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(kt1_coil, 'A1'), [{ x: 280, y: 240 }, { x: 285, y: 240 }, { x: 285, y: 360 }]),
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(kt1_nc, '55'), [{ x: 280, y: 240 }, { x: 380, y: 240 }, { x: 380, y: 260 }]),
    createWire(makeJunctionRef(j_s1_bot), makeTerminalRef(kt1_no, '67'), [{ x: 280, y: 240 }, { x: 500, y: 240 }, { x: 500, y: 260 }]),
    // Star path: KT1_NC:56 -> KM3_NC:11 -> KM3_NC:12 -> KM2:A1
    createWire(makeTerminalRef(kt1_nc, '56'), makeTerminalRef(km3_nc_lock, '11'), [{ x: 380, y: 320 }, { x: 380, y: 320 }]),
    createWire(makeTerminalRef(km3_nc_lock, '12'), makeTerminalRef(km2_coil, 'A1'), [{ x: 380, y: 380 }, { x: 380, y: 400 }]),
    // Delta path: KT1_NO:68 -> KM2_NC:11 -> KM2_NC:12 -> KM3:A1
    createWire(makeTerminalRef(kt1_no, '68'), makeTerminalRef(km2_nc_lock, '11'), [{ x: 500, y: 320 }, { x: 500, y: 320 }]),
    createWire(makeTerminalRef(km2_nc_lock, '12'), makeTerminalRef(km3_coil, 'A1'), [{ x: 500, y: 380 }, { x: 500, y: 400 }]),
    // Common Return
    createWire(makeTerminalRef(km1_coil, 'A2'), makeJunctionRef(j_bot_ret), [{ x: 180, y: 420 }, { x: 180, y: 480 }, { x: 340, y: 480 }]),
    createWire(makeTerminalRef(kt1_coil, 'A2'), makeJunctionRef(j_bot_ret), [{ x: 285, y: 420 }, { x: 285, y: 480 }, { x: 340, y: 480 }]),
    createWire(makeTerminalRef(km2_coil, 'A2'), makeJunctionRef(j_bot_ret), [{ x: 380, y: 460 }, { x: 380, y: 480 }, { x: 340, y: 480 }]),
    createWire(makeTerminalRef(km3_coil, 'A2'), makeJunctionRef(j_bot_ret), [{ x: 500, y: 460 }, { x: 500, y: 480 }, { x: 340, y: 480 }]),
    createWire(makeJunctionRef(j_bot_ret), makeTerminalRef(p0v, 'M'), [{ x: 340, y: 480 }, { x: 340, y: 520 }]),
  ];

  sheet.annotations = [
    {
      id: 'ann_yd1',
      x: 100,
      y: 20,
      text: 'CIRCUITO 4: Arranque Estrella-Triángulo (Y-Δ) Temporizado',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    {
      id: 'ann_yd2',
      x: 100,
      y: 40,
      text: 'Arranca en Estrella (KM1+KM2). A los 4.0s KT1 conmuta automáticamente a Triángulo (KM1+KM3).',
      fontSize: 11,
      color: '#64748B',
    },
  ];

  return {
    metadata: {
      id: 'example_estrella_triangulo',
      name: '4. Arranque Estrella-Triángulo Temporizado',
      description: 'Automatismo Y-Δ con temporizador a la conexión (TON 4s) y enclavamiento mutuo.',
      author: 'Circuit Studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    devices: {},
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}

export const EXAMPLE_CIRCUITS = [
  { id: 'marcha_paro', name: '1. Marcha y Paro con Auto-mantenimiento', factory: createMarchaParoExample },
  { id: 'arranque_directo', name: '2. Arranque Directo con Relé Térmico', factory: createArranqueDirectoTermicoExample },
  { id: 'inversion_giro', name: '3. Inversión de Giro con Enclavamientos', factory: createInversionGiroExample },
  { id: 'estrella_triangulo', name: '4. Arranque Estrella-Triángulo Temporizado', factory: createEstrellaTrianguloExample },
];
