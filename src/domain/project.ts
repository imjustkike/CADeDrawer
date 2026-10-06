import { Project, Sheet, ComponentInstance, ComponentType, TerminalRef, Wire, Junction, Point, Terminal } from './types';
import { COMPONENT_DEFINITIONS } from '../components-library/definitions';
import { snapToGrid, routeOrthogonalWire, getAbsoluteTerminalPosition } from './geometry';

export const CURRENT_SCHEMA_VERSION = 1;

export function createEmptyProject(name: string = 'Proyecto Nuevo'): Project {
  const sheetId = 'sheet_' + Math.random().toString(36).substring(2, 9);
  return {
    metadata: {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name,
      description: 'Esquema de automatismo eléctrico',
      author: 'Usuario',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
    devices: {},
    sheets: [createDefaultSheet(sheetId, 'Esquema Principal')],
    activeSheetId: sheetId,
  };
}

export function createDefaultSheet(id: string, name: string = 'Esquema 1'): Sheet {
  return {
    id,
    name,
    width: 2400,
    height: 1600,
    gridSize: 20,
    components: [],
    wires: [],
    junctions: [],
    annotations: [],
  };
}

export function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project));
}

export function createNewComponent(
  type: ComponentType,
  x: number,
  y: number,
  sheet: Sheet,
  customTag?: string
): ComponentInstance {
  const def = COMPONENT_DEFINITIONS[type];
  if (!def) {
    throw new Error(`Unknown component type: ${type}`);
  }

  const compId = 'cmp_' + Math.random().toString(36).substring(2, 9);

  // Generate unique tag if not provided
  let tag = customTag;
  if (!tag) {
    const existingTags = new Set(sheet.components.map((c) => c.tag));
    let counter = 1;
    tag = `${def.defaultTagPrefix}`;
    if (existingTags.has(tag)) {
      while (existingTags.has(`${def.defaultTagPrefix}${counter}`)) {
        counter++;
      }
      tag = `${def.defaultTagPrefix}${counter}`;
    }
  }

  // Device ID defaults to tag or device group
  const deviceId = `dev_${tag.toLowerCase()}`;

  const snappedX = snapToGrid(x, sheet.gridSize);
  const snappedY = snapToGrid(y, sheet.gridSize);

  const terminals: Terminal[] = def.ports.map((p) => ({
    id: `${compId}:${p.name}`,
    componentId: compId,
    name: p.name,
    label: p.label || p.name,
    relX: p.relX,
    relY: p.relY,
    function: p.function,
  }));

  return {
    id: compId,
    type,
    x: snappedX,
    y: snappedY,
    rotation: 0,
    deviceId,
    tag,
    terminals,
    params: { ...def.defaultParams },
  };
}

export function createWire(
  from: TerminalRef,
  to: TerminalRef,
  points?: Point[],
  color?: string
): Wire {
  const wireId = 'wire_' + Math.random().toString(36).substring(2, 9);
  const calculatedPoints = points || routeOrthogonalWire({ x: from.x, y: from.y }, { x: to.x, y: to.y });

  return {
    id: wireId,
    from,
    to,
    points: calculatedPoints,
    color,
  };
}

export function getTerminalAbsolutePoint(sheet: Sheet, terminalId: string): Point | null {
  const parts = terminalId.split(':');
  if (parts.length < 2) return null;
  const compId = parts[0];
  const portName = parts[1];

  const comp = sheet.components.find((c) => c.id === compId);
  if (!comp) return null;

  const term = comp.terminals.find((t) => t.name === portName);
  if (!term) return null;

  return getAbsoluteTerminalPosition(comp.x, comp.y, comp.rotation, term);
}
