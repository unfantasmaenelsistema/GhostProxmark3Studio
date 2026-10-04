import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileCode, 
  Play, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Radio, 
  ShieldCheck, 
  Terminal,
  Settings,
  ChevronRight,
  Keyboard,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Command,
  Circle,
  StopCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { SCRIPT_TEMPLATES } from '../services/pm3Engine';

export interface QuickMacro {
  id: string;
  name: string;
  shortcut: string; // e.g. 'Alt+1', 'Alt+2'
  description: string;
  commands: string[];
  delayMs: number;
}

const STORAGE_MACROS_KEY = 'pm3_quick_macros';

const DEFAULT_MACROS: QuickMacro[] = [
  {
    id: 'macro-1',
    name: 'Auditoría Express Dual (HF & LF)',
    shortcut: 'Alt+1',
    description: 'Diagnostica resonancia de antenas y sondea chips en 13.56 MHz y 125 kHz.',
    commands: ['hw tune', 'hw status', 'hf search', 'lf search'],
    delayMs: 600,
  },
  {
    id: 'macro-2',
    name: 'Autopwn Rápido MIFARE Classic 1K',
    shortcut: 'Alt+2',
    description: 'Identificación ISO14443-A, verificación de diccionario y ejecución de autopwn.',
    commands: ['hf 14a info', 'hf mf chk --1k -f default_keys.dic', 'hf mf autopwn --1k'],
    delayMs: 700,
  },
  {
    id: 'macro-3',
    name: 'Lectura y Detección T5577 (LF)',
    shortcut: 'Alt+3',
    description: 'Lee transpondedor HID Prox y verifica presencia de chip grabable T5577.',
    commands: ['lf hid read', 'lf t55xx detect'],
    delayMs: 600,
  },
  {
    id: 'macro-4',
    name: 'Volcado Rápido NTAG / Ultralight',
    shortcut: 'Alt+4',
    description: 'Inspecciona chip NFC Forum Type 2 y descarga sus páginas de memoria.',
    commands: ['hf 14a info', 'hf mfu info', 'hf mfu dump'],
    delayMs: 600,
  }
];

interface ScriptAutomationProps {
  onExecuteCommand: (cmd: string) => void;
  isExecuting: boolean;
}

