import { CardDump, ConsoleLogItem, DeviceInfo, HidWiegand26, MifareSector, T5577Config } from '../types/proxmark';

export const INITIAL_DEVICE_INFO: DeviceInfo = {
  version: 'v4.18967 - Iceman Edition',
  firmwareBranch: 'master/v4.18967 (git)',
  os: 'Linux / Windows x64',
  chipModel: 'AT91SAM7S512 (512 KB)',
  fpgaImage: 'FPGA image 2s30vq100',
  flashSize: '512 KB Flash / 64 KB RAM',
  baudRate: 115200,
  portName: '/dev/ttyACM0',
  lfVoltage: 29.4,
  hfVoltage: 11.2,
  resonanceLfKhz: 125.0,
  resonanceHfMhz: 13.56,
};

// Access conditions decoder for Mifare Classic (C1, C2, C3)
export function decodeAccessBits(accessBitsHex: string): string {
  // Typical default FF078069 -> transport configuration:
  // Data blocks: Read/Write by Key A or Key B
  // Trailer: Key A read never, write Key A/B; Key B read never, write Key A/B
  if (accessBitsHex.toUpperCase().startsWith('FF0780')) {
    return 'Transport standard: Bloques de datos R/W con Key A|B. Trailer: Key A nunca leíble, modificable con Key B.';
  }
  if (accessBitsHex.toUpperCase().startsWith('7F0788')) {
    return 'Sector de sólo lectura: Bloques de datos R con Key A|B, W denegado. Llaves protegidas.';
  }
  if (accessBitsHex.toUpperCase().startsWith('08778F')) {
    return 'Monedero / Validador: Bloques de datos con funciones de Débito/Crédito protegidas por Key B.';
  }
  return `Permisos personalizados (Bytes: ${accessBitsHex}). Control de lectura/escritura según matriz de bits C1 C2 C3.`;
}

// Generate default mock Mifare Classic 1K dump
export function generateSampleMifare1k(uid: string = 'A48F2B19'): CardDump {
  const sectors: MifareSector[] = [];
  const defaultKeys = [
    { a: 'A0A1A2A3A4A5', b: 'B0B1B2B3B4B5' },
    { a: 'FFFFFFFFFFFF', b: 'FFFFFFFFFFFF' },
    { a: 'D3F7D3F7D3F7', b: 'FFFFFFFFFFFF' },
    { a: 'A0B0C0D0E0F0', b: 'A1B1C1D1E1F1' },
  ];

  for (let s = 0; s < 16; s++) {
    const keyPair = defaultKeys[s % defaultKeys.length];
    const isSector0 = s === 0;
    const blocks = [];

    for (let b = 0; b < 4; b++) {
      const blockIndex = s * 4 + b;
      let hexData = '00000000000000000000000000000000';
      let type: 'manufacturer' | 'data' | 'trailer' = 'data';

      if (isSector0 && b === 0) {
        type = 'manufacturer';
        // Block 0: UID (4 bytes) + BCC (1 byte) + SAK/ATQA manufacturer info
        const bcc = '37';
        hexData = `${uid}${bcc}08040001020304050607`;
      } else if (b === 3) {
        type = 'trailer';
        const access = s === 0 ? 'FF078069' : (s % 2 === 0 ? '7F078869' : 'FF078069');
        hexData = `${keyPair.a}${access}${keyPair.b}`;
      } else {
        type = 'data';
        if (s === 1 && b === 0) {
          // Simulated card balance or card holder ID
          hexData = '00271000FFD8EFFF0027100001FE01FE'; // 10000 units value block
        } else if (s === 2 && b === 0) {
          hexData = '4143434553532D4752414E5445443236'; // ASCII "ACCESS-GRANTED26"
        }
      }

      // Convert hex to ASCII
      let ascii = '';
      for (let i = 0; i < hexData.length; i += 2) {
        const byte = parseInt(hexData.substring(i, i + 2), 16);
        ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '·';
      }

      blocks.push({
        blockIndex,
        hexData,
        ascii,
        type,
      });
    }

    sectors.push({
      sector: s,
      blocks,
      keyA: { value: keyPair.a, found: true, source: 'Default Dict' },
      keyB: { value: keyPair.b, found: true, source: 'Nested Attack' },
      accessBits: s === 0 ? 'FF078069' : (s % 2 === 0 ? '7F078869' : 'FF078069'),
      permissionsDescription: decodeAccessBits(s === 0 ? 'FF078069' : (s % 2 === 0 ? '7F078869' : 'FF078069')),
    });
  }

  return {
    uid,
    atqa: '00 04',
    sak: '08',
    type: 'Mifare Classic 1K',
    sectors,
    timestamp: new Date().toISOString(),
    notes: 'Volcado completo recuperado mediante autopwn/nested attack (16/16 sectores descifrados)',
  };
}

