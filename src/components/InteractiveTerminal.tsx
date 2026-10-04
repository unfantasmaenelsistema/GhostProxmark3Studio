import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Terminal as TerminalIcon, 
  Send, 
  Trash2, 
  Download, 
  CornerDownLeft, 
  Sparkles, 
  ChevronRight,
  Copy,
  Check,
  History,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ChevronsDown
} from 'lucide-react';
import { ConsoleLogItem } from '../types/proxmark';

interface InteractiveTerminalProps {
  logs: ConsoleLogItem[];
  onExecuteCommand: (cmd: string) => void;
  onClearLogs: () => void;
  isExecuting: boolean;
}

interface CommandProgressState {
  active: boolean;
  command: string;
  percentage: number;
  label: string;
  isFinished: boolean;
}

const COMMON_COMMANDS = [
  'hw status',
  'hw version',
  'hw tune',
  'lf search',
  'lf hid read',
  'lf em 410xread',
  'lf t55xx detect',
  'hf search',
  'hf 14a info',
  'hf mf autopwn --1k',
  'hf mf chk --1k',
  'hf mfu info',
  'data plot',
];

const STORAGE_KEY = 'pm3_command_history';
const AUTO_SCROLL_KEY = 'pm3_terminal_auto_scroll';
const DEFAULT_INITIAL_HISTORY = [
  'hf search',
  'lf search',
  'hw tune',
  'hw status',
  'hw version',
];

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  logs,
  onExecuteCommand,
  onClearLogs,
  isExecuting,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  
  // History state: index -1 means currently writing a fresh command / draft
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return DEFAULT_INITIAL_HISTORY;
  });

  // Stores the temporary uncommitted draft when user starts navigating history
  const [draftVal, setDraftVal] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Command Execution Progress State
  const [progressState, setProgressState] = useState<CommandProgressState | null>(null);

  // User-configurable auto-scroll toggle state (persisted to localStorage)
  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SCROLL_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAutoScroll = () => {
    setAutoScroll((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_SCROLL_KEY, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      if (next) {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      return next;
    });
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync command history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commandHistory.slice(0, 100)));
    } catch (e) {
      // ignore storage quota error
    }
  }, [commandHistory]);

  // Command Progress Parser based on live logs output
  useEffect(() => {
    const lastInputIdx = logs.map(l => l.type).lastIndexOf('input');
    if (lastInputIdx === -1) {
      if (!isExecuting) {
        setProgressState(null);
      }
      return;
    }

    const lastInputLog = logs[lastInputIdx];
    const rawCmd = lastInputLog.text.replace(/^\[usb\]\s*pm3\s*-->\s*/i, '').trim();
    const lowerCmd = rawCmd.toLowerCase();

    // All logs that arrived after this command was issued
    const subsequentLogs = logs.slice(lastInputIdx + 1);
    const combinedRecentText = subsequentLogs.map(l => l.text).join('\n');

    let percentage = 0;
    let label = `Ejecutando: ${rawCmd}...`;
    let isFinished = !isExecuting;

    if (lowerCmd.includes('autopwn')) {
      if (combinedRecentText.includes('All 16 sectors unlocked') || combinedRecentText.includes('dump.bin')) {
        percentage = 100;
        label = '¡Autopwn completado con éxito! 16/16 sectores descifrados';
        isFinished = true;
      } else if (combinedRecentText.includes('Nested attack')) {
        percentage = 88;
        label = 'Ataque Nested sobre sectores restantes (PRNG)...';
      } else if (combinedRecentText.includes('Sector 03')) {
        percentage = 75;
        label = 'Descifrando Sector 03 / 16...';
      } else if (combinedRecentText.includes('Sector 02')) {
        percentage = 60;
        label = 'Descifrando Sector 02 / 16...';
      } else if (combinedRecentText.includes('Sector 01')) {
        percentage = 45;
        label = 'Descifrando Sector 01 / 16...';
      } else if (combinedRecentText.includes('Sector 00')) {
        percentage = 30;
        label = 'Descifrando Sector 00 con llaves estándar...';
      } else if (combinedRecentText.includes('Loading default dictionary')) {
        percentage = 18;
        label = 'Probando diccionario estándar de 52 llaves...';
      } else if (combinedRecentText.includes('Auto-pwn starting')) {
        percentage = 10;
        label = 'Iniciando ataque autopwn en Mifare Classic 1K...';
      } else {
        percentage = isExecuting ? 15 : 100;
        label = isExecuting ? 'Iniciando ataque autopwn...' : 'Autopwn finalizado';
      }
    } else if (lowerCmd.includes('hw tune')) {
      if (combinedRecentText.includes('Displaying resonance') || combinedRecentText.includes('tuned to')) {
        percentage = 100;
        label = 'Sintonización de antenas completada (LF & HF óptimos)';
        isFinished = true;
      } else if (combinedRecentText.includes('HF antenna')) {
        percentage = 85;
        label = 'Midiendo resonancia de antena HF (13.56 MHz)...';
      } else if (combinedRecentText.includes('LF antenna')) {
        percentage = 50;
        label = 'Midiendo resonancia de antena LF (125 kHz)...';
      } else if (combinedRecentText.includes('Measuring antenna')) {
        percentage = 25;
        label = 'Midiendo características de antenas LC...';
      } else {
        percentage = isExecuting ? 30 : 100;
        label = isExecuting ? 'Sintonizando antenas...' : 'hw tune completado';
      }
    } else if (lowerCmd.includes('lf search') || lowerCmd.includes('hf search') || lowerCmd.includes('info')) {
      if (combinedRecentText.includes('Valid') || combinedRecentText.includes('Found') || combinedRecentText.includes('types:') || combinedRecentText.includes('Proprietary') || combinedRecentText.includes('IC Type')) {
        percentage = 100;
        label = 'Transpondedor detectado e identificado correctamente';
        isFinished = true;
      } else if (combinedRecentText.includes('Raw:') || combinedRecentText.includes('Tag ID')) {
        percentage = 80;
        label = 'Decodificando trama y payload de tarjeta...';
      } else if (combinedRecentText.includes('Searching') || combinedRecentText.includes('NOTE:')) {
        percentage = 40;
        label = 'Escaneando frecuencias de radio RFID...';
      } else {
        percentage = isExecuting ? 35 : 100;
        label = isExecuting ? 'Buscando transpondedores...' : 'Búsqueda finalizada';
      }
    } else if (lowerCmd.includes('clone') || lowerCmd.includes('wipe') || lowerCmd.includes('wrbl') || lowerCmd.includes('csetuid')) {
      if (combinedRecentText.includes('SUCCESS') || combinedRecentText.includes('OK')) {
        percentage = 100;
        label = '¡Operación de escritura y verificación exitosa!';
        isFinished = true;
      } else if (combinedRecentText.includes('Verifying')) {
        percentage = 85;
        label = 'Verificando lectura del chip tras escritura...';
      } else if (combinedRecentText.includes('Writing block 02') || combinedRecentText.includes('part 2')) {
        percentage = 70;
        label = 'Escribiendo bloque 02...';
      } else if (combinedRecentText.includes('Writing block 01') || combinedRecentText.includes('part 1')) {
        percentage = 50;
        label = 'Escribiendo bloque 01...';
      } else if (combinedRecentText.includes('Writing block 00') || combinedRecentText.includes('Mode:')) {
        percentage = 30;
        label = 'Escribiendo configuración en bloque 0...';
      } else {
        percentage = isExecuting ? 25 : 100;
        label = isExecuting ? 'Escribiendo en chip...' : 'Escritura completada';
      }
    } else {
      if (combinedRecentText.includes('OK') || (!isExecuting && subsequentLogs.length > 0)) {
        percentage = 100;
        label = 'Comando ejecutado con éxito';
        isFinished = true;
      } else {
        percentage = isExecuting ? 50 : 100;
        label = isExecuting ? `Procesando: ${rawCmd}...` : 'Comando finalizado';
      }
    }

    if (isExecuting) {
      setProgressState({
        active: true,
        command: rawCmd,
        percentage: Math.min(percentage, 95),
        label,
        isFinished: false,
      });
    } else if (progressState?.active) {
      setProgressState({
        active: true,
        command: rawCmd,
        percentage: 100,
        label: label.includes('éxito') || label.includes('completad') ? label : `Comando '${rawCmd}' finalizado con éxito`,
        isFinished: true,
      });

      const timer = setTimeout(() => {
        setProgressState(null);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [logs, isExecuting]);

  // Auto scroll to bottom whenever logs update (only if autoScroll is enabled)
  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Move cursor to the end of input
  const moveCursorToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
        inputRef.current.focus();
      }
    });
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    // Update command history: remove duplicate if exists and place at the top (index 0)
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== trimmed);
      return [trimmed, ...filtered].slice(0, 100);
    });

    // Reset history pointer and draft
    setHistoryIndex(-1);
    setDraftVal('');

    // Execute through PM3 engine or Web Serial
    onExecuteCommand(trimmed);
    setInputVal('');
  };

  // Keyboard navigation for ArrowUp, ArrowDown and Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (commandHistory.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();

      // If we are at the initial prompt (index -1), save the current typing as draft
      if (historyIndex === -1) {
        setDraftVal(inputVal);
      }

      // Move older in history (0 -> 1 -> 2 ... length - 1)
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
        moveCursorToEnd();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (historyIndex > 0) {
        // Move newer in history (e.g. 2 -> 1 -> 0)
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
        moveCursorToEnd();
      } else if (historyIndex === 0) {
        // Exited history back to user's unsubmitted draft
        setHistoryIndex(-1);
        setInputVal(draftVal);
        moveCursorToEnd();
      }
    } else if (e.key === 'Escape') {
      // Escape key cancels history browsing and restores original draft
      if (historyIndex !== -1) {
        e.preventDefault();
        setHistoryIndex(-1);
        setInputVal(draftVal);
        moveCursorToEnd();
      }
    }
  };

  const handleClearHistory = () => {
    setCommandHistory([]);
    setHistoryIndex(-1);
    setDraftVal('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setShowHistoryModal(false);
  };

  const handleSelectFromHistory = (cmd: string) => {
    setInputVal(cmd);
    setHistoryIndex(-1);
    setShowHistoryModal(false);
    moveCursorToEnd();
  };

  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [copiedAllLogs, setCopiedAllLogs] = useState<boolean>(false);

  const handleExportLogs = () => {
    if (logs.length === 0) {
      setExportFeedback('No hay logs para exportar.');
      setTimeout(() => setExportFeedback(null), 2500);
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `proxmark3_log_${fileTime}.txt`;

    const divider = '='.repeat(80);
    const subDivider = '-'.repeat(80);

    const fileLines: string[] = [
      divider,
      'PROXMARK3 WEB STUDIO - REGISTRO DE SESIÓN / CONSOLE LOG',
      divider,
      `Fecha y hora de exportación : ${dateStr}`,
      `Cliente y Firmware           : Proxmark3 Client v4.18967 (Iceman Edition)`,
      `Proyecto y Documentación    : https://www.unfantasmaenelsistema.com/`,
      `Total de entradas de registro: ${logs.length}`,
      subDivider,
      '',
    ];

    logs.forEach((log) => {
      const timeTag = `[${log.timestamp}]`;
      const content = log.text;
      fileLines.push(`${timeTag} ${content}`);
    });

    fileLines.push('');
    fileLines.push(divider);
    fileLines.push('FIN DEL REGISTRO DE SESIÓN / END OF SESSION LOG');
    fileLines.push(divider);

    const fullContent = fileLines.join('\r\n');
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportFeedback(`¡Descargado como ${filename}!`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const handleCopyAllLogs = () => {
    if (logs.length === 0) return;
    const text = logs.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAllLogs(true);
    setTimeout(() => setCopiedAllLogs(false), 2000);
  };

  const handleCopyLine = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  // Format line styling based on Proxmark3 prefix
  const renderLogLine = (log: ConsoleLogItem) => {
    const text = log.text;
    const lines = text.split('\n');

    return (
      <div key={log.id} className="group relative flex items-start gap-2 py-0.5 hover:bg-slate-900/60 px-2 rounded">
        <span className="text-[10px] text-slate-400 select-none tabular-nums shrink-0 pt-0.5">
          {log.timestamp}
        </span>

        <div className="flex-1 font-mono text-xs break-all leading-relaxed whitespace-pre-wrap">
          {lines.map((line, idx) => {
            let textColor = 'text-slate-200';
            if (line.startsWith('[+]')) {
              textColor = 'text-emerald-400';
            } else if (line.startsWith('[-]')) {
              textColor = 'text-rose-400';
            } else if (line.startsWith('[=]')) {
              textColor = 'text-cyan-400';
            } else if (line.startsWith('[?]')) {
              textColor = 'text-amber-400';
            } else if (line.startsWith('[!]')) {
              textColor = 'text-purple-400';
            } else if (line.startsWith('[usb] pm3 -->')) {
              textColor = 'text-cyan-300 font-bold';
            }

            return (
              <div key={idx} className={textColor}>
                {line}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => handleCopyLine(log.id, log.text)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-slate-300 shrink-0"
          title="Copiar línea"
        >
          {copiedLogId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Terminal y Consola Interactiva Proxmark3
            </h2>
            <p className="text-xs text-slate-400">
              Emulación directa de la CLI de Iceman con historial con flechas Arriba/Abajo, resaltado de sintaxis y accesos directos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* User-configurable Auto-Scroll Toggle */}
          <button
            onClick={toggleAutoScroll}
            title={
              autoScroll
                ? 'Auto-scroll activo: la consola baja automáticamente al llegar nuevos logs (clic para desactivar y leer logs anteriores)'
                : 'Auto-scroll pausado: inspección manual de logs históricos sin saltos forzados (clic para activar)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              autoScroll
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 shadow-sm shadow-cyan-950/40'
                : 'bg-amber-950/50 text-amber-300 border-amber-600/60 hover:bg-amber-900/40'
            }`}
          >
            <ArrowDownToLine className={`w-3.5 h-3.5 ${autoScroll ? 'text-cyan-400' : 'text-amber-400'}`} />
            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          {/* Export feedback toast */}
          {exportFeedback && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-1 rounded-md animate-fade-in flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{exportFeedback}</span>
            </span>
          )}

          {/* History drawer button */}
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            title="Ver lista de comandos del historial"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Historial ({commandHistory.length})</span>
          </button>

          {/* Copy all logs button */}
          <button
            onClick={handleCopyAllLogs}
            disabled={logs.length === 0}
            title="Copiar todo el texto de los logs al portapapeles"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {copiedAllLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedAllLogs ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* Export to .txt file button */}
          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            title="Descargar historial de logs en archivo .txt"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:text-cyan-100 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 rounded-lg transition-all shadow-sm shadow-cyan-950/40 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar (.txt)</span>
          </button>

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 rounded-lg transition-colors"
            title="Limpiar pantalla de consola"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider shrink-0 font-mono">
          Rápidos:
        </span>
        {COMMON_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setInputVal(cmd);
              moveCursorToEnd();
            }}
            disabled={isExecuting}
            className="px-2.5 py-1 font-mono text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Live Command Execution Progress Bar */}
      {progressState && progressState.active && (
        <div className={`p-3 rounded-xl border shadow-lg space-y-2 transition-all ${
          progressState.isFinished
            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-slate-900/95 border-cyan-500/40 shadow-cyan-950/30'
        }`}>
          <div className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {!progressState.isFinished ? (
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-75"></span>
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 relative" />
                </div>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-semibold text-xs ${
                    progressState.isFinished ? 'text-emerald-300' : 'text-slate-100'
                  }`}>
                    {progressState.label}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded shrink-0">
                    pm3 &gt; {progressState.command}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-mono text-xs font-bold tabular-nums ${
                progressState.isFinished ? 'text-emerald-400' : 'text-cyan-400'
              }`}>
                {progressState.percentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800/80">
            <div
              style={{ width: `${progressState.percentage}%` }}
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                progressState.isFinished
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
              }`}
            />
          </div>
        </div>
      )}

      {/* Terminal Viewport */}
      <div className="bg-[#080d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px] relative">
        {/* Terminal Titlebar */}
        <div className="h-8 bg-slate-950/90 border-b border-slate-800/80 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              proxmark3@client: [usb] pm3
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-scroll Paused Status Tag */}
            {!autoScroll && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 rounded flex items-center gap-1">
                <span>⏸️ Auto-scroll Pausado</span>
              </span>
            )}

            {/* Active History Navigation Badge */}
            {historyIndex !== -1 && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded">
                <span>Historial: {historyIndex + 1} / {commandHistory.length}</span>
                <span className="text-slate-400">(Esc para cancelar)</span>
              </div>
            )}
            <span className="text-[10px] font-mono text-cyan-400">
              {logs.length} líneas
            </span>
          </div>
        </div>

        {/* Console Log Area */}
        <div className="flex-1 p-3 overflow-y-auto font-mono space-y-0.5 select-text relative">
          {logs.map((log) => renderLogLine(log))}
          <div ref={terminalEndRef} />
        </div>

        {/* Floating Scroll-to-Bottom Quick Action when Auto-Scroll is OFF */}
        {!autoScroll && logs.length > 5 && (
          <button
            onClick={scrollToBottom}
            title="Bajar al final (último log recibido)"
            className="absolute bottom-16 right-5 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-100 bg-slate-900/95 hover:bg-cyan-600 hover:text-slate-950 border border-cyan-500/50 rounded-full shadow-2xl backdrop-blur-md transition-all group"
          >
            <ChevronsDown className="w-3.5 h-3.5 text-cyan-400 group-hover:text-slate-950 animate-bounce" />
            <span>Bajar al último log</span>
          </button>
        )}

        {/* Command History Drawer Modal Overlay */}
        {showHistoryModal && (
          <div className="absolute inset-x-3 bottom-14 top-10 bg-slate-950/95 border border-slate-800 rounded-xl p-4 z-20 backdrop-blur-md flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-xs text-slate-200">
                  Historial de Comandos ({commandHistory.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {commandHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Borrar Historial
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1 font-mono text-xs">
              {commandHistory.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  No hay comandos previos en el historial.
                </div>
              ) : (
                commandHistory.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectFromHistory(cmd)}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 flex items-center justify-between group transition-colors"
                  >
                    <span className="truncate">{cmd}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 font-sans">
                      #{idx + 1}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              Haz clic en cualquier comando para cargarlo en el prompt, o usa las flechas <b>Arriba</b> / <b>Abajo</b> directamente en la consola.
            </div>
          </div>
        )}

        {/* Input prompt bar */}
        <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-950/90 p-2 flex items-center gap-2">
          <div className="flex items-center text-cyan-400 font-mono text-xs font-semibold pl-2 select-none shrink-0">
            <span>[usb] pm3 --&gt;</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              // If user manually modifies text while browsing history, exit history mode
              if (historyIndex !== -1) {
                setHistoryIndex(-1);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando pm3 (ej: hw tune, lf search, help)..."
            className="flex-1 bg-transparent border-0 outline-none text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:ring-0"
            autoFocus
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isExecuting}
            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-30 shrink-0"
            title="Ejecutar comando (Enter)"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400/90">↑ / ↓</span>
          <span>Navegar en el historial de comandos (como en terminal Bash / PM3).</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-400">Esc</span>
          <span>Restaurar borrador.</span>
        </div>
        <span>Escribe `help` para ver la lista completa.</span>
      </div>
    </div>
  );
};
