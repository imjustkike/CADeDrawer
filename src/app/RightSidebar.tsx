import React from 'react';
import { ComponentInstance, Sheet, NodePotential } from '../domain/types';
import { COMPONENT_DEFINITIONS } from '../components-library/definitions';
import { Sliders, Link, Tag, Zap, Activity, Info } from 'lucide-react';

interface RightSidebarProps {
  sheet: Sheet;
  selectedComponentIds: string[];
  onChangeComponent: (updatedComp: ComponentInstance) => void;
  isSimulating: boolean;
  terminalPotentials: Record<string, NodePotential>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  sheet,
  selectedComponentIds,
  onChangeComponent,
  isSimulating,
  terminalPotentials,
}) => {
  if (selectedComponentIds.length === 0) {
    return (
      <aside className="w-64 bg-white border-l border-[#D8DDE5] p-4 flex flex-col items-center justify-center text-center text-[#64748B] select-none shrink-0">
        <Info className="w-8 h-8 text-[#CBD5E1] mb-2" />
        <p className="text-xs font-medium">Ningún elemento seleccionado</p>
        <p className="text-[11px] text-[#94A3B8] mt-1">Haz clic en un componente para inspeccionar y configurar sus propiedades.</p>
      </aside>
    );
  }

  const selectedComp = sheet.components.find((c) => c.id === selectedComponentIds[0]);
  if (!selectedComp) return null;

  const def = COMPONENT_DEFINITIONS[selectedComp.type];
  if (!def) return null;

  const params = selectedComp.params || {};

  const handleTagChange = (newTag: string) => {
    onChangeComponent({
      ...selectedComp,
      tag: newTag,
    });
  };

  const handleDeviceIdChange = (newDevId: string) => {
    onChangeComponent({
      ...selectedComp,
      deviceId: newDevId,
    });
  };

  const handleParamChange = (key: string, val: any) => {
    onChangeComponent({
      ...selectedComp,
      params: {
        ...selectedComp.params,
        [key]: val,
      },
    });
  };

  return (
    <aside className="w-72 bg-white border-l border-[#D8DDE5] flex flex-col h-full select-none z-20 shrink-0 overflow-y-auto text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-[#1E293B]">{def.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#E2E8F0] text-[10px] font-mono text-[#475569]">
            {selectedComp.type}
          </span>
        </div>
        <p className="text-[11px] text-[#64748B] mt-0.5">{def.description}</p>
      </div>

      <div className="p-3 space-y-4">
        {/* Identifiers (Tag & Device ID Link) */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
            Identificación
          </span>

          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] block">Etiqueta Visible (Tag):</label>
            <input
              type="text"
              value={selectedComp.tag}
              disabled={isSimulating}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded font-mono font-bold text-xs text-[#1E293B] focus:border-[#2563EB] focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] block flex items-center justify-between">
              <span>Dispositivo Vinculado (Device ID):</span>
              <Link className="w-3 h-3 text-[#2563EB]" />
            </label>
            <input
              type="text"
              value={selectedComp.deviceId || ''}
              disabled={isSimulating}
              onChange={(e) => handleDeviceIdChange(e.target.value)}
              placeholder="Ej: dev_km1"
              className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded font-mono text-xs text-[#1E293B] focus:border-[#2563EB] focus:outline-none disabled:opacity-50"
            />
            <p className="text-[10px] text-[#94A3B8]">
              Vincula bobinas y contactos que compartan el mismo ID de dispositivo.
            </p>
          </div>
        </div>

        {/* Specific Parameters */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
            Parámetros Específicos
          </span>

          {/* TON / TOF Timer settings */}
          {(selectedComp.type === 'coil_timer_ton' || selectedComp.type === 'coil_timer_tof') && (
            <div className="space-y-2 bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#1E293B]">Retardo de Tiempo:</span>
                <span className="font-mono font-bold text-[#2563EB]">
                  {((params.delayMs || 3000) / 1000).toFixed(1)} s
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={params.delayMs || 3000}
                disabled={isSimulating}
                onChange={(e) => handleParamChange('delayMs', Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>0.5 s</span>
                <span>15 s</span>
                <span>30 s</span>
              </div>
            </div>
          )}

          {/* Pilot Light Color */}
          {selectedComp.type === 'pilot_light' && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#64748B] block">Color de la Lámpara:</label>
              <div className="flex items-center gap-1.5">
                {(['green', 'red', 'yellow', 'blue', 'white'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    disabled={isSimulating}
                    onClick={() => handleParamChange('color', col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      (params.color || 'green') === col ? 'scale-110 border-[#1E293B] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor:
                        col === 'green' ? '#22C55E' : col === 'red' ? '#EF4444' : col === 'yellow' ? '#FACC15' : col === 'blue' ? '#3B82F6' : '#F1F5F9',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Thermal Relay Trip Simulation Toggle */}
          {(selectedComp.type === 'thermal_relay_power' ||
            selectedComp.type === 'thermal_relay_aux_nc' ||
            selectedComp.type === 'thermal_relay_aux_no') && (
            <div className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded space-y-2">
              <span className="text-[11px] font-semibold text-[#B91C1C] block">Prueba de Disparo Térmico:</span>
              <button
                type="button"
                onClick={() => handleParamChange('tripped', !params.tripped)}
                className={`w-full py-1.5 px-3 rounded text-xs font-semibold transition-colors ${
                  params.tripped
                    ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                    : 'bg-white text-[#B91C1C] border border-[#F87171] hover:bg-[#FEE2E2]'
                }`}
              >
                {params.tripped ? 'DISPARADO (Rearmar F2)' : 'Simular Disparo Térmico'}
              </button>
            </div>
          )}

          {/* Motor 3P Info */}
          {selectedComp.type === 'motor_3p' && (
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Potencia:</span>
                <span className="font-mono font-semibold">{params.powerKw || 2.2} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Velocidad Nominal:</span>
                <span className="font-mono font-semibold">{params.rpmNominal || 1450} RPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Tensión:</span>
                <span className="font-mono font-semibold">400 V (3~)</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Simulation Monitor */}
        {isSimulating && (
          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
              Monitor en Vivo
            </span>

            <div className="p-2.5 bg-[#0F172A] text-white rounded font-mono text-[11px] space-y-1 shadow-inner">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Estado:</span>
                <span className={params.isEnergized || params.motorState?.startsWith('RUNNING') ? 'text-[#22C55E] font-bold' : 'text-[#94A3B8]'}>
                  {params.isEnergized ? 'ENERGIZADO' : params.motorState || 'INACTIVO'}
                </span>
              </div>

              {/* Terminals table */}
              <div className="pt-1 border-t border-[#334155] space-y-0.5">
                <span className="text-[10px] text-[#64748B] uppercase">Potenciales de Bornes:</span>
                {def.ports.map((port) => {
                  const tId = `${selectedComp.id}:${port.name}`;
                  const pot = terminalPotentials[tId];
                  let potStr = '0V / Flotante';
                  if (pot) {
                    if (pot.isConflict) potStr = 'CORTO / CONFLICTO';
                    else if (pot.has24V) potStr = '+24V CC';
                    else if (pot.has0V) potStr = '0V (Masa)';
                    else if (pot.hasL1) potStr = 'Fase L1';
                    else if (pot.hasL2) potStr = 'Fase L2';
                    else if (pot.hasL3) potStr = 'Fase L3';
                    else if (pot.hasPE) potStr = 'Tierra PE';
                  }

                  return (
                    <div key={port.name} className="flex justify-between text-[10px]">
                      <span className="text-[#38BDF8]">{port.name}:</span>
                      <span className={pot?.has24V || pot?.hasL1 || pot?.hasL2 || pot?.hasL3 ? 'text-[#34D399]' : 'text-[#64748B]'}>
                        {potStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
