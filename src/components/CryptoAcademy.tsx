import React, { useState } from 'react';
import { 
  GraduationCap, 
  Key, 
  ShieldAlert, 
  Zap, 
  Cpu, 
  Radio, 
  Binary, 
  HelpCircle, 
  Layers, 
  Lock, 
  Unlock, 
  Check, 
  Copy,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  AlertCircle,
  Terminal
} from 'lucide-react';

export const CryptoAcademy: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<'nested' | 'darkside' | 'wiegand' | 'rfid_physics'>('nested');

  // Interactive Wiegand 26-bit calculator state
  const [facilityCode, setFacilityCode] = useState<number>(104);
  const [cardNumber, setCardNumber] = useState<number>(31337);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Calculate Wiegand 26 bits
  const calcWiegandBits = () => {
    const fcClamped = Math.max(0, Math.min(255, facilityCode));
    const cnClamped = Math.max(0, Math.min(65535, cardNumber));

    const fcBin = fcClamped.toString(2).padStart(8, '0');
    const cnBin = cnClamped.toString(2).padStart(16, '0');
    const payload = fcBin + cnBin; // 24 bits

    // Even parity over first 12 bits (indices 0..11)
    const first12 = payload.slice(0, 12);
    const onesFirst12 = (first12.match(/1/g) || []).length;
    const evenParity = (onesFirst12 % 2 === 0) ? '0' : '1';

    // Odd parity over last 12 bits (indices 12..23)
    const last12 = payload.slice(12, 24);
    const onesLast12 = (last12.match(/1/g) || []).length;
    const oddParity = (onesLast12 % 2 === 1) ? '0' : '1';

    const full26 = evenParity + payload + oddParity;
    const hexVal = parseInt(full26, 2).toString(16).toUpperCase().padStart(7, '0');

    return {
      evenParity,
      fcBin,
      cnBin,
      oddParity,
      full26,
      hexVal,
      fcClamped,
      cnClamped,
    };
  };

  const wiegandData = calcWiegandBits();
  const pm3WiegandCmd = `lf hid clone -w H10301 --fc ${wiegandData.fcClamped} --cn ${wiegandData.cnClamped}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Academia Criptográfica & Fundamentos RFID
              </h1>
              <p className="text-xs text-slate-400">
                Aprende la física electromagnética y la matemática de explotación detrás de los ataques del Proxmark3.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTopic('nested')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTopic === 'nested' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ataque Nested
            </button>
            <button
              onClick={() => setActiveTopic('darkside')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTopic === 'darkside' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ataque Darkside
            </button>
            <button
              onClick={() => setActiveTopic('wiegand')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTopic === 'wiegand' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wiegand 26-bit
            </button>
            <button
              onClick={() => setActiveTopic('rfid_physics')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTopic === 'rfid_physics' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Física LF vs HF
            </button>
          </div>
        </div>
      </div>

      {/* TOPIC 1: ATAQUE NESTED */}
      {activeTopic === 'nested' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Lock className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-100">
                  ¿Cómo funciona el Ataque Nested en MIFARE Classic?
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                El ataque <b>Nested</b> (desarrollado por Nicolas T. Courtois, Karsten Nohl y Sean O'Neil) permite descifrar todos los sectores de una tarjeta MIFARE Classic si se conoce al menos <b>una sola clave válida</b> de cualquier sector (por ejemplo, la clave por defecto <code className="text-cyan-300">FFFFFFFFFFFF</code> del sector 0).
              </p>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  El fallo criptográfico (Crypto-1 PRNG Flaw)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El algoritmo propietario Crypto-1 de NXP utiliza un Generador de Números Pseudoaleatorios (PRNG) de 16 bits basado en un registro de desplazamiento con retroalimentación lineal (LFSR). El reloj del PRNG se incrementa de forma determinista con cada ciclo de transmisión.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-1">1. Autenticación Inicial</span>
                    <span className="text-slate-400">El Proxmark3 se autentica legítimamente en el sector conocido usando la clave recuperada. El canal queda cifrado.</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-semibold block mb-1">2. Solicitud Anidada (Nested)</span>
                    <span className="text-slate-400">Sin reiniciar la sesión de RF, solicita autenticación para un sector desconocido. La tarjeta emite un desafío pseudoaleatorio (Nonce <code className="text-cyan-300 font-mono">Nt</code>).</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-semibold block mb-1">3. Ventana Temporal Estricta</span>
                    <span className="text-slate-400">Debido a que el tiempo entre comandos es ultrapreciso (controlado por el FPGA), el número de estados posibles del PRNG se reduce de 2<sup>32</sup> a solo unas pocas docenas.</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-purple-400 font-semibold block mb-1">4. Recuperación de Clave</span>
                    <span className="text-slate-400">Con solo 2 a 4 nonces capturados, el software resuelve los estados del LFSR y extrae la clave de 48 bits en segundos.</span>
                  </div>
                </div>
              </div>

              {/* Hardnested note */}
              <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-amber-300">
                    ¿Qué es el ataque Hardnested?
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    NXP lanzó tarjetas MIFARE Classic "Fixed PRNG" donde el nonce ya no depende linealmente del tiempo. Para estas tarjetas se utiliza el ataque <b>Hardnested</b>, el cual explota filtraciones en la función no lineal del filtro de estados mediante análisis probabilístico (requiere más nonces y poder de CPU).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Card: Practical Command */}
          <div className="space-y-6">
            <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Comando en Proxmark3
              </span>
              <p className="text-xs text-slate-400">
                El comando automatizado que orquesta este ataque completo en el cliente Iceman es:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 flex items-center justify-between">
                <span>hf mf autopwn --1k</span>
                <button
                  onClick={() => copyToClipboard('hf mf autopwn --1k')}
                  className="p-1 hover:text-white"
                  title="Copiar comando"
                >
                  {copiedCmd === 'hf mf autopwn --1k' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Tiempo de extracción:</span>
                  <span className="text-emerald-400 font-semibold font-mono">15 ~ 45 segundos</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Requisito previo:</span>
                  <span className="text-slate-300 font-mono">1 clave válida (de fábrica)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Vulnerabilidad:</span>
                  <span className="text-rose-400 font-mono">CVE-2008-0118 (PRNG Weakness)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 2: ATAQUE DARKSIDE */}
      {activeTopic === 'darkside' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-100">
                  ¿Cómo funciona el Ataque Darkside (Ataque a Ciegas)?
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                El ataque <b>Darkside</b> (Courtois, 2009) se utiliza cuando la tarjeta MIFARE Classic tiene <b>todas sus claves cambiadas</b> y no se conoce ninguna de antemano.
              </p>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Mecánica: El oráculo de error de paridad
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cuando el lector se comunica con la tarjeta, cada byte transmitido va acompañado de un bit de paridad. En Crypto-1, estos bits de paridad están <b>cifrados con la misma clave de flujo</b> (keystream) que los datos.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center shrink-0 font-bold">1</span>
                    <div>
                      <span className="font-semibold text-slate-200">Envío de credenciales arbitrarias</span>
                      <p className="text-slate-400 mt-0.5">El Proxmark3 intenta autenticarse con una respuesta de prueba calculada intencionalmente.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center shrink-0 font-bold">2</span>
                    <div>
                      <span className="font-semibold text-slate-200">Filtración del oráculo NACK (Canal lateral)</span>
                      <p className="text-slate-400 mt-0.5">Si los bits de paridad coinciden, la tarjeta responde con un código de error de 4 bits (<code className="text-purple-300">0x5 NACK</code>). Si la paridad falla, la tarjeta no responde (silencio de radio).</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center shrink-0 font-bold">3</span>
                    <div>
                      <span className="font-semibold text-slate-200">Recuperación de la primera clave</span>
                      <p className="text-slate-400 mt-0.5">Esta discrepancia actúa como un oráculo que filtra 3 bits de keystream por intento. Tras acumular suficientes aciertos, se recupera la primera clave de 48 bits, permitiendo saltar inmediatamente al ataque <b>Nested</b> para terminar el resto.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                Comando Darkside en Proxmark3
              </span>
              <p className="text-xs text-slate-400">
                Se invoca para obtener la primera clave cuando no hay llaves conocidas en el diccionario:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 flex items-center justify-between">
                <span>hf mf darkside</span>
                <button
                  onClick={() => copyToClipboard('hf mf darkside')}
                  className="p-1 hover:text-white"
                  title="Copiar comando"
                >
                  {copiedCmd === 'hf mf darkside' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <span className="text-slate-300 font-semibold block">Estrategia de ataque profesional:</span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400">
                  <li>Probar diccionario rápido (<code className="text-cyan-400">hf mf chk</code>).</li>
                  <li>Si ninguna coincide: lanzar <code className="text-purple-400">hf mf darkside</code> para obtener 1 clave.</li>
                  <li>Al obtener la primera clave: ejecutar <code className="text-cyan-400">hf mf nested</code> para el resto de sectores.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 3: WIEGAND 26-BIT CALCULATOR & STRUCTURE */}
      {activeTopic === 'wiegand' && (
        <div className="space-y-6">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Binary className="w-5 h-5 text-emerald-400" />
                  Estructura y Calculadora Interactiva de Formato Wiegand 26-bit (H10301)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  El formato de control de acceso estándar más utilizado en el mundo (HID Prox II, Indala, EM4100).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-slate-500 mr-2">HEX:</span>
                  <span className="text-emerald-400 font-bold">{wiegandData.hexVal}</span>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                  <span>Facility Code (Código de Instalación / Empresa)</span>
                  <span className="font-mono text-slate-400">0 - 255 (8 bits)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={facilityCode}
                  onChange={(e) => setFacilityCode(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Card Number (Número de Tarjeta de Empleado)</span>
                  <span className="font-mono text-slate-400">0 - 65,535 (16 bits)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={65535}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Visual 26-bit Map */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Mapa Binario de 26 Bits:
              </span>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-1 font-mono text-sm">
                  {/* Bit 1: Even Parity */}
                  <div className="flex flex-col items-center bg-purple-950/60 border border-purple-700/60 rounded px-2 py-1 text-purple-300" title="Bit 1: Paridad Par (calculada sobre bits 2 al 13)">
                    <span className="font-bold">{wiegandData.evenParity}</span>
                    <span className="text-[9px] text-purple-400">EP</span>
                  </div>

                  {/* Bits 2-9: Facility Code */}
                  {wiegandData.fcBin.split('').map((bit, idx) => (
                    <div key={`fc-${idx}`} className="flex flex-col items-center bg-cyan-950/60 border border-cyan-700/60 rounded px-2 py-1 text-cyan-300" title={`Bit FC ${idx + 1}`}>
                      <span className="font-bold">{bit}</span>
                      <span className="text-[9px] text-cyan-400">FC</span>
                    </div>
                  ))}

                  {/* Bits 10-25: Card Number */}
                  {wiegandData.cnBin.split('').map((bit, idx) => (
                    <div key={`cn-${idx}`} className="flex flex-col items-center bg-emerald-950/60 border border-emerald-700/60 rounded px-2 py-1 text-emerald-300" title={`Bit CN ${idx + 1}`}>
                      <span className="font-bold">{bit}</span>
                      <span className="text-[9px] text-emerald-400">CN</span>
                    </div>
                  ))}

                  {/* Bit 26: Odd Parity */}
                  <div className="flex flex-col items-center bg-amber-950/60 border border-amber-700/60 rounded px-2 py-1 text-amber-300" title="Bit 26: Paridad Impar (calculada sobre bits 14 al 25)">
                    <span className="font-bold">{wiegandData.oddParity}</span>
                    <span className="text-[9px] text-amber-400">OP</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500"></span>
                    <span className="text-slate-400">Bit 1: Paridad Par (EP)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500"></span>
                    <span className="text-slate-400">Bits 2–9: Facility Code (8 bits)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500"></span>
                    <span className="text-slate-400">Bits 10–25: Card Number (16 bits)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500"></span>
                    <span className="text-slate-400">Bit 26: Paridad Impar (OP)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Proxmark3 Command */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Comando Proxmark3 para clonar esta credencial a un chip T5577:
                </span>
                <code className="text-xs font-mono text-cyan-300 mt-1 block">
                  {pm3WiegandCmd}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(pm3WiegandCmd)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-colors shrink-0"
              >
                {copiedCmd === pm3WiegandCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar comando</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 4: FISICA LF VS HF */}
      {activeTopic === 'rfid_physics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Frequency */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Radio className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">
                Baja Frecuencia: LF (125 kHz – 134 kHz)
              </h3>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Frecuencia nominal:</span>
                <span className="font-mono text-amber-300 font-semibold">125.00 kHz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Mecanismo físico:</span>
                <span className="text-slate-200">Acoplamiento Inductivo (Magnético puro)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Bobina de antena:</span>
                <span className="text-slate-200">Cientos de vueltas de hilo de cobre fino</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Modulaciones típicas:</span>
                <span className="text-slate-200">ASK, FSK (FSK1, FSK2), PSK</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <b>Propiedades de seguridad:</b> Los chips LF típicos (EM4100, HID Prox II) son <b>transpondedores tontos</b> (Broadcast). No poseen procesador criptográfico ni memoria protegida por contraseñas.
              </p>
              <p className="text-rose-400">
                Cualquier antena sintonizada a 125 kHz que energice la tarjeta provocará que esta transmita su ID continuamente por modulación de carga, haciéndolas trivialmente clonables a chips Atmel T5577.
              </p>
            </div>
          </div>

          {/* High Frequency */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Layers className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">
                Alta Frecuencia: HF (13.56 MHz - NFC)
              </h3>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Frecuencia nominal:</span>
                <span className="font-mono text-cyan-300 font-semibold">13.56 MHz (Banda ISM)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Estándares internacionales:</span>
                <span className="text-slate-200">ISO/IEC 14443 Type A/B, ISO 15693 (Vicinity)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Velocidad de datos:</span>
                <span className="text-slate-200">106 kbps hasta 848 kbps</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Antena:</span>
                <span className="text-slate-200">Pistas impresas de pocas espiras en PCB/film</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <b>Propiedades de seguridad:</b> Poseen microcontroladores dedicados con memoria EEPROM particionada en sectores y bloques (Mifare Classic, Desfire, Ultralight, NTAG).
              </p>
              <p className="text-slate-300">
                Soportan autenticación mutual desafío-respuesta (3-pass mutual auth) y cifrado de canal (Crypto-1, 3DES, AES-128). Las auditorías se centran en debilidades de implementación, claves por defecto y ataques laterales.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
