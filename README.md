# Circuit Studio (Alternativa a CADe SIMU para macOS)

**Circuit Studio** es un entorno de escritorio profesional de diseño, cableado y simulación interactiva de esquemas de automatismos eléctricos de mando y potencia, optimizado para macOS.

Diseñado para estudiantes, docentes y técnicos de automatización eléctrica que requieren una herramienta moderna, sobria, precisa y 100% offline.

---

## Características Principales

- **Editor CAD Ortogonal**:
  - Lienzo con cuadrícula técnica de 20 px con ajuste magnético (*snap to grid*).
  - Cableado ortogonal inteligente entre terminales y bornes con detección automática de uniones explícitas (*junctions*).
  - Selección individual y en bloque mediante marco (*marquee selection*).
  - Mover, rotar en 90° (<kbd>R</kbd>), duplicar (<kbd>Cmd+D</kbd>) y eliminar (<kbd>Supr</kbd> / <kbd>Backspace</kbd>).
  - Pila de historial con Deshacer (<kbd>Cmd+Z</kbd>) y Rehacer (<kbd>Cmd+Shift+Z</kbd>) mediante transacciones atómicas.
  - Zoom centrado en el cursor con rueda o gesto de trackpad y desplazamiento fluido (*Pan*).

- **Biblioteca Eléctrica Normalizada (Español)**:
  - **Alimentación**: +24V CC, 0V CC (Masa), Red Trifásica funcional (L1, L2, L3, PE).
  - **Protección**: Seccionador tripolar (Q1), Magnetotérmico unipolar (F1), Relé térmico tripolar (F2) con bornes 1-6, contacto de seguridad NC (95-96) y contacto de señalización de avería NA (97-98) con prueba de disparo manual simulado y rearme.
  - **Interruptores y Pulsadores**: Pulsador NA (Marcha S1), Pulsador NC (Paro S0), Seta de Parada de Emergencia enclavada (S_EMERG), Selector de 2 posiciones (SA1).
  - **Bobinas**: Contactor standard (KM1, A1-A2), Temporizador a la conexión TON (KT1, A1-A2 con ajuste t=0.1s..60s), Temporizador a la desconexión TOF (KT2).
  - **Contactos**: Auxiliares NA (13-14), NC (11-12), Contactos principales de potencia tripolares (1-2, 3-4, 5-6), Temporizados NA (67-68) y NC (55-56).
  - **Señalización y Cargas**: Pilotos ópticos (H1..H3 con selector de color: verde, rojo, amarillo, azul, blanco), Zumbador acústico (HA1).
  - **Motores**: Motor asíncrono trifásico (M1, U1-V1-W1-PE) con visualización dinámica de sentido de giro (Horario CW / Antihorario CCW / Detenido / Falta de Fase).

- **Motor de Simulación Determinista**:
  - Compilación del circuito a grafo topológico de redes equipotenciales independiente de coordenadas o DOM.
  - Resolución sincrónica con bucle de relajación de punto fijo y detección de bucles oscilantes.
  - Distinción visual clara entre conductor energizado y carga activa.
  - Detección de cortocircuitos y conflictos de fuentes.
  - Reloj de simulación con paso discreto de 10 ms y multiplicadores de velocidad (0.25×, 0.5×, 1×, 2×).
  - Registro de eventos en tiempo real con marca de tiempo simulada y panel de diagnósticos eléctricos.

- **Proyectos de Ejemplo Incluidos**:
  1. *Marcha y Paro con Auto-mantenimiento*: Estación de control clásica con contacto auxiliar de realimentación KM1:13-14 y lámpara de marcha.
  2. *Arranque Directo con Relé Térmico*: Esquema completo de potencia y mando 24V con protección bimetálica y señalización de sobrecarga.
  3. *Inversión de Giro con Enclavamiento Cruzado*: Control de doble sentido con bloqueo mutuo de seguridad por contactos auxiliares NC.
  4. *Arranque Estrella-Triángulo (Y-Δ)*: Automatismo temporizado con transición automática abierta de contactor estrella a triángulo a los 4.0 segundos.

- **Persistencia y Exportación**:
  - Formato abierto JSON con extensión `.circuit` y versionado de esquema.
  - Exportación vectorial limpia en SVG y rasterizado PNG a 2× para memorias técnicas.
  - Autoguardado y recuperación ante cierres inesperados.

---

## Arquitectura del Código

