import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FolderOpen,
  Save,
  FilePlus,
  Download,
  RotateCw,
  Copy,
  Trash2,
  MousePointer,
  Waypoints,
  Hand,
  Maximize2,
  Undo2,
  Redo2,
  FileCode,
  Sparkles,
  Zap,
} from 'lucide-react';
import { EditorTool } from './Canvas';
import { EXAMPLE_CIRCUITS } from './examples';

interface TopBarProps {
  projectName: string;
  isDirty: boolean;
  tool: EditorTool;
  setTool: (t: EditorTool) => void;
  isSimulating: boolean;
  isPaused: boolean;
  simulatedTimeMs: number;
  speedMultiplier: 0.25 | 0.5 | 1 | 2;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onStepSimulation: () => void;
  onResetSimulation: () => void;
  onSetSpeed: (speed: 0.25 | 0.5 | 1 | 2) => void;
  onNewProject: () => void;
  onOpenProject: (file: File) => void;
  onSaveProject: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onLoadExample: (exampleId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onFitToScreen: () => void;
  hasSelection: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  isDirty,
  tool,
  setTool,
  isSimulating,
  isPaused,
  simulatedTimeMs,
  speedMultiplier,
  onStartSimulation,
  onPauseSimulation,
  onStepSimulation,
  onResetSimulation,
  onSetSpeed,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExportSvg,
  onExportPng,
  onLoadExample,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onFitToScreen,
  hasSelection,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSimTime = (ms: number) => {
    const sec = (ms / 1000).toFixed(2);
    return `${sec} s`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenProject(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-12 bg-white border-b border-[#D8DDE5] px-3 flex items-center justify-between select-none z-30 shrink-0">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".circuit,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: App Title & File Actions */}
      <div className="flex items-center space-x-2">
        {/* Brand */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-[#E2E8F0]">
          <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#1E293B]">Circuit Studio</span>
        </div>

        {/* File & Edit Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onNewProject}
            title="Nuevo Proyecto (Cmd+N)"
            className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded text-xs flex items-center gap-1 font-medium transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nuevo</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Abrir Archivo .circuit (Cmd+O)"
            className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded text-xs flex items-center gap-1 font-medium transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abrir</span>
          </button>

          <button
            onClick={onSaveProject}
            title="Guardar Proyecto .circuit (Cmd+S)"
            className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded text-xs flex items-center gap-1 font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Guardar</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
          </button>

          {/* Examples Dropdown */}
          <div className="relative group">
            <button
              title="Cargar Esquemas de Ejemplo"
              className="p-1.5 text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded text-xs flex items-center gap-1 font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ejemplos</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#D8DDE5] shadow-lg rounded-md py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Automatismos Didácticos
              </div>
              {EXAMPLE_CIRCUITS.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onLoadExample(ex.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              title="Exportar Esquema"
              className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Exportar</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#D8DDE5] shadow-lg rounded-md py-1 hidden group-hover:block z-50">
              <button
                onClick={onExportSvg}
                className="w-full text-left px-3 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-[#2563EB]" />
                Exportar Vector SVG
              </button>
              <button
                onClick={onExportPng}
                className="w-full text-left px-3 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#10B981]" />
                Exportar Imagen PNG
              </button>
            </div>
          </div>
        </div>

        {/* Undo / Redo & Editing Tools */}
        <div className="flex items-center space-x-0.5 pl-2 border-l border-[#E2E8F0]">
          <button
            onClick={onUndo}
            disabled={!canUndo || isSimulating}
            title="Deshacer (Cmd+Z)"
            className="p-1.5 text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 rounded transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isSimulating}
            title="Rehacer (Cmd+Shift+Z)"
            className="p-1.5 text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 rounded transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] mx-1" />

          <button
            onClick={onRotateSelected}
            disabled={!hasSelection || isSimulating}
            title="Rotar 90° (R)"
            className="p-1.5 text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 rounded transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDuplicateSelected}
            disabled={!hasSelection || isSimulating}
            title="Duplicar (Cmd+D)"
            className="p-1.5 text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 rounded transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={!hasSelection || isSimulating}
            title="Eliminar (Supr / Backspace)"
            className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] disabled:opacity-30 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Editor Mode Tools */}
      <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
        <button
          onClick={() => setTool('select')}
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
            tool === 'select' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
          title="Seleccionar / Mover (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Selección</span>
        </button>

        <button
          onClick={() => setTool('wire')}
          disabled={isSimulating}
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
            tool === 'wire' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
          } disabled:opacity-40`}
          title="Cablear Ortogonal (W)"
        >
          <Waypoints className="w-3.5 h-3.5" />
          <span>Cablear</span>
        </button>

        <button
          onClick={() => setTool('pan')}
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
            tool === 'pan' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
          title="Desplazar Lienzo (Espacio + Arrastrar)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Pan</span>
        </button>

        <button
          onClick={onFitToScreen}
          className="p-1 text-[#64748B] hover:text-[#1E293B] rounded transition-colors"
          title="Encuadrar Esquema (Cmd+0)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Simulation Controls & Speed */}
      <div className="flex items-center space-x-2">
        {/* Simulation Time Display */}
        <div className="bg-[#0F172A] text-white px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 shadow-inner">
          <span className={`w-2 h-2 rounded-full ${isSimulating && !isPaused ? 'bg-[#22C55E] animate-pulse' : 'bg-[#94A3B8]'}`} />
          <span className="text-[#94A3B8] text-[10px]">TIEMPO</span>
          <span className="tabular-nums text-[#38BDF8]">{formatSimTime(simulatedTimeMs)}</span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center bg-[#F1F5F9] rounded p-0.5 border border-[#E2E8F0] text-xs font-mono">
          {([0.25, 0.5, 1, 2] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                speedMultiplier === spd ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Simulation Run / Pause / Step / Reset Buttons */}
        <div className="flex items-center space-x-1">
          {!isSimulating || isPaused ? (
            <button
              onClick={onStartSimulation}
              title="Iniciar / Reanudar Simulación"
              className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simular</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              title="Pausar Simulación"
              className="px-2.5 py-1 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pausar</span>
            </button>
          )}

          <button
            onClick={onStepSimulation}
            title="Avanzar 1 Paso (10ms)"
            className="p-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] rounded text-xs font-semibold transition-colors border border-[#CBD5E1]"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetSimulation}
            title="Reiniciar Simulación y Parámetros"
            className="p-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] rounded text-xs font-semibold transition-colors border border-[#CBD5E1]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
