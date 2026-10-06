import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  snapPointToGrid,
  rotatePoint,
  routeOrthogonalWire,
  distance,
  simplifyPolyline,
} from '../src/domain/geometry';
import { exportProjectToJson, parseProjectJson } from '../src/persistence/file';
import { createMarchaParoExample } from '../src/app/examples';

describe('Geometría y Enrutamiento Ortogonal', () => {
  it('Ajusta coordenadas a la cuadrícula discreta de 20px', () => {
    expect(snapToGrid(23, 20)).toBe(20);
    expect(snapToGrid(31, 20)).toBe(40);
    expect(snapPointToGrid({ x: 19, y: 44 }, 20)).toEqual({ x: 20, y: 40 });
  });

  it('Rotación vectorial en incrementos de 90°', () => {
    expect(rotatePoint(10, 20, 0)).toEqual({ x: 10, y: 20 });
    expect(rotatePoint(10, 20, 90)).toEqual({ x: -20, y: 10 });
    expect(rotatePoint(10, 20, 180)).toEqual({ x: -10, y: -20 });
    expect(rotatePoint(10, 20, 270)).toEqual({ x: 20, y: -10 });
  });

  it('Genera trayectorias ortogonales sin diagonales', () => {
    const route = routeOrthogonalWire({ x: 100, y: 100 }, { x: 200, y: 300 });
    expect(route.length).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i];
      const p2 = route[i + 1];
      const isOrthogonal = p1.x === p2.x || p1.y === p2.y;
      expect(isOrthogonal).toBe(true);
    }
  });
});

describe('Persistencia y Serialización .circuit', () => {
  it('Exporta y vuelve a parsear el proyecto conservando integridad', () => {
    const original = createMarchaParoExample();
    const jsonStr = exportProjectToJson(original);
    const parsed = parseProjectJson(jsonStr);

    expect(parsed.metadata.schemaVersion).toBe(1);
    expect(parsed.sheets.length).toBe(original.sheets.length);
    expect(parsed.sheets[0].components.length).toBe(original.sheets[0].components.length);
    expect(parsed.sheets[0].wires.length).toBe(original.sheets[0].wires.length);
  });
});