// 26-bit Wiegand Calculator (H10301 standard)
export function calculateWiegand26(fc: number, cn: number): HidWiegand26 {
  const safeFc = Math.max(0, Math.min(255, fc));
  const safeCn = Math.max(0, Math.min(65535, cn));

  // 1 bit: Even parity of bits 1..12 (FC + first 4 bits of CN)
  // 8 bits: Facility Code
  // 16 bits: Card Number
  // 1 bit: Odd parity of bits 13..24 (last 12 bits of CN)
  const fcBits = safeFc.toString(2).padStart(8, '0');
  const cnBits = safeCn.toString(2).padStart(16, '0');

  const first12 = fcBits + cnBits.slice(0, 4);
  const last12 = cnBits.slice(4);

  // Even parity for first 12: total 1s including parity bit must be even
  const onesFirst = (first12.match(/1/g) || []).length;
  const evenParity = (onesFirst % 2 === 0) ? 0 : 1;

  // Odd parity for last 12: total 1s including parity bit must be odd
  const onesLast = (last12.match(/1/g) || []).length;
  const oddParity = (onesLast % 2 === 0) ? 1 : 0;

  const fullBinary = `${evenParity}${fcBits}${cnBits}${oddParity}`;
  const decVal = parseInt(fullBinary, 2);
  const rawHex = '200' + decVal.toString(16).padStart(7, '0');

  return {
    facilityCode: safeFc,
    cardNumber: safeCn,
    evenParity,
    oddParity,
    binaryString: fullBinary,
    rawHex: rawHex.toUpperCase(),
  };
}

// Parse Wiegand 26 from raw binary string
export function parseWiegand26Binary(binary26: string): HidWiegand26 | null {
  if (binary26.length !== 26) return null;
  const evenParity = parseInt(binary26[0], 10);
  const fc = parseInt(binary26.slice(1, 9), 2);
  const cn = parseInt(binary26.slice(9, 25), 2);
  const oddParity = parseInt(binary26[25], 10);
  return calculateWiegand26(fc, cn);
}

// Generate T5577 Block 0 Configuration Hex
export function generateT5577Block0(config: T5577Config): string {
  // T5577 Block 0 is 32 bits:
  // Bit 0: Extended mode (0)
  // Bit 1-4: Modulation (0000 = Direct, 0001 = Manchester ASK, 0010 = Bi-Phase, 0100 = FSK, etc.)
  // Bit 5-7: Bit Rate
  // Bit 8-11: Maxblock (e.g. 7)
  // Bit 12: AOR
  // Bit 13: PSK clock (if PSK)
  // Bit 14: Inverse data
  // Bit 15: Fast write
  // Bit 16: Password enable
  let modVal = '0001'; // Default ASK Manchester
  if (config.modulation.startsWith('FSK')) modVal = '0100';
  if (config.modulation.startsWith('PSK')) modVal = '1000';

  let rateVal = '010'; // RF/32 default
  if (config.bitRate === 'RF/16') rateVal = '001';
  if (config.bitRate === 'RF/64') rateVal = '011';
  if (config.bitRate === 'RF/128') rateVal = '100';

  const maxBlockBits = config.maxBlock.toString(2).padStart(4, '0');
  const pwdBit = config.passwordProtected ? '1' : '0';
  const aorBit = config.aor ? '1' : '0';
  const testBit = config.testMode ? '1' : '0';

  // Construct standard 32 bits
  const bin = `0${modVal}${rateVal}${maxBlockBits}${aorBit}000${pwdBit}${testBit}0000000000000`;
  const hex = parseInt(bin.padEnd(32, '0').slice(0, 32), 2).toString(16).padStart(8, '0').toUpperCase();
  return hex;
}

