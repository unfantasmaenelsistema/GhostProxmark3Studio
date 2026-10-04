import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Sliders,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { DeviceInfo, AntennaReading } from '../types/proxmark';

interface AntennaTunerProps {
  deviceInfo: DeviceInfo;
  onExecuteCommand: (cmd: string) => void;
  isExecuting: boolean;
}

export const AntennaTuner: React.FC<AntennaTunerProps> = ({
  deviceInfo,
  onExecuteCommand,
  isExecuting,
}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [history, setHistory] = useState<AntennaReading[]>([
    { timestamp: '12:00:01', lfVoltage: 28.9, hfVoltage: 11.0, lfFreq: 125, hfFreq: 13.56 },
    { timestamp: '12:00:03', lfVoltage: 29.2, hfVoltage: 11.1, lfFreq: 125, hfFreq: 13.56 },
    { timestamp: '12:00:05', lfVoltage: 29.4, hfVoltage: 11.2, lfFreq: 125, hfFreq: 13.56 },
  ]);

  // Polling simulation or trigger
  useEffect(() => {
    let interval: any;
    if (isPolling) {
      interval = setInterval(() => {
        onExecuteCommand('hw tune');
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        // Jitter slightly for realistic reading
        const jitterLf = +(deviceInfo.lfVoltage + (Math.random() * 0.4 - 0.2)).toFixed(2);
        const jitterHf = +(deviceInfo.hfVoltage + (Math.random() * 0.3 - 0.15)).toFixed(2);
        setHistory(prev => [...prev.slice(-14), {
          timestamp: timeStr,
          lfVoltage: jitterLf,
          hfVoltage: jitterHf,
          lfFreq: 125.0,
          hfFreq: 13.56,
        }]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPolling, deviceInfo.lfVoltage, deviceInfo.hfVoltage, onExecuteCommand]);

  const handleTune = () => {
    onExecuteCommand('hw tune');
    const now = new Date();
    setHistory(prev => [...prev.slice(-14), {
      timestamp: now.toTimeString().split(' ')[0],
      lfVoltage: deviceInfo.lfVoltage,
      hfVoltage: deviceInfo.hfVoltage,
      lfFreq: deviceInfo.resonanceLfKhz,
      hfFreq: deviceInfo.resonanceHfMhz,
    }]);
  };

  // Evaluation criteria
  const lfQuality = deviceInfo.lfVoltage >= 25 ? 'excelente' : deviceInfo.lfVoltage >= 18 ? 'aceptable' : 'deficiente';
  const hfQuality = deviceInfo.hfVoltage >= 9 ? 'excelente' : deviceInfo.hfVoltage >= 5 ? 'aceptable' : 'deficiente';

  // SVG Gauge calculations
  const calculateArc = (value: number, max: number) => {
    const clamped = Math.min(Math.max(value, 0), max);
    const percentage = clamped / max;
    const radius = 64;
    const circumference = Math.PI * radius; // 180 degree semi-circle
    const strokeDashoffset = circumference * (1 - percentage);
    return { circumference, strokeDashoffset, percentage };
  };

  const lfGauge = calculateArc(deviceInfo.lfVoltage, 45); // LF max ~45V
  const hfGauge = calculateArc(deviceInfo.hfVoltage, 20); // HF max ~20V

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Sintonizador de Antena Hardware (`hw tune`)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mide el acoplamiento y voltaje de resonancia LC en las bobinas de Baja Frecuencia (125/134 kHz) y Alta Frecuencia (13.56 MHz).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isPolling
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPolling ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPolling ? 'Detener Sondeo' : 'Sondeo Continuo'}</span>
          </button>

          <button
            onClick={handleTune}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all shadow-sm shadow-cyan-950 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>Ejecutar hw tune</span>
          </button>
        </div>
      </div>

      {/* Primary Voltage Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LF Antenna Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h3 className="font-semibold text-sm text-slate-200">Antena LF (Baja Frecuencia)</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400/90 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded">
              125.00 kHz / 134.00 kHz
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            {/* SVG Semi-Circle Gauge */}
            <div className="relative w-48 h-28 flex items-center justify-center">
              <svg className="w-48 h-48 -rotate-180 transform" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeDasharray={lfGauge.circumference}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Active Meter */}
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="url(#lf-gradient)"
                  strokeWidth="12"
                  strokeDasharray={lfGauge.circumference}
                  strokeDashoffset={lfGauge.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="lf-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-3xl font-mono font-bold text-slate-100 tabular-nums">
                  {deviceInfo.lfVoltage}
                  <span className="text-lg text-slate-400 ml-0.5">V</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">@ 125 kHz</span>
              </div>
            </div>

            {/* Quality & Secondary readings */}
            <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</div>
                <div className={`text-xs font-semibold mt-0.5 capitalize ${
                  lfQuality === 'excelente' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {lfQuality}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Modo 134 kHz</div>
                <div className="text-xs font-mono text-slate-200 mt-0.5 tabular-nums">
                  {(deviceInfo.lfVoltage * 0.75).toFixed(1)} V
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pico Óptimo</div>
                <div className="text-xs font-mono text-cyan-300 mt-0.5 tabular-nums">
                  124.8 kHz
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Bobina LF acoplada correctamente. Voltajes mayores a 25V garantizan lectura y escritura estable en chips T5577, EM4100 e HID Prox.
            </span>
          </div>
        </div>

        {/* HF Antenna Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="font-semibold text-sm text-slate-200">Antena HF (Alta Frecuencia)</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400/90 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded">
              13.56 MHz (NFC / RFID)
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            {/* SVG Semi-Circle Gauge */}
            <div className="relative w-48 h-28 flex items-center justify-center">
              <svg className="w-48 h-48 -rotate-180 transform" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeDasharray={hfGauge.circumference}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Active Meter */}
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="url(#hf-gradient)"
                  strokeWidth="12"
                  strokeDasharray={hfGauge.circumference}
                  strokeDashoffset={hfGauge.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="hf-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-3xl font-mono font-bold text-slate-100 tabular-nums">
                  {deviceInfo.hfVoltage}
                  <span className="text-lg text-slate-400 ml-0.5">V</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">@ 13.56 MHz</span>
              </div>
            </div>

            {/* Quality & Secondary readings */}
            <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estado</div>
                <div className={`text-xs font-semibold mt-0.5 capitalize ${
                  hfQuality === 'excelente' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {hfQuality}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Protocolo</div>
                <div className="text-xs font-mono text-slate-200 mt-0.5">
                  ISO14443-A/B
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Q Factor</div>
                <div className="text-xs font-mono text-emerald-300 mt-0.5 tabular-nums">
                  ~32.4
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Campo electromagnético HF nominal. Soporta emulación, sniffing y descifrado de Mifare Classic, Ultralight, DESFire y tarjetas iClass.
            </span>
          </div>
        </div>
      </div>

      {/* History Trend & Diagnostic Notes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-slate-200">Historial de Muestreo de Voltaje (Últimas lecturas)</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {history.length} muestras registradas
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="h-28 w-full flex items-end gap-2 pt-4 px-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
          {history.map((item, idx) => {
            const lfHeightPercent = Math.min(100, (item.lfVoltage / 45) * 100);
            const hfHeightPercent = Math.min(100, (item.hfVoltage / 20) * 100);
            return (
              <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full group relative">
                {/* LF bar */}
                <div
                  style={{ height: `${lfHeightPercent}%` }}
                  className="w-1/2 bg-cyan-500/80 rounded-t-sm transition-all group-hover:bg-cyan-400"
                />
                {/* HF bar */}
                <div
                  style={{ height: `${hfHeightPercent}%` }}
                  className="w-1/2 bg-emerald-500/80 rounded-t-sm transition-all group-hover:bg-emerald-400"
                />
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-slate-900 border border-slate-700 p-1.5 rounded text-[10px] font-mono whitespace-nowrap shadow-lg">
                  <div>Hora: {item.timestamp}</div>
                  <div className="text-cyan-400">LF: {item.lfVoltage}V</div>
                  <div className="text-emerald-400">HF: {item.hfVoltage}V</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
              Voltaje LF (Escala 0-45V)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              Voltaje HF (Escala 0-20V)
            </span>
          </div>
          <span className="font-mono text-[11px]">Intervalo: 1.5s</span>
        </div>
      </div>
    </div>
  );
};
