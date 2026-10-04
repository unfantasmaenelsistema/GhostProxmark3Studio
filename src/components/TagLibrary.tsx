import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Tag as TagIcon, 
  Layers, 
  Radio, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  Info, 
  Sliders, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';

export interface TagSpec {
  id: string;
  name: string;
  manufacturer: string;
  frequency: 'HF' | 'LF';
  freqLabel: string;
  standards: string[];
  uidLength: string;
  atqa?: string;
  sak?: string;
  memorySize: string;
  memoryLayoutSummary: string;
  memoryBlocks: {
    label: string;
    range: string;
    bytes: number;
    color: string;
    description: string;
  }[];
  clonable: boolean;
  cloneTarget?: string;
  securityRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';
  securitySummary: string;
  pm3Commands: {
    title: string;
    cmd: string;
  }[];
  commonUses: string[];
}

export const TAG_DATABASE: TagSpec[] = [
  {
    id: 'mifare-classic-1k',
    name: 'MIFARE Classic 1K (S50)',
    manufacturer: 'NXP Semiconductors',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 14443-A', 'NFC Forum Type 2 Compat'],
    uidLength: '4 Bytes (Single) o 7 Bytes',
    atqa: '00 04',
    sak: '08',
    memorySize: '1024 Bytes (1 KB EEPROM)',
    memoryLayoutSummary: '16 Sectores × 4 Bloques (16 bytes/bloque) = 64 bloques.',
    memoryBlocks: [
      { label: 'Bloque Fabricante (00)', range: 'Sector 0, Bloque 0', bytes: 16, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'UID (4B), BCC (1B), Datos Fabricante (11B). Solo lectura en tarjetas originales; modificable en Magic Gen1a/Gen2.' },
      { label: 'Bloques de Datos de Usuario', range: 'Bloques 1-2 por sector (y 4-14)', bytes: 720, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Almacena datos en texto plano o estructuras Value Block (saldo/monedero electrónico).' },
      { label: 'Sector Trailers', range: 'Último bloque (Bloque 3) de c/sector', bytes: 256, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Key A (6B), Bits de Acceso (4B), Key B (6B). Controlan permisos R/W de cada bloque del sector.' },
    ],
    clonable: true,
    cloneTarget: 'UID Magic Gen1a / CUID Gen2 / UFUID Gen3',
    securityRisk: 'CRITICAL',
    securitySummary: 'Cifrado propietario Crypto-1 roto por completo. Vulnerable a Darkside, Nested y Hardnested en segundos con Proxmark3.',
    pm3Commands: [
      { title: 'Detectar e Info ISO14443-A', cmd: 'hf 14a info' },
      { title: 'Ataque Automatizado Autopwn', cmd: 'hf mf autopwn --1k' },
      { title: 'Comprobar Diccionario de Claves', cmd: 'hf mf chk --1k -f default_keys.dic' },
      { title: 'Clonar en Tarjeta Magic Gen1a', cmd: 'hf mf cload -f dump.eml' }
    ],
    commonUses: ['Sistemas de transporte masivo antiguos', 'Control de acceso de oficinas y parkings', 'Tarjetas de fidelización y gimnasios']
  },
  {
    id: 'mifare-classic-4k',
    name: 'MIFARE Classic 4K (S70)',
    manufacturer: 'NXP Semiconductors',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 14443-A'],
    uidLength: '4 Bytes o 7 Bytes',
    atqa: '00 02',
    sak: '18',
    memorySize: '4096 Bytes (4 KB EEPROM)',
    memoryLayoutSummary: '32 sectores de 4 bloques (16B) + 8 sectores grandes de 16 bloques (16B). Total 40 sectores.',
    memoryBlocks: [
      { label: 'Sectores 0 a 31 (Pequeños)', range: 'Sectores 0-31 (4 bloques c/u)', bytes: 2048, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Estructura idéntica a Classic 1K (bloques de datos + sector trailer).' },
      { label: 'Sectores 32 a 39 (Grandes)', range: 'Sectores 32-39 (16 bloques c/u)', bytes: 2048, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', description: 'Sectores ampliados para almacenar archivos de datos de mayor tamaño con un único Sector Trailer en el bloque 15.' }
    ],
    clonable: true,
    cloneTarget: 'Magic 4K CUID / Gen1a 4K',
    securityRisk: 'CRITICAL',
    securitySummary: 'Mismo cifrado Crypto-1 vulnerable que el modelo de 1K. Autopwn y Hardnested permiten extracción de los 40 pares de claves.',
    pm3Commands: [
      { title: 'Recuperar Todas las Claves 4K', cmd: 'hf mf autopwn --4k' },
      { title: 'Volcar Memoria Completa', cmd: 'hf mf dump --4k' }
    ],
    commonUses: ['Hotelería de lujo', 'Carnets universitarios multipropósito', 'Sistemas de monedero de campus']
  },
  {
    id: 'ntag213-215-216',
    name: 'NTAG 213 / 215 / 216',
    manufacturer: 'NXP Semiconductors',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 14443-A', 'NFC Forum Type 2 Tag'],
    uidLength: '7 Bytes (Double Cascade)',
    atqa: '00 44',
    sak: '00',
    memorySize: '144B (213) / 504B (215) / 888B (216)',
    memoryLayoutSummary: 'Organizado en Páginas de 4 Bytes. NTAG215 posee 135 páginas (540B en total).',
    memoryBlocks: [
      { label: 'Páginas 0x00 - 0x01 (Header)', range: 'Páginas 0-1', bytes: 8, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'UID0-UID6, BCC0, BCC1 y bytes internos de fábrica (OTP lock).' },
      { label: 'Página 0x02 (Static Lock)', range: 'Página 2', bytes: 4, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Lock bytes estáticos y CC (Capability Container).' },
      { label: 'Páginas de Usuario (NDEF)', range: 'Páginas 4 a 129 (en NTAG215)', bytes: 504, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Registros NDEF NFC (URLs, texto, VCARDs, datos binarios Amiibo).' },
      { label: 'Páginas Config / Auth', range: 'Últimas 5 páginas', bytes: 20, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Dynamic Lock, Contador de lecturas, PWD (password de 32 bits) y PACK (16 bits).' }
    ],
    clonable: true,
    cloneTarget: 'NTAG215 Magic Tag / Gen4x',
    securityRisk: 'LOW',
    securitySummary: 'Sin cifrado en el aire para lectura normal. Protección por contraseña PWD de 32 bits opcional. Muy seguro si no se requiere confidencialidad.',
    pm3Commands: [
      { title: 'Identificar Chip NTAG', cmd: 'hf mfu info' },
      { title: 'Volcado de Memoria Completo', cmd: 'hf mfu dump' },
      { title: 'Probar Contraseña de 32 bits', cmd: 'hf mfu pwdauth -k FFFFFFFF' }
    ],
    commonUses: ['Figuras Nintendo Amiibo (NTAG215)', 'Smart Posters y Etiquetas NFC URL', 'Emparejamiento Bluetooth rápido']
  },
  {
    id: 'mifare-desfire-ev1-ev2',
    name: 'MIFARE DESFire EV1 / EV2 / EV3',
    manufacturer: 'NXP Semiconductors',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 14443-4 (T=CL)', 'ISO/IEC 7816-4'],
    uidLength: '7 Bytes (o 4B aleatorio)',
    atqa: '03 44',
    sak: '20',
    memorySize: '2 KB / 4 KB / 8 KB Flexible',
    memoryLayoutSummary: 'Sistema de archivos jerárquico estructurado: Aplicaciones (AID) con hasta 32 archivos (Standard Data, Backup, Value, Linear/Cyclic Record).',
    memoryBlocks: [
      { label: 'Nivel Maestro (PICC Root)', range: 'AID 000000', bytes: 64, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Clave Maestra (PICC Master Key), versión de hardware y configuración del chip.' },
      { label: 'Aplicaciones AID', range: 'Hasta 28 Aplicaciones', bytes: 8192, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', description: 'Cada AID contiene sus propias claves de cifrado (3DES o AES-128) y archivos de datos aislados.' }
    ],
    clonable: false,
    cloneTarget: 'No clonable (Cifrado AES de grado bancario)',
    securityRisk: 'SECURE',
    securitySummary: 'Autenticación mutua criptográfica con 3DES o AES-128 y MAC de integridad. No existen vulnerabilidades públicas de extracción de claves.',
    pm3Commands: [
      { title: 'Identificar DESFire y Version', cmd: 'hf des info' },
      { title: 'Listar IDs de Aplicaciones (AID)', cmd: 'hf des list' }
    ],
    commonUses: ['Transporte de alta seguridad (Cercanías, Metro moderno)', 'Pasaportes electrónicos e-Passport', 'Control de acceso gubernamental']
  },
  {
    id: 'hid-prox-ii',
    name: 'HID Prox II (1326 / H10301)',
    manufacturer: 'HID Global',
    frequency: 'LF',
    freqLabel: '125 kHz',
    standards: ['Proprietary HID FSK', 'Wiegand 26-bit'],
    uidLength: '26 bits (3.25 Bytes)',
    memorySize: '37 bits de codificación RF total',
    memoryLayoutSummary: 'Transpondedor pasivo sin memoria de usuario. Emite continuamente su trama Wiegand modulada en FSK a 125 kHz.',
    memoryBlocks: [
      { label: 'Bit de Paridad Par (EP)', range: 'Bit 1', bytes: 1, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', description: 'Calculada sobre los bits 1 a 13.' },
      { label: 'Facility Code (FC)', range: 'Bits 2 a 9 (8 bits)', bytes: 1, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Código de instalación (0 a 255).' },
      { label: 'Card Number (CN)', range: 'Bits 10 a 25 (16 bits)', bytes: 2, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Identificador único de usuario (0 a 65,535).' },
      { label: 'Bit de Paridad Impar (OP)', range: 'Bit 26', bytes: 1, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'Calculada sobre los bits 14 a 26.' }
    ],
    clonable: true,
    cloneTarget: 'Chip Atmel T5577 (Configurado en FSK2a RF/50 o RF/64)',
    securityRisk: 'CRITICAL',
    securitySummary: 'Sin autenticación ni cifrado alguno. Se lee a distancia y se clona en 2 segundos en un chip T5577 regrabable.',
    pm3Commands: [
      { title: 'Búsqueda e Identificación HID', cmd: 'lf hid read' },
      { title: 'Clonar en T5577 (Ejemplo FC 104 CN 31337)', cmd: 'lf hid clone --fc 104 --cn 31337' },
      { title: 'Simular Credencial HID en Antena', cmd: 'lf hid sim --fc 104 --cn 31337' }
    ],
    commonUses: ['Control de accesos corporativos clásicos', 'Barreras de parking vehicular', 'Puertas de comunidades residenciales']
  },
  {
    id: 'em4100-unique',
    name: 'EM4100 / EM4102 (Unique)',
    manufacturer: 'EM Microelectronic',
    frequency: 'LF',
    freqLabel: '125 kHz',
    standards: ['EM Microelectronic ASK', 'Manchester 64-bit'],
    uidLength: '40 bits (5 Bytes UID)',
    memorySize: '64 bits totales transmitidos',
    memoryLayoutSummary: 'Trama continua de 64 bits modulada en ASK Manchester a RF/64: 9 bits de preámbulo + 10 nibbles con paridad + 1 stop bit.',
    memoryBlocks: [
      { label: 'Preámbulo de Sincronismo', range: 'Bits 0-8 (9 bits)', bytes: 1, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Secuencia fija de 9 unos binarios (111111111).' },
      { label: 'Customer ID (8 bits)', range: 'Bits 9-18 (2 nibbles + 2P)', bytes: 1, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Código de fabricante o versión de producto con paridad por fila.' },
      { label: 'Data Serial Number (32 bits)', range: 'Bits 19-58 (8 nibbles + 8P)', bytes: 4, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Número de serie único impreso en llavero RFID azul típico.' },
      { label: 'Paridad de Columna & Stop', range: 'Bits 59-63 (5 bits)', bytes: 1, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', description: '4 bits de paridad vertical (columnas) + 1 bit de parada final en 0.' }
    ],
    clonable: true,
    cloneTarget: 'Chip Atmel T5577 (Modulación ASK Manchester RF/64)',
    securityRisk: 'CRITICAL',
    securitySummary: 'Transmite su ID en texto plano sin validación bidireccional. Fácilmente clonable con Proxmark3 o Flipper Zero.',
    pm3Commands: [
      { title: 'Leer Llavero EM4100', cmd: 'lf em 410xread' },
      { title: 'Clonar en Tarjeta T5577', cmd: 'lf em 410xclone --id 0102030405' },
      { title: 'Simulación Continua', cmd: 'lf em 410xsim --id 0102030405' }
    ],
    commonUses: ['Llaveros RFID azules genéricos de porteros automáticos', 'Control de fichaje de empleados básico', 'Identificación de mascotas y microchips']
  },
  {
    id: 'atmel-t5577',
    name: 'Atmel / Microchip ATA5577 (T5577)',
    manufacturer: 'Microchip Technology',
    frequency: 'LF',
    freqLabel: '125 kHz / 134.2 kHz',
    standards: ['Multiestándar Configurable', 'ISO 11784/11785 FDX-B / HDX'],
    uidLength: 'Configurable (EM, HID, Indala, AWID, etc.)',
    memorySize: '330 bits (8 Bloques × 32 bits EEPROM)',
    memoryLayoutSummary: 'Chip de emulación regrabable por excelencia. Su Bloque 0 configura el modulador analógico interno.',
    memoryBlocks: [
      { label: 'Bloque 0 (Configuración Analógica)', range: 'Bloque 00', bytes: 4, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'Define modulación (ASK, FSK1, FSK2, PSK), tasa de bits (RF/16 a RF/128), contraseña y max block.' },
      { label: 'Bloques de Usuario (1 a 6)', range: 'Bloques 01 a 06', bytes: 24, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Almacena la trama binaria que el chip emitirá continuamente.' },
      { label: 'Bloque 7 (Password Opcional)', range: 'Bloque 07', bytes: 4, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Contraseña de 32 bits para bloquear la reescritura del chip.' }
    ],
    clonable: true,
    cloneTarget: 'Es el medio regrabable utilizado para clonar otros tags',
    securityRisk: 'MEDIUM',
    securitySummary: 'Por defecto sin contraseña; cualquiera con un Proxmark3 puede reescribir su Bloque 0. Puede protegerse con password de 32 bits.',
    pm3Commands: [
      { title: 'Detectar Chip T5577', cmd: 'lf t55xx detect' },
      { title: 'Leer Volcado de Bloques', cmd: 'lf t55xx dump' },
      { title: 'Restablecer Configuración de Fábrica', cmd: 'lf t55xx reset' }
    ],
    commonUses: ['Tarjeta y llaveros de clonación para cerrajeros', 'Laboratorio de pruebas de modulación RF', 'Emulación de credenciales LF']
  },
  {
    id: 'icode-slix',
    name: 'ICODE SLIX / SLIX2',
    manufacturer: 'NXP Semiconductors',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 15693 (Vicinity Cards)', 'NFC Forum Type 5 Tag'],
    uidLength: '8 Bytes (64 bits, inicia en E0 04)',
    memorySize: '1024 bits / 2528 bits (32 bloques × 4B)',
    memoryLayoutSummary: 'Tarjetas de vecindad con alcance extendido (hasta 1 metro). Bloques de 4 Bytes.',
    memoryBlocks: [
      { label: 'Bloque de UID & Fabricante', range: 'Header 64-bit', bytes: 8, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'Prefijo fijo 0xE0 (ISO15693), 0x04 (NXP), número de serie.' },
      { label: 'Bloques de Usuario', range: 'Bloques 0x00 a 0x1F (o 0x4F)', bytes: 320, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Almacena inventario de libros o etiquetas de logística.' },
      { label: 'EAS & Bloqueos (Protección)', range: 'Config Flags', bytes: 8, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'EAS (Electronic Article Surveillance) para alarmas antirrobo en bibliotecas.' }
    ],
    clonable: true,
    cloneTarget: 'Magic ISO 15693 Card',
    securityRisk: 'MEDIUM',
    securitySummary: 'No incluye cifrado en SLIX estándar. SLIX2 incluye contraseña de 32 bits y firma digital NXP.',
    pm3Commands: [
      { title: 'Buscar Tarjetas ISO15693', cmd: 'hf 15 info' },
      { title: 'Leer Todo el Inventario', cmd: 'hf 15 dump' }
    ],
    commonUses: ['Gestión y préstamo de libros en bibliotecas públicas', 'Seguimiento de equipaje en aeropuertos', 'Trazabilidad en farmacéuticas']
  },
  {
    id: 'motorola-hid-indala',
    name: 'Motorola / HID Indala (125 kHz)',
    manufacturer: 'Motorola / HID Global',
    frequency: 'LF',
    freqLabel: '125 kHz',
    standards: ['Proprietary Indala PSK1', 'RF/32 Phase Inversion'],
    uidLength: '26 bits (Wiegand) a 224 bits (Raw)',
    memorySize: '64 a 224 bits de trama modulada',
    memoryLayoutSummary: 'Transpondedor pasivo PSK1 a 125 kHz con esquema de codificación pseudoaleatorio (Scrambled/Permuted Matrix).',
    memoryBlocks: [
      { label: 'Cabecera y Sincronismo PSK', range: 'Bits 0 a 15', bytes: 2, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Transiciones de fase PSK1 a RF/32 para enganche del demodulador Proxmark3.' },
      { label: 'Payload Ofuscado (Permuted)', range: 'Bits 16 a 41 (26-bit)', bytes: 4, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'Bits permutados mediante matriz de inversión propietaria (evita lectura directa sin descramble).' },
      { label: 'Bits de Paridad / Checksum', range: 'Bits finales', bytes: 1, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', description: 'Verificación de integridad de la trama Wiegand reconstruida.' }
    ],
    clonable: true,
    cloneTarget: 'Chip Atmel T5577 (Configurado en modulación PSK1 RF/32)',
    securityRisk: 'HIGH',
    securitySummary: 'Seguridad por oscuridad. El algoritmo de descrambling lineal fue invertido por la comunidad de Proxmark3 (Iceman); una vez descodificado, se clona directamente en un chip T5577.',
    pm3Commands: [
      { title: 'Leer y Decodificar Indala', cmd: 'lf indala read' },
      { title: 'Demodulación Manual de Señal', cmd: 'lf indala demod' },
      { title: 'Clonar en Tarjeta T5577 (Raw Hex)', cmd: 'lf indala clone --raw a0000000000000' },
      { title: 'Simular Indala en Antena LF', cmd: 'lf indala sim --raw a0000000000000' }
    ],
    commonUses: ['Acceso a edificios corporativos de alta seguridad heredados', 'Instalaciones industriales y gubernamentales con lectores Indala FP3511 / Linear']
  },
  {
    id: 'picopass-iclass',
    name: 'Inside Secure PicoPass / HID iCLASS',
    manufacturer: 'Inside Secure / HID Global',
    frequency: 'HF',
    freqLabel: '13.56 MHz',
    standards: ['ISO/IEC 15693 (Vicinity)', 'ISO/IEC 14443-B (PicoPass mode)'],
    uidLength: '8 Bytes CSN (64 bits, inicia en 00 1F o 00 0E)',
    memorySize: '2 Kbits (PicoPass 2KS) / 16 Kbits (16KS) / 32 Kbits',
    memoryLayoutSummary: 'Organizado en 8 bloques de 8 Bytes por página. Bloque 1 (Config/Fuses), Bloque 2 (e-Purse), Bloques 3-4 (Claves de Aplicación Kd / Kc).',
    memoryBlocks: [
      { label: 'Bloque 0 (CSN / UID 64-bit)', range: 'Bloque 00', bytes: 8, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', description: 'Número de Serie del Chip (CSN) grabado en fábrica. Fijo en tarjetas de producción; modificable en PicoPass Magic.' },
      { label: 'Bloque 1 (Configuración & Fusibles)', range: 'Bloque 01', bytes: 8, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Define modo de clave (Personalization Mode vs Secured Mode), fuses de lectura y límite de saldo.' },
      { label: 'Bloque 2 (e-Purse Monedero)', range: 'Bloque 02', bytes: 8, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', description: 'Monedero decrementable protegido por clave de débito.' },
      { label: 'Bloques 3 y 4 (Claves de Aplicación)', range: 'Bloques 03-04', bytes: 16, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Almacena clave de lectura Kc y clave de débito/escritura Kd (Standard Master Key o HID Elite Key).' },
      { label: 'Bloques de Usuario (Área Wiegand)', range: 'Bloques 06 a 07 (y sucesivos)', bytes: 16, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', description: 'Bloque 6 almacena el payload Wiegand (Facility Code y Card Number) cifrado con la clave de aplicación.' }
    ],
    clonable: true,
    cloneTarget: 'Tarjeta Magic iCLASS / PicoPass 2KS regrabable',
    securityRisk: 'HIGH',
    securitySummary: 'La clave maestra estándar de HID (Standard Key) está filtrada públicamente. Vulnerable a ataques de diccionario, ataque Heart-of-Darkness y downgrade a modo no seguro. HID Elite Key añade protección salvo si se extrae de un lector con loclass.',
    pm3Commands: [
      { title: 'Detectar e Info iCLASS / PicoPass', cmd: 'hf iclass info' },
      { title: 'Comprobar Claves Estándar (Diccionario)', cmd: 'hf iclass chk' },
      { title: 'Volcar Memoria Completa (Dump)', cmd: 'hf iclass dump' },
      { title: 'Clonar en Tarjeta PicoPass Magic', cmd: 'hf iclass clone -f dump.bin' },
      { title: 'Ataque de Extracción de Clave Lector', cmd: 'hf iclass loclass' }
    ],
    commonUses: ['Sistemas de control de acceso corporativo HID iCLASS Legacy', 'Tarjetas inteligentes de identificación universitaria', 'Sistemas de pago en máquinas de vending y parquímetros']
  }
];

interface TagLibraryProps {
  onExecuteCommand?: (cmd: string) => void;
}

export const TagLibrary: React.FC<TagLibraryProps> = ({ onExecuteCommand }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [freqFilter, setFreqFilter] = useState<'ALL' | 'HF' | 'LF'>('ALL');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<TagSpec>(TAG_DATABASE[0]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Quick ATQA/SAK match finder
  const [atqaInput, setAtqaInput] = useState<string>('');
  const [sakInput, setSakInput] = useState<string>('');

  // Extract unique manufacturers
  const manufacturers = useMemo(() => {
    const list = Array.from(new Set(TAG_DATABASE.map(t => t.manufacturer)));
    return ['ALL', ...list];
  }, []);

  // Filtered tags list
  const filteredTags = useMemo(() => {
    return TAG_DATABASE.filter(tag => {
      // Frequency filter
      if (freqFilter !== 'ALL' && tag.frequency !== freqFilter) return false;

      // Manufacturer filter
      if (manufacturerFilter !== 'ALL' && tag.manufacturer !== manufacturerFilter) return false;

      // Risk filter
      if (riskFilter !== 'ALL' && tag.securityRisk !== riskFilter) return false;

      // ATQA / SAK helper filter
      if (atqaInput.trim() && tag.atqa && !tag.atqa.toLowerCase().replace(/\s+/g, '').includes(atqaInput.toLowerCase().replace(/\s+/g, ''))) {
        return false;
      }
      if (sakInput.trim() && tag.sak && !tag.sak.toLowerCase().includes(sakInput.toLowerCase())) {
        return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = tag.name.toLowerCase().includes(query);
        const matchMfg = tag.manufacturer.toLowerCase().includes(query);
        const matchStd = tag.standards.some(s => s.toLowerCase().includes(query));
        const matchUses = tag.commonUses.some(u => u.toLowerCase().includes(query));
        const matchCommands = tag.pm3Commands.some(c => c.cmd.toLowerCase().includes(query));
        if (!matchName && !matchMfg && !matchStd && !matchUses && !matchCommands) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, freqFilter, manufacturerFilter, riskFilter, atqaInput, sakInput]);

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const getRiskBadge = (risk: TagSpec['securityRisk']) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded text-[10px] font-bold">Riesgo Crítico</span>;
      case 'HIGH':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold">Riesgo Alto</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-950/80 text-yellow-300 border border-yellow-800/60 px-2 py-0.5 rounded text-[10px] font-bold">Riesgo Medio</span>;
      case 'LOW':
        return <span className="bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded text-[10px] font-bold">Riesgo Bajo</span>;
      case 'SECURE':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold">Segura (AES)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Base de Datos y Especificaciones de Transpondedores
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Biblioteca de Tags RFID / NFC <span className="text-cyan-400 font-mono text-lg font-normal">Identificador de Memorias</span>
            </h1>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Consulta especificaciones detalladas, mapas de memoria bloque a bloque, vulnerabilidades conocidas y comandos de Iceman para identificar cualquier tarjeta o transpondedor desconocido.
            </p>
          </div>

          {/* Quick ATQA / SAK Finder */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 shrink-0 space-y-2">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
              Identificador Rápido por ATQA / SAK:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ATQA (ej: 00 04)"
                value={atqaInput}
                onChange={(e) => setAtqaInput(e.target.value)}
                className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="SAK (ej: 08)"
                value={sakInput}
                onChange={(e) => setSakInput(e.target.value)}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              {(atqaInput || sakInput) && (
                <button
                  onClick={() => { setAtqaInput(''); setSakInput(''); }}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre (ej: MIFARE, HID, NTAG, T5577), fabricante, comando o uso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>

          {/* Frequency Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
            <button
              onClick={() => setFreqFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                freqFilter === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFreqFilter('HF')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                freqFilter === 'HF' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>HF (13.56 MHz)</span>
            </button>
            <button
              onClick={() => setFreqFilter('LF')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                freqFilter === 'LF' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LF (125 kHz)</span>
            </button>
          </div>
        </div>

        {/* Second Filter Row: Manufacturer & Risk Level */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1 text-slate-400">
          <div className="flex items-center gap-2">
            <span>Fabricante:</span>
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
            >
              {manufacturers.map((m) => (
                <option key={m} value={m}>{m === 'ALL' ? 'Todos los fabricantes' : m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Nivel de Riesgo:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos los riesgos</option>
              <option value="CRITICAL">Crítico (Crypto-1 / LF sin cifrar)</option>
              <option value="MEDIUM">Medio (Protección parcial)</option>
              <option value="SECURE">Seguro (AES-128 / DESFire)</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500">
            Mostrando {filteredTags.length} de {TAG_DATABASE.length} chips catalogados
          </div>
        </div>
      </div>

      {/* Main Grid: Left Catalog Cards & Right Detailed Specification Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Tag Cards List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const isSelected = selectedTag.id === tag.id;
              const isHf = tag.frequency === 'HF';

              return (
                <div
                  key={tag.id}
                  onClick={() => setSelectedTag(tag)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isHf ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        }`}>
                          {tag.freqLabel}
                        </span>
                        {getRiskBadge(tag.securityRisk)}
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm">
                        {tag.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {tag.manufacturer}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'}`} />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Cap: {tag.memorySize}
                    </span>
                    {tag.atqa && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                        ATQA: {tag.atqa}
                      </span>
                    )}
                    {tag.sak && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                        SAK: {tag.sak}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-mono">No se encontraron tags con los filtros actuales.</p>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Tag Specification & Memory Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-[#080d16] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Header of Selected Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedTag.frequency === 'HF'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                }`}>
                  {selectedTag.freqLabel}
                </span>
                {getRiskBadge(selectedTag.securityRisk)}
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                {selectedTag.name}
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Fabricante: {selectedTag.manufacturer}
              </span>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 font-mono text-xs">
              <span className="text-slate-400">Memoria Total:</span>
              <span className="text-cyan-400 font-bold">{selectedTag.memorySize}</span>
            </div>
          </div>

          {/* Quick Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase block">Longitud UID</span>
              <span className="font-bold text-slate-200">{selectedTag.uidLength}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase block">Valores ATQA / SAK</span>
              <span className="font-bold text-cyan-300">
                {selectedTag.atqa ? `${selectedTag.atqa} / ${selectedTag.sak}` : 'N/A (Baja Frecuencia)'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase block">Clonabilidad</span>
              <span className={`font-bold ${selectedTag.clonable ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectedTag.clonable ? 'Sí (Factible)' : 'No (Segura)'}
              </span>
            </div>
          </div>

          {/* Interactive Memory Layout Architecture */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mapa y Estructura de Memoria</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedTag.memoryLayoutSummary}
              </span>
            </div>

            <div className="space-y-2">
              {selectedTag.memoryBlocks.map((blk, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${blk.color} backdrop-blur-sm space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{blk.label}</span>
                    <span className="text-[10px] font-mono opacity-90">{blk.range} ({blk.bytes} Bytes)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    {blk.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Vulnerability Analysis */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Análisis de Seguridad & Clonación</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTag.securitySummary}
            </p>
            {selectedTag.cloneTarget && (
              <div className="pt-2 border-t border-slate-800 text-xs font-mono flex items-center gap-2">
                <span className="text-slate-400">Tarjeta Magic / Blanco de clonación:</span>
                <span className="text-cyan-300 font-bold">{selectedTag.cloneTarget}</span>
              </div>
            )}
          </div>

          {/* Proxmark3 Commands Toolkit */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comandos Oficiales Iceman para {selectedTag.name}</span>
            </h3>

            <div className="space-y-2">
              {selectedTag.pm3Commands.map((pm3, cIdx) => (
                <div
                  key={cIdx}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 font-mono text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">{pm3.title}</span>
                    <span className="text-cyan-300 font-bold text-xs truncate block">
                      pm3 &gt; {pm3.cmd}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyCommand(pm3.cmd)}
                      title="Copiar comando al portapapeles"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                    >
                      {copiedCmd === pm3.cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {onExecuteCommand && (
                      <button
                        onClick={() => onExecuteCommand(pm3.cmd)}
                        title="Ejecutar en la terminal Proxmark3"
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                      >
                        Ejecutar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Applications List */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Usos y Despliegues Comunes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedTag.commonUses.map((use, uIdx) => (
                <span
                  key={uIdx}
                  className="bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px]"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
