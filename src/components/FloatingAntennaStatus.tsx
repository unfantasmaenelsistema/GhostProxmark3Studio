import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders,
  ExternalLink,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { DeviceInfo } from '../types/proxmark';

interface FloatingAntennaStatusProps {
  deviceInfo: DeviceInfo;
  onExecuteCommand: (cmd: string) => void;
  isExecuting: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const FloatingAntennaStatus: React.FC<FloatingAntennaStatusProps> = ({
  deviceInfo,
  onExecuteCommand,
  isExecuting,
  onNavigateTab,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Compute status and estimated VSWR
  const lfV = deviceInfo.lfVoltage;
  const hfV = deviceInfo.hfVoltage;

  // Approximate VSWR based on peak resonant voltage unloaded
  const computeVswr = (voltage: number, optimalVoltage: number) => {
    if (voltage >= optimalVoltage * 0.95) return 1.1;
    if (voltage >= optimalVoltage * 0.8) return 1.3;
    if (voltage >= optimalVoltage * 0.6) return 1.7;
    if (voltage >= optimalVoltage * 0.4) return 2.4;
    return 3.5;
  };

  const lfVswr = computeVswr(lfV, 30.0);
  const hfVswr = computeVswr(hfV, 11.5);

  const lfStatus = lfV >= 26 ? 'optimal' : lfV >= 18 ? 'warning' : 'critical';
  const hfStatus = hfV >= 9.5 ? 'optimal' : hfV >= 6 ? 'warning' : 'critical';

  const overallHealthy = lfStatus === 'optimal' && hfStatus === 'optimal';
  const hasWarning = lfStatus === 'warning' || hfStatus === 'warning';

  const handleTune = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExecuteCommand('hw tune');
  };

  // If fully minimized into tiny pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0b101b]/95 hover:bg-slate-900 border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-md text-xs font-mono text-slate-200 transition-all hover:border-cyan-500/60 group"
          title="Restaurar monitor de salud de antenas"
        >
          <span className={`w-2 h-2 rounded-full ${overallHealthy ? 'bg-emerald-400' : hasWarning ? 'bg-amber-400' : 'bg-rose-500'} animate-pulse`}></span>
          <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] text-slate-300">Antenas: LF {lfV.toFixed(1)}V · HF {hfV.toFixed(1)}V</span>
          <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none animate-fade-in">
      <div className="bg-[#0b101b]/95 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200 w-80">
        {/* Header Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${overallHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : hasWarning ? 'bg-amber-400' : 'bg-rose-500'} animate-pulse`}></span>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Salud de Antenas RF</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick hw tune button */}
            <button
              onClick={handleTune}
              disabled={isExecuting}
              title="Ejecutar hw tune en segundo plano"
              className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Minimize button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              title="Minimizar a píldora"
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
            </button>

            {/* Expand / Collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Compact View Summary: Always visible */}
        <div className="p-3 grid grid-cols-2 gap-2 text-xs font-mono">
          {/* LF Summary */}
          <div className={`p-2 rounded-xl border ${
            lfStatus === 'optimal' 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : lfStatus === 'warning'
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>LF 125 kHz</span>
              <span className={`font-bold ${lfStatus === 'optimal' ? 'text-emerald-400' : lfStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'}`}>
                {lfStatus === 'optimal' ? 'Óptimo' : lfStatus === 'warning' ? 'Regular' : 'Bajo'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-100">{lfV.toFixed(1)} V</span>
              <span className="text-[10px] text-slate-400">~{lfVswr}:1</span>
            </div>
          </div>

          {/* HF Summary */}
          <div className={`p-2 rounded-xl border ${
            hfStatus === 'optimal' 
              ? 'bg-cyan-950/20 border-cyan-500/30' 
              : hfStatus === 'warning'
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>HF 13.56 MHz</span>
              <span className={`font-bold ${hfStatus === 'optimal' ? 'text-cyan-400' : hfStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'}`}>
                {hfStatus === 'optimal' ? 'Óptimo' : hfStatus === 'warning' ? 'Regular' : 'Bajo'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-100">{hfV.toFixed(1)} V</span>
              <span className="text-[10px] text-slate-400">~{hfVswr}:1</span>
            </div>
          </div>
        </div>

        {/* Expanded View Details */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 pt-1 border-t border-slate-800/80 text-xs font-mono animate-fade-in">
            {/* Visual Level Bars */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Acoplamiento LC Baja Frecuencia</span>
                  <span className="text-slate-300 font-bold">{((lfV / 45) * 100).toFixed(0)}% ({lfV}V / 45V)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((lfV / 45) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Acoplamiento LC Alta Frecuencia</span>
                  <span className="text-slate-300 font-bold">{((hfV / 20) * 100).toFixed(0)}% ({hfV}V / 20V)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((hfV / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Technical Parameters */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Resonancia LF:</span>
                <span className="text-slate-200 font-bold">{deviceInfo.resonanceLfKhz} kHz</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Resonancia HF:</span>
                <span className="text-slate-200 font-bold">{deviceInfo.resonanceHfMhz} MHz</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estado Hardware:</span>
                <span className="text-emerald-400 font-bold">RDV4.01 Sintonizado</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleTune}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>hw tune</span>
              </button>

              <button
                onClick={() => onNavigateTab('antenna')}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Abrir Sintonizador</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
