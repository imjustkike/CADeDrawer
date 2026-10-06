import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sheet, ComponentInstance, Wire, Junction, Point, TerminalRef, NodePotential } from '../domain/types';
import { ComponentSymbol } from '../components-library/renderers';
import { snapToGrid, snapPointToGrid, routeOrthogonalWire, distance, getAbsoluteTerminalPosition } from '../domain/geometry';
import { COMPONENT_DEFINITIONS } from '../components-library/definitions';
import { createWire, createNewComponent, getTerminalAbsolutePoint } from '../domain/project';

export type EditorTool = 'select' | 'wire' | 'pan' | 'place';

interface CanvasProps {
  sheet: Sheet;
  tool: EditorTool;
  setTool: (tool: EditorTool) => void;
  selectedComponentIds: string[];
  selectedWireIds: string[];
  onSelectComponents: (ids: string[]) => void;
  onSelectWires: (ids: string[]) => void;
  onChangeSheet: (newSheet: Sheet, commitToHistory?: boolean) => void;
  isSimulating: boolean;
  terminalPotentials: Record<string, NodePotential>;
  wireEnergized: Record<string, boolean>;
  onToggleParam: (componentId: string, paramKey: string, value: any) => void;
  onMomentaryPress: (componentId: string, isDown: boolean) => void;
  pendingPlacementType: string | null;
  onFinishPlacement: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
}