export const ScriptAutomation: React.FC<ScriptAutomationProps> = ({
  onExecuteCommand,
  isExecuting,
}) => {
  const [activeView, setActiveView] = useState<'macros' | 'templates'>('macros');

  // Quick Macros State
  const [macros, setMacros] = useState<QuickMacro[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MACROS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MACROS;
  });

  const [activeMacroRunning, setActiveMacroRunning] = useState<{
    id: string;
    stepIndex: number;
    totalSteps: number;
    currentCommand: string;
  } | null>(null);

  const [macroToast, setMacroToast] = useState<string | null>(null);
  const cancelExecutionRef = useRef<boolean>(false);

  // New Macro Modal / Recorder State
  const [showRecorderModal, setShowRecorderModal] = useState<boolean>(false);
  const [newMacroName, setNewMacroName] = useState<string>('');
  const [newMacroShortcut, setNewMacroShortcut] = useState<string>('Alt+5');
  const [newMacroDesc, setNewMacroDesc] = useState<string>('');
  const [newMacroCommands, setNewMacroCommands] = useState<string[]>(['hw tune']);
  const [newMacroDelay, setNewMacroDelay] = useState<number>(600);
  const [commandInputDraft, setCommandInputDraft] = useState<string>('');

  // Script Templates State (existing)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SCRIPT_TEMPLATES[0].id);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [paramFc, setParamFc] = useState<number>(112);
  const [paramCn, setParamCn] = useState<number>(45021);
  const [paramEmId, setParamEmId] = useState<string>('0102030405');
  const [paramUid, setParamUid] = useState<string>('DEADBEEF');

  // Save macros to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MACROS_KEY, JSON.stringify(macros));
    } catch {
      // ignore
    }
  }, [macros]);

  // Execute sequence of commands
  const executeMacroSequence = useCallback(async (macro: QuickMacro) => {
    if (isExecuting || activeMacroRunning) return;
    cancelExecutionRef.current = false;

    setMacroToast(`⚡ Disparando Macro [${macro.shortcut}]: "${macro.name}"`);
    setTimeout(() => setMacroToast(null), 3500);

    for (let i = 0; i < macro.commands.length; i++) {
      if (cancelExecutionRef.current) {
        break;
      }
      const cmd = macro.commands[i].trim();
      if (!cmd) continue;

      setActiveMacroRunning({
        id: macro.id,
        stepIndex: i + 1,
        totalSteps: macro.commands.length,
        currentCommand: cmd,
      });

      onExecuteCommand(cmd);

      // Delay between steps
      await new Promise(r => setTimeout(r, macro.delayMs));
    }

    setActiveMacroRunning(null);
  }, [isExecuting, activeMacroRunning, onExecuteCommand]);

  const handleStopMacro = () => {
    cancelExecutionRef.current = true;
    setActiveMacroRunning(null);
  };

  // Keyboard shortcut event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      for (const macro of macros) {
        const parts = macro.shortcut.toLowerCase().split('+');
        const altRequired = parts.includes('alt');
        const ctrlRequired = parts.includes('ctrl');
        const shiftRequired = parts.includes('shift');
        const keyPart = parts[parts.length - 1];

        const matchesKey = e.key.toLowerCase() === keyPart.toLowerCase() || e.code.toLowerCase() === `digit${keyPart}` || e.code.toLowerCase() === `key${keyPart}`;
        const matchesModifiers = e.altKey === altRequired && e.ctrlKey === ctrlRequired && e.shiftKey === shiftRequired;

        if (matchesKey && matchesModifiers) {
          e.preventDefault();
          executeMacroSequence(macro);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [macros, executeMacroSequence]);

  // Template handling (existing)
  const activeTemplate = SCRIPT_TEMPLATES.find(t => t.id === selectedTemplateId) || SCRIPT_TEMPLATES[0];

  const resolvedCommand = activeTemplate.command
    .replace(/{FC}/g, paramFc.toString())
    .replace(/{CN}/g, paramCn.toString())
    .replace(/{EM_ID}/g, paramEmId)
    .replace(/{NEW_UID}/g, paramUid)
    .replace(/{BLOCK0_DATA}/g, `${paramUid}3708040001020304050607`);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(resolvedCommand);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 1800);
  };

  const handleRunSequence = async () => {
    const lines = resolvedCommand.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      onExecuteCommand(line.trim());
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const handleDownloadSh = () => {
    const shContent = `#!/usr/bin/env bash
# Proxmark3 Automated Script - Linux
# Generado por Proxmark3 Web Studio

PORT="/dev/ttyACM0"
echo "[+] Conectando a Proxmark3 en $PORT..."

proxmark3 "$PORT" -c "${resolvedCommand.split('\n').join('; ')}"
`;
    const blob = new Blob([shContent], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm3_${activeTemplate.id}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPs1 = () => {
    const psContent = `# Proxmark3 Automated Script - Windows PowerShell
# Generado por Proxmark3 Web Studio

$Port = "COM3"
Write-Host "[+] Conectando a Proxmark3 en $Port..." -ForegroundColor Cyan

& proxmark3.exe $Port -c "${resolvedCommand.split('\n').join('; ')}"
`;
    const blob = new Blob([psContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm3_${activeTemplate.id}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add command to draft
  const handleAddCommandToDraft = () => {
    if (!commandInputDraft.trim()) return;
    setNewMacroCommands(prev => [...prev, commandInputDraft.trim()]);
    setCommandInputDraft('');
  };

  const handleRemoveDraftCommand = (idx: number) => {
    setNewMacroCommands(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveNewMacro = () => {
    if (!newMacroName.trim() || newMacroCommands.length === 0) return;
    const newEntry: QuickMacro = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim(),
      shortcut: newMacroShortcut,
      description: newMacroDesc.trim() || 'Macro personalizada grabada por el usuario.',
      commands: newMacroCommands,
      delayMs: newMacroDelay,
    };
    setMacros(prev => [...prev, newEntry]);
    setShowRecorderModal(false);
    setNewMacroName('');
    setNewMacroDesc('');
    setNewMacroCommands(['hw tune']);
    setMacroToast(`Macro "${newEntry.name}" guardada con éxito (Asignada a ${newEntry.shortcut})`);
    setTimeout(() => setMacroToast(null), 3000);
  };

  const handleDeleteMacro = (id: string) => {
    setMacros(prev => prev.filter(m => m.id !== id));
  };

  const handleResetDefaultMacros = () => {
    setMacros(DEFAULT_MACROS);
    setMacroToast('Macros restablecidas a la configuración inicial por defecto.');
    setTimeout(() => setMacroToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {macroToast && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-500/50 rounded-xl text-xs font-mono text-cyan-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{macroToast}</span>
          </div>
          <span className="text-[10px] text-slate-400">Atajo Global Activo</span>
        </div>
      )}

      {/* Main Header with View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            Automatización, Macros & Generador de Scripts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Graba secuencias de comandos ejecutables por teclado (Quick Macros) o genera scripts batch para Linux (`.sh`) y Windows (`.ps1`).
          </p>
        </div>

        {/* View Switcher: Quick Macros vs Script Templates */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveView('macros')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'macros'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Quick Macros ({macros.length})</span>
          </button>
          <button
            onClick={() => setActiveView('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'templates'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Plantillas (.sh / .ps1)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: QUICK MACROS MANAGER */}
      {activeView === 'macros' && (
        <div className="space-y-6">
          {/* Action Toolbar for Macros */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Receptor de atajos de teclado activo en todo el sistema</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleResetDefaultMacros}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 font-mono transition-colors"
                title="Restaurar las 4 macros predeterminadas"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                <span>Restablecer</span>
              </button>

              <button
                onClick={() => setShowRecorderModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg font-mono transition-all shadow-sm shadow-cyan-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Grabar Nueva Macro</span>
              </button>
            </div>
          </div>

          {/* Active Macro Progress Bar */}
          {activeMacroRunning && (
            <div className="p-4 bg-cyan-950/90 border border-cyan-500/60 rounded-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    EJECUTANDO MACRO · Paso {activeMacroRunning.stepIndex} de {activeMacroRunning.totalSteps}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Comando actual: <span className="text-cyan-400 font-bold">pm3 &gt; {activeMacroRunning.currentCommand}</span>
                </div>
              </div>

              <button
                onClick={handleStopMacro}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shrink-0"
              >
                <StopCircle className="w-4 h-4" />
                <span>Detener Secuencia</span>
              </button>
            </div>
          )}

          {/* Macros Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {macros.map((macro) => {
              const isCurrent = activeMacroRunning?.id === macro.id;

              return (
                <div
                  key={macro.id}
                  className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-cyan-500 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Name and Shortcut Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          <span>{macro.name}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {macro.description}
                        </p>
                      </div>

                      <kbd className="px-2 py-1 bg-slate-950 text-cyan-300 border border-slate-700 rounded-md font-mono text-xs font-bold shrink-0 shadow-inner">
                        {macro.shortcut}
                      </kbd>
                    </div>

                    {/* Commands List preview */}
                    <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                        Secuencia ({macro.commands.length} comandos · {macro.delayMs}ms retardo):
                      </span>
                      <div className="space-y-0.5">
                        {macro.commands.map((cmd, cIdx) => (
                          <div key={cIdx} className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-600 w-3">{cIdx + 1}.</span>
                            <span className="text-cyan-400">pm3 &gt;</span>
                            <span className="truncate">{cmd}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Pulsa <kbd className="text-slate-300 font-bold">{macro.shortcut}</kbd> en cualquier pestaña
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteMacro(macro.id)}
                        title="Eliminar macro"
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => executeMacroSequence(macro)}
                        disabled={isExecuting || !!activeMacroRunning}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Ejecutar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instructions info card */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2 font-mono">
            <div className="text-slate-200 font-bold flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Cómo funcionan los atajos rápidos Quick Macros:</span>
            </div>
            <p className="leading-relaxed">
              Las macros configuradas pueden ser invocadas desde cualquier pestaña de la aplicación utilizando la combinación asignada (<kbd className="text-cyan-300 bg-slate-900 px-1 rounded">Alt+1</kbd>, <kbd className="text-cyan-300 bg-slate-900 px-1 rounded">Alt+2</kbd>, etc.) siempre que no estés escribiendo en un campo de texto. Cada comando se transmite al Proxmark3 con un intervalo de retardo configurable para asegurar que la antena y la CPU del chip estabilicen cada respuesta.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: SCRIPT TEMPLATES (.sh & .ps1) */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template List */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Plantillas Disponibles
            </h3>

            {SCRIPT_TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {tpl.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Script Editor & Generator */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-200">
                  {activeTemplate.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTemplate.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSequence}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Ejecutar Lote</span>
                </button>

                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar</span>
                </button>
              </div>
            </div>

            {/* Dynamic parameter inputs */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-3">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Parámetros de la Secuencia
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Facility Code</label>
                  <input
                    type="number"
                    value={paramFc}
                    onChange={(e) => setParamFc(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
                  <input
                    type="number"
                    value={paramCn}
                    onChange={(e) => setParamCn(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">EM4100 ID (10 Hex)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={paramEmId}
                    onChange={(e) => setParamEmId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mifare UID (8 Hex)</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={paramUid}
                    onChange={(e) => setParamUid(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-cyan-300"
                  />
                </div>
              </div>
            </div>

            {/* Code display */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Secuencia de Comandos Proxmark3
              </span>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed select-all">
                {resolvedCommand}
              </pre>
            </div>

            {/* Export buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadSh}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Bash (.sh para Linux)</span>
              </button>

              <button
                onClick={handleDownloadPs1}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar PowerShell (.ps1 para Windows)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD / CREATE NEW MACRO */}
      {showRecorderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Grabar / Crear Nueva Quick Macro
                </h3>
              </div>
              <button
                onClick={() => setShowRecorderModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Cerrar (Esc)
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nombre de la Macro</label>
                <input
                  type="text"
                  placeholder="Ej: Clonación Rápida EM4100"
                  value={newMacroName}
                  onChange={(e) => setNewMacroName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Atajo de Teclado</label>
                  <select
                    value={newMacroShortcut}
                    onChange={(e) => setNewMacroShortcut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  >
                    <option value="Alt+1">Alt + 1</option>
                    <option value="Alt+2">Alt + 2</option>
                    <option value="Alt+3">Alt + 3</option>
                    <option value="Alt+4">Alt + 4</option>
                    <option value="Alt+5">Alt + 5</option>
                    <option value="Alt+6">Alt + 6</option>
                    <option value="Alt+7">Alt + 7</option>
                    <option value="Alt+8">Alt + 8</option>
                    <option value="Alt+9">Alt + 9</option>
                    <option value="Alt+0">Alt + 0</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Retardo entre comandos</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={200}
                      max={2000}
                      step={100}
                      value={newMacroDelay}
                      onChange={(e) => setNewMacroDelay(parseInt(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <span className="text-cyan-400 font-bold shrink-0">{newMacroDelay}ms</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="Ej: Lee credencial y programa en chip T5577"
                  value={newMacroDesc}
                  onChange={(e) => setNewMacroDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              {/* Commands List in Macro */}
              <div className="space-y-2">
                <label className="block text-[11px] text-slate-400">
                  Secuencia de Comandos ({newMacroCommands.length})
                </label>

                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {newMacroCommands.map((cmd, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-slate-900/80 px-2 py-1 rounded text-[11px]">
                      <span className="text-slate-400">{i + 1}. <span className="text-cyan-300 font-bold">{cmd}</span></span>
                      <button
                        onClick={() => handleRemoveDraftCommand(i)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new command to list */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Comando PM3 (ej: hf mf autopwn --1k)"
                    value={commandInputDraft}
                    onChange={(e) => setCommandInputDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCommandToDraft();
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleAddCommandToDraft}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                  >
                    Añadir
                  </button>
                </div>

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                  <span className="text-slate-600">Sugerencias:</span>
                  {['hw tune', 'hf search', 'lf search', 'hf 14a info', 'lf hid read', 'lf t55xx detect'].map((sug) => (
                    <button
                      key={sug}
                      onClick={() => setNewMacroCommands(prev => [...prev, sug])}
                      className="px-1.5 py-0.5 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-800 rounded text-slate-300"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRecorderModal(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewMacro}
                disabled={!newMacroName.trim() || newMacroCommands.length === 0}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all disabled:opacity-50"
              >
                Guardar Macro ({newMacroShortcut})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
