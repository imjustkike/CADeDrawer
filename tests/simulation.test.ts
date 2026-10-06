import { describe, it, expect } from 'vitest';
import {
  createMarchaParoExample,
  createArranqueDirectoTermicoExample,
  createInversionGiroExample,
  createEstrellaTrianguloExample,
} from '../src/app/examples';
import { compileSheetToCircuit } from '../src/simulation/compiler';
import { solveCircuitStep } from '../src/simulation/solver';

describe('Motor de Simulación Eléctrica - Automatismos', () => {
  it('Marcha y Paro: pulsar S1 enclava KM1 y soltarlo mantiene la bobina encendida', () => {
    const project = createMarchaParoExample();
    const sheet = project.sheets[0];
    const circuit = compileSheetToCircuit(sheet);

    // Initial state: S1 open, S0 closed -> KM1 should be OFF
    let result = solveCircuitStep(circuit, sheet, {}, 10, 0);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(false);

    // Press S1 (Marcha)
    const s1 = sheet.components.find((c) => c.id === 's1')!;
    s1.params.isPressed = true;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 10);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_h1']?.pilotLit).toBe(true);

    // Release S1 -> KM1 must STAY energized via self-holding auxiliary contact KM1:13-14!
    s1.params.isPressed = false;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 20);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);

    // Press S0 (Paro) -> KM1 must DE-ENERGIZE
    const s0 = sheet.components.find((c) => c.id === 's0')!;
    s0.params.isPressed = true;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 30);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(false);
    expect(result.deviceStates['dev_h1']?.pilotLit).toBe(false);

    // Release S0 -> KM1 remains OFF
    s0.params.isPressed = false;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 40);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(false);
  });

  it('Relé Térmico: el disparo térmico interrumpe el mando y enciende la lámpara de fallo H2', () => {
    const project = createArranqueDirectoTermicoExample();
    const sheet = project.sheets[0];
    const circuit = compileSheetToCircuit(sheet);

    // Start motor
    const s1 = sheet.components.find((c) => c.id === 's1')!;
    s1.params.isPressed = true;
    let result = solveCircuitStep(circuit, sheet, {}, 10, 10);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_m1']?.motorState).toBe('RUNNING_CW');

    s1.params.isPressed = false;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 20);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);

    // Trip Thermal Relay F2!
    const f2Pow = sheet.components.find((c) => c.id === 'f2_pow')!;
    f2Pow.params.tripped = true;

    // Solver step
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 30);
    // Control contact 95-96 opens -> KM1 turns off -> Motor stops
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(false);
    expect(result.deviceStates['dev_m1']?.motorState).toBe('STOPPED');
    // Signaling contact 97-98 closes -> H2 turns ON!
    expect(result.deviceStates['dev_h2']?.pilotLit).toBe(true);
  });

  it('Inversión de Giro: los enclavamientos impiden la activación simultánea de KM1 y KM2', () => {
    const project = createInversionGiroExample();
    const sheet = project.sheets[0];
    const circuit = compileSheetToCircuit(sheet);

    // Activate Forward (S1)
    const s1 = sheet.components.find((c) => c.id === 's1_fwd')!;
    s1.params.isPressed = true;
    let result = solveCircuitStep(circuit, sheet, {}, 10, 10);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_km2']?.isEnergized).toBe(false);

    s1.params.isPressed = false;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 20);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);

    // While KM1 is running, press Reverse (S2) -> KM2 must NOT energize because KM1 NC is open!
    const s2 = sheet.components.find((c) => c.id === 's2_rev')!;
    s2.params.isPressed = true;
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 10, 30);
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_km2']?.isEnergized).toBe(false);
  });

  it('Estrella-Triángulo: el temporizador TON conmuta de Estrella (KM2) a Triángulo (KM3)', () => {
    const project = createEstrellaTrianguloExample();
    const sheet = project.sheets[0];
    const circuit = compileSheetToCircuit(sheet);

    // Press S1 (Start)
    const s1 = sheet.components.find((c) => c.id === 's1')!;
    s1.params.isPressed = true;
    let result = solveCircuitStep(circuit, sheet, {}, 10, 0);

    // Initially: Main KM1 ON, Timer KT1 ON, Star KM2 ON, Delta KM3 OFF
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_kt1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_km2']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_km3']?.isEnergized).toBe(false);

    s1.params.isPressed = false;

    // Advance time by 4000ms (timer target is 4000ms)
    result = solveCircuitStep(circuit, sheet, result.deviceStates, 4100, 4100);

    // After timer elapses: KT1 active -> Star KM2 OFF -> Delta KM3 ON!
    expect(result.deviceStates['dev_km1']?.isEnergized).toBe(true);
    expect(result.deviceStates['dev_km2']?.isEnergized).toBe(false);
    expect(result.deviceStates['dev_km3']?.isEnergized).toBe(true);
  });

  it('Determinismo: el resultado no depende del orden de los componentes en el array', () => {
    const project = createMarchaParoExample();
    const sheet1 = project.sheets[0];
    const sheet2 = JSON.parse(JSON.stringify(sheet1));
    // Reverse component order
    sheet2.components.reverse();

    const c1 = compileSheetToCircuit(sheet1);
    const c2 = compileSheetToCircuit(sheet2);

    const r1 = solveCircuitStep(c1, sheet1, {}, 10, 0);
    const r2 = solveCircuitStep(c2, sheet2, {}, 10, 0);

    expect(r1.deviceStates['dev_km1']?.isEnergized).toBe(r2.deviceStates['dev_km1']?.isEnergized);
  });
});