```text
src/
├── app/                      # Composición de la aplicación e interfaz de usuario
│   ├── App.tsx               # Contenedor principal y coordinación de estado
│   ├── TopBar.tsx            # Barra superior con menús y controles de simulación
│   ├── Canvas.tsx            # Lienzo interactivo SVG de alta resolución
│   ├── LeftSidebar.tsx       # Paleta categorizada con búsqueda y drag/drop
│   ├── RightSidebar.tsx      # Inspector contextual de parámetros y dispositivos
│   ├── BottomPanel.tsx       # Consola de diagnósticos y registro de eventos
│   └── examples.ts           # Circuitos didácticos preconfigurados
├── components-library/       # Definiciones de símbolos y geometría eléctrica
│   ├── types.ts              # Interfaces de definiciones y puertos
│   ├── definitions.ts        # Catálogo de componentes en español
│   └── renderers.tsx         # Renderizadores SVG dinámicos con animación y estados
├── domain/                   # Modelo del documento y reglas de proyecto
│   ├── types.ts              # Esquema de datos (Project, Sheet, Device, Wire, Terminal)
│   ├── geometry.ts           # Cuadrícula, snap, rotación 90° y enrutador ortogonal
│   └── project.ts            # Creación, clonación y gestión de entidades
├── editor/                   # Herramientas del editor y comandos
│   └── history.ts            # Pila de transacciones atómicas para Deshacer / Rehacer
├── simulation/               # Motor de simulación eléctrica discreta
│   ├── types.ts              # Estructuras del grafo y resultados de paso
│   ├── compiler.ts           # Compilación de hoja a red eléctrica topológica
│   ├── solver.ts             # Solucionador determinista de punto fijo y temporizadores
│   └── engine.ts             # Coordinador temporal, pasos y controladores de entrada
├── persistence/              # Almacenamiento y exportación
│   └── file.ts               # Manejo de .circuit, localStorage, SVG y PNG
└── src-tauri/                # Configuración nativa macOS (Tauri 2)
```

---

## Requisitos y Compatibilidad

- **Node.js**: v18+ (recomendado v22+)
- **NPM**: v10+
- **Rust / Cargo**: 1.80+ (para compilar la versión de escritorio nativa Tauri)
- **macOS**: macOS 11.0 Big Sur o superior (compatible nativamente con Apple Silicon M1/M2/M3/M4 y arquitectura Intel x86_64).

---

## Instalación y Ejecución

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/imjustkike/CADeDrawer.git
cd CADeDrawer
npm install
```

### 2. Ejecutar en Modo Desarrollo (Navegador)
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173/`.

### 3. Ejecutar Pruebas Unitarias Automatizadas
```bash
npm test
```

### 4. Compilar Paquete de Producción Web
```bash
npm run build
```

### 5. Ejecutar la Aplicación de Escritorio Nativa macOS (Tauri 2)
```bash
npm run tauri dev
```

### 6. Generar el Paquete .dmg / .app para macOS
```bash
npm run tauri build
```
El instalador generado se ubicará en `src-tauri/target/release/bundle/dmg/`.

---

## Especificación del Modelo de Simulación

1. **Topología**: Cada terminal de componente y unión explícita constituye un nodo eléctrico. Los conductores y contactos cerrados crean ramas de conductividad ideal ($R=0$).
2. **Fuentes y Retornos**: La fuente `+24V` y el retorno `0V` inyectan potenciales a sus nodos de conexión. Las ramas trifásicas propagan las fases funcionales $L_1, L_2, L_3$ y $PE$.
3. **Cargas**: Las bobinas, lámparas y motores evalúan la diferencia de potencial entre sus bornes para determinar su estado de activación, sin cortocircuitar sus terminales.
4. **Dispositivos Vinculados**: Las bobinas y sus contactos asociados se vinculan a través de `deviceId`, lo que garantiza que modificar etiquetas visibles (e.g. renombrar `KM1` a `KM_PRINCIPAL`) conserve intacta la vinculación operativa.
5. **Temporizadores**: Los temporizadores TON incrementan su acumulador de tiempo con el reloj discreto ($dt=10\text{ ms}$). Al alcanzar la consigna, conmutan sus contactos vinculados. Los temporizadores TOF mantienen sus contactos activados tras la pérdida de alimentación durante el intervalo fijado.

---

## Extensiones Previstas para Versiones Posteriores

Las siguientes áreas están documentadas en el roadmap arquitectónico para futuras versiones:
- Módulo PLC con editor de Diagrama de Contactos (Ladder IEC 61131-3).
- Simulación de circuitos neumáticos y electroneumáticos (cilindros, electroválvulas monoestables y biestables).
- Solver analógico diferencial para transitorios RC/RL y curvas de arranque de motores con carga mecánica.
- Sincronización y trabajo colaborativo en red.
