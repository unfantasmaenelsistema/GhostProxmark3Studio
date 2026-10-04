import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

interface OsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OsGuideModal: React.FC<OsGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeOs, setActiveOs] = useState<'linux' | 'windows' | 'webserial' | 'webhid'>('linux');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Guía de Conexión y Configuración (Linux & Windows)
              </h3>
              <p className="text-xs text-slate-400">
                Instrucciones para comunicar tu Proxmark3 físico mediante Web Serial o CLI nativa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 text-xs">
          <button
            onClick={() => setActiveOs('linux')}
            className={`pb-2.5 px-3 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
              activeOs === 'linux'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Linux (Ubuntu / Debian / Arch / Fedora)</span>
          </button>
          <button
            onClick={() => setActiveOs('windows')}
            className={`pb-2.5 px-3 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
              activeOs === 'windows'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Windows 10 / 11 & WSL2</span>
          </button>
          <button
            onClick={() => setActiveOs('webserial')}
            className={`pb-2.5 px-3 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
              activeOs === 'webserial'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Web Serial API</span>
          </button>
          <button
            onClick={() => setActiveOs('webhid')}
            className={`pb-2.5 px-3 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
              activeOs === 'webhid'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>WebHID Alternativo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* LINUX GUIDE */}
          {activeOs === 'linux' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 1: Permisos de Usuario (Grupo Dialout)
                </span>
                <p className="text-slate-400 text-[11px]">
                  En Linux, los puertos serie como <code className="text-cyan-300">/dev/ttyACM0</code> pertenecen al grupo dialout. Agrega tu usuario para acceder sin requerir root:
                </p>
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-[11px]">
                  <span>sudo usermod -aG dialout $USER</span>
                  <button
                    onClick={() => handleCopy('dialout', 'sudo usermod -aG dialout $USER')}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {copiedKey === 'dialout' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  *Cierra sesión o ejecuta `newgrp dialout` para aplicar los permisos.
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 2: Desactivar o Evitar ModemManager
                </span>
                <p className="text-slate-400 text-[11px]">
                  El servicio <code className="text-slate-200">ModemManager</code> de Linux suele secuestrar el puerto USB del Proxmark3 enviando comandos AT que bloquean la comunicación:
                </p>
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-[11px]">
                  <span>sudo systemctl stop ModemManager && sudo systemctl disable ModemManager</span>
                  <button
                    onClick={() => handleCopy('modem', 'sudo systemctl stop ModemManager && sudo systemctl disable ModemManager')}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {copiedKey === 'modem' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 3: Reglas Udev para Proxmark3 (RDV4 / Easy)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Crea el archivo <code className="text-cyan-300">/etc/udev/rules.d/77-pm3-usb.rules</code> con el siguiente contenido:
                </p>
                <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-[11px] overflow-x-auto select-all">
{`# Proxmark3 RDV4 y Easy udev rules
ATTRS{idVendor}=="9ac4", ATTRS{idProduct}=="4b8f", MODE="0666", GROUP="dialout"
ATTRS{idVendor}=="2d2d", ATTRS{idProduct}=="504d", MODE="0666", GROUP="dialout"`}
                </pre>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">Recargar reglas udev:</span>
                  <button
                    onClick={() => handleCopy('udev_reload', 'sudo udevadm control --reload-rules && sudo udevadm trigger')}
                    className="text-cyan-400 hover:underline text-[11px] font-mono"
                  >
                    Copiar comando de recarga
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WINDOWS GUIDE */}
          {activeOs === 'windows' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 1: Asignación de Puerto COM en Windows
                </span>
                <p className="text-slate-400 text-[11px]">
                  Al conectar el Proxmark3 por USB a Windows 10/11, el sistema operativo le asignará automáticamente un puerto virtual COM (por ejemplo <code className="text-cyan-300">COM3</code> o <code className="text-cyan-300">COM4</code>).
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div>1. Abre el <b>Administrador de Dispositivos</b> (Presiona Win + X &gt; Administrador de dispositivos).</div>
                  <div>2. Despliega la categoría <b>Puertos (COM y LPT)</b>.</div>
                  <div>3. Verifica que aparezca <b>USB Serial Device (COMx)</b> o <b>Proxmark3</b> sin signos de exclamación amarillos.</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 2: Conexión en WSL2 con usbipd (Opcional para Linux en Windows)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Si utilizas Proxmark3 dentro de WSL2 (Windows Subsystem for Linux), comparte el dispositivo USB mediante <code className="text-cyan-300">usbipd-win</code> en PowerShell:
                </p>
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-[11px]">
                  <span>usbipd list ; usbipd wsl attach --busid &lt;BUSID&gt;</span>
                  <button
                    onClick={() => handleCopy('usbipd', 'usbipd list ; usbipd wsl attach --busid <BUSID>')}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {copiedKey === 'usbipd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Paso 3: Baudrate Recomendado
                </span>
                <p className="text-slate-400 text-[11px]">
                  La velocidad habitual para firmware Iceman en Windows es <code className="text-cyan-300">115200</code> baudios (o <code className="text-cyan-300">460800</code> para builds de alta velocidad CDC). Esta interfaz gráfica detecta automáticamente la tasa configurada.
                </p>
              </div>
            </div>
          )}

          {/* WEBSERIAL GUIDE */}
          {activeOs === 'webserial' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  ¿Cómo funciona la conexión Web Serial directa?
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Esta aplicación aprovecha el estándar W3C <b>Web Serial API</b> integrado en navegadores modernos (Google Chrome, Microsoft Edge, Opera y Chromium en Linux y Windows).
                </p>
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <b>Sin servidores locales intermediarios:</b> El navegador se comunica directamente con el microcontrolador AT91SAM7S512 mediante el cable USB.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Pasos para conectar:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Conecta tu Proxmark3 al puerto USB de tu equipo.</li>
                  <li>Haz clic en el botón superior <b>"Conectar Serial"</b>.</li>
                  <li>El navegador abrirá una ventana emergente mostrando los dispositivos USB detectados.</li>
                  <li>Selecciona tu Proxmark3 y presiona <b>"Conectar"</b>.</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  ¿Qué hacer si no tienes el hardware a mano?
                </span>
                <p className="text-slate-400 text-[11px]">
                  Puedes activar el botón <b>"Demo"</b> en la barra superior. El motor simulará respuestas idénticas a un Proxmark3 RDV4 con tarjetas Mifare Classic 1K, HID Prox y transpondedores EM4100 para que explores todas las funciones.
                </p>
              </div>
            </div>
          )}

          {/* WEBHID GUIDE */}
          {activeOs === 'webhid' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl space-y-2">
                <span className="font-semibold text-cyan-300 block text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  ¿Por qué y cuándo usar WebHID en lugar de Web Serial?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  En ciertos sistemas corporativos, contenedores sandboxed, ChromeOS o distribuciones Linux donde tu usuario carece de permisos sobre los puertos <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400">/dev/ttyACM*</code> (grupo dialout), la <b>WebHID API</b> permite interactuar con el Proxmark3 a nivel de interfaz USB HID directa sin requerir emulación CDC de puerto serie virtual ni permisos de administrador.
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Identificadores USB compatibles (VID / PID):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] font-mono">
                  <li>Proxmark3 RDV4.01: <span className="text-cyan-300">VID 0x9AC4</span></li>
                  <li>Proxmark3 Bootloader / J-Type: <span className="text-cyan-300">VID 0x2D2D / 0x1D50</span></li>
                  <li>Proxmark3 Easy / STM32: <span className="text-cyan-300">VID 0x0483 (PID 0x5740)</span></li>
                </ul>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Instrucciones de conexión WebHID:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Conecta tu Proxmark3 a cualquier puerto USB.</li>
                  <li>Haz clic en el botón <b>"WebHID"</b> en la barra superior.</li>
                  <li>El selector del navegador mostrará el dispositivo HID detectado (ej: <i>Proxmark3 RDV4 HID</i>).</li>
                  <li>Selecciona el dispositivo y confirma. La comunicación USB directa iniciará inmediatamente.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Más guías de RFID y ciberseguridad en unfantasmaenelsistema.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors w-full sm:w-auto"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
