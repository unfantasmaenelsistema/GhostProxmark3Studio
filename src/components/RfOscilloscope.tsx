import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Radio, 
  Layers, 
  Terminal, 
  Download,
  Info
} from 'lucide-react';

interface RfOscilloscopeProps {
  onExecuteCommand: (cmd: string) => void;
}

export const RfOscilloscope: React.FC<RfOscilloscopeProps> = ({ onExecuteCommand }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [modulation, setModulation] = useState<'manchester' | 'fsk' | 'biphase' | 'subcarrier'>('manchester');
  const [frequencyMode, setFrequencyMode] = useState<'lf' | 'hf'>('lf');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(0);
  const [noiseLevel, setNoiseLevel] = useState<number>(15);
  const [timeOffset, setTimeOffset] = useState<number>(0);

  // Generate synthetic demodulated RF signal samples based on modulation mode
  const generateSamples = (count: number, offset: number) => {
    const samples: number[] = [];
    const bitSequence = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1];
    const bitDuration = 40; // samples per bit

    for (let i = 0; i < count; i++) {
      const globalIdx = (i + offset) % (bitSequence.length * bitDuration);
      const bitIdx = Math.floor(globalIdx / bitDuration);
      const bitProgress = (globalIdx % bitDuration) / bitDuration;
      const currentBit = bitSequence[bitIdx];

      let rawVal = 0;

      if (modulation === 'manchester') {
        // Manchester: 0 = low then high, 1 = high then low
        const isFirstHalf = bitProgress < 0.5;
        const level = currentBit === 1 ? (isFirstHalf ? 1 : -1) : (isFirstHalf ? -1 : 1);
        rawVal = level * 80;
      } else if (modulation === 'fsk') {
        // FSK (e.g. HID Prox): bit 0 = 125/10 kHz, bit 1 = 125/8 kHz
        const freq = currentBit === 1 ? 0.35 : 0.18;
        rawVal = Math.sin(i * freq) * 85;
      } else if (modulation === 'biphase') {
        // Biphase / FM0 (Indala)
        const phase = currentBit === 1 ? Math.sin(bitProgress * Math.PI * 2) : Math.sin(bitProgress * Math.PI);
        rawVal = phase * 80;
      } else {
        // HF Subcarrier 848 kHz (ISO 14443-A)
        const carrier = Math.sin(i * 0.8);
        const envelope = currentBit === 1 ? 1 : 0.3;
        rawVal = carrier * envelope * 85;
      }

      // Add controlled ADC analog noise
      const noise = (Math.random() - 0.5) * noiseLevel;
      samples.push(rawVal + noise);
    }
    return samples;
  };

  // Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Dark oscilloscope background with phosphorescent grid
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#111d2e';
      ctx.lineWidth = 1;

      // Vertical divisions
      const vGrid = 40 * zoomLevel;
      for (let x = 0; x < width; x += vGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal divisions
      const hGrid = 30;
      for (let y = 0; y < height; y += hGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Threshold line
      if (threshold !== 0) {
        ctx.strokeStyle = '#f59e0b88';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, midY - threshold);
        ctx.lineTo(width, midY - threshold);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Signal Trace
      const sampleCount = Math.floor(width / zoomLevel);
      const samples = generateSamples(sampleCount, isPlaying ? timeOffset : 0);

      // Glowing phosphor trace
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let x = 0; x < samples.length; x++) {
        const drawX = x * zoomLevel;
        const drawY = midY - samples[x];
        if (x === 0) {
          ctx.moveTo(drawX, drawY);
        } else {
          ctx.lineTo(drawX, drawY);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Animate time offset when playing
      if (isPlaying) {
        setTimeOffset((prev) => (prev + 2) % 6400);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, modulation, zoomLevel, threshold, noiseLevel, timeOffset]);

  const handleCaptureFromHardware = () => {
    if (frequencyMode === 'lf') {
      onExecuteCommand('data getraw');
    } else {
      onExecuteCommand('hf 14a raw -p -c');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Modes Header */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Osciloscopio de Señal RF (`data plot`)
            </h1>
            <p className="text-xs text-slate-400">
              Analizador de formas de onda brutas del FPGA del Proxmark3 para ingeniería inversa de señales desconocidas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFrequencyMode(frequencyMode === 'lf' ? 'hf' : 'lf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              frequencyMode === 'lf'
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                : 'bg-cyan-950/40 border-cyan-600/50 text-cyan-300'
            }`}
          >
            {frequencyMode === 'lf' ? <Radio className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            <span>Banda: {frequencyMode === 'lf' ? 'LF (125 kHz)' : 'HF (13.56 MHz)'}</span>
          </button>

          <button
            onClick={handleCaptureFromHardware}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Muestrear FPGA (`data getraw`)</span>
          </button>
        </div>
      </div>

      {/* Main Oscilloscope Screen */}
      <div className="bg-[#060a12] border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-4">
        {/* Top Scope Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2.5 px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
              <span>{isPlaying ? 'TRIGGER: AUTO (CAPTURA EN VIVO)' : 'PAUSA (HOLD)'}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">MOD: {modulation.toUpperCase()}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">ADC: 8-BIT 125 kS/s</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700"
              title={isPlaying ? 'Congelar señal' : 'Reanudar señal'}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5 text-rose-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700"
              title="Disminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas Element */}
        <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800">
          <canvas
            ref={canvasRef}
            width={960}
            height={320}
            className="w-full h-full block"
          />
        </div>

        {/* Oscilloscope Controls & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Modulation Preset */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tipo de Modulación RF
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                onClick={() => setModulation('manchester')}
                className={`p-1.5 rounded text-center transition-all ${
                  modulation === 'manchester' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Manchester (EM)
              </button>
              <button
                onClick={() => setModulation('fsk')}
                className={`p-1.5 rounded text-center transition-all ${
                  modulation === 'fsk' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                FSK (HID Prox)
              </button>
              <button
                onClick={() => setModulation('biphase')}
                className={`p-1.5 rounded text-center transition-all ${
                  modulation === 'biphase' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Biphase (Indala)
              </button>
              <button
                onClick={() => setModulation('subcarrier')}
                className={`p-1.5 rounded text-center transition-all ${
                  modulation === 'subcarrier' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Subcarrier (14A)
              </button>
            </div>
          </div>

          {/* Noise filter */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Filtro de Ruido Analógico:</span>
              <span className="font-mono text-cyan-400">{noiseLevel}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Simula la relación señal-ruido (SNR) de la bobina física.
            </span>
          </div>

          {/* Comparator threshold */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Umbral de Disparo (Trigger):</span>
              <span className="font-mono text-amber-400">{threshold} mV</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Ajusta la línea de corte para la decodificación digital binaria.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
