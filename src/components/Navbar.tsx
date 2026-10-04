import React from 'react';
import { 
  Usb, 
  Cpu, 
  HelpCircle, 
  Zap, 
  Terminal, 
  Radio, 
  Layers, 
  FileCode, 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ShieldAlert, 
  ArrowLeftRight, 
  Calculator, 
  GraduationCap, 
  Compass, 
  Bot, 
  Sparkles, 
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { ConnectionMode, DeviceInfo } from '../types/proxmark';
import { FantasmaLogo } from './FantasmaLogo';

interface NavbarProps {
  connectionMode: ConnectionMode;
  deviceInfo: DeviceInfo;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onConnectSerial: () => void;
  onConnectHid: () => void;
  onToggleVirtual: () => void;
  onOpenOsGuide: () => void;
  onRunHwTune: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  connectionMode,
  deviceInfo,
  activeTab,
  setActiveTab,
  onConnectSerial,
  onConnectHid,
  onToggleVirtual,
  onOpenOsGuide,
  onRunHwTune,
  theme,
  onToggleTheme,
}) => {
  const isConnected = connectionMode !== 'disconnected';

  // Row 1: Core RFID & Hardware Suite
  const row1Items = [
    { id: 'overview', label: 'Hardware', icon: Cpu },
    { id: 'antenna', label: 'Antena (Tune)', icon: Activity },
    { id: 'lf', label: 'LF (125 kHz)', icon: Radio },
    { id: 'hf', label: 'HF (13.56 MHz)', icon: Layers },
    { id: 'dump', label: 'Visor Hex', icon: FileText },
    { id: 'terminal', label: 'Consola PM3', icon: Terminal },
  ];

  // Row 2: Forensic Tools, Academy & AI Assistant
  const row2Items = [
    { id: 'copilot', label: 'Copiloto IA', icon: Bot, isAi: true, badge: 'Gemini' },
    { id: 'tags', label: 'Biblioteca Tags', icon: Database },
    { id: 'auditor', label: 'Auditor Seguridad', icon: ShieldAlert, highlight: true },
    { id: 'converter', label: 'Conversor Flipper/PM3', icon: ArrowLeftRight },
    { id: 't5577', label: 'Calc T5577', icon: Calculator },
    { id: 'oscilloscope', label: 'Osciloscopio RF', icon: Activity },
    { id: 'academy', label: 'Academia Cripto', icon: GraduationCap },
    { id: 'missions', label: 'Misiones Guiadas', icon: Compass },
    { id: 'scripts', label: 'Scripts', icon: FileCode },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d131f] border-b border-slate-800/80 backdrop-blur-md">
      {/* Primary Top Bar: Brand, Hardware Status & Connectivity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone with Un Fantasma En El Sistema Logo & Web Link */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visitar Un Fantasma En El Sistema"
            className="flex items-center gap-2.5 group p-1 -m-1 rounded-xl hover:bg-slate-800/60 transition-all"
          >
            <div className="relative">
              <FantasmaLogo size={40} className="transition-transform group-hover:scale-105" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[9px] font-mono text-cyan-400 font-bold">
                P3
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  Proxmark3 Studio
                </span>
                <span className="hidden sm:inline text-[10px] font-mono font-medium text-cyan-400/90 bg-cyan-950/70 border border-cyan-800/40 px-1.5 py-0.2 rounded">
                  Iceman GUI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-1">
                <span>por unfantasmaenelsistema.com</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400" />
              </span>
            </div>
          </a>
        </div>

        {/* Hardware Status & Connection Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Antenna Quick-Action Button */}
          {isConnected && (
            <button
              onClick={onRunHwTune}
              title="Ejecutar hw tune rápido"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">LF: {deviceInfo.lfVoltage}V / HF: {deviceInfo.hfVoltage}V</span>
            </button>
          )}

          {/* Web Serial Connect Button */}
          <button
            onClick={onConnectSerial}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
              connectionMode === 'serial'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span className="hidden sm:inline">
              {connectionMode === 'serial' ? 'Desconectar Serial' : 'Serial USB'}
            </span>
          </button>

          {/* WebHID Connect Button (Alternative for restricted environments) */}
          <button
            onClick={onConnectHid}
            title={
              connectionMode === 'hid'
                ? 'Desconectar dispositivo WebHID'
                : 'Conectar Proxmark3 mediante WebHID (para sistemas con permisos seriales restringidos o sin grupo dialout)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
              connectionMode === 'hid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-800/50 hover:border-cyan-500/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">
              {connectionMode === 'hid' ? 'WebHID Activo' : 'WebHID'}
            </span>
          </button>

          {/* Virtual Mode Switch */}
          <button
            onClick={onToggleVirtual}
            title={connectionMode === 'virtual' ? 'Desactivar simulación virtual' : 'Activar modo demo virtual'}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              connectionMode === 'virtual'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo
          </button>

          {/* OS Connection Help */}
          <button
            onClick={onOpenOsGuide}
            title="Guía de configuración en Windows y Linux"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
            aria-label="Guía para Windows y Linux"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Light / Dark Mode Switch */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a Modo Claro (Presentación / Aulas)' : 'Cambiar a Modo Oscuro (Cyber / Terminal)'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
            aria-label="Alternar Modo Claro y Oscuro"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Oscuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TWO ORGANIZED NAVIGATION ROWS */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 divide-y divide-slate-800/60">
        {/* ROW 1: Hardware & Operaciones Base RFID */}
        <div className="px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0 font-bold hidden sm:inline w-24">
              RFID Core:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {row1Items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 2: Herramientas Forenses, Academia & Asistente IA */}
        <div className="px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto scrollbar-thin bg-slate-950/40">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-500/80 shrink-0 font-bold hidden sm:inline w-24">
              Herramientas:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {row2Items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                if (item.isAi) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 border border-cyan-400/60 shadow-md shadow-cyan-950/50'
                          : 'bg-gradient-to-r from-cyan-950/40 to-purple-950/40 text-cyan-300 hover:text-white border border-cyan-700/40 hover:border-cyan-500/60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>{item.label}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-700 font-bold">
                        {item.badge}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
