import React, { useState } from 'react';
import { SimulationDiagnostic, SimulationEvent } from '../domain/types';
import { Terminal, AlertTriangle, Info, ShieldAlert, ChevronUp, ChevronDown, Trash2, Keyboard } from 'lucide-react';

interface BottomPanelProps {
  events: SimulationEvent[];
  diagnostics: SimulationDiagnostic[];
  onClearEvents: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ events, diagnostics, onClearEvents }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'diagnostics' | 'shortcuts'>('events');

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="bg-white border-t border-[#D8DDE5] select-none z-30 shrink-0 transition-all">
      {/* Tab Bar Header */}
      <div className="h-8 px-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Tab Events */}
          <button
            onClick={() => {
              setActiveTab('events');
              setIsExpanded(true);
            }}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 rounded transition-colors ${
              activeTab === 'events' && isExpanded ? 'bg-white text-[#2563EB] shadow-xs border border-[#CBD5E1]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Registro de Eventos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#E2E8F0] text-[10px] font-mono text-[#475569]">
              {events.length}
            </span>
          </button>

          {/* Tab Diagnostics */}
          <button
            onClick={() => {
              setActiveTab('diagnostics');
              setIsExpanded(true);
            }}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 rounded transition-colors ${
              activeTab === 'diagnostics' && isExpanded ? 'bg-white text-[#2563EB] shadow-xs border border-[#CBD5E1]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Diagnósticos</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FEE2E2] text-[10px] font-bold text-[#DC2626]">
                {errorCount}
              </span>
            )}
          </button>

          {/* Tab Shortcuts */}
          <button
            onClick={() => {
              setActiveTab('shortcuts');
              setIsExpanded(true);
            }}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 rounded transition-colors ${
              activeTab === 'shortcuts' && isExpanded ? 'bg-white text-[#2563EB] shadow-xs border border-[#CBD5E1]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Atajos</span>
          </button>
        </div>

        {/* Right action & toggle */}
        <div className="flex items-center space-x-2">
          {activeTab === 'events' && isExpanded && (
            <button
              onClick={onClearEvents}
              title="Limpiar registro"
              className="p-1 text-[#64748B] hover:text-[#EF4444] rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#64748B] hover:text-[#1E293B] rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="h-44 overflow-y-auto p-3 font-mono text-xs bg-[#0F172A] text-[#F8FAFC]">
          {activeTab === 'events' && (
            <div className="space-y-1">
              {events.length === 0 ? (
                <div className="text-[#64748B] italic">No hay eventos registrados. Inicia la simulación para interactuar.</div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2 hover:bg-[#1E293B] px-1.5 py-0.5 rounded">
                    <span className="text-[#38BDF8] shrink-0">
                      [t = {(evt.simulatedTimeMs / 1000).toFixed(3)}s]
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 bg-[#334155] text-[#94A3B8]">
                      {evt.category}
                    </span>
                    <span className="text-[#E2E8F0]">{evt.description}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-1.5">
              {diagnostics.length === 0 ? (
                <div className="text-[#34D399] flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>Circuito sin anomalías ni conflictos de potencial detectados.</span>
                </div>
              ) : (
                diagnostics.map((diag, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded flex items-start gap-2 ${
                      diag.severity === 'error' ? 'bg-[#450A0A] border border-[#991B1B] text-[#FCA5A5]' : 'bg-[#451A03] border border-[#92400E] text-[#FDE68A]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">{diag.title}</div>
                      <div className="text-[11px] opacity-90">{diag.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-[#CBD5E1]">
              <div className="space-y-1">
                <div className="font-bold text-[#38BDF8]">Herramientas</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">V</kbd> Selección / Mover</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">W</kbd> Cablear Ortogonal</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Espacio</kbd> Desplazar Lienzo</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Esc</kbd> Cancelar Cable / Deseleccionar</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#38BDF8]">Edición</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Cmd+Z</kbd> Deshacer</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Cmd+Shift+Z</kbd> Rehacer</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">R</kbd> Rotar 90°</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Supr / Backspace</kbd> Eliminar</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#38BDF8]">Archivo & Zoom</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Cmd+S</kbd> Guardar Proyecto</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Cmd+O</kbd> Abrir Archivo</div>
                <div><kbd className="px-1 py-0.5 bg-[#334155] rounded text-white font-mono">Rueda / Trackpad</kbd> Zoom en cursor</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#38BDF8]">Simulación</div>
                <div>Clic en pulsador NA/NC para accionar.</div>
                <div>Clic en Parada de Emergencia para enclavar/liberar.</div>
                <div>Clic en F2 para probar disparo por sobrecarga.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