// Pre-defined script templates for Proxmark3
export const SCRIPT_TEMPLATES = [
  {
    id: 'script_audit_full',
    title: 'Auditoría Rápida Integral (LF + HF)',
    description: 'Sintoniza antenas, busca credenciales en 125 kHz y 13.56 MHz, y muestra reporte básico.',
    category: 'HARDWARE' as const,
    command: 'hw tune\nlf search\nhf search\nhw status',
  },
  {
    id: 'script_hid_clone',
    title: 'Clonado HID Prox en T5577',
    description: 'Escribe formato Wiegand 26-bit (H10301) en chip T5577 virgen.',
    category: 'LF' as const,
    command: 'lf t55xx wipe\nlf hid clone -w H10301 --fc {FC} --cn {CN}\nlf hid read',
  },
  {
    id: 'script_em4100_clone',
    title: 'Clonado EM4100 en T5577',
    description: 'Configura modulación RF/64 y escribe el ID de 10 dígitos hexadecimales.',
    category: 'LF' as const,
    command: 'lf em 410xclone --id {EM_ID}\nlf em 410xread',
  },
  {
    id: 'script_mifare_autopwn',
    title: 'Mifare Classic 1K Autopwn Completo',
    description: 'Ejecuta ataque de diccionario, nested y volcado a archivo binario de todos los sectores.',
    category: 'HF' as const,
    command: 'hf 14a info\nhf mf autopwn --1k -s\nhf mf dump',
  },
  {
    id: 'script_gen1a_uid',
    title: 'Modificar UID en Tarjeta Mágica Gen1a (Backdoor)',
    description: 'Escribe bloque 0 con nuevo UID y recalcula checksum BCC automáticamente.',
    category: 'MAGIC' as const,
    command: 'hf mf csetuid -u {NEW_UID} --force\nhf 14a info',
  },
  {
    id: 'script_gen2_cuid',
    title: 'Modificar UID en Tarjeta Gen2 CUID (Direct Write)',
    description: 'Escribe el bloque 0 mediante autenticación con llave estándar (sin comandos mágicos).',
    category: 'MAGIC' as const,
    command: 'hf mf wrbl --block 0 -k FFFFFFFFFFFF -d {BLOCK0_DATA}\nhf 14a info',
  },
  {
    id: 'script_ultralight_dump',
    title: 'Inspeccionar Mifare Ultralight / NTAG',
    description: 'Lee páginas 0 a 15, contadores y analiza formato NDEF.',
    category: 'HF' as const,
    command: 'hf mfu info\nhf mfu dump -f mfu_dump.bin',
  },
];

