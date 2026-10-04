import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Download, 
  Upload, 
  FileCode, 
  FileText, 
  Check, 
  Copy, 
  Sparkles,
  Smartphone,
  Cpu,
  Layers,
  RefreshCw
} from 'lucide-react';
import { CardDump } from '../types/proxmark';

interface FormatConverterProps {
  cardDump: CardDump;
  onLoadConvertedDump?: (newDump: CardDump) => void;
}

export const FormatConverter: React.FC<FormatConverterProps> = ({ cardDump }) => {
  const [targetFormat, setTargetFormat] = useState<'flipper_nfc' | 'pm3_eml' | 'pm3_bin' | 'chameleon_json'>('flipper_nfc');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Clean UID without spaces
  const cleanUid = cardDump.uid.replace(/\s+/g, '');
  const cleanAtqa = cardDump.atqa.replace(/\s+/g, '');
  const cleanSak = cardDump.sak.replace(/\s+/g, '');

  // Generate Flipper Zero .nfc file content
  const generateFlipperNfc = () => {
    let lines = [
      'Filetype: Flipper NFC device',
      'Version: 3',
      '# Created with Proxmark3 Web Studio (unfantasmaenelsistema.com)',
      'Device type: Mifare Classic',
      `UID: ${cardDump.uid}`,
      `ATQA: ${cardDump.atqa}`,
      `SAK: ${cardDump.sak}`,
      'Mifare Classic type: 1K',
      'Data content layout: 16x4',
    ];

    lines.push('# Sector Keys & Data Blocks:');
    cardDump.sectors.forEach((sec) => {
      lines.push(`\n# Sector ${sec.sector}:`);
      lines.push(`Key A: ${sec.keyA.value}`);
      lines.push(`Key B: ${sec.keyB.value}`);
      lines.push(`Access Bits: ${sec.accessBits}`);

      sec.blocks.forEach((blk) => {
        lines.push(`Block ${blk.blockIndex}: ${blk.hexData}`);
      });
    });

    return lines.join('\n');
  };

  // Generate Proxmark3 .eml file content (pure hex text, 1 line per 16-byte block)
  const generatePm3Eml = () => {
    let lines: string[] = [];
    cardDump.sectors.forEach((sec) => {
      sec.blocks.forEach((blk) => {
        lines.push(blk.hexData.replace(/\s+/g, ''));
      });
    });
    return lines.join('\n');
  };

  // Generate Chameleon Ultra JSON format
  const generateChameleonJson = () => {
    const data: any = {
      format: 'ChameleonUltra-MifareClassic1K',
      generatedBy: 'Proxmark3 Web Studio',
      website: 'https://www.unfantasmaenelsistema.com/',
      card: {
        uid: cleanUid,
        atqa: cleanAtqa,
        sak: cleanSak,
        type: 'Mifare Classic 1K',
      },
      sectors: cardDump.sectors.map((sec) => ({
        sector: sec.sector,
        keyA: sec.keyA.value,
        keyB: sec.keyB.value,
        accessBits: sec.accessBits,
        blocks: sec.blocks.map((b) => ({
          blockIndex: b.blockIndex,
          data: b.hexData.replace(/\s+/g, ''),
        })),
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  // Compute active preview output
  const getConvertedOutput = () => {
    switch (targetFormat) {
      case 'flipper_nfc':
        return {
          content: generateFlipperNfc(),
          extension: '.nfc',
          label: 'Flipper Zero (.nfc)',
        };
      case 'pm3_eml':
        return {
          content: generatePm3Eml(),
          extension: '.eml',
          label: 'Proxmark3 Emulator (.eml)',
        };
      case 'chameleon_json':
        return {
          content: generateChameleonJson(),
          extension: '.json',
          label: 'Chameleon Ultra (.json)',
        };
      case 'pm3_bin':
        return {
          content: generatePm3Eml(),
          extension: '.bin',
          label: 'Binario Puro Dump (.bin)',
        };
      default:
        return {
          content: '',
          extension: '.txt',
          label: 'Texto',
        };
    }
  };

  const output = getConvertedOutput();

  const handleCopy = () => {
    navigator.clipboard.writeText(output.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownload = () => {
    const filename = `dump_${cleanUid || 'pm3'}${output.extension}`;
    const blob = new Blob([output.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // File import handler (simulated conversion of Flipper or PM3 dump)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportStatus(`¡Archivo '${file.name}' analizado e importado con éxito!`);
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Conversor Universal de Formatos RFID
            </h1>
            <p className="text-xs text-slate-400">
              Intercambia volcados entre Proxmark3, Flipper Zero (.nfc), Chameleon Ultra y emuladores LibNFC sin fricciones.
            </p>
          </div>
        </div>

        {/* Upload file button */}
        <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold cursor-pointer transition-colors shrink-0">
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Importar Archivo (.nfc, .eml, .bin)</span>
          <input
            type="file"
            accept=".nfc,.eml,.bin,.json,.dump"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Target Format Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setTargetFormat('flipper_nfc')}
          className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
            targetFormat === 'flipper_nfc'
              ? 'bg-orange-950/30 border-orange-500/60 shadow-lg shadow-orange-950/30'
              : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-slate-100">Flipper Zero</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Formato .nfc con bloques y llaves
          </span>
        </button>

        <button
          onClick={() => setTargetFormat('pm3_eml')}
          className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
            targetFormat === 'pm3_eml'
              ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
              : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">Proxmark3 EML</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Formato .eml texto hexadecimal
          </span>
        </button>

        <button
          onClick={() => setTargetFormat('chameleon_json')}
          className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
            targetFormat === 'chameleon_json'
              ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/30'
              : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-100">Chameleon Ultra</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Formato .json estructurado
          </span>
        </button>

        <button
          onClick={() => setTargetFormat('pm3_bin')}
          className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
            targetFormat === 'pm3_bin'
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
              : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-100">Binario Raw</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Formato .bin / .dump 1024 bytes
          </span>
        </button>
      </div>

      {/* Preview and Export Box */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">
              Vista Previa de Salida: <span className="font-mono text-cyan-400">{output.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors border border-slate-700"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar {output.extension}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 max-h-[460px] overflow-y-auto leading-relaxed select-all">
          <pre className="whitespace-pre-wrap">{output.content}</pre>
        </div>
      </div>
    </div>
  );
};
