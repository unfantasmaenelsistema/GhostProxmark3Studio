import React, { useState } from 'react';
import { 
  Calculator, 
  Cpu, 
  Check, 
  Copy, 
  Play, 
  Terminal, 
  Radio, 
  Sliders, 
  Info,
  ShieldAlert
} from 'lucide-react';

interface T5577CalculatorProps {
  onExecuteCommand: (cmd: string) => void;
}

interface ChipPreset {
  id: string;
  name: string;
  desc: string;
  rfDivider: number;
  modulation: string;
  inverted: boolean;
  maxBlock: number;
  block0Hex: string;
}

const PRESETS: ChipPreset[] = [
  {
    id: 'em4100',
    name: 'EM4100 / EM4102 (Llaveros estándar 125 kHz)',
    desc: 'Modulación ASK Manchester, reloj RF/64. Estándar más común en porteros automáticos y garajes.',
    rfDivider: 64,
    modulation: 'Manchester (Direct)',
    inverted: false,
    maxBlock: 2,
    block0Hex: '00148040',
  },
  {
    id: 'hid_prox_26',
    name: 'HID Prox II (Wiegand 26-bit H10301)',
    desc: 'Modulación FSK2a con división de frecuencia alterna RF/8 y RF/10. Muy usado en accesos corporativos.',
    rfDivider: 50,
    modulation: 'FSK2a',
    inverted: false,
    maxBlock: 3,
    block0Hex: '00107060',
  },
  {
    id: 'indala',
    name: 'Motorola / Indala (Biphase / PSK)',
    desc: 'Modulación de fase PSK con reloj RF/32. Requiere inversión de portadora.',
    rfDivider: 32,
    modulation: 'PSK1',
    inverted: true,
    maxBlock: 4,
    block0Hex: '00081040',
  },
  {
    id: 'awid',
    name: 'AWID (FSK 26/37/50 bits)',
    desc: 'Modulación FSK1b con cabecera de sincronismo extendida.',
    rfDivider: 50,
    modulation: 'FSK1b',
    inverted: false,
    maxBlock: 3,
    block0Hex: '00107060',
  },
  {
    id: 'keri',
    name: 'Keri Systems (Pyramid Series)',
    desc: 'Modulación Manchester RF/32 con bloques protegidos.',
    rfDivider: 32,
    modulation: 'Manchester',
    inverted: false,
    maxBlock: 3,
    block0Hex: '00108040',
  },
];

export const T5577Calculator: React.FC<T5577CalculatorProps> = ({ onExecuteCommand }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('em4100');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  const calculatedCmd = usePassword && customPassword.trim()
    ? `lf t55xx wrbl --blk 0 -d ${activePreset.block0Hex} -p ${customPassword.trim()}`
    : `lf t55xx wrbl --blk 0 -d ${activePreset.block0Hex}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Calculadora de Modulación & Bloque 0 T5577
            </h1>
            <p className="text-xs text-slate-400">
              Configura los 32 bits de control del registro maestro del chip Atmel T5577 para emular cualquier estándar de 125 kHz.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Selector Cards */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Selecciona el Chip / Tarjeta que deseas emular:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/30'
                    : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {preset.block0Hex}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Configuration Breakdown */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Desglose de Bits del Bloque 0:</span>
              <span className="font-mono text-cyan-400">{activePreset.block0Hex}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registro maestro de 32 bits (Página 0, Bloque 0 del T5577).
            </p>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300">
            Target: {activePreset.modulation} (RF/{activePreset.rfDivider})
          </div>
        </div>

        {/* Bit breakdown properties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px]">TIPO DE MODULACIÓN</span>
            <div className="font-semibold text-slate-200">{activePreset.modulation}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px]">DIVISOR DE RELOJ (BIT RATE)</span>
            <div className="font-semibold text-slate-200">RF / {activePreset.rfDivider}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px]">BLOQUE MÁXIMO (MAXBLOCK)</span>
            <div className="font-semibold text-slate-200">Bloque {activePreset.maxBlock}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px]">INVERSIÓN DE PORTADORA</span>
            <div className="font-semibold text-slate-200">{activePreset.inverted ? 'Sí (Inverted)' : 'No'}</div>
          </div>
        </div>

        {/* Password Lock Option */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span>Proteger bloque con contraseña maestra (32-bit Password)</span>
          </label>

          {usePassword && (
            <div className="space-y-1.5 pl-6">
              <span className="text-[11px] text-slate-400 block">
                Introduce la clave en hexadecimal (8 caracteres, ej: <code className="text-cyan-300">12345678</code>):
              </span>
              <input
                type="text"
                maxLength={8}
                placeholder="12345678"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300 w-48 outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>

        {/* Proxmark3 Generated Command */}
        <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Comando Oficial Iceman para Grabar en T5577:
            </span>
            <code className="text-xs sm:text-sm font-mono text-slate-100 font-bold block truncate">
              {calculatedCmd}
            </code>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyToClipboard(calculatedCmd)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors border border-slate-700"
              title="Copiar comando"
            >
              {copiedCmd === calculatedCmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onExecuteCommand(calculatedCmd)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar en PM3</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