export const Canvas: React.FC<CanvasProps> = ({
  sheet,
  tool,
  setTool,
  selectedComponentIds,
  selectedWireIds,
  onSelectComponents,
  onSelectWires,
  onChangeSheet,
  isSimulating,
  terminalPotentials,
  wireEnergized,
  onToggleParam,
  onMomentaryPress,
  pendingPlacementType,
  onFinishPlacement,
  zoom,
  setZoom,
  pan,
  setPan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Wiring state
  const [wiringStart, setWiringStart] = useState<TerminalRef | null>(null);
  const [wiringCursor, setWiringCursor] = useState<Point | null>(null);

  // Dragging components state
  const [isDraggingComponents, setIsDraggingComponents] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const [initialCompPositions, setInitialCompPositions] = useState<Map<string, Point>>(new Map());

  // Marquee selection box state
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);

  // Hovered target
  const [hoveredTerminal, setHoveredTerminal] = useState<TerminalRef | null>(null);

  // Convert client viewport coordinates to Canvas/SVG coordinates
  const clientToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Wheel zoom / trackpad pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom centered on cursor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 3.5);

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    } else {
      // Pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Pointer Down on background / canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click or Pan tool -> Pan
    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Left click only for actions

    const canvasPos = clientToCanvas(e.clientX, e.clientY);
    const snapped = snapPointToGrid(canvasPos, sheet.gridSize);

    // Place component on click if in placement mode
    if (pendingPlacementType && !isSimulating) {
      try {
        const newComp = createNewComponent(pendingPlacementType as any, snapped.x, snapped.y, sheet);
        const updatedSheet = {
          ...sheet,
          components: [...sheet.components, newComp],
        };
        onChangeSheet(updatedSheet, true);
        onSelectComponents([newComp.id]);
        onFinishPlacement();
      } catch (err) {
        console.error('Error placing component:', err);
      }
      return;
    }

    // Wiring tool: click on canvas can cancel or connect to junction
    if (tool === 'wire' && wiringStart && !isSimulating) {
      // If clicked on empty space, create a junction!
      const newJunction: Junction = {
        id: 'jnc_' + Math.random().toString(36).substring(2, 9),
        x: snapped.x,
        y: snapped.y,
        wireIds: [],
      };
      const jncRef: TerminalRef = {
        type: 'junction',
        id: newJunction.id,
        x: newJunction.x,
        y: newJunction.y,
      };

      const newWire = createWire(wiringStart, jncRef);
      const updatedSheet: Sheet = {
        ...sheet,
        junctions: [...sheet.junctions, newJunction],
        wires: [...sheet.wires, newWire],
      };
      onChangeSheet(updatedSheet, true);
      setWiringStart(jncRef);
      return;
    }

    // Selection marquee start
    if (!isSimulating && (tool === 'select' || tool === 'wire')) {
      if (!e.shiftKey) {
        onSelectComponents([]);
        onSelectWires([]);
      }
      setMarqueeStart(canvasPos);
      setMarqueeCurrent(canvasPos);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const canvasPos = clientToCanvas(e.clientX, e.clientY);

    // Update wiring preview
    if (wiringStart) {
      setWiringCursor(snapPointToGrid(canvasPos, sheet.gridSize));
    }

    // Update dragging components
    if (isDraggingComponents && !isSimulating) {
      const dx = snapToGrid(canvasPos.x - dragStartPos.x, sheet.gridSize);
      const dy = snapToGrid(canvasPos.y - dragStartPos.y, sheet.gridSize);

      if (dx !== 0 || dy !== 0) {
        const updatedComponents = sheet.components.map((comp) => {
          if (selectedComponentIds.includes(comp.id)) {
            const initPos = initialCompPositions.get(comp.id) || { x: comp.x, y: comp.y };
            return {
              ...comp,
              x: initPos.x + dx,
              y: initPos.y + dy,
            };
          }
          return comp;
        });

        // Update wire endpoint positions attached to moved components
        const updatedWires = sheet.wires.map((wire) => {
          let fromRef = { ...wire.from };
          let toRef = { ...wire.to };

          if (fromRef.type === 'terminal' && fromRef.componentId && selectedComponentIds.includes(fromRef.componentId)) {
            const comp = updatedComponents.find((c) => c.id === fromRef.componentId);
            const term = comp?.terminals.find((t) => t.name === fromRef.terminalName);
            if (comp && term) {
              const absP = getAbsoluteTerminalPosition(comp.x, comp.y, comp.rotation, term);
              fromRef.x = absP.x;
              fromRef.y = absP.y;
            }
          }

          if (toRef.type === 'terminal' && toRef.componentId && selectedComponentIds.includes(toRef.componentId)) {
            const comp = updatedComponents.find((c) => c.id === toRef.componentId);
            const term = comp?.terminals.find((t) => t.name === toRef.terminalName);
            if (comp && term) {
              const absP = getAbsoluteTerminalPosition(comp.x, comp.y, comp.rotation, term);
              toRef.x = absP.x;
              toRef.y = absP.y;
            }
          }

          return {
            ...wire,
            from: fromRef,
            to: toRef,
            points: routeOrthogonalWire({ x: fromRef.x, y: fromRef.y }, { x: toRef.x, y: toRef.y }),
          };
        });

        onChangeSheet(
          {
            ...sheet,
            components: updatedComponents,
            wires: updatedWires,
          },
          false
        );
      }
    }

    // Update marquee selection
    if (marqueeStart && !isSimulating) {
      setMarqueeCurrent(canvasPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingComponents) {
      setIsDraggingComponents(false);
      // Commit final drag movement to undo/redo history stack!
      onChangeSheet(sheet, true);
    }

    // Finish marquee selection
    if (marqueeStart && marqueeCurrent && !isSimulating) {
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);

      // If dragged more than 5px, select enclosed components
      if (maxX - minX > 5 || maxY - minY > 5) {
        const enclosedIds = sheet.components
          .filter((c) => {
            const def = COMPONENT_DEFINITIONS[c.type];
            const w = def ? def.width : 40;
            const h = def ? def.height : 60;
            return c.x >= minX && c.x + w <= maxX && c.y >= minY && c.y + h <= maxY;
          })
          .map((c) => c.id);

        onSelectComponents(enclosedIds);
      }
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }
  };

  // Terminal / Junction Click Handler for Wiring & Selection
  const handleTerminalClick = (ref: TerminalRef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSimulating) return;

    if (!wiringStart) {
      // Start wiring from this terminal
      setWiringStart(ref);
      setWiringCursor({ x: ref.x, y: ref.y });
    } else {
      // Complete wire connection!
      if (wiringStart.id === ref.id) {
        // Clicked same terminal -> cancel wiring
        setWiringStart(null);
        setWiringCursor(null);
        return;
      }

      const newWire = createWire(wiringStart, ref);
      const updatedSheet: Sheet = {
        ...sheet,
        wires: [...sheet.wires, newWire],
      };
      onChangeSheet(updatedSheet, true);
      setWiringStart(null);
      setWiringCursor(null);
    }
  };

  // Component click & drag start
  const handleComponentPointerDown = (comp: ComponentInstance, e: React.PointerEvent) => {
    if (isSimulating) return; // In simulation mode, let the component handle its own click/toggle
    e.stopPropagation();

    if (tool === 'wire') return; // In wire tool, let terminal clicks trigger

    // If shift key, toggle selection
    let newSelected = [...selectedComponentIds];
    if (e.shiftKey) {
      if (newSelected.includes(comp.id)) {
        newSelected = newSelected.filter((id) => id !== comp.id);
      } else {
        newSelected.push(comp.id);
      }
    } else if (!newSelected.includes(comp.id)) {
      newSelected = [comp.id];
    }
    onSelectComponents(newSelected);
    onSelectWires([]);

    // Prepare drag movement
    setIsDraggingComponents(true);
    const canvasPos = clientToCanvas(e.clientX, e.clientY);
    setDragStartPos(canvasPos);

    const positions = new Map<string, Point>();
    for (const c of sheet.components) {
      positions.set(c.id, { x: c.x, y: c.y });
    }
    setInitialCompPositions(positions);
  };

  // Handle Drag-and-drop from sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isSimulating) return;
    const compType = e.dataTransfer.getData('application/circuit-studio-component');
    if (!compType) return;

    const canvasPos = clientToCanvas(e.clientX, e.clientY);
    const snapped = snapPointToGrid(canvasPos, sheet.gridSize);

    try {
      const newComp = createNewComponent(compType as any, snapped.x, snapped.y, sheet);
      const updatedSheet = {
        ...sheet,
        components: [...sheet.components, newComp],
      };
      onChangeSheet(updatedSheet, true);
      onSelectComponents([newComp.id]);
    } catch (err) {
      console.error('Failed to drop component:', err);
    }
  };

  // Cancel wiring on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWiringStart(null);
        setWiringCursor(null);
        onFinishPlacement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinishPlacement]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#F5F6F8] overflow-hidden select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grab' : tool === 'wire' ? 'crosshair' : 'default' }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle technical drafting grid */}
          <pattern id="cad-grid-pattern" width={sheet.gridSize * zoom} height={sheet.gridSize * zoom} patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r={0.8 * Math.min(zoom, 1.2)} fill="#CBD5E1" />
          </pattern>
          <pattern id="cad-grid-major" width={sheet.gridSize * 5 * zoom} height={sheet.gridSize * 5 * zoom} patternUnits="userSpaceOnUse">
            <rect width={sheet.gridSize * 5 * zoom} height={sheet.gridSize * 5 * zoom} fill="url(#cad-grid-pattern)" />
            <path d={`M ${sheet.gridSize * 5 * zoom} 0 L 0 0 0 ${sheet.gridSize * 5 * zoom}`} fill="none" stroke="#E2E8F0" strokeWidth="1" />
          </pattern>

          {/* Motor spinning arrows */}
          <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#16A34A" />
          </marker>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563EB" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="#F8FAFC" />
        <rect
          x={pan.x % (sheet.gridSize * 5 * zoom)}
          y={pan.y % (sheet.gridSize * 5 * zoom)}
          width="100%"
          height="100%"
          fill="url(#cad-grid-major)"
        />

        {/* Main Canvas Viewport Transform Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Sheet Frame & Title Block */}
          <rect
            x="20"
            y="20"
            width={sheet.width - 40}
            height={sheet.height - 40}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="8,4"
          />

          {/* Text Annotations */}
          {sheet.annotations.map((ann) => (
            <text
              key={ann.id}
              x={ann.x}
              y={ann.y}
              fontSize={ann.fontSize || 12}
              fontWeight={ann.fontWeight || 'normal'}
              fill={ann.color || '#1E293B'}
              className="select-none font-sans"
            >
              {ann.text}
            </text>
          ))}

          {/* Wires Layer */}
          {sheet.wires.map((wire) => {
            const isSelected = selectedWireIds.includes(wire.id);
            const isEnergized = !!wireEnergized[wire.id];
            const stroke = isSelected
              ? '#2563EB'
              : isEnergized
              ? '#10B981'
              : wire.color || '#1E293B';
            const strokeW = isSelected ? 2.5 : isEnergized ? 2.5 : 1.5;

            const pathD = wire.points.reduce((acc, pt, idx) => {
              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '');

            return (
              <g
                key={wire.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSimulating) {
                    onSelectWires([wire.id]);
                    onSelectComponents([]);
                  }
                }}
                className="cursor-pointer"
              >
                {/* Thick invisible hit area for easy clicking */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" />
                {/* Visible wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Dynamic Wiring Preview Line */}
          {wiringStart && wiringCursor && (
            <path
              d={routeOrthogonalWire({ x: wiringStart.x, y: wiringStart.y }, wiringCursor).reduce(
                (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                ''
              )}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
          )}

          {/* Junctions Layer (Connection Dots) */}
          {sheet.junctions.map((jnc) => {
            return (
              <g
                key={jnc.id}
                onClick={(e) => {
                  handleTerminalClick(
                    {
                      type: 'junction',
                      id: jnc.id,
                      x: jnc.x,
                      y: jnc.y,
                    },
                    e
                  );
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={jnc.x}
                  cy={jnc.y}
                  r="3.5"
                  fill="#1E293B"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Components Layer */}
          {sheet.components.map((comp) => {
            const isSelected = selectedComponentIds.includes(comp.id);
            const def = COMPONENT_DEFINITIONS[comp.type];
            if (!def) return null;

            return (
              <g
                key={comp.id}
                onPointerDown={(e) => handleComponentPointerDown(comp, e)}
              >
                <ComponentSymbol
                  component={comp}
                  isSimulating={isSimulating}
                  isSelected={isSelected}
                  isHovered={false}
                  terminalPotentials={terminalPotentials}
                  onToggleParam={(paramKey, val) => onToggleParam(comp.id, paramKey, val)}
                  onMomentaryPress={(isDown) => onMomentaryPress(comp.id, isDown)}
                />

                {/* Terminal Ports Snap Targets */}
                {def.ports.map((p) => {
                  const absPos = getAbsoluteTerminalPosition(comp.x, comp.y, comp.rotation, {
                    id: `${comp.id}:${p.name}`,
                    componentId: comp.id,
                    name: p.name,
                    relX: p.relX,
                    relY: p.relY,
                    function: p.function,
                  });

                  return (
                    <circle
                      key={p.name}
                      cx={absPos.x}
                      cy={absPos.y}
                      r="7"
                      fill="transparent"
                      className="cursor-crosshair"
                      onClick={(e) =>
                        handleTerminalClick(
                          {
                            type: 'terminal',
                            id: `${comp.id}:${p.name}`,
                            componentId: comp.id,
                            terminalName: p.name,
                            x: absPos.x,
                            y: absPos.y,
                          },
                          e
                        )
                      }
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Marquee Selection Rectangle */}
          {marqueeStart && marqueeCurrent && (
            <rect
              x={Math.min(marqueeStart.x, marqueeCurrent.x)}
              y={Math.min(marqueeStart.y, marqueeCurrent.y)}
              width={Math.abs(marqueeCurrent.x - marqueeStart.x)}
              height={Math.abs(marqueeCurrent.y - marqueeStart.y)}
              fill="rgba(37, 99, 235, 0.08)"
              stroke="#2563EB"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}
        </g>
      </svg>
    </div>
  );
};
