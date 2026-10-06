import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Project, Sheet, ComponentInstance, ComponentType, Point } from './domain/types';
import { createMarchaParoExample, EXAMPLE_CIRCUITS } from './app/examples';
import { createEmptyProject, cloneProject, createNewComponent, getTerminalAbsolutePoint } from './domain/project';
import { HistoryManager } from './editor/history';
import { SimulationEngine } from './simulation/engine';
import { TopBar } from './app/TopBar';
import { LeftSidebar } from './app/LeftSidebar';
import { RightSidebar } from './app/RightSidebar';
import { BottomPanel } from './app/BottomPanel';
import { Canvas, EditorTool } from './app/Canvas';
import {
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
  exportProjectToJson,
  downloadFile,
  parseProjectJson,
  exportSvgElement,
  exportPngElement,
} from './persistence/file';

export function App() {
  // Master Project State
  const [project, setProject] = useState<Project>(() => {
    const saved = loadProjectFromLocalStorage();
    if (saved) return saved;
    return createMarchaParoExample();
  });

  const [isDirty, setIsDirty] = useState(false);

  // Active sheet reference
  const currentSheet = useMemo(() => {
    return project.sheets.find((s) => s.id === project.activeSheetId) || project.sheets[0];
  }, [project]);

  // Editor Tools & Selection State
  const [tool, setTool] = useState<EditorTool>('select');
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([]);
  const [pendingPlacementType, setPendingPlacementType] = useState<ComponentType | null>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 40, y: 40 });

  // History Undo / Redo Manager
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager());
  const [historyVersion, setHistoryVersion] = useState(0);

  // Master Simulation Engine
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());
  const [simState, setSimState] = useState(() => engineRef.current.getState());

  // Keep engine synced with active sheet
  useEffect(() => {
    engineRef.current.setSheet(currentSheet);
  }, [currentSheet]);

  // Subscribe to simulation state
  useEffect(() => {
    const unsubscribe = engineRef.current.subscribe((state) => {
      setSimState(state);
    });
    return () => unsubscribe();
  }, []);

  // Autosave to localStorage on project changes
  useEffect(() => {
    saveProjectToLocalStorage(project);
  }, [project]);

  // Apply Sheet updates with optional history transaction
  const handleSheetChange = useCallback(
    (newSheet: Sheet, commitToHistory: boolean = false) => {
      if (commitToHistory) {
        historyManagerRef.current.pushState(currentSheet);
        setHistoryVersion((v) => v + 1);
        setIsDirty(true);
      }

      setProject((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => (s.id === newSheet.id ? newSheet : s)),
      }));
    },
    [currentSheet]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (simState.running) return;
    const restoredSheet = historyManagerRef.current.undo(currentSheet);
    if (restoredSheet) {
      setProject((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => (s.id === restoredSheet.id ? restoredSheet : s)),
      }));
      setHistoryVersion((v) => v + 1);
      setSelectedComponentIds([]);
      setSelectedWireIds([]);
    }
  }, [currentSheet, simState.running]);

  const handleRedo = useCallback(() => {
    if (simState.running) return;
    const restoredSheet = historyManagerRef.current.redo(currentSheet);
    if (restoredSheet) {
      setProject((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => (s.id === restoredSheet.id ? restoredSheet : s)),
      }));
      setHistoryVersion((v) => v + 1);
      setSelectedComponentIds([]);
      setSelectedWireIds([]);
    }
  }, [currentSheet, simState.running]);

  // Rotate selected components 90 degrees
  const handleRotateSelected = useCallback(() => {
    if (simState.running || selectedComponentIds.length === 0) return;

    historyManagerRef.current.pushState(currentSheet);
    setHistoryVersion((v) => v + 1);

    const updatedComponents = currentSheet.components.map((comp) => {
      if (selectedComponentIds.includes(comp.id)) {
        const nextRot = ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return {
          ...comp,
          rotation: nextRot,
        };
      }
      return comp;
    });

    handleSheetChange(
      {
        ...currentSheet,
        components: updatedComponents,
      },
      false
    );
  }, [currentSheet, selectedComponentIds, simState.running, handleSheetChange]);

  // Duplicate selected components
  const handleDuplicateSelected = useCallback(() => {
    if (simState.running || selectedComponentIds.length === 0) return;

    historyManagerRef.current.pushState(currentSheet);
    setHistoryVersion((v) => v + 1);

    const newComps: ComponentInstance[] = [];
    const newSelectedIds: string[] = [];

    for (const compId of selectedComponentIds) {
      const orig = currentSheet.components.find((c) => c.id === compId);
      if (!orig) continue;

      const duplicated = createNewComponent(
        orig.type,
        orig.x + 40,
        orig.y + 40,
        currentSheet
      );
      duplicated.rotation = orig.rotation;
      duplicated.params = { ...orig.params };
      newComps.push(duplicated);
      newSelectedIds.push(duplicated.id);
    }

    handleSheetChange(
      {
        ...currentSheet,
        components: [...currentSheet.components, ...newComps],
      },
      false
    );
    setSelectedComponentIds(newSelectedIds);
  }, [currentSheet, selectedComponentIds, simState.running, handleSheetChange]);

  // Delete selected components / wires
  const handleDeleteSelected = useCallback(() => {
    if (simState.running) return;
    if (selectedComponentIds.length === 0 && selectedWireIds.length === 0) return;

    historyManagerRef.current.pushState(currentSheet);
    setHistoryVersion((v) => v + 1);

    const updatedComponents = currentSheet.components.filter(
      (c) => !selectedComponentIds.includes(c.id)
    );

    // Also remove wires attached to deleted components
    const updatedWires = currentSheet.wires.filter((w) => {
      if (selectedWireIds.includes(w.id)) return false;
      if (w.from.type === 'terminal' && w.from.componentId && selectedComponentIds.includes(w.from.componentId)) {
        return false;
      }
      if (w.to.type === 'terminal' && w.to.componentId && selectedComponentIds.includes(w.to.componentId)) {
        return false;
      }
      return true;
    });

    handleSheetChange(
      {
        ...currentSheet,
        components: updatedComponents,
        wires: updatedWires,
      },
      false
    );
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, [currentSheet, selectedComponentIds, selectedWireIds, simState.running, handleSheetChange]);

  // Fit view to sheet
  const handleFitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  }, []);

  // File Operations
  const handleNewProject = () => {
    engineRef.current.reset();
    const newProj = createEmptyProject();
    historyManagerRef.current.clear();
    setProject(newProj);
    setIsDirty(false);
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  };

  const handleOpenProject = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseProjectJson(text);
      engineRef.current.reset();
      historyManagerRef.current.clear();
      setProject(parsed);
      setIsDirty(false);
      setSelectedComponentIds([]);
      setSelectedWireIds([]);
    } catch (err: any) {
      alert(`Error al abrir el proyecto: ${err.message}`);
    }
  };

  const handleSaveProject = () => {
    const jsonStr = exportProjectToJson(project);
    const fileName = `${project.metadata.name.replace(/\s+/g, '_').toLowerCase()}.circuit`;
    downloadFile(jsonStr, fileName, 'application/json');
    setIsDirty(false);
  };

  const handleLoadExample = (exampleId: string) => {
    const ex = EXAMPLE_CIRCUITS.find((e) => e.id === exampleId);
    if (!ex) return;
    engineRef.current.reset();
    historyManagerRef.current.clear();
    const exProj = ex.factory();
    setProject(exProj);
    setIsDirty(false);
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
    handleFitToScreen();
  };

  const handleExportSvg = () => {
    const svgEl = document.querySelector('svg');
    if (svgEl) exportSvgElement(svgEl, `${project.metadata.name}.svg`);
  };

  const handleExportPng = () => {
    const svgEl = document.querySelector('svg');
    if (svgEl) exportPngElement(svgEl, `${project.metadata.name}.png`, 2);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Undo: Cmd+Z or Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd+Shift+Z or Ctrl+Y
      else if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Save: Cmd+S
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      }
      // Duplicate: Cmd+D
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
      // Rotate: R
      else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRotateSelected();
      }
      // Delete: Backspace or Delete
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }
      // Tools: V (Select), W (Wire)
      else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'w') {
        if (!simState.running) setTool('wire');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSaveProject,
    handleDuplicateSelected,
    handleRotateSelected,
    handleDeleteSelected,
    simState.running,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F5F6F8] font-sans antialiased text-[#1E293B]">
      {/* Top Header & Simulation Controls */}
      <TopBar
        projectName={project.metadata.name}
        isDirty={isDirty}
        tool={tool}
        setTool={setTool}
        isSimulating={simState.running}
        isPaused={simState.paused}
        simulatedTimeMs={simState.simulatedTimeMs}
        speedMultiplier={simState.speedMultiplier}
        onStartSimulation={() => engineRef.current.start()}
        onPauseSimulation={() => engineRef.current.pause()}
        onStepSimulation={() => engineRef.current.step()}
        onResetSimulation={() => engineRef.current.reset()}
        onSetSpeed={(spd) => engineRef.current.setSpeed(spd)}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
        onLoadExample={handleLoadExample}
        canUndo={historyManagerRef.current.canUndo()}
        canRedo={historyManagerRef.current.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onRotateSelected={handleRotateSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onFitToScreen={handleFitToScreen}
        hasSelection={selectedComponentIds.length > 0 || selectedWireIds.length > 0}
      />

      {/* Main Workspace Area (Left Sidebar + Canvas + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Component Library */}
        <LeftSidebar
          onStartPlacing={(type) => {
            setPendingPlacementType(type);
            setTool('place');
          }}
          isSimulating={simState.running}
        />

        {/* Central CAD Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <Canvas
            sheet={currentSheet}
            tool={tool}
            setTool={setTool}
            selectedComponentIds={selectedComponentIds}
            selectedWireIds={selectedWireIds}
            onSelectComponents={setSelectedComponentIds}
            onSelectWires={setSelectedWireIds}
            onChangeSheet={handleSheetChange}
            isSimulating={simState.running}
            terminalPotentials={simState.terminalPotentials}
            wireEnergized={simState.wireEnergized}
            onToggleParam={(compId, key, val) => engineRef.current.setComponentParam(compId, key, val)}
            onMomentaryPress={(compId, isDown) => engineRef.current.setMomentaryPress(compId, isDown)}
            pendingPlacementType={pendingPlacementType}
            onFinishPlacement={() => {
              setPendingPlacementType(null);
              setTool('select');
            }}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
          />
        </main>

        {/* Right Inspector */}
        <RightSidebar
          sheet={currentSheet}
          selectedComponentIds={selectedComponentIds}
          onChangeComponent={(updatedComp) => {
            const updated = currentSheet.components.map((c) =>
              c.id === updatedComp.id ? updatedComp : c
            );
            handleSheetChange(
              {
                ...currentSheet,
                components: updated,
              },
              true
            );
          }}
          isSimulating={simState.running}
          terminalPotentials={simState.terminalPotentials}
        />
      </div>

      {/* Bottom Collapsible Diagnostics & Live Event Log */}
      <BottomPanel
        events={simState.events}
        diagnostics={simState.diagnostics}
        onClearEvents={() => {
          engineRef.current.getState().events = [];
          setSimState(engineRef.current.getState());
        }}
      />
    </div>
  );
}
export default App;
