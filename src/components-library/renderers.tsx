import React from 'react';
import { ComponentInstance, NodePotential } from '../domain/types';
import { COMPONENT_DEFINITIONS } from './definitions';

interface SymbolRendererProps {
  component: ComponentInstance;
  isSimulating: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isInteracting?: boolean;
  terminalPotentials?: Record<string, NodePotential>;
  onToggleParam?: (paramKey: string, value: any) => void;
  onMomentaryPress?: (isDown: boolean) => void;
}

export const ComponentSymbol: React.FC<SymbolRendererProps> = ({
  component,
  isSimulating,
  isSelected,
  isHovered,
  terminalPotentials = {},
  onToggleParam,
  onMomentaryPress,
}) => {
  const def = COMPONENT_DEFINITIONS[component.type];
  if (!def) return null;

  const { width, height } = def;
  const params = component.params || {};

  // Check state
  const isEnergized = !!params.isEnergized;
  const isClosed = !!params.isClosed;
  const isPressed = !!params.isPressed;
  const isLatched = !!params.isLatched;
  const isTripped = !!params.tripped;
  const motorState = params.motorState || 'STOPPED';
  const pilotLit = !!params.pilotLit;

  const strokeColor = isSelected ? '#2563EB' : isHovered ? '#3B82F6' : '#1E293B';
  const strokeWidth = isSelected ? 2 : 1.5;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isSimulating) return;
    e.stopPropagation();

    if (component.type === 'pushbutton_no' || component.type === 'pushbutton_nc') {
      onMomentaryPress?.(true);
    } else if (component.type === 'emergency_stop_nc') {
      onToggleParam?.('isLatched', !isLatched);
    } else if (component.type === 'switch_selector_2pos') {
      onToggleParam?.('isClosed', !isClosed);
    } else if (component.type === 'thermal_relay_power' || component.type === 'thermal_relay_aux_nc' || component.type === 'thermal_relay_aux_no') {
      onToggleParam?.('tripped', !isTripped);
    } else if (component.type === 'disconnector_3p' || component.type === 'circuit_breaker_1p') {
      onToggleParam?.('isClosed', !isClosed);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSimulating) return;
    if (component.type === 'pushbutton_no' || component.type === 'pushbutton_nc') {
      onMomentaryPress?.(false);
    }
  };

  const renderSymbolGraphic = () => {
    switch (component.type) {
      // === ALIMENTACIÓN ===
      case 'power_24v':
        return (
          <g>
            <circle cx="20" cy="15" r="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
            <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#DC2626">+24V</text>
            <line x1="20" y1="23" x2="20" y2="30" stroke="#DC2626" strokeWidth="2" />
          </g>
        );

      case 'power_0v':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="15" stroke="#2563EB" strokeWidth="2" />
            <line x1="10" y1="15" x2="30" y2="15" stroke="#2563EB" strokeWidth="2" />
            <line x1="13" y1="19" x2="27" y2="19" stroke="#2563EB" strokeWidth="1.5" />
            <line x1="16" y1="23" x2="24" y2="23" stroke="#2563EB" strokeWidth="1.5" />
            <text x="34" y="16" fontSize="9" fontWeight="bold" fill="#2563EB">0V</text>
          </g>
        );

      case 'power_3p_pe':
        return (
          <g>
            <line x1="5" y1="12" x2="75" y2="12" stroke="#475569" strokeWidth="2" strokeDasharray="2,2" />
            {/* L1 */}
            <line x1="10" y1="12" x2="10" y2="30" stroke="#92400E" strokeWidth="2" />
            <text x="10" y="9" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400E">L1</text>
            {/* L2 */}
            <line x1="30" y1="12" x2="30" y2="30" stroke="#1E293B" strokeWidth="2" />
            <text x="30" y="9" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1E293B">L2</text>
            {/* L3 */}
            <line x1="50" y1="12" x2="50" y2="30" stroke="#64748B" strokeWidth="2" />
            <text x="50" y="9" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748B">L3</text>
            {/* PE */}
            <line x1="70" y1="12" x2="70" y2="30" stroke="#15803D" strokeWidth="2" />
            <text x="70" y="9" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#15803D">PE</text>
          </g>
        );

      // === SECCIONADOR TRIPOLAR ===
      case 'disconnector_3p': {
        const closed = isClosed;
        return (
          <g>
            {[10, 30, 50].map((xPos, idx) => (
              <g key={idx}>
                <line x1={xPos} y1="0" x2={xPos} y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
                <circle cx={xPos} cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <line
                  x1={xPos}
                  y1="42"
                  x2={closed ? xPos : xPos + 10}
                  y2={closed ? "20" : "24"}
                  stroke={closed ? '#10B981' : strokeColor}
                  strokeWidth={strokeWidth}
                />
                <circle cx={xPos} cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <line x1={xPos} y1="42" x2={xPos} y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
            ))}
            {/* Gang link */}
            <line x1="16" y1="30" x2="56" y2="30" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          </g>
        );
      }

      // === RELÉ TÉRMICO TRIPOLAR POTENCIA ===
      case 'thermal_relay_power':
        return (
          <g>
            {[10, 30, 50].map((xPos, idx) => (
              <g key={idx}>
                <line x1={xPos} y1="0" x2={xPos} y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
                {/* Bimetallic heater symbol */}
                <rect x={xPos - 5} y="20" width="10" height="20" fill={isTripped ? "#FEE2E2" : "#F1F5F9"} stroke={isTripped ? "#EF4444" : strokeColor} strokeWidth={strokeWidth} rx="2" />
                <path d={`M ${xPos - 3} 25 L ${xPos + 3} 30 L ${xPos - 3} 35`} fill="none" stroke={isTripped ? "#EF4444" : strokeColor} strokeWidth="1.5" />
                <line x1={xPos} y1="40" x2={xPos} y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
            ))}
            {isTripped && (
              <g>
                <rect x="18" y="24" width="24" height="12" fill="#DC2626" rx="2" />
                <text x="30" y="33" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF">TRIP</text>
              </g>
            )}
          </g>
        );

      // === CONTACTOS TÉRMICOS AUXILIARES ===
      case 'thermal_relay_aux_nc': {
        const open = isTripped;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={open ? "28" : "20"}
              y2={open ? "24" : "20"}
              stroke={open ? '#EF4444' : strokeColor}
              strokeWidth={strokeWidth}
            />
            <path d="M 22 25 L 26 22" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'thermal_relay_aux_no': {
        const closed = isTripped;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={closed ? "20" : "28"}
              y2={closed ? "20" : "24"}
              stroke={closed ? '#10B981' : strokeColor}
              strokeWidth={strokeWidth}
            />
            <path d="M 22 30 L 26 27" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === PULSADORES ===
      case 'pushbutton_no': {
        const pressed = isPressed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            {/* Moving contact */}
            <line
              x1="20"
              y1="42"
              x2={pressed ? "20" : "28"}
              y2={pressed ? "20" : "24"}
              stroke={pressed ? '#10B981' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Push button actuator symbol */}
            <path d={pressed ? "M 20 20 L 14 20 M 14 16 L 14 24" : "M 24 33 L 18 33 M 18 29 L 18 37"} stroke="#2563EB" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'pushbutton_nc': {
        const pressed = isPressed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            {/* NC bridge */}
            <line
              x1="20"
              y1="42"
              x2={pressed ? "28" : "20"}
              y2={pressed ? "24" : "20"}
              stroke={pressed ? '#EF4444' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Actuator */}
            <path d={pressed ? "M 24 33 L 18 33 M 18 29 L 18 37" : "M 20 20 L 14 20 M 14 16 L 14 24"} stroke="#DC2626" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'emergency_stop_nc': {
        const open = isLatched;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={open ? "28" : "20"}
              y2={open ? "24" : "20"}
              stroke={open ? '#DC2626' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Mushroom latch head symbol */}
            <path d="M 12 28 C 12 22, 16 20, 20 20 C 24 20, 28 22, 28 28 Z" fill={open ? "#EF4444" : "#DC2626"} stroke="#B91C1C" strokeWidth="1" />
            <line x1="20" y1="28" x2="20" y2="35" stroke="#B91C1C" strokeWidth="1.5" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'switch_selector_2pos': {
        const closed = isClosed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={closed ? "20" : "28"}
              y2={closed ? "20" : "24"}
              stroke={closed ? '#10B981' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Selector arrow */}
            <path d="M 23 29 L 27 27 L 25 33" stroke="#475569" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === BOBINA DE CONTACTOR ===
      case 'coil_contactor':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Rectangular coil */}
            <rect
              x="5"
              y="15"
              width="30"
              height="30"
              fill={isEnergized ? "#DCFCE7" : "#FFFFFF"}
              stroke={isEnergized ? "#16A34A" : strokeColor}
              strokeWidth={isEnergized ? "2" : strokeWidth}
              rx="2"
            />
            <line x1="5" y1="15" x2="35" y2="45" stroke={isEnergized ? "#16A34A" : "#CBD5E1"} strokeWidth="1" />
            {isEnergized && (
              <text x="20" y="33" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803D">ON</text>
            )}
            <line x1="20" y1="45" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // === TEMPORIZADORES TON / TOF ===
      case 'coil_timer_ton':
      case 'coil_timer_tof': {
        const isTon = component.type === 'coil_timer_ton';
        const delayS = ((params.delayMs || 3000) / 1000).toFixed(1);
        const timerActive = !!params.timerActive;
        const progress = params.timerElapsedMs ? Math.min(1, params.timerElapsedMs / (params.timerTargetMs || params.delayMs || 3000)) : 0;

        return (
          <g>
            <line x1="25" y1="0" x2="25" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect
              x="5"
              y="15"
              width="40"
              height="30"
              fill={isEnergized ? "#FEF3C7" : "#FFFFFF"}
              stroke={isEnergized ? "#D97706" : strokeColor}
              strokeWidth={isEnergized ? "2" : strokeWidth}
              rx="2"
            />
            {/* Symbol crosshatch top or bottom */}
            {isTon ? (
              <rect x="5" y="15" width="40" height="8" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
            ) : (
              <rect x="5" y="37" width="40" height="8" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
            )}
            <text x="25" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350F">
              {isTon ? 'TON' : 'TOF'} ({delayS}s)
            </text>
            {timerActive && (
              <rect x="6" y="42" width={38 * progress} height="2" fill="#2563EB" />
            )}
            <line x1="25" y1="45" x2="25" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === CONTACTOS AUXILIARES ===
      case 'contact_aux_no': {
        const closed = isClosed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={closed ? "20" : "28"}
              y2={closed ? "20" : "24"}
              stroke={closed ? '#10B981' : strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'contact_aux_nc': {
        const open = isClosed; // When coil energized, NC opens
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={open ? "28" : "20"}
              y2={open ? "24" : "20"}
              stroke={open ? '#EF4444' : strokeColor}
              strokeWidth={strokeWidth}
            />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === CONTACTOS DE POTENCIA TRIPOLARES ===
      case 'contact_power_3p': {
        const closed = isClosed;
        return (
          <g>
            {[10, 30, 50].map((xPos, idx) => (
              <g key={idx}>
                <line x1={xPos} y1="0" x2={xPos} y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
                <circle cx={xPos} cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <line
                  x1={xPos}
                  y1="42"
                  x2={closed ? xPos : xPos + 8}
                  y2={closed ? "20" : "24"}
                  stroke={closed ? '#10B981' : strokeColor}
                  strokeWidth={strokeWidth}
                />
                <circle cx={xPos} cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <line x1={xPos} y1="42" x2={xPos} y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
            ))}
            {/* Gang link */}
            <line x1="14" y1="30" x2="54" y2="30" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          </g>
        );
      }

      // === CONTACTOS TEMPORIZADOS ===
      case 'contact_timed_no': {
        const closed = isClosed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={closed ? "20" : "28"}
              y2={closed ? "20" : "24"}
              stroke={closed ? '#10B981' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Timed arc cup */}
            <path d="M 23 28 A 4 4 0 0 1 29 33" stroke="#D97706" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      case 'contact_timed_nc': {
        const open = isClosed;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="20" cy="18" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line
              x1="20"
              y1="42"
              x2={open ? "28" : "20"}
              y2={open ? "24" : "20"}
              stroke={open ? '#EF4444' : strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Timed arc cup */}
            <path d="M 23 28 A 4 4 0 0 1 29 33" stroke="#D97706" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="42" r="2.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="42" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === PILOTO DE SEÑALIZACIÓN ===
      case 'pilot_light': {
        const color = params.color || 'green';
        const colorMap: Record<string, { on: string; border: string; glow: string }> = {
          green: { on: '#22C55E', border: '#15803D', glow: 'rgba(34, 197, 94, 0.4)' },
          red: { on: '#EF4444', border: '#B91C1C', glow: 'rgba(239, 68, 68, 0.4)' },
          yellow: { on: '#FACC15', border: '#B45309', glow: 'rgba(250, 204, 21, 0.4)' },
          blue: { on: '#3B82F6', border: '#1D4ED8', glow: 'rgba(59, 130, 246, 0.4)' },
          white: { on: '#F8FAFC', border: '#94A3B8', glow: 'rgba(248, 250, 252, 0.6)' },
        };
        const c = colorMap[color] || colorMap.green;

        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle
              cx="20"
              cy="30"
              r="15"
              fill={pilotLit ? c.on : '#FFFFFF'}
              stroke={pilotLit ? c.border : strokeColor}
              strokeWidth={pilotLit ? "2" : strokeWidth}
              style={{
                filter: pilotLit ? `drop-shadow(0 0 6px ${c.glow})` : 'none',
              }}
            />
            {/* Diagonal X inside circle */}
            <line x1="10" y1="20" x2="30" y2="40" stroke={pilotLit ? '#FFFFFF' : strokeColor} strokeWidth="1.5" />
            <line x1="30" y1="20" x2="10" y2="40" stroke={pilotLit ? '#FFFFFF' : strokeColor} strokeWidth="1.5" />
            <line x1="20" y1="45" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === ZUMBADOR ===
      case 'buzzer': {
        const active = !!params.buzzerActive;
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon
              points="10,15 30,15 35,45 5,45"
              fill={active ? "#FEF3C7" : "#FFFFFF"}
              stroke={active ? "#D97706" : strokeColor}
              strokeWidth={active ? "2" : strokeWidth}
            />
            <line x1="20" y1="45" x2="20" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );
      }

      // === MOTOR TRIFÁSICO ===
      case 'motor_3p': {
        const isRunning = motorState === 'RUNNING_CW' || motorState === 'RUNNING_CCW';
        const isFault = motorState === 'FAULT';

        return (
          <g>
            {/* 3 Feeder lines */}
            <line x1="20" y1="0" x2="20" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="40" y1="0" x2="40" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="60" y1="0" x2="60" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="75" y1="40" x2="70" y2="40" stroke="#15803D" strokeWidth={strokeWidth} />

            {/* Motor Stator Shell */}
            <circle
              cx="40"
              cy="48"
              r="26"
              fill={isFault ? "#FEE2E2" : isRunning ? "#DCFCE7" : "#FFFFFF"}
              stroke={isFault ? "#EF4444" : isRunning ? "#16A34A" : strokeColor}
              strokeWidth={isRunning ? "2.5" : strokeWidth}
            />
            <text x="40" y="46" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1E293B">M</text>
            <text x="40" y="58" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569">3 ~</text>

            {/* Rotation Direction Indicator */}
            {motorState === 'RUNNING_CW' && (
              <path
                d="M 24 38 A 18 18 0 0 1 56 38"
                fill="none"
                stroke="#16A34A"
                strokeWidth="2.5"
                markerEnd="url(#arrow-green)"
              />
            )}
            {motorState === 'RUNNING_CCW' && (
              <path
                d="M 56 38 A 18 18 0 0 0 24 38"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                markerEnd="url(#arrow-blue)"
              />
            )}
          </g>
        );
      }

      // === BORNE DE PASO ===
      case 'terminal_block':
        return (
          <g>
            <line x1="15" y1="0" x2="15" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle cx="15" cy="20" r="5" fill="#F1F5F9" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="15" y1="25" x2="15" y2="40" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      default:
        return (
          <rect x="0" y="0" width={width} height={height} fill="#F8FAFC" stroke={strokeColor} strokeWidth="1" />
        );
    }
  };

  return (
    <g
      transform={`translate(${component.x}, ${component.y}) rotate(${component.rotation})`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={isSimulating ? 'cursor-pointer select-none' : 'select-none'}
    >
      {/* Component Symbol Graphics */}
      {renderSymbolGraphic()}

      {/* Visible Tag / Label */}
      <text
        x={width / 2}
        y={height + 12}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill={isSelected ? '#2563EB' : '#1E293B'}
        className="font-mono select-none"
      >
        {component.tag}
      </text>

      {/* Terminal Port Markers */}
      {def.ports.map((port) => {
        const termId = `${component.id}:${port.name}`;
        const pot = terminalPotentials[termId];
        const isPotEnergized = pot && (pot.has24V || pot.hasL1 || pot.hasL2 || pot.hasL3);

        return (
          <g key={port.name}>
            {/* Terminal Pin Number */}
            <text
              x={port.relX > width / 2 ? port.relX + 6 : port.relX - 6}
              y={port.relY <= 10 ? port.relY + 8 : port.relY - 4}
              textAnchor={port.relX > width / 2 ? 'start' : 'end'}
              fontSize="7"
              fill="#64748B"
              className="font-mono select-none"
            >
              {port.name}
            </text>

            {/* Connection snap circle */}
            <circle
              cx={port.relX}
              cy={port.relY}
              r="2.5"
              fill={isPotEnergized ? '#10B981' : isSimulating ? '#64748B' : '#FFFFFF'}
              stroke={isPotEnergized ? '#059669' : '#475569'}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </g>
  );
};
