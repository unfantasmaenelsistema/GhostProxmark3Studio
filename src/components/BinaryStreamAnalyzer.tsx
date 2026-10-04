import React, { useState, useEffect, useRef } from 'react';
import { 
  Binary, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Filter, 
  Terminal, 
  Eye, 
  Radio,
  Sliders,
  ChevronDown,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { ConnectionMode, ProtocolDataFrame, ProtocolType, FrameDirection } from '../types/proxmark';

interface BinaryStreamAnalyzerProps {
  connectionMode: ConnectionMode;
  onExecuteCommand?: (cmd: string) => void;
}

// Preset handshake sequences for visual inspection
const SAMPLE_HANDSHAKES: Record<string, ProtocolDataFrame[]> = {
  'ISO14443A': [
    {
      id: 'f1',
      timestamp: '00:00.001',
      timeOffsetMs: 1.2,
      protocol: 'ISO14443A',
      direction: 'PCD_TO_PICC',
      commandName: 'REQA (Request Type A)',
      rawHex: '26',
      rawBinary: '00100110',
      byteLength: 1,
      status: 'OK',
      description: 'PCD sondea el campo RF buscando tarjetas ISO/IEC 14443-A en estado IDLE.',
      fields: [
        { name: 'Command Code', value: '0x26', bitsOrBytes: 'Bits 0-6 (7 bits)', description: 'Código estándar REQA' },
        { name: 'Modulation', value: '100% ASK Miller', bitsOrBytes: 'RF Carrier', description: 'Codificación Miller modificada a 106 kbps' }
      ]
    },
    {
      id: 'f2',
      timestamp: '00:00.004',
      timeOffsetMs: 4.8,
      protocol: 'ISO14443A',
      direction: 'PICC_TO_PCD',
      commandName: 'ATQA (Answer To Request A)',
      rawHex: '04 00',
      rawBinary: '00000100 00000000',
      byteLength: 2,
      status: 'OK',
      description: 'Tarjeta responde indicando tamaño de UID de 4 bytes y soporte para anticolisión.',
      fields: [
        { name: 'UID Size Indicator', value: 'Single (4 bytes)', bitsOrBytes: 'Bits 6-7 (b00)', description: 'Cascada Nivel 1' },
        { name: 'Anticollision Bitframe', value: 'Bitframe 0x04', bitsOrBytes: 'Bits 0-4 (00100b)', description: 'Compatible con algoritmo de bit-collision' }
      ]
    },
    {
      id: 'f3',
      timestamp: '00:00.009',
      timeOffsetMs: 9.3,
      protocol: 'ISO14443A',
      direction: 'PCD_TO_PICC',
      commandName: 'ANTICOL (Cascade Level 1)',
      rawHex: '93 20',
      rawBinary: '10010011 00100000',
      byteLength: 2,
      status: 'OK',
      description: 'PCD inicia resolución de anticolisión para aislar UID único del transpondedor.',
      fields: [
        { name: 'SEL (Select Code)', value: '0x93', bitsOrBytes: 'Byte 0', description: 'Cascade Level 1 Select' },
        { name: 'NVB (Number of Valid Bits)', value: '0x20', bitsOrBytes: 'Byte 1', description: '2 bytes completos transmitidos (sin bits de colisión)' }
      ]
    },
    {
      id: 'f4',
      timestamp: '00:00.015',
      timeOffsetMs: 15.6,
      protocol: 'ISO14443A',
      direction: 'PICC_TO_PCD',
      commandName: 'UID + BCC Response',
      rawHex: 'A4 8F 2B 19 10',
      rawBinary: '10100100 10001111 00101011 00011001 00010000',
      byteLength: 5,
      parityValid: true,
      status: 'OK',
      description: 'PICC entrega su UID de 4 bytes junto con el byte de verificación XOR (BCC).',
      fields: [
        { name: 'UID Byte 0', value: '0xA4', bitsOrBytes: 'Byte 0', description: 'Identificador Fabricante / Lote' },
        { name: 'UID Byte 1', value: '0x8F', bitsOrBytes: 'Byte 1', description: 'UID Serial' },
        { name: 'UID Byte 2', value: '0x2B', bitsOrBytes: 'Byte 2', description: 'UID Serial' },
        { name: 'UID Byte 3', value: '0x19', bitsOrBytes: 'Byte 3', description: 'UID Serial' },
        { name: 'BCC (XOR Checksum)', value: '0x10', bitsOrBytes: 'Byte 4', description: 'A4 ^ 8F ^ 2B ^ 19 = 0x10 (Correcto ✓)' }
      ]
    },
    {
      id: 'f5',
      timestamp: '00:00.021',
      timeOffsetMs: 21.4,
      protocol: 'ISO14443A',
      direction: 'PCD_TO_PICC',
      commandName: 'SELECT CL1',
      rawHex: '93 70 A4 8F 2B 19 10 7C 92',
      rawBinary: '10010011 01110000 10100100 10001111 ...',
      byteLength: 9,
      crcValid: true,
      status: 'OK',
      description: 'PCD selecciona formalmente la tarjeta con el UID especificado y CRC-A.',
      fields: [
        { name: 'SEL', value: '0x93', bitsOrBytes: 'Byte 0', description: 'Cascade Level 1' },
        { name: 'NVB', value: '0x70', bitsOrBytes: 'Byte 1', description: '7 bytes válidos (40 bits de UID + BCC)' },
        { name: 'CRC_A', value: '0x7C92', bitsOrBytes: 'Bytes 7-8', description: 'ISO 14443-A CRC-16 (Polinomio 0x8408)' }
      ]
    },
    {
      id: 'f6',
      timestamp: '00:00.028',
      timeOffsetMs: 28.1,
      protocol: 'ISO14443A',
      direction: 'PICC_TO_PCD',
      commandName: 'SAK (Select Acknowledge)',
      rawHex: '08 B6 DD',
      rawBinary: '00001000 10110110 11011101',
      byteLength: 3,
      crcValid: true,
      status: 'ACK',
      description: 'Tarjeta confirma selección y reporta arquitectura MIFARE Classic 1K.',
      fields: [
        { name: 'SAK Byte', value: '0x08', bitsOrBytes: 'Byte 0', description: 'MIFARE Classic 1K (Crypto-1, 1024 bytes)' },
        { name: 'UID Complete', value: 'True (Bit 2=0)', bitsOrBytes: 'Bit 2', description: 'No requiere nivel de cascada adicional' },
        { name: 'CRC_A', value: '0xB6DD', bitsOrBytes: 'Bytes 1-2', description: 'Checksum válido' }
      ]
    },
    {
      id: 'f7',
      timestamp: '00:00.035',
      timeOffsetMs: 35.7,
      protocol: 'ISO14443A',
      direction: 'PCD_TO_PICC',
      commandName: 'AUTH_KEY_A (Sector 0)',
      rawHex: '60 00 F5 7B',
      rawBinary: '01100000 00000000 11110101 01111011',
      byteLength: 4,
      status: 'OK',
      description: 'PCD solicita autenticación con Clave A en el Bloque 0 (Sector 00).',
      fields: [
        { name: 'Auth Command', value: '0x60', bitsOrBytes: 'Byte 0', description: 'Autenticación con Key A (0x61 = Key B)' },
        { name: 'Block Address', value: '0x00', bitsOrBytes: 'Byte 1', description: 'Bloque Fabricante 0' },
        { name: 'CRC_A', value: '0xF57B', bitsOrBytes: 'Bytes 2-3', description: 'CRC verificado' }
      ]
    },
    {
      id: 'f8',
      timestamp: '00:00.041',
      timeOffsetMs: 41.2,
      protocol: 'ISO14443A',
      direction: 'PICC_TO_PCD',
      commandName: 'PICC Nonce (Nt Challenge)',
      rawHex: '48 F2 B1 92',
      rawBinary: '01001000 11110010 10110001 10010010',
      byteLength: 4,
      status: 'OK',
      description: 'PICC genera y transmite su número pseudoaleatorio Nt (32 bits PRNG).',
      fields: [
        { name: 'Nonce Nt', value: '0x48F2B192', bitsOrBytes: '32 bits', description: 'Generado por el registro LFSR interno del chip' },
        { name: 'Criptoanálisis', value: 'PRNG Débil', bitsOrBytes: 'Crypto-1', description: 'Vulnerable a ataque Nested si se correlaciona tiempo' }
      ]
    },
    {
      id: 'f9',
      timestamp: '00:00.052',
      timeOffsetMs: 52.0,
      protocol: 'ISO14443A',
      direction: 'PCD_TO_PICC',
      commandName: 'Encrypted Reader Challenge (Nr + ar)',
      rawHex: '7A 9C 14 D3 5B 88 E2 01',
      rawBinary: '01111010 10011100 ...',
      byteLength: 8,
      status: 'ENCRYPTED',
      description: 'PCD responde con Nonce del lector (Nr) y respuesta cifrada (ar) bajo Crypto-1.',
      fields: [
        { name: 'Reader Nonce Nr', value: 'Cifrado', bitsOrBytes: 'Bytes 0-3', description: '32 bits cifrados con keystream' },
        { name: 'Answer ar', value: 'Cifrado', bitsOrBytes: 'Bytes 4-7', description: 'Función sucesora f(Nt)' }
      ]
    },
    {
      id: 'f10',
      timestamp: '00:00.063',
      timeOffsetMs: 63.4,
      protocol: 'ISO14443A',
      direction: 'PICC_TO_PCD',
      commandName: 'PICC Session Established (at)',
      rawHex: '3C 8E A1 5F',
      rawBinary: '00111100 10001110 10100001 01011111',
      byteLength: 4,
      status: 'ENCRYPTED',
      description: 'Tarjeta verifica ar y devuelve at. El canal cifrado queda abierto para lectura.',
      fields: [
        { name: 'PICC Answer at', value: 'Válido', bitsOrBytes: '32 bits', description: 'Sesión autenticada con éxito' },
        { name: 'Cipher State', value: 'Crypto-1 Keystream', bitsOrBytes: 'LFSR 48-bit', description: 'Comandos subsiguientes van cifrados con paridad par' }
      ]
    }
  ],

  'HID_WIEGAND': [
    {
      id: 'w1',
      timestamp: '00:00.010',
      timeOffsetMs: 10.0,
      protocol: 'HID_WIEGAND',
      direction: 'PCD_TO_PICC',
      commandName: 'LF Carrier Excitation (125 kHz)',
      rawHex: 'AA 55 FF',
      rawBinary: '10101010 01010101 11111111',
      byteLength: 3,
      status: 'OK',
      description: 'Bobina LF energiza el transpondedor pasivo T5577 / e-Marine a 125 kHz.',
      fields: [
        { name: 'Carrier Frequency', value: '125.00 kHz', bitsOrBytes: 'RF Field', description: 'Generación de campo continuo' }
      ]
    },
    {
      id: 'w2',
      timestamp: '00:00.024',
      timeOffsetMs: 24.2,
      protocol: 'HID_WIEGAND',
      direction: 'PICC_TO_PCD',
      commandName: 'FSK2 Demodulated Stream',
      rawHex: '20 06 EC 13 37',
      rawBinary: '00100000 00000110 11101100 00010011 00110111',
      byteLength: 5,
      parityValid: true,
      status: 'OK',
      description: 'Trama Wiegand 26 bits decodificada: FC: 104, Card Number: 31337.',
      fields: [
        { name: 'Even Parity (EP)', value: '0', bitsOrBytes: 'Bit 1', description: 'Paridad par sobre bits 1-13' },
        { name: 'Facility Code (FC)', value: '104 (0x68)', bitsOrBytes: 'Bits 2-9', description: 'Código de instalación de 8 bits' },
        { name: 'Card Number (CN)', value: '31337 (0x7A69)', bitsOrBytes: 'Bits 10-25', description: 'Número serial de credencial de 16 bits' },
        { name: 'Odd Parity (OP)', value: '1', bitsOrBytes: 'Bit 26', description: 'Paridad impar sobre bits 14-26' }
      ]
    }
  ]
};

export const BinaryStreamAnalyzer: React.FC<BinaryStreamAnalyzerProps> = ({
  connectionMode,
  onExecuteCommand,
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ISO14443A');
  const [frames, setFrames] = useState<ProtocolDataFrame[]>(SAMPLE_HANDSHAKES['ISO14443A']);
  const [selectedFrame, setSelectedFrame] = useState<ProtocolDataFrame | null>(SAMPLE_HANDSHAKES['ISO14443A'][0]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PCD' | 'PICC'>('ALL');
  const [copiedFrameId, setCopiedFrameId] = useState<string | null>(null);

  const streamEndRef = useRef<HTMLDivElement>(null);

  // Switch protocol sequence
  const handleSelectProtocol = (proto: string) => {
    setSelectedProtocol(proto);
    const seq = SAMPLE_HANDSHAKES[proto] || SAMPLE_HANDSHAKES['ISO14443A'];
    setFrames(seq);
    setSelectedFrame(seq[0]);
  };

  // Re-simulate / inject fresh handshake with randomized nonces
  const handleResimulateHandshake = () => {
    const randomUid = [
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
    ];
    const bccNum = parseInt(randomUid[0], 16) ^ parseInt(randomUid[1], 16) ^ parseInt(randomUid[2], 16) ^ parseInt(randomUid[3], 16);
    const bccHex = bccNum.toString(16).padStart(2, '0').toUpperCase();

    const randomNt = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(' ');

    const updated = SAMPLE_HANDSHAKES['ISO14443A'].map((f) => {
      if (f.id === 'f4') {
        const fullHex = `${randomUid.join(' ')} ${bccHex}`;
        return {
          ...f,
          rawHex: fullHex,
          rawBinary: fullHex.split(' ').map(h => parseInt(h, 16).toString(2).padStart(8, '0')).join(' '),
          fields: [
            { name: 'UID Byte 0', value: `0x${randomUid[0]}`, bitsOrBytes: 'Byte 0', description: 'Fabricante' },
            { name: 'UID Byte 1', value: `0x${randomUid[1]}`, bitsOrBytes: 'Byte 1', description: 'Serial' },
            { name: 'UID Byte 2', value: `0x${randomUid[2]}`, bitsOrBytes: 'Byte 2', description: 'Serial' },
            { name: 'UID Byte 3', value: `0x${randomUid[3]}`, bitsOrBytes: 'Byte 3', description: 'Serial' },
            { name: 'BCC (XOR Checksum)', value: `0x${bccHex}`, bitsOrBytes: 'Byte 4', description: 'Verificación XOR' }
          ]
        };
      }
      if (f.id === 'f8') {
        return {
          ...f,
          rawHex: randomNt,
          rawBinary: randomNt.split(' ').map(h => parseInt(h, 16).toString(2).padStart(8, '0')).join(' '),
          fields: [
            { name: 'Nonce Nt', value: `0x${randomNt.replace(/\s+/g, '')}`, bitsOrBytes: '32 bits', description: 'Desafío generado' },
            { name: 'Criptoanálisis', value: 'PRNG Analizado', bitsOrBytes: 'Crypto-1', description: 'Explotable' }
          ]
        };
      }
      return f;
    });

    setFrames(updated);
    setSelectedFrame(updated[0]);
  };

  const handleCopyHex = (frame: ProtocolDataFrame) => {
    navigator.clipboard.writeText(frame.rawHex);
    setCopiedFrameId(frame.id);
    setTimeout(() => setCopiedFrameId(null), 1800);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(frames, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid_handshake_trace_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter frames
  const filteredFrames = frames.filter((f) => {
    if (activeFilter === 'PCD') return f.direction === 'PCD_TO_PICC';
    if (activeFilter === 'PICC') return f.direction === 'PICC_TO_PCD';
    return true;
  });

  return (
    <div className="bg-[#080d16] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Binary className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Analizador de Tramas Binarias & Handshakes RF</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                PCD ↔ PICC INSPECTOR
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Intercepción y disección a nivel de bit de tramas hex en el aire (REQA, ATQA, Anticollision, SAK y Nonces).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto text-xs">
          {/* Protocol selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => handleSelectProtocol('ISO14443A')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedProtocol === 'ISO14443A'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ISO 14443-A (MIFARE)
            </button>
            <button
              onClick={() => handleSelectProtocol('HID_WIEGAND')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedProtocol === 'HID_WIEGAND'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LF HID Prox (26-bit)
            </button>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2 py-0.5 rounded ${activeFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('PCD')}
              className={`px-2 py-0.5 rounded ${activeFilter === 'PCD' ? 'bg-blue-900/60 text-blue-200 font-bold' : 'text-slate-400'}`}
            >
              Lector (PCD)
            </button>
            <button
              onClick={() => setActiveFilter('PICC')}
              className={`px-2 py-0.5 rounded ${activeFilter === 'PICC' ? 'bg-emerald-900/60 text-emerald-200 font-bold' : 'text-slate-400'}`}
            >
              Tarjeta (PICC)
            </button>
          </div>

          {/* Resimulate Button */}
          <button
            onClick={handleResimulateHandshake}
            title="Generar nueva secuencia de handshake con Nonce y UID aleatorios"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 font-mono text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Regenerar Trazas</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            title="Descargar volcado de tramas en formato JSON estructurado"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg border border-cyan-800/60 font-mono text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar Traza</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Ladder/List & Right Bit-Level Dissector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Frame Sequence Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/90 rounded-xl overflow-hidden flex flex-col h-[400px]">
          {/* Table Header */}
          <div className="h-8 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80"></span>
              <span>SECUENCIA DE TRAMAS CAPTURADAS ({filteredFrames.length})</span>
            </div>
            <span className="text-[10px] text-slate-500">Haz clic en una trama para inspeccionar bits</span>
          </div>

          {/* Frame List Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 select-none font-mono text-xs">
            {filteredFrames.map((frame, index) => {
              const isSelected = selectedFrame?.id === frame.id;
              const isPcd = frame.direction === 'PCD_TO_PICC';

              return (
                <div
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Direction + Index + Time */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-slate-500 w-4 text-right">#{index + 1}</span>
                    
                    {/* Direction Badge */}
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 shrink-0 ${
                      isPcd 
                        ? 'bg-blue-950/90 text-blue-300 border border-blue-700/60' 
                        : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                    }`}>
                      {isPcd ? <ArrowRight className="w-2.5 h-2.5 text-blue-400" /> : <ArrowLeft className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{isPcd ? 'PCD' : 'PICC'}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate text-[11px] flex items-center gap-1.5">
                        <span>{frame.commandName}</span>
                        {frame.status === 'ENCRYPTED' && (
                          <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800/60 px-1 rounded">
                            Cifrado
                          </span>
                        )}
                        {frame.status === 'ACK' && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1 rounded">
                            ACK
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        +{frame.timeOffsetMs} ms · {frame.byteLength} byte(s)
                      </div>
                    </div>
                  </div>

                  {/* Right: Hex Preview */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-bold">
                      {frame.rawHex}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyHex(frame);
                      }}
                      title="Copiar bytes hexadecimales"
                      className="p-1 hover:text-cyan-400 text-slate-500 rounded transition-colors"
                    >
                      {copiedFrameId === frame.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Bit-Level Frame Dissector & Field Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/90 rounded-xl overflow-hidden flex flex-col h-[400px]">
          {/* Header */}
          <div className="h-8 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>DISECCIÓN DE CAMPOS & BITS</span>
            </span>
            {selectedFrame && (
              <span className="text-[10px] text-cyan-400 font-mono">
                {selectedFrame.protocol}
              </span>
            )}
          </div>

          {/* Details Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {selectedFrame ? (
              <>
                {/* Frame Overview Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-slate-100">{selectedFrame.commandName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      selectedFrame.direction === 'PCD_TO_PICC'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}>
                      {selectedFrame.direction === 'PCD_TO_PICC' ? 'Lector → Tarjeta' : 'Tarjeta → Lector'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {selectedFrame.description}
                  </p>

                  {/* Raw Hex & Binary Stream */}
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Hexadecimal:</span>
                      <span className="font-bold text-cyan-300">{selectedFrame.rawHex}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 block">Flujo de Bits (Binario):</span>
                      <div className="p-1.5 bg-slate-950 border border-slate-800 rounded text-emerald-400 break-all font-mono text-[10px] tracking-widest leading-relaxed">
                        {selectedFrame.rawBinary}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decoded Protocol Fields List */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Campos Decodificados del Protocolo:
                  </span>

                  <div className="space-y-1.5">
                    {selectedFrame.fields.map((field, fIdx) => (
                      <div
                        key={fIdx}
                        className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-[11px]">{field.name}</span>
                          <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                            {field.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="text-slate-500">{field.bitsOrBytes}</span>
                          <span className="text-slate-300 text-right">{field.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-center text-xs">
                Selecciona una trama del panel izquierdo para analizar sus bits y campos decodificados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Quick Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Total Tramas</span>
          <span className="text-sm font-bold text-slate-100">{frames.length} paquetes</span>
          <span className="text-[9px] text-cyan-400 block">Handshake Completo</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Latencia Media de Ida y Vuelta</span>
          <span className="text-sm font-bold text-emerald-400">~6.8 ms</span>
          <span className="text-[9px] text-emerald-400 block">Frame Delay Time (FDT) Óptimo</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Tasa de Modulación</span>
          <span className="text-sm font-bold text-cyan-300">106 kbps</span>
          <span className="text-[9px] text-slate-400 block">Subportadora fc/16 (848 kHz)</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Integridad de Trama</span>
          <span className="text-sm font-bold text-emerald-400">100% Válida</span>
          <span className="text-[9px] text-emerald-400 block">CRC-16 & Paridad OK</span>
        </div>
      </div>
    </div>
  );
};
