import React, { useState, useMemo } from 'react';
import { Search, Zap, ShieldAlert, ToggleLeft, CircleDot, Cpu, GitCommit, Lightbulb, Gauge, Waypoints, ChevronDown, ChevronRight } from 'lucide-react';
import { COMPONENT_DEFINITIONS, CATEGORY_LABELS } from '../components-library/definitions';
import { ComponentType, ComponentCategory } from '../domain/types';

interface LeftSidebarProps {
  onStartPlacing: (type: ComponentType) => void;
  isSimulating: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  power: <Zap className="w-4 h-4 text-[#EF4444]" />,
  protection: <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />,
  switches: <ToggleLeft className="w-4 h-4 text-[#6366F1]" />,
  pushbuttons: <CircleDot className="w-4 h-4 text-[#2563EB]" />,
  coils: <Cpu className="w-4 h-4 text-[#10B981]" />,
  contacts: <GitCommit className="w-4 h-4 text-[#0EA5E9]" />,
  signaling: <Lightbulb className="w-4 h-4 text-[#EAB308]" />,
  motors: <Gauge className="w-4 h-4 text-[#8B5CF6]" />,
  terminals: <Waypoints className="w-4 h-4 text-[#64748B]" />,
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onStartPlacing, isSimulating }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group definitions by category & filter by search
  const groupedDefinitions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const groups: Record<ComponentCategory, ComponentType[]> = {
      power: [],
      protection: [],
      switches: [],
      pushbuttons: [],
      coils: [],
      contacts: [],
      signaling: [],
      motors: [],
      terminals: [],
    };

    for (const [type, def] of Object.entries(COMPONENT_DEFINITIONS)) {
      if (
        !query ||
        def.name.toLowerCase().includes(query) ||
        def.description.toLowerCase().includes(query) ||
        def.defaultTagPrefix.toLowerCase().includes(query)
      ) {
        groups[def.category]?.push(type as ComponentType);
      }
    }

    return groups;
  }, [searchQuery]);

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    if (isSimulating) return;
    e.dataTransfer.setData('application/circuit-studio-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-64 bg-[#FFFFFF] border-r border-[#D8DDE5] flex flex-col h-full select-none z-20 shrink-0">
      {/* Search Header */}
      <div className="p-2.5 border-b border-[#E2E8F0]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar componentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSimulating}
            className="w-full pl-8 pr-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#1E293B] focus:outline-none focus:border-[#2563EB] disabled:opacity-50 placeholder-[#94A3B8]"
          />
        </div>
      </div>

      {/* Component Library List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Object.entries(groupedDefinitions).map(([catKey, compTypes]) => {
          if (compTypes.length === 0) return null;
          const catMeta = CATEGORY_LABELS[catKey] || { label: catKey };
          const isCollapsed = !!collapsedCategories[catKey];

          return (
            <div key={catKey} className="rounded-md border border-[#F1F5F9] bg-[#FAFAFA] overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catKey)}
                className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {CATEGORY_ICONS[catKey]}
                  <span>{catMeta.label}</span>
                  <span className="text-[10px] text-[#94A3B8] font-normal">({compTypes.length})</span>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </button>

              {/* Component Tiles */}
              {!isCollapsed && (
                <div className="p-1 grid grid-cols-1 gap-1">
                  {compTypes.map((type) => {
                    const def = COMPONENT_DEFINITIONS[type];
                    return (
                      <div
                        key={type}
                        draggable={!isSimulating}
                        onDragStart={(e) => handleDragStart(e, type)}
                        onClick={() => !isSimulating && onStartPlacing(type)}
                        title={`${def.description} (Arrastra al lienzo o haz clic)`}
                        className={`p-2 rounded bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] flex items-center justify-between transition-all ${
                          isSimulating ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col pr-2">
                          <span className="text-xs font-medium text-[#1E293B] leading-tight">{def.name}</span>
                          <span className="text-[10px] text-[#64748B] line-clamp-1">{def.description}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] font-mono text-[#475569] font-bold shrink-0">
                          {def.defaultTagPrefix}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
