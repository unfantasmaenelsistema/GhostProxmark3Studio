export type ConnectionMode = 'disconnected' | 'serial' | 'hid' | 'virtual';

export interface DeviceInfo {
  version: string;
  firmwareBranch: string;
  os: string;
  chipModel: string;
  fpgaImage: string;
  flashSize: string;
  baudRate: number;
  portName?: string;
  lfVoltage: number; // e.g. 29.4 V
  hfVoltage: number; // e.g. 10.8 V
  resonanceLfKhz: number; // e.g. 125.0
  resonanceHfMhz: number; // e.g. 13.56
}

export interface AntennaReading {
  timestamp: string;
  lfVoltage: number;
  hfVoltage: number;
  lfFreq: number;
  hfFreq: number;
}

export interface ConsoleLogItem {
  id: string;
  timestamp: string;
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  text: string;
}

export interface HidWiegand26 {
  facilityCode: number; // 0-255 (8 bits)
  cardNumber: number;   // 0-65535 (16 bits)
  evenParity: number;   // 1 bit
  oddParity: number;    // 1 bit
  rawHex: string;       // 26-bit in hex (e.g. 200676abcd)
  binaryString: string; // 26 bits string
}

export interface Em4100Data {
  rawHex: string;       // 10 hex chars (e.g. 0102030405)
  customerCode: string;
  tagNumber: string;
  parityValid: boolean;
}

export interface T5577Config {
  block0Hex: string;
  modulation: 'ASK' | 'FSK1' | 'FSK2' | 'PSK1' | 'PSK2' | 'PSK3';
  bitRate: 'RF/16' | 'RF/32' | 'RF/40' | 'RF/50' | 'RF/64' | 'RF/100' | 'RF/128';
  maxBlock: number;
  testMode: boolean;
  aor: boolean;
  passwordProtected: boolean;
  passwordHex?: string;
}

export interface MifareSector {
  sector: number;
  blocks: {
    blockIndex: number;
    hexData: string;
    ascii: string;
    type: 'manufacturer' | 'data' | 'trailer';
  }[];
  keyA: {
    value: string;
    found: boolean;
    source?: string;
  };
  keyB: {
    value: string;
    found: boolean;
    source?: string;
  };
  accessBits: string; // e.g. 'FF078069'
  permissionsDescription?: string;
}

export interface CardDump {
  uid: string;
  atqa: string;
  sak: string;
  type: 'Mifare Classic 1K' | 'Mifare Classic 4K' | 'Mifare Ultralight' | 'HID Prox' | 'EM4100' | 'T5577' | 'iClass';
  sectors: MifareSector[];
  timestamp: string;
  notes?: string;
}

export interface ScriptCommand {
  id: string;
  title: string;
  command: string;
  description: string;
  category: 'LF' | 'HF' | 'HARDWARE' | 'DUMP' | 'MAGIC' | 'EMULATE';
}

export type ProtocolType = 'ISO14443A' | 'ISO14443B' | 'ISO15693' | 'HID_WIEGAND' | 'EM4100' | 'FELICA';

export type FrameDirection = 'PCD_TO_PICC' | 'PICC_TO_PCD';

export interface ProtocolDataFrame {
  id: string;
  timestamp: string;
  timeOffsetMs: number;
  protocol: ProtocolType;
  direction: FrameDirection;
  commandName: string;
  rawHex: string;
  rawBinary: string;
  byteLength: number;
  crcValid?: boolean;
  parityValid?: boolean;
  status: 'OK' | 'COLLISION' | 'PARITY_ERR' | 'CRC_ERR' | 'ENCRYPTED' | 'ACK' | 'NACK';
  description: string;
  fields: {
    name: string;
    value: string;
    bitsOrBytes: string;
    description: string;
  }[];
}
