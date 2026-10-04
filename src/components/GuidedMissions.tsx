import React, { useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Terminal, 
  HelpCircle, 
  Play, 
  Layers, 
  Radio, 
  ShieldCheck, 
  Copy, 
  Check 
} from 'lucide-react';

interface GuidedMissionsProps {
  onExecuteCommand: (cmd: string) => void;
  onNavigateToTab: (tab: string) => void;
}

interface Step {
  title: string;
  command: string;
  explanation: string;
  expectedOutput: string;
}

interface Mission {
  id: string;
  title: string;
  category: 'LF (125 kHz)' | 'HF (13.56 MHz)' | 'Hardware & Diagnóstico';
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  steps: Step[];
}

export const GuidedMissions: React.FC<GuidedMissionsProps> = ({ onExecuteCommand, onNavigateToTab }) => {
  const missions: Mission[] = [
    {
      id: 'mission-1',
      title: 'Misión 1: Clonación de Llavero de Garaje (EM4100 a Atmel T5577)',
      category: 'LF (125 kHz)',
      difficulty: 'Principiante',
      description: 'Aprende el flujo de trabajo estándar para identificar la modulación de un transpondedor de 125 kHz y replicarlo de forma permanente en un chip reescribible T5577.',
      steps: [
        {
          title: '1. Sintonizar antena de baja frecuencia (LF)',
          command: 'hw tune',
          explanation: 'Antes de cualquier lectura, medimos la resonancia para asegurar que el voltaje LF supere los 25 V y no haya desacoplamiento magnético.',
          expectedOutput: '[+] LF antenna: ~29 V @ 125.00 kHz (Optimal)',
        },
        {
          title: '2. Escanear e identificar el chip original',
          command: 'lf search',
          explanation: 'El Proxmark3 prueba modulaciones ASK, FSK y PSK para decodificar la señal. Al detectar EM410x, extraerá el ID hexadecimal de 5 bytes.',
          expectedOutput: '[+] EM 410x ID 0102030405 | Modulación Manchester 64 clocks',
        },
        {
          title: '3. Limpiar y formatear el chip destino T5577',
          command: 'lf t55xx wipe',
          explanation: 'Restaura los bloques del chip T5577 a estado de fábrica para evitar conflictos con contraseñas o modos de modulación previos.',
          expectedOutput: '[+] Writing default configuration to Block 0... OK',
        },
        {
          title: '4. Grabar el ID en el nuevo chip',
          command: 'lf em 410xclone --id 0102030405',
          explanation: 'Configura la modulación Manchester en el Bloque 0 y escribe el preámbulo de 9 unos y el checksum en los bloques 1 y 2.',
          expectedOutput: '[+] Cloning tag with ID 0102030405... SUCCESS',
        },
        {
          title: '5. Verificar la lectura de la tarjeta clonada',
          command: 'lf em 410xread',
          explanation: 'Comprueba que el lector detecta el nuevo chip idéntico al original.',
          expectedOutput: '[+] Valid EM410X ID Found: 0102030405',
        },
      ],
    },
    {
      id: 'mission-2',
      title: 'Misión 2: Auditoría y Ataque Autopwn a Tarjeta MIFARE Classic 1K',
      category: 'HF (13.56 MHz)',
      difficulty: 'Intermedio',
      description: 'Descubre cómo recuperar todas las claves Crypto-1 de una tarjeta mediante la combinación de diccionarios de claves y el ataque estadístico Nested.',
      steps: [
        {
          title: '1. Detectar etiqueta ISO/IEC 14443-A',
          command: 'hf 14a info',
          explanation: 'Verifica la presencia de la tarjeta, tamaño de UID (4 o 7 bytes), ATQA y SAK para corroborar que es MIFARE Classic.',
          expectedOutput: '[+] UID: A4 8F 2B 19 | SAK: 08 [MIFARE Classic 1K]',
        },
        {
          title: '2. Verificar diccionario de claves conocidas',
          command: 'hf mf chk --1k',
          explanation: 'Prueba una lista estándar de contraseñas de fábrica para ver cuántos sectores están abiertos por defecto.',
          expectedOutput: '[+] Found 12 keys using default dictionary',
        },
        {
          title: '3. Lanzar ataque automatizado (Autopwn)',
          command: 'hf mf autopwn --1k',
          explanation: 'Orquesta el ataque Nested: utiliza las claves encontradas para capturar nonces de los sectores restantes y extraer las claves faltantes.',
          expectedOutput: '[+] All 16 sectors unlocked successfully! Saved dump to hf-mf-A48F2B19-dump.bin',
        },
        {
          title: '4. Visualizar el mapa de sectores en el visor Hex',
          command: 'data plot',
          explanation: 'Inspecciona los bloques de datos y trailer en la pestaña Visor Hex para auditar saldos o credenciales.',
          expectedOutput: '[+] DUMP cargado en memoria de sesión',
        },
      ],
    },
    {
      id: 'mission-3',
      title: 'Misión 3: Extracción y Decodificación de Credencial HID Prox II',
      category: 'LF (125 kHz)',
      difficulty: 'Intermedio',
      description: 'Aprende a decodificar una tarjeta corporativa Wiegand 26-bit (formato H10301) y entender el Facility Code y Card Number.',
      steps: [
        {
          title: '1. Búsqueda específica de modulación FSK',
          command: 'lf hid read',
          explanation: 'Activa la demodulación por modulación por desplazamiento de frecuencia (FSK) calibrada para lectores HID.',
          expectedOutput: '[+] HID Prox TAG ID: 2006ec1337 (31337) | Format: H10301 (26-bit)',
        },
        {
          title: '2. Decodificar la trama Wiegand en campos legibles',
          command: 'lf hid clone -w H10301 --fc 104 --cn 31337',
          explanation: 'Calcula las paridades cruzadas par e impar y emula la credencial en un chip T5577.',
          expectedOutput: '[+] Writing HID 26-bit payload... SUCCESS',
        },
      ],
    },
  ];

  const [selectedMissionId, setSelectedMissionId] = useState<string>('mission-1');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const activeMission = missions.find((m) => m.id === selectedMissionId) || missions[0];

  const handleStepExecute = (stepIndex: number, cmd: string) => {
    onExecuteCommand(cmd);
    const key = `${activeMission.id}-${stepIndex}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: true }));
  };

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Laboratorio de Misiones Guiadas (Walkthroughs Prácticos)
            </h1>
            <p className="text-xs text-slate-400">
              Guías paso a paso con ejecución interactiva para dominar auditorías RFID/NFC reales con Proxmark3.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Select Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {missions.map((m) => {
          const isSelected = m.id === selectedMissionId;
          const completedCount = m.steps.filter((_, idx) => completedSteps[`${m.id}-${idx}`]).length;
          const isAllDone = completedCount === m.steps.length;

          return (
            <button
              key={m.id}
              onClick={() => setSelectedMissionId(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all space-y-2.5 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
                  : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-semibold">
                  {m.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {completedCount}/{m.steps.length} pasos
                </span>
              </div>

              <h3 className="font-bold text-xs text-slate-100 line-clamp-1">
                {m.title}
              </h3>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  Dificultad: <b className="text-slate-300">{m.difficulty}</b>
                </span>
                {isAllDone && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Completada</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mission Walkthrough Steps */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{activeMission.title}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {activeMission.description}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {activeMission.steps.map((step, idx) => {
            const isDone = completedSteps[`${activeMission.id}-${idx}`];

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <h3 className="font-semibold text-xs text-slate-100">
                      {step.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => copyToClipboard(step.command)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 text-xs"
                      title="Copiar comando"
                    >
                      {copiedCmd === step.command ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleStepExecute(idx, step.command)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ejecutar Paso</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pl-8">
                  {step.explanation}
                </p>

                <div className="pl-8 pt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono">
                  <span className="text-slate-500 shrink-0">Comando:</span>
                  <code className="text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[11px]">
                    {step.command}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
