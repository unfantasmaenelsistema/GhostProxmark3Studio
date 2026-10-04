import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Key, 
  ShieldAlert, 
  Sparkles, 
  Copy, 
  Check, 
  Play, 
  Cpu, 
  FileText,
  Lock,
  Unlock,
  Terminal,
  Database
} from 'lucide-react';
import { CardDump } from '../types/proxmark';

interface HfSuiteProps {
  cardDump: CardDump;
  onExecuteCommand: (cmd: string) => void;
  isExecuting: boolean;
  onLoadSampleDump: () => void;
}

export const HfSuite: React.FC<HfSuiteProps> = ({
  cardDump,
  onExecuteCommand,
  isExecuting,
  onLoadSampleDump,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mifare' | 'magic' | 'ultralight'>('mifare');
  const [magicUid, setMagicUid] = useState<string>('DEADBEEF');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [attackProgress, setAttackProgress] = useState<number>(0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleRunAutopwn = () => {
    setIsAttacking(true);
    setAttackProgress(10);
    onExecuteCommand('hf mf autopwn --1k -s');

    const interval = setInterval(() => {
      setAttackProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAttacking(false);
          return 100;
        }
        return prev + 25;
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Suite de Alta Frecuencia - HF (13.56 MHz / NFC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditoría de seguridad para Mifare Classic 1K/4K, Tarjetas Mágicas (Gen1a/CUID), NTAG213/215/216 e ISO14443-A.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExecuteCommand('hf search')}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm shadow-emerald-950 disabled:opacity-50"
          >
            <Search className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>Buscar Tarjeta HF (`hf search`)</span>
          </button>
        </div>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('mifare')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'mifare'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Mifare Classic (Autopwn & Llaves)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('magic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'magic'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tarjetas Mágicas (Gen1a / CUID)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ultralight')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeSubTab === 'ultralight'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Ultralight / NTAG (Amiibo)</span>
        </button>
      </div>

      {/* SUB-TAB 1: MIFARE CLASSIC */}
      {activeSubTab === 'mifare' && (
        <div className="space-y-6">
          {/* Card Overview banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-100">{cardDump.type}</span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                    UID: {cardDump.uid}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>ATQA: <span className="font-mono text-slate-200">{cardDump.atqa}</span></span>
                  <span>·</span>
                  <span>SAK: <span className="font-mono text-slate-200">{cardDump.sak}</span></span>
                  <span>·</span>
                  <span>Sectores: <span className="font-mono text-slate-200">{cardDump.sectors.length}/16</span></span>
                </div>
              </div>
            </div>

            {/* Attack Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAutopwn}
                disabled={isExecuting || isAttacking}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isAttacking ? `Autopwn (${attackProgress}%)` : 'Ejecutar Autopwn Completo'}</span>
              </button>

              <button
                onClick={() => onExecuteCommand('hf mf chk --1k -d')}
                disabled={isExecuting}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                Chequeo Diccionario (`chk`)
              </button>
            </div>
          </div>

          {/* Progress bar if attacking */}
          {isAttacking && (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Ejecutando autopwn: ataque de diccionario + nested...</span>
                <span>{attackProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  style={{ width: `${attackProgress}%` }}
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Sector Key Map Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-200">
                  Matriz de Llaves y Condiciones de Acceso (16 Sectores)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cada sector contiene Key A (6 bytes), Bits de acceso (4 bytes) y Key B (6 bytes).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Unlock className="w-3.5 h-3.5" /> Llave Encontrada
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Sector</th>
                    <th className="py-2.5 px-4">Key A (6 Bytes)</th>
                    <th className="py-2.5 px-4">Access Bits</th>
                    <th className="py-2.5 px-4">Key B (6 Bytes)</th>
                    <th className="py-2.5 px-4">Permisos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cardDump.sectors.map((sec) => (
                    <tr key={sec.sector} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-slate-300 font-bold">
                        #{sec.sector.toString().padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-semibold">{sec.keyA.value}</span>
                          <button
                            onClick={() => handleCopy(sec.keyA.value)}
                            className="text-slate-500 hover:text-slate-300"
                            title="Copiar Key A"
                          >
                            {copiedKey === sec.keyA.value ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-cyan-300">
                        {sec.accessBits}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-semibold">{sec.keyB.value}</span>
                          <button
                            onClick={() => handleCopy(sec.keyB.value)}
                            className="text-slate-500 hover:text-slate-300"
                            title="Copiar Key B"
                          >
                            {copiedKey === sec.keyB.value ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px] font-sans truncate max-w-xs">
                        {sec.permissionsDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MAGIC CARDS (GEN1A / CUID) */}
      {activeSubTab === 'magic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Modificador de UID en Tarjetas Chinas Mágicas (Magic Cards)
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                Gen1a Backdoor / Gen2 CUID
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Nuevo UID Deseado (4 bytes hex, ej: DEADBEEF o A1B2C3D4)
              </label>
              <input
                type="text"
                maxLength={8}
                value={magicUid}
                onChange={(e) => setMagicUid(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-base font-mono text-emerald-300 tracking-widest outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Formato con espacios: {magicUid.match(/.{1,2}/g)?.join(' ')}
              </span>
            </div>

            {/* Command breakdown */}
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Comando Gen1a (Backdoor Desbloqueado)</span>
                  <button
                    onClick={() => handleCopy(`hf mf csetuid -u ${magicUid || 'DEADBEEF'} --force`)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-mono text-emerald-400 text-xs mt-1">
                  hf mf csetuid -u {magicUid || 'DEADBEEF'} --force
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sobrescribe directamente el bloque 0 del fabricante mediante comandos backdoor 0x40/0x43.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Comando Gen2 (CUID / Direct Write con Key)</span>
                  <button
                    onClick={() => handleCopy(`hf mf wrbl --block 0 -k FFFFFFFFFFFF -d ${magicUid || 'DEADBEEF'}3708040001020304050607`)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-mono text-slate-300 text-xs mt-1 truncate">
                  hf mf wrbl --block 0 -k FFFFFFFFFFFF -d {magicUid || 'DEADBEEF'}37...
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Escribe el bloque 0 mediante comandos ISO14443 estándar (inmune a detectores de tarjetas backdoor).
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Acciones de Tarjeta Mágica</h3>

            <button
              onClick={() => onExecuteCommand(`hf mf csetuid -u ${magicUid || 'DEADBEEF'} --force`)}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-emerald-200">1. Escribir Nuevo UID (Gen1a)</div>
                <div className="text-[11px] font-mono text-emerald-400/80 mt-0.5">`hf mf csetuid -u {magicUid}`</div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => onExecuteCommand('hf mf cchk')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">2. Probar si responde a Backdoor</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">`hf mf cchk`</div>
              </div>
              <Terminal className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onExecuteCommand('hf mf cwipe')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-rose-300">3. Restaurar Tarjeta a Fábrica (Wipe)</div>
                <div className="text-[11px] font-mono text-rose-400/80 mt-0.5">`hf mf cwipe`</div>
              </div>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ULTRALIGHT / NTAG */}
      {activeSubTab === 'ultralight' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Mifare Ultralight / NTAG213 / NTAG215 (Amiibo) / NTAG216
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                ISO14443-A Páginas 4B
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Las etiquetas NTAG son ampliamente utilizadas en pósteres NFC, validadores de transporte y figuras interactivas Nintendo Amiibo (NTAG215 de 540 bytes).
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">NTAG213</span>
                <span className="text-slate-200 block mt-1">180 Bytes</span>
                <span className="text-[11px] text-slate-400">45 páginas</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">NTAG215 (Amiibo)</span>
                <span className="text-emerald-400 font-bold block mt-1">540 Bytes</span>
                <span className="text-[11px] text-slate-400">135 páginas</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">NTAG216</span>
                <span className="text-slate-200 block mt-1">924 Bytes</span>
                <span className="text-[11px] text-slate-400">231 páginas</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Comandos Ultralight / NTAG</h3>

            <button
              onClick={() => onExecuteCommand('hf mfu info')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-slate-200">Leer Información de Chip (`info`)</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">`hf mfu info`</div>
              </div>
              <Terminal className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => onExecuteCommand('hf mfu dump')}
              disabled={isExecuting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-left text-xs transition-all"
            >
              <div>
                <div className="font-semibold text-emerald-200">Volcar Páginas de Memoria (`dump`)</div>
                <div className="text-[11px] font-mono text-emerald-400/80 mt-0.5">`hf mfu dump`</div>
              </div>
              <Database className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
