import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Radio, 
  Layers, 
  Terminal, 
  HardDrive, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Shield,
  Binary,
  Flame,
  Database
} from 'lucide-react';
import { ConnectionMode, DeviceInfo } from '../types/proxmark';
import { FantasmaLogo } from './FantasmaLogo';
import { SignalHeatmap } from './SignalHeatmap';
import { BinaryStreamAnalyzer } from './BinaryStreamAnalyzer';

interface HardwareOverviewProps {
  deviceInfo: DeviceInfo;
  connectionMode: ConnectionMode;
  onExecuteCommand: (cmd: string) => void;
  onNavigateTab: (tab: string) => void;
  isExecuting: boolean;
}

export const HardwareOverview: React.FC<HardwareOverviewProps> = ({
  deviceInfo,
  connectionMode,
  onExecuteCommand,
  onNavigateTab,
  isExecuting,
}) => {
  const [telemetryTab, setTelemetryTab] = useState<'both' | 'heatmap' | 'analyzer'>('both');

  return (
    <div className="space-y-6">
      {/* Hero Hardware Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Hardware Operativo & Sintonizado
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Proxmark3 RDV4.01 <span className="text-cyan-400 font-mono text-lg font-normal">Iceman Edition</span>
            </h1>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Dispositivo de investigación y auditoría de seguridad RFID/NFC de doble frecuencia. Controla el hardware directamente desde tu navegador en Windows y Linux.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-slate-400">
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                Firmware: {deviceInfo.version}
              </span>
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                FPGA: {deviceInfo.fpgaImage}
              </span>
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                Modo: {connectionMode === 'serial' ? 'Web Serial (COM)' : connectionMode === 'hid' ? 'WebHID Directo' : connectionMode === 'virtual' ? 'Emulador Virtual' : 'Desconectado'}
              </span>
              <span className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-cyan-300">
                Dispositivo: {deviceInfo.portName || (connectionMode === 'hid' ? 'USB HID' : 'Serial USB')}
              </span>
            </div>
          </div>

          {/* Quick Action Diagnostic Group */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => onExecuteCommand('hw status')}
              disabled={isExecuting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verificar Estado (`hw status`)</span>
            </button>

            <button
              onClick={() => onExecuteCommand('hw tune')}
              disabled={isExecuting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm shadow-cyan-950"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Medir Antena (`hw tune`)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Voltaje LF (125 kHz)</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {deviceInfo.lfVoltage} V
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
            Resonancia Óptima
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Voltaje HF (13.56 MHz)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {deviceInfo.hfVoltage} V
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
            Acoplamiento Nominal
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Memoria Flash / MCU</span>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1">
            512 KB
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            AT91SAM7S512
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Velocidad UART</span>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1 tabular-nums">
            {deviceInfo.baudRate}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Baudios (High Speed)
          </span>
        </div>
      </div>

      {/* Telemetry Hub Header & Selector: Signal Heatmap + Binary Stream Analyzer */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Diagnóstico en Vivo: Señal RF & Análisis de Protocolos
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono self-start sm:self-auto">
            <button
              onClick={() => setTelemetryTab('both')}
              className={`px-3 py-1 rounded transition-all ${
                telemetryTab === 'both'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vista Completa (Ambos)
            </button>
            <button
              onClick={() => setTelemetryTab('heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                telemetryTab === 'heatmap'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Mapa de Calor D3</span>
            </button>
            <button
              onClick={() => setTelemetryTab('analyzer')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                telemetryTab === 'analyzer'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Analizador Binario</span>
            </button>
          </div>
        </div>

        {/* Telemetry Views Rendering */}
        <div className="space-y-6">
          {(telemetryTab === 'both' || telemetryTab === 'heatmap') && (
            <SignalHeatmap
              connectionMode={connectionMode}
              deviceInfo={deviceInfo}
              onExecuteTune={() => onExecuteCommand('hw tune')}
            />
          )}

          {(telemetryTab === 'both' || telemetryTab === 'analyzer') && (
            <BinaryStreamAnalyzer
              connectionMode={connectionMode}
              onExecuteCommand={onExecuteCommand}
            />
          )}
        </div>
      </div>

      {/* Feature Exploration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LF Suite Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
              Suite LF (125 kHz)
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Calculadora Wiegand 26-bit (H10301) para HID Prox II, decodificador de transpondedores EM4100 y laboratorio T5577.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => onExecuteCommand('lf search')}
              className="text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              `lf search`
            </button>
            <button
              onClick={() => onNavigateTab('lf')}
              className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              <span>Abrir LF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HF Suite Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
              Suite HF (13.56 MHz)
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Recuperación automatizada de llaves Mifare Classic 1K/4K (Autopwn, Nested, Hardnested) y tarjetas chinas mágicas CUID.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => onExecuteCommand('hf search')}
              className="text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              `hf search`
            </button>
            <button
              onClick={() => onNavigateTab('hf')}
              className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              <span>Abrir HF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tag Library Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
              Biblioteca de Tags
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Base de datos consultable de chips RFID/NFC, mapas de bloques EEPROM, identificador por ATQA/SAK y cheatsheet.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              10 Familias
            </span>
            <button
              onClick={() => onNavigateTab('tags')}
              className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300"
            >
              <span>Biblioteca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hex Dumps & Automation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
              Visor Hex & Scripts
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Inspección interactiva de 64 bloques con decodificador de condiciones de acceso C1-C2-C3 y exportación a `.eml` / `.bin`.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('dump')}
              className="text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              Visor Hex
            </button>
            <button
              onClick={() => onNavigateTab('terminal')}
              className="flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300"
            >
              <span>Consola</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Community & Creator Spotlight Banner: Un Fantasma En El Sistema */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0d1424] to-slate-950 border border-slate-800/90 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-1 rounded-2xl bg-slate-900/80 border border-slate-800 shrink-0">
            <FantasmaLogo size={56} />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Un Fantasma En El Sistema
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                Seguridad & Hardware Hacking
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Explora tutoriales en profundidad, análisis de radiofrecuencia (RFID/NFC), guías de Proxmark3 y artículos sobre ciberseguridad ofensiva y defensiva.
            </p>
          </div>
        </div>

        <a
          href="https://www.unfantasmaenelsistema.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition-all shadow-sm shrink-0 whitespace-nowrap"
        >
          <span>Visitar unfantasmaenelsistema.com</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
