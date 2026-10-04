import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Cpu, 
  CreditCard, 
  Sliders, 
  Activity, 
  Wrench,
  Download,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { calculateWiegand26, generateT5577Block0 } from '../services/pm3Engine';
import { T5577Config } from '../types/proxmark';

interface LfSuiteProps {
  onExecuteCommand: (cmd: string) => void;
  isExecuting: boolean;
}

export const LfSuite: React.FC<LfSuiteProps> = ({ onExecuteCommand, isExecuting }) => {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'hid' | 'em4100' | 't5577' | 'plot'>('hid');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // HID Prox State
  const [facilityCode, setFacilityCode] = useState<number>(112);
  const [cardNumber, setCardNumber] = useState<number>(45021);
  const wiegand = calculateWiegand26(facilityCode, cardNumber);

  // EM4100 State
  const [emId, setEmId] = useState<string>('0102030405');

  // T5577 State
  const [t5577Config, setT5577Config] = useState<T5577Config>({
    block0Hex: '00148040',
    modulation: 'ASK',
    bitRate: 'RF/64',
    maxBlock: 7,
    testMode: false,
    aor: false,
    passwordProtected: false,
    passwordHex: '12345678',
  });

  const generatedBlock0 = generateT5577Block0(t5577Config);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* LF Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Suite de Baja Frecuencia - LF (125 kHz / 134 kHz)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Herramientas para lectura, codificación Wiegand, clonado y configuración de chips T5577, HID Prox, EM4100 e Indala.
          </p>
        </div>

        <button
          onClick={() => onExecuteCommand('lf search')}
          disabled={isExecuting}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all shadow-sm shadow-cyan-950 disabled:opacity-50"
        >
          <Search className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
          <span>Búsqueda Automática (`lf search`)</span>
        </button>
      </div>

      {/* Sub navigation segmented control */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'hid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>HID Prox II (26-bit)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('em4100')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'em4100'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>EM4100 / EM4200</span>
        </button>
        <button
          onClick={() => setActiveSubTab('t5577')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 't5577'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Laboratorio T5577</span>
        </button>
        <button
          onClick={() => setActiveSubTab('plot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'plot'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Forma de Onda (Plot)</span>
        </button>
      </div>

      {/* SUB-TAB 1: HID PROX II */}
      {activeSubTab === 'hid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Calculator & Inputs */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Calculadora y Decodificador Wiegand 26-bit (H10301)
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                FSK2 / 125 kHz
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Facility Code (FC: 0 - 255)
                </label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={facilityCode}
                  onChange={(e) => setFacilityCode(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Hex: 0x{facilityCode.toString(16).toUpperCase().padStart(2, '0')} (8 bits)
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Card Number (CN: 0 - 65535)
                </label>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Hex: 0x{cardNumber.toString(16).toUpperCase().padStart(4, '0')} (16 bits)
                </span>
              </div>
            </div>

            {/* Wiegand bit breakdown representation */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Estructura de la Trama de 26 Bits</span>
                <span className="font-mono text-emerald-400">Paridades Válidas</span>
              </div>

              <div className="flex flex-wrap gap-1 font-mono text-xs items-center justify-center p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 select-all">
                {/* Parity 1 */}
                <span
                  title="Paridad Par (Bits 1..12)"
                  className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded"
                >
                  {wiegand.evenParity}
                </span>
                {/* 8 FC bits */}
                {wiegand.binaryString.slice(1, 9).split('').map((b, i) => (
                  <span
                    key={i}
                    title={`Facility Code Bit ${8 - i}`}
                    className="px-1.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded"
                  >
                    {b}
                  </span>
                ))}
                {/* 16 CN bits */}
                {wiegand.binaryString.slice(9, 25).split('').map((b, i) => (
                  <span
                    key={i}
                    title={`Card Number Bit ${16 - i}`}
                    className="px-1.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded"
                  >
                    {b}
                  </span>
                ))}
                {/* Parity 2 */}
                <span
                  title="Paridad Impar (Bits 13..24)"
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded"
                >
                  {wiegand.oddParity}
                </span>
              </div>

              {/* Color legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500"></span>
                  Paridad Par (P1)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-500"></span>
                  Facility Code (8b)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500/40 border border-blue-500"></span>
                  Card Number (16b)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500/40 border border-purple-500"></span>
                  Paridad Impar (P2)
                </span>
              </div>
            </div>

            {/* Raw Hex & Wiegand Dec */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Raw Hex PM3</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-cyan-300 font-bold">{wiegand.rawHex}</span>
                  <button
                    onClick={() => handleCopy(wiegand.rawHex)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {copiedText === wiegand.rawHex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Comando Clonado</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-200 truncate">lf hid clone -w H10301 --fc {facilityCode} --cn {cardNumber}</span>
                  <button
                    onClick={() => handleCopy(`lf hid clone -w H10301 --fc ${facilityCode} --cn ${cardNumber}`)}
                    className="text-slate-400 hover:text-slate-200 ml-1 shrink-0"
                  >
                    {copiedText?.includes('lf hid clone') ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Direct Actions */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-200 mb-2">
                Acciones Directas Proxmark3
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Envía órdenes directas al hardware o copia los comandos para terminal nativa de Windows/Linux.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => onExecuteCommand('lf hid read')}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">1. Leer Tarjeta HID Físico</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">`lf hid read`</div>
                  </div>
                  <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                </button>

                <button
                  onClick={() => onExecuteCommand(`lf hid clone -w H10301 --fc ${facilityCode} --cn ${cardNumber}`)}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-left transition-all text-xs"
                >
                  <div>
                    <div className="font-semibold text-cyan-200">2. Clonar a Tarjeta T5577</div>
                    <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
                      `lf hid clone -w H10301 --fc {facilityCode} --cn {cardNumber}`
                    </div>
                  </div>
                  <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                </button>

                <button
                  onClick={() => onExecuteCommand(`lf hid sim -w H10301 --fc ${facilityCode} --cn ${cardNumber}`)}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">3. Emular Tarjeta con Proxmark3</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      `lf hid sim -w H10301 --fc {facilityCode} --cn {cardNumber}`
                    </div>
                  </div>
                  <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Nota sobre chips T5577:</span>
              <span>
                Para asegurar una escritura correcta, coloca el chip o llavero azul T5577 en el centro de la bobina circular LF de tu Proxmark3.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EM4100 */}
      {activeSubTab === 'em4100' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Gestor y Clonador EM4100 / EM4200 (ASK RF/64)
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                Manchester / 10 Hex
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tag ID (10 dígitos hexadecimales, ej: 0102030405)
              </label>
              <input
                type="text"
                maxLength={10}
                value={emId}
                onChange={(e) => setEmId(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-base font-mono text-cyan-300 tracking-wider outline-none transition-colors"
                placeholder="0102030405"
              />
            </div>

            {/* Split view */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Customer ID (Byte 0)</span>
                <span className="text-sm font-mono text-slate-200 font-semibold mt-1 block">
                  {emId.slice(0, 2) || '--'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Card Number (Bytes 1-4)</span>
                <span className="text-sm font-mono text-cyan-400 font-semibold mt-1 block">
                  {emId.slice(2) || '--'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-slate-400 text-[11px]">Equivalente decimal estándar:</div>
              <div className="text-slate-200">
                Decimal 8H10D: {parseInt(emId.slice(2), 16) || 0}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Acciones Rápidas EM4100</h3>

            <button
              onClick={() => onExecuteCommand('lf em 410xread')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">Leer Transpondedor EM4100</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">`lf em 410xread`</div>
              </div>
              <Terminal className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onExecuteCommand(`lf em 410xclone --id ${emId || '0102030405'}`)}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-cyan-200">Clonar este ID a chip T5577</div>
                <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
                  `lf em 410xclone --id {emId || '0102030405'}`
                </div>
              </div>
              <Wrench className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onExecuteCommand(`lf em 410xsim --id ${emId || '0102030405'}`)}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">Simular Transpondedor</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  `lf em 410xsim --id {emId || '0102030405'}`
                </div>
              </div>
              <Radio className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: T5577 LAB */}
      {activeSubTab === 't5577' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Constructor de Bloque 0 (Configuración Atmel T5577)
              </h3>
              <span className="text-[11px] font-mono text-slate-300">
                Bloque 0: <span className="text-cyan-400 font-bold">{generatedBlock0}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Modulación</label>
                <select
                  value={t5577Config.modulation}
                  onChange={(e) => setT5577Config({ ...t5577Config, modulation: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                >
                  <option value="ASK">Manchester (ASK) - Estándar EM4100</option>
                  <option value="FSK1">FSK 1 (e.g. HID Prox H10301)</option>
                  <option value="FSK2">FSK 2 (e.g. Indala)</option>
                  <option value="PSK1">PSK 1</option>
                  <option value="PSK2">PSK 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Bit Rate (Velocidad de Reloj)</label>
                <select
                  value={t5577Config.bitRate}
                  onChange={(e) => setT5577Config({ ...t5577Config, bitRate: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                >
                  <option value="RF/32">RF/32 (Común)</option>
                  <option value="RF/64">RF/64 (Estándar EM4100)</option>
                  <option value="RF/16">RF/16 (Alta velocidad)</option>
                  <option value="RF/128">RF/128</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Block (1 a 7)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={t5577Config.maxBlock}
                  onChange={(e) => setT5577Config({ ...t5577Config, maxBlock: parseInt(e.target.value) || 7 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="pwdProt"
                  checked={t5577Config.passwordProtected}
                  onChange={(e) => setT5577Config({ ...t5577Config, passwordProtected: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                />
                <label htmlFor="pwdProt" className="text-xs text-slate-300">
                  Protegido con Contraseña (Password)
                </label>
              </div>
            </div>

            {t5577Config.passwordProtected && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Contraseña Hex (8 dígitos hex, ej: 12345678)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={t5577Config.passwordHex}
                  onChange={(e) => setT5577Config({ ...t5577Config, passwordHex: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
                />
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Comando de Escritura Bloque 0</span>
                <span className="font-mono text-cyan-300 mt-0.5 block">
                  lf t55xx wr -b 0 -d {generatedBlock0}
                </span>
              </div>
              <button
                onClick={() => handleCopy(`lf t55xx wr -b 0 -d ${generatedBlock0}`)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Operaciones T5577</h3>

            <button
              onClick={() => onExecuteCommand('lf t55xx detect')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">Detectar Chip T5577</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">`lf t55xx detect`</div>
              </div>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onExecuteCommand('lf t55xx dump')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">Volcar Todos los Bloques (0-7)</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">`lf t55xx dump`</div>
              </div>
              <Download className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onExecuteCommand('lf t55xx wipe')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-rose-300">Borrado de Fábrica (Wipe)</div>
                <div className="text-[11px] font-mono text-rose-400/80 mt-0.5">`lf t55xx wipe`</div>
              </div>
              <RefreshCw className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: WAVEFORM PLOT */}
      {activeSubTab === 'plot' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Visualizador de Señal Muestreada (`data plot`)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Representación gráfica de las transiciones de fase y modulación RF capturadas por el ADC del Proxmark3.
              </p>
            </div>
            <button
              onClick={() => onExecuteCommand('data plot')}
              className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Actualizar Muestreo
            </button>
          </div>

          {/* SVG Waveform Graphic */}
          <div className="h-44 w-full bg-slate-950 rounded-xl border border-slate-800/80 p-3 relative overflow-hidden flex items-center">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 pointer-events-none opacity-20">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-slate-700/50"></div>
              ))}
            </div>

            {/* Zero threshold line */}
            <div className="absolute inset-x-0 top-1/2 border-b border-cyan-500/30"></div>

            {/* Simulated sampled wave */}
            <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
              <path
                d="M 0 80 
                   Q 20 20, 40 80 T 80 80 T 120 20 T 160 140 T 200 80 
                   Q 220 15, 240 80 T 280 80 T 320 30 T 360 130 T 400 80 
                   Q 420 25, 440 80 T 480 80 T 520 20 T 560 145 T 600 80
                   Q 620 20, 640 80 T 680 80 T 720 35 T 760 125 T 800 80"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <path
                d="M 0 80 
                   Q 20 20, 40 80 T 80 80 T 120 20 T 160 140 T 200 80 
                   Q 220 15, 240 80 T 280 80 T 320 30 T 360 130 T 400 80 
                   Q 420 25, 440 80 T 480 80 T 520 20 T 560 145 T 600 80
                   Q 620 20, 640 80 T 680 80 T 720 35 T 760 125 T 800 80 L 800 160 L 0 160 Z"
                fill="url(#wave-gradient)"
                opacity="0.15"
              />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Muestras: 2048 pts</span>
            <span>Tasa ADC: 125.00 kHz</span>
            <span>Trigger: RF Peak</span>
          </div>
        </div>
      )}
    </div>
  );
};