// Helper to format simulated CLI outputs for commands
export function evaluateCommand(rawCmd: string, sampleDump: CardDump): { output: string; parsedData?: any } {
  const cmd = rawCmd.trim();
  const lower = cmd.toLowerCase();

  if (lower === 'help' || lower === '?') {
    return {
      output: `[=] Ayuda de comandos Proxmark3 Web Studio:
[=]  hw status       : Estado del hardware, voltajes y reloj
[=]  hw version      : Información de firmware, bootloader y FPGA
[=]  hw tune         : Prueba de resonancia de antenas LF y HF
[=]  lf search       : Escaneo automático de tarjetas 125 kHz
[=]  lf hid read     : Lectura de tarjeta HID Prox II Wiegand
[=]  lf em 410xread  : Lectura de tarjeta EM4100
[=]  lf t55xx detect : Detección de chip Atmel T5577
[=]  hf search       : Escaneo de etiquetas 13.56 MHz (ISO14443-A/B, ISO15693)
[=]  hf 14a info     : Información detallada de tarjeta ISO14443-A
[=]  hf mf autopwn   : Ataque automatizado sobre Mifare Classic 1K
[=]  hf mf chk       : Verificación de llaves contra diccionario estándar
[=]  hf mf dump      : Volcado de memoria descifrada
[=]  hf mf csetuid   : Cambio de UID en tarjeta mágica Gen1a
[=]  hf mfu info     : Información de Mifare Ultralight / NTAG
[=]  data plot       : Muestra gráfico de señal muestreada`,
    };
  }

  if (lower.startsWith('hw version')) {
    return {
      output: `[=] Communicating with Proxmark3 device on /dev/ttyACM0
[+] Device: Proxmark3 RDV4.01
[+] Flash size: 512 KB
[+] FPGA image: 2s30vq100 (Dual LF/HF)
[+] Hardware: RDV4 iceman
[+] Operating system: Linux / Windows
[+] Client version: master/v4.18967 (git iceman 2026)
[+] Bootloader version: v4.18967
[+] Microcontroller: AT91SAM7S512
[+] Chip speed: 48.05 MHz`,
    };
  }

  if (lower.startsWith('hw status')) {
    return {
      output: `[+] Hardware Status:
[+]   Mode..............: Normal dual-frequency
[+]   Supply voltage....: 5.04 V
[+]   Core voltage......: 3.32 V
[+]   LF antenna voltage: 29.42 V @ 125.00 kHz (Optimal)
[+]   HF antenna voltage: 11.24 V @ 13.56 MHz (Optimal)
[+]   USB connection....: USB High-Speed Full Duplex
[+]   FPGA status.......: Configured (ready)
[+]   Status LEDs.......: Red (LF), Green (HF), Amber (FPGA)`,
    };
  }

  if (lower.startsWith('hw tune')) {
    return {
      output: `[=] Measuring antenna characteristics, please wait...
[+] LF antenna: 29.42 V @ 125.00 kHz
[+] LF antenna: 22.15 V @ 134.00 kHz
[+] LF optimal: 31.80 V @ 124.80 kHz
[+] HF antenna: 11.24 V @ 13.56 MHz
[+] Your LF antenna is tuned to 125.00 kHz
[+] Your HF antenna is tuned to 13.56 MHz
[+] Displaying resonance curves... OK`,
    };
  }

  if (lower.startsWith('lf search')) {
    return {
      output: `[=] NOTE: some tags aren't capable of answering to 'lf search'
[+] [?] EM 410x ID 0102030405
[+] EM410x (RF/64)
[+] Tag ID      : 01 02 03 04 05
[+] Customer ID : 01
[+] Number      : 02 03 04 05
[+] Valid EM410x ID Found!
[+] [H10301] HID 26-bit: FC: 112  Card: 45021  Parity: Valid
[+] Raw: 200676a0d5`,
    };
  }

  if (lower.startsWith('lf hid read')) {
    return {
      output: `[+] [H10301] HID 26-bit: FC: 112  Card: 45021  Parity: Valid
[+] Raw: 200676a0d5
[+] Facility Code : 112 (0x70)
[+] Card Number   : 45021 (0xAFD5)
[+] Wiegand Bits  : 0 01110000 1010111111010101 1
[+] Parities      : Even=OK, Odd=OK`,
    };
  }

  if (lower.startsWith('lf em 410xread') || lower.startsWith('lf em 410xdread')) {
    return {
      output: `[+] EM410x (RF/64)
[+] Tag ID      : 01 02 03 04 05
[+] Customer ID : 01
[+] Number      : 02 03 04 05
[+] Hex parity  : Valid
[+] Clock       : 64 RF cycles`,
    };
  }

  if (lower.startsWith('lf em 410xclone')) {
    const match = cmd.match(/--id\s+([0-9a-fA-F]{10})/i);
    const id = match ? match[1].toUpperCase() : '0102030405';
    return {
      output: `[+] Cloning tag with ID ${id} to T55x7 chip...
[+] Writing block 00 (Mode: Manchester RF/64, Maxblock 2)...
[+] Writing block 01 (EM ID part 1)...
[+] Writing block 02 (EM ID part 2)...
[+] Verifying write by reading back...
[+] SUCCESS! Cloned EM410x ID: ${id}`,
    };
  }

  if (lower.startsWith('lf t55xx detect')) {
    return {
      output: `[+] Chip Type.........: ATA5577
[+] Modulation........: ASK / Manchester
[+] Bit rate..........: 32 (RF/32)
[+] Inverted..........: No
[+] Offset............: 0
[+] Max block.........: 7
[+] Password set......: No
[+] AOR...............: No
[+] Test mode.........: Disabled`,
    };
  }

  if (lower.startsWith('hf search') || lower.startsWith('hf 14a info')) {
    return {
      output: `[=] Searching for ISO14443-A tag...
[+] UID: ${sampleDump.uid.match(/.{1,2}/g)?.join(' ') || 'A4 8F 2B 19'}
[+] ATQA: ${sampleDump.atqa}
[+] SAK: ${sampleDump.sak} [2]
[+] Possible types:
[+]    MIFARE Classic 1K | Plus 2K SL1
[=] Proprietary IC: NXP Semiconductors
[+] PRNG: Weak (vulnerable to Darkside / Nested attacks)
[+] Fingerprint: Standard NXP transponder`,
    };
  }

  if (lower.startsWith('hf mf autopwn')) {
    return {
      output: `[+] Auto-pwn starting on MIFARE Classic 1K...
[+] Loading default dictionary keys (52 standard keys)...
[+] Testing Sector 00 | Key A: A0A1A2A3A4A5 [found] | Key B: B0B1B2B3B4B5 [found]
[+] Testing Sector 01 | Key A: FFFFFFFFFFFF [found] | Key B: FFFFFFFFFFFF [found]
[+] Testing Sector 02 | Key A: D3F7D3F7D3F7 [found] | Key B: FFFFFFFFFFFF [found]
[+] Testing Sector 03 | Key A: A0B0C0D0E0F0 [found] | Key B: A1B1C1D1E1F1 [found]
[+] Nested attack on unknown sectors (using weak PRNG exploit)...
[+] All 16 sectors unlocked successfully! (32/32 keys found)
[+] Dump written to \`hf-mf-${sampleDump.uid.replace(/\s+/g, '')}-dump.bin\` (1024 bytes)
[+] Dump written to \`hf-mf-${sampleDump.uid.replace(/\s+/g, '')}-dump.eml\``,
    };
  }

  if (lower.startsWith('hf mf csetuid')) {
    const match = cmd.match(/-u\s+([0-9a-fA-F]{8})/i);
    const newUid = match ? match[1].toUpperCase() : 'DEADBEEF';
    return {
      output: `[+] Magic Gen1a Card detected (backdoor response 0x0A received)
[+] Writing Block 0 with UID ${newUid}...
[+] Calculating BCC checksum: OK
[+] Verifying new card identity...
[+] New UID: ${newUid.match(/.{1,2}/g)?.join(' ')}
[+] SAK: 08
[+] ATQA: 00 04
[+] SUCCESS! UID changed successfully.`,
    };
  }

  if (lower.startsWith('hf mfu info')) {
    return {
      output: `[+] MIFARE Ultralight / NTAG detected
[+] UID: 04 78 92 1A 44 6B 80 (7 bytes)
[+] Manufacturer: NXP Semiconductors
[+] IC Type: NTAG215 (Amiibo compatible)
[+] Total Memory: 540 bytes (135 pages x 4 bytes)
[+] User Memory: 504 bytes (126 pages)
[+] Lock bytes: Page 02 [00 00] (Unlocked)
[+] Dynamic lock: Page 82 [00 00 00]
[+] Counter 0: 0x000000`,
    };
  }

  return {
    output: `[usb] pm3 --> ${cmd}
[+] Command acknowledged and executed by Proxmark3 client.
[+] Status: OK (0)`,
  };
}
