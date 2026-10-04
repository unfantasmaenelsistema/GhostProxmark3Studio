import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Edit3, 
  Eye, 
  Info,
  Save,
  RefreshCw,
  Sliders,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CardDump } from '../types/proxmark';
import { decodeAccessBits } from '../services/pm3Engine';

interface CardDumpViewerProps {
  cardDump: CardDump;
  onUpdateCardDump: (dump: CardDump) => void;
  onResetToSample: () => void;
  onRestoreLastBackup?: () => boolean | void;
  lastBackupTime?: string | null;
}

export const CardDumpViewer: React.FC<CardDumpViewerProps> = ({
  cardDump,
  onUpdateCardDump,
  onResetToSample,
  onRestoreLastBackup,
  lastBackupTime,
}) => {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [editingHex, setEditingHex] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const handleRestoreLastBackupClick = () => {
    try {
      if (onRestoreLastBackup) {
        const res = onRestoreLastBackup();
        if (res !== false) {
          setRestoreFeedback('¡Última copia de seguridad restaurada correctamente desde el almacenamiento local!');
          setTimeout(() => setRestoreFeedback(null), 3500);
          return;
        }
      }

      // Fallback direct check in localStorage
      const saved = localStorage.getItem('pm3_card_dump_backup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sectors && parsed?.uid) {
          onUpdateCardDump(parsed);
          setRestoreFeedback(`¡Copia de seguridad restaurada! (UID: ${parsed.uid}, ${parsed.sectors.length} sectores)`);
          setTimeout(() => setRestoreFeedback(null), 3500);
          return;
        }
      }
      setRestoreFeedback('No se encontró ninguna copia de seguridad guardada en este navegador.');
      setTimeout(() => setRestoreFeedback(null), 3500);
    } catch (e) {
      setRestoreFeedback('Error al procesar la copia de seguridad.');
      setTimeout(() => setRestoreFeedback(null), 3500);
    }
  };

  // Find the selected block in sectors
  const allBlocks = cardDump.sectors.flatMap(s => s.blocks.map(b => ({ ...b, sectorIndex: s.sector })));
  const selectedBlock = allBlocks.find(b => b.blockIndex === selectedBlockIndex) || allBlocks[0];

  const handleSelectBlock = (blockIndex: number) => {
    setSelectedBlockIndex(blockIndex);
    const b = allBlocks.find(item => item.blockIndex === blockIndex);
    if (b) {
      setEditingHex(b.hexData);
    }
    setIsEditing(false);
  };

  const handleSaveBlockEdit = () => {
    if (!editingHex || editingHex.length !== 32) {
      alert('Un bloque de Mifare Classic debe tener exactamente 32 caracteres hexadecimales (16 bytes).');
      return;
    }

    // Convert hex to ASCII
    let ascii = '';
    for (let i = 0; i < editingHex.length; i += 2) {
      const byte = parseInt(editingHex.substring(i, i + 2), 16);
      ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '·';
    }

    const updatedSectors = cardDump.sectors.map(sec => {
      const updatedBlocks = sec.blocks.map(b => {
        if (b.blockIndex === selectedBlockIndex) {
          return {
            ...b,
            hexData: editingHex.toUpperCase(),
            ascii,
          };
        }
        return b;
      });
      return { ...sec, blocks: updatedBlocks };
    });

    onUpdateCardDump({
      ...cardDump,
      sectors: updatedSectors,
    });

    setIsEditing(false);
  };

  // Export to .eml file (Proxmark3 format)
  const handleExportEml = () => {
    let emlContent = '';
    allBlocks.forEach(b => {
      emlContent += b.hexData + '\n';
    });

    const blob = new Blob([emlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hf-mf-${cardDump.uid.replace(/\s+/g, '')}-dump.eml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to .bin raw binary file
  const handleExportBin = () => {
    const totalBytes = allBlocks.length * 16;
    const buffer = new Uint8Array(totalBytes);
    let offset = 0;

    allBlocks.forEach(b => {
      for (let i = 0; i < 32; i += 2) {
        buffer[offset++] = parseInt(b.hexData.substr(i, 2), 16) || 0;
      }
    });

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hf-mf-${cardDump.uid.replace(/\s+/g, '')}-dump.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(cardDump, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm3-dump-${cardDump.uid.replace(/\s+/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import custom file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Check if JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.sectors && parsed.uid) {
            onUpdateCardDump(parsed);
            return;
          }
        }

        // Check if .eml
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length === 32);
        if (lines.length >= 64) {
          // Reconstruct 16 sectors
          const newSectors = [];
          for (let s = 0; s < 16; s++) {
            const blocks = [];
            for (let b = 0; b < 4; b++) {
              const blkIdx = s * 4 + b;
              const hexData = lines[blkIdx].toUpperCase();
              let ascii = '';
              for (let i = 0; i < 32; i += 2) {
                const byte = parseInt(hexData.substring(i, i + 2), 16);
                ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '·';
              }
              const type: 'manufacturer' | 'data' | 'trailer' = (s === 0 && b === 0) ? 'manufacturer' : b === 3 ? 'trailer' : 'data';
              blocks.push({ blockIndex: blkIdx, hexData, ascii, type });
            }
            newSectors.push({
              sector: s,
              blocks,
              keyA: { value: lines[s * 4 + 3].substring(0, 12), found: true },
              keyB: { value: lines[s * 4 + 3].substring(20, 32), found: true },
              accessBits: lines[s * 4 + 3].substring(12, 20),
              permissionsDescription: decodeAccessBits(lines[s * 4 + 3].substring(12, 20)),
            });
          }

          onUpdateCardDump({
            ...cardDump,
            uid: lines[0].substring(0, 8),
            sectors: newSectors,
          });
        }
      } catch (err) {
        alert('Formato de archivo no reconocido. Sube un archivo .eml o .json válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyDumpHex = () => {
    const raw = allBlocks.map(b => b.hexData).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Visor y Editor de Volcado Hexadecimal (Card Dump)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explora la estructura binaria completa de 64 bloques (1024 bytes), inspecciona llaves de tráiler, permisos C1-C2-C3 y exporta a formato `.eml` / `.bin`.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar (.eml / .json)</span>
            <input type="file" accept=".eml,.json,.bin,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Restore Last Backup Button */}
          <button
            onClick={handleRestoreLastBackupClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 rounded-lg transition-colors shadow-sm"
            title="Restaura la última copia de seguridad guardada automáticamente en el navegador"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Restaurar Último Backup</span>
          </button>

          <button
            onClick={handleExportEml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-sm shadow-cyan-950"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .eml</span>
          </button>

          <button
            onClick={handleExportBin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .bin</span>
          </button>

          <button
            onClick={handleCopyDumpHex}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            title="Copiar todo el volcado hex"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Restore Feedback Banner */}
      {restoreFeedback && (
        <div className="p-3 bg-amber-950/90 border border-amber-500/50 rounded-xl text-xs font-mono text-amber-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{restoreFeedback}</span>
          </div>
          <span className="text-[10px] text-amber-400/80">Almacenamiento Local (localStorage)</span>
        </div>
      )}

      {/* Autosave Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Autoguardado continuo en navegador activo</span>
        </div>
        {lastBackupTime && (
          <span className="text-[10px] text-slate-500">
            Última copia registrada: {new Date(lastBackupTime).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Grid: Left hex matrix, Right block inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hex & ASCII Table (64 blocks) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500"></span>
                Bloque 0 (Fabricante / UID)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-700/60 border border-slate-600"></span>
                Datos de Usuario
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500"></span>
                Sector Trailer (Key A/B)
              </span>
            </div>

            <span className="font-mono text-cyan-400 text-[11px]">
              UID: {cardDump.uid}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono select-text">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2 px-3 text-center">Blk</th>
                  <th className="py-2 px-3">Hexadecimal (16 Bytes / 32 Caracteres)</th>
                  <th className="py-2 px-3">ASCII</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {allBlocks.map((blk) => {
                  const isSelected = blk.blockIndex === selectedBlockIndex;
                  const isManufacturer = blk.type === 'manufacturer';
                  const isTrailer = blk.type === 'trailer';

                  let rowStyle = 'hover:bg-slate-800/50 cursor-pointer transition-colors';
                  if (isSelected) {
                    rowStyle = 'bg-cyan-950/60 border-l-2 border-cyan-400';
                  }

                  let hexColor = 'text-slate-200';
                  if (isManufacturer) hexColor = 'text-amber-300 font-semibold';
                  if (isTrailer) hexColor = 'text-emerald-300 font-semibold';

                  return (
                    <tr
                      key={blk.blockIndex}
                      onClick={() => handleSelectBlock(blk.blockIndex)}
                      className={rowStyle}
                    >
                      <td className="py-1.5 px-3 text-center text-slate-400 text-[11px] tabular-nums">
                        {blk.blockIndex.toString().padStart(2, '0')}
                      </td>
                      <td className={`py-1.5 px-3 tracking-wider ${hexColor}`}>
                        {/* If trailer, highlight Key A (first 12), Access (next 8), Key B (last 12) */}
                        {isTrailer ? (
                          <span>
                            <span className="text-emerald-400" title="Key A">{blk.hexData.slice(0, 12)}</span>
                            <span className="text-cyan-300" title="Access Bits">{blk.hexData.slice(12, 20)}</span>
                            <span className="text-emerald-400" title="Key B">{blk.hexData.slice(20, 32)}</span>
                          </span>
                        ) : (
                          blk.hexData.match(/.{1,2}/g)?.join(' ')
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-slate-400 tracking-widest text-[11px] select-none">
                        {blk.ascii}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Block Inspector & Editor */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Inspector de Bloque #{selectedBlock.blockIndex.toString().padStart(2, '0')}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Sector #{selectedBlock.sectorIndex} · {selectedBlock.type === 'manufacturer' ? 'Bloque Fabricante' : selectedBlock.type === 'trailer' ? 'Sector Trailer' : 'Bloque de Datos'}
                </span>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => {
                    setEditingHex(selectedBlock.hexData);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-cyan-400" />
                  <span>Editar</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveBlockEdit}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>Guardar</span>
                </button>
              )}
            </div>

            {/* Block Content */}
            {!isEditing ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Raw Hexadecimal</span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-cyan-300 font-bold tracking-wider break-all mt-1">
                    {selectedBlock.hexData}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Representación ASCII</span>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 tracking-widest mt-1">
                    {selectedBlock.ascii}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Editar Hex (32 caracteres)</span>
                  <textarea
                    rows={2}
                    maxLength={32}
                    value={editingHex}
                    onChange={(e) => setEditingHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
                    className="w-full bg-slate-950 border border-cyan-500 rounded-lg p-2 text-cyan-300 font-mono tracking-widest outline-none mt-1"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Longitud: {editingHex.length}/32</span>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-rose-400 hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Trailer Breakdown if applicable */}
            {selectedBlock.type === 'trailer' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-sans block font-semibold">
                  Desglose del Trailer
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Key A:</span>
                  <span className="text-emerald-400 font-bold">{selectedBlock.hexData.slice(0, 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Access:</span>
                  <span className="text-cyan-300 font-bold">{selectedBlock.hexData.slice(12, 20)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Key B:</span>
                  <span className="text-emerald-400 font-bold">{selectedBlock.hexData.slice(20, 32)}</span>
                </div>
              </div>
            )}

            {/* Decoded Access Conditions Note */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
                Condición de Acceso del Sector #{selectedBlock.sectorIndex}
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {cardDump.sectors[selectedBlock.sectorIndex]?.permissionsDescription || decodeAccessBits('FF078069')}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Restaurar volcado de ejemplo:</span>
            <button
              onClick={onResetToSample}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
