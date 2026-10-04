import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HardwareOverview } from './components/HardwareOverview';
import { AntennaTuner } from './components/AntennaTuner';
import { LfSuite } from './components/LfSuite';
import { HfSuite } from './components/HfSuite';
import { CardDumpViewer } from './components/CardDumpViewer';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { ScriptAutomation } from './components/ScriptAutomation';
import { OsGuideModal } from './components/OsGuideModal';
import { CryptoAcademy } from './components/CryptoAcademy';
import { SecurityAuditor } from './components/SecurityAuditor';
import { RfOscilloscope } from './components/RfOscilloscope';
import { FormatConverter } from './components/FormatConverter';
import { GuidedMissions } from './components/GuidedMissions';
import { T5577Calculator } from './components/T5577Calculator';
import { AiSecurityCopilot } from './components/AiSecurityCopilot';
import { TagLibrary } from './components/TagLibrary';
import { FloatingAntennaStatus } from './components/FloatingAntennaStatus';
import { 
  ConnectionMode, 
  DeviceInfo, 
  ConsoleLogItem, 
  CardDump 
} from './types/proxmark';
import { 
  INITIAL_DEVICE_INFO, 
  generateSampleMifare1k, 
  evaluateCommand 
} from './services/pm3Engine';
import { serialService } from './services/serialService';
import { hidService } from './services/hidService';

import { ExternalLink } from 'lucide-react';
import { FantasmaLogo } from './components/FantasmaLogo';

const STORAGE_CARD_DUMP_BACKUP_KEY = 'pm3_card_dump_backup';
const STORAGE_CARD_DUMP_BACKUP_TIME_KEY = 'pm3_card_dump_backup_time';

export default function App() {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('virtual');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(INITIAL_DEVICE_INFO);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [cardDump, setCardDump] = useState<CardDump>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CARD_DUMP_BACKUP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sectors && parsed?.uid) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return generateSampleMifare1k();
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_CARD_DUMP_BACKUP_TIME_KEY);
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pm3_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Sync theme with DOM document and body
  useEffect(() => {
    try {
      localStorage.setItem('pm3_app_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Automatically save current cardDump state to browser localStorage every time it is modified
  useEffect(() => {
    if (cardDump) {
      try {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_CARD_DUMP_BACKUP_KEY, JSON.stringify(cardDump));
        localStorage.setItem(STORAGE_CARD_DUMP_BACKUP_TIME_KEY, now);
        setLastBackupTime(now);
      } catch (err) {
        console.error('Failed to auto-save cardDump to localStorage', err);
      }
    }
  }, [cardDump]);

  const handleRestoreLastBackup = () => {
    try {
      const saved = localStorage.getItem(STORAGE_CARD_DUMP_BACKUP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sectors && parsed?.uid) {
          setCardDump(parsed);
          const time = localStorage.getItem(STORAGE_CARD_DUMP_BACKUP_TIME_KEY);
          setLastBackupTime(time);
          return true;
        }
      }
    } catch (e) {
      console.error('Error al restaurar copia de seguridad de cardDump', e);
    }
    return false;
  };
  const [isOsGuideOpen, setIsOsGuideOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([
    {
      id: 'init-1',
      timestamp: '12:00:00',
      type: 'system',
      text: '[=] Proxmark3 Web Studio Client v4.18967 - Iceman Edition',
    },
    {
      id: 'init-2',
      timestamp: '12:00:00',
      type: 'system',
      text: '[=] Modo Virtual Activo: Hardware RDV4.01 simulado listo para comandos',
    },
    {
      id: 'init-3',
      timestamp: '12:00:01',
      type: 'output',
      text: '[+] LF antenna: 29.42 V @ 125.00 kHz (Optimal)\n[+] HF antenna: 11.24 V @ 13.56 MHz (Optimal)\n[+] Dispositivo listo para lectura y auditoría.',
    },
  ]);

  // Hook real serial data callback
  useEffect(() => {
    serialService.setOnData((text: string) => {
      const now = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev.slice(-300),
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          type: 'output',
          text,
        },
      ]);
    });

    serialService.setOnDisconnect(() => {
      setConnectionMode('disconnected');
      setLogs((prev) => [
        ...prev,
        {
          id: `disc-${Date.now()}`,
          timestamp: new Date().toTimeString().split(' ')[0],
          type: 'error',
          text: '[-] Dispositivo Serial desconectado.',
        },
      ]);
    });

    // Hook WebHID data callback
    hidService.setOnData((text: string) => {
      const now = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev.slice(-300),
        {
          id: `hid-log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          type: 'output',
          text,
        },
      ]);
    });

    hidService.setOnDisconnect(() => {
      setConnectionMode('disconnected');
      setLogs((prev) => [
        ...prev,
        {
          id: `hid-disc-${Date.now()}`,
          timestamp: new Date().toTimeString().split(' ')[0],
          type: 'error',
          text: '[-] Dispositivo WebHID desconectado.',
        },
      ]);
    });

    return () => {
      serialService.setOnData(() => {});
      serialService.setOnDisconnect(() => {});
      hidService.setOnData(() => {});
      hidService.setOnDisconnect(() => {});
    };
  }, []);

  // Command Execution Handler
  const handleExecuteCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) return;
    setIsExecuting(true);

    const now = new Date().toTimeString().split(' ')[0];
    const userLog: ConsoleLogItem = {
      id: `in-${Date.now()}`,
      timestamp: now,
      type: 'input',
      text: `[usb] pm3 --> ${cmd}`,
    };

    setLogs((prev) => [...prev.slice(-300), userLog]);

    if (connectionMode === 'serial' && serialService.isConnected()) {
      // Send real hardware command via Web Serial API
      const sent = await serialService.sendCommand(cmd);
      if (!sent) {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toTimeString().split(' ')[0],
            type: 'error',
            text: '[-] Error al transmitir comando a través del puerto serie.',
          },
        ]);
        setIsExecuting(false);
      }
      // For serial, isExecuting is kept until final prompt is seen or timeout
      setTimeout(() => setIsExecuting(false), 2000);
    } else if (connectionMode === 'hid' && hidService.isConnected()) {
      // Send real hardware command via WebHID API
      const sent = await hidService.sendCommand(cmd);
      if (!sent) {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toTimeString().split(' ')[0],
            type: 'error',
            text: '[-] Error al transmitir comando a través de WebHID.',
          },
        ]);
        setIsExecuting(false);
      }
      setTimeout(() => setIsExecuting(false), 2000);
    } else {
      // Evaluate in Virtual Engine mode
      const { output } = evaluateCommand(cmd, cardDump);
      const lines = output.split('\n');

      if (cmd.toLowerCase().includes('autopwn') || cmd.toLowerCase().includes('hw tune') || cmd.toLowerCase().includes('clone')) {
        // Multi-stage progressive output for realistic progress tracking
        const stepDelay = cmd.toLowerCase().includes('autopwn') ? 350 : 250;
        let lineIdx = 0;

        const interval = setInterval(() => {
          if (lineIdx < lines.length) {
            const currentLine = lines[lineIdx];
            const nowTime = new Date().toTimeString().split(' ')[0];
            setLogs((prev) => [
              ...prev.slice(-300),
              {
                id: `out-${Date.now()}-${lineIdx}`,
                timestamp: nowTime,
                type: currentLine.includes('SUCCESS') || currentLine.includes('Optimal') || currentLine.includes('unlocked') ? 'success' : 'output',
                text: currentLine,
              },
            ]);
            lineIdx++;
          } else {
            clearInterval(interval);
            if (cmd.startsWith('hw tune')) {
              setDeviceInfo((prev) => ({
                ...prev,
                lfVoltage: +(29.0 + (Math.random() * 0.8)).toFixed(2),
                hfVoltage: +(11.0 + (Math.random() * 0.5)).toFixed(2),
              }));
            }
            setIsExecuting(false);
          }
        }, stepDelay);
      } else {
        // Standard fast command
        setTimeout(() => {
          const respLog: ConsoleLogItem = {
            id: `out-${Date.now()}`,
            timestamp: new Date().toTimeString().split(' ')[0],
            type: output.includes('SUCCESS') || output.includes('Optimal') ? 'success' : 'output',
            text: output,
          };
          setLogs((prev) => [...prev.slice(-300), respLog]);
          setIsExecuting(false);
        }, 300);
      }
    }
  }, [connectionMode, cardDump]);

  // Connect Web Serial Hardware
  const handleConnectSerial = async () => {
    if (connectionMode === 'serial') {
      await serialService.disconnect();
      setConnectionMode('disconnected');
      return;
    }

    const result = await serialService.connectHardware(deviceInfo.baudRate);
    if (result.success) {
      setConnectionMode('serial');
      setDeviceInfo((prev) => ({
        ...prev,
        portName: result.portName || 'Serial USB',
      }));

      const now = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev,
        {
          id: `conn-${Date.now()}`,
          timestamp: now,
          type: 'success',
          text: `[+] Conexión Web Serial establecida exitosamente en ${result.portName}`,
        },
      ]);

      // Query hardware version
      setTimeout(() => {
        handleExecuteCommand('hw version');
      }, 500);
    } else {
      alert(result.error || 'No se pudo conectar al puerto serie.');
    }
  };

  // Connect WebHID Hardware (Direct USB communication for restricted environments)
  const handleConnectHid = async () => {
    if (connectionMode === 'hid') {
      await hidService.disconnect();
      setConnectionMode('disconnected');
      return;
    }

    if (connectionMode === 'serial') {
      await serialService.disconnect();
    }

    const result = await hidService.connectHardware();
    if (result.success) {
      setConnectionMode('hid');
      setDeviceInfo((prev) => ({
        ...prev,
        portName: result.deviceName || 'USB HID (RDV4)',
      }));

      const now = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev,
        {
          id: `conn-hid-${Date.now()}`,
          timestamp: now,
          type: 'success',
          text: `[+] Conexión WebHID establecida exitosamente con ${result.deviceName}. Interfaz USB directa lista.`,
        },
      ]);

      setTimeout(() => {
        handleExecuteCommand('hw version');
      }, 500);
    } else {
      alert(result.error || 'No se pudo conectar al dispositivo WebHID.');
    }
  };

  const handleToggleVirtual = () => {
    if (connectionMode === 'virtual') {
      setConnectionMode('disconnected');
    } else {
      setConnectionMode('virtual');
      setLogs((prev) => [
        ...prev,
        {
          id: `virt-${Date.now()}`,
          timestamp: new Date().toTimeString().split(' ')[0],
          type: 'system',
          text: '[=] Modo Virtual reactivado. Emulando Proxmark3 RDV4.',
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        connectionMode={connectionMode}
        deviceInfo={deviceInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onConnectSerial={handleConnectSerial}
        onConnectHid={handleConnectHid}
        onToggleVirtual={handleToggleVirtual}
        onOpenOsGuide={() => setIsOsGuideOpen(true)}
        onRunHwTune={() => handleExecuteCommand('hw tune')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <HardwareOverview
            deviceInfo={deviceInfo}
            connectionMode={connectionMode}
            onExecuteCommand={handleExecuteCommand}
            onNavigateTab={setActiveTab}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'antenna' && (
          <AntennaTuner
            deviceInfo={deviceInfo}
            onExecuteCommand={handleExecuteCommand}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'lf' && (
          <LfSuite
            onExecuteCommand={handleExecuteCommand}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'hf' && (
          <HfSuite
            cardDump={cardDump}
            onExecuteCommand={handleExecuteCommand}
            isExecuting={isExecuting}
            onLoadSampleDump={() => setCardDump(generateSampleMifare1k())}
          />
        )}

        {activeTab === 'dump' && (
          <CardDumpViewer
            cardDump={cardDump}
            onUpdateCardDump={setCardDump}
            onResetToSample={() => setCardDump(generateSampleMifare1k())}
            onRestoreLastBackup={handleRestoreLastBackup}
            lastBackupTime={lastBackupTime}
          />
        )}

        {activeTab === 'terminal' && (
          <InteractiveTerminal
            logs={logs}
            onExecuteCommand={handleExecuteCommand}
            onClearLogs={() => setLogs([])}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptAutomation
            onExecuteCommand={handleExecuteCommand}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'auditor' && (
          <SecurityAuditor
            cardDump={cardDump}
          />
        )}

        {activeTab === 'converter' && (
          <FormatConverter
            cardDump={cardDump}
            onLoadConvertedDump={setCardDump}
          />
        )}

        {activeTab === 't5577' && (
          <T5577Calculator
            onExecuteCommand={handleExecuteCommand}
          />
        )}

        {activeTab === 'oscilloscope' && (
          <RfOscilloscope
            onExecuteCommand={handleExecuteCommand}
          />
        )}

        {activeTab === 'academy' && (
          <CryptoAcademy />
        )}

        {activeTab === 'missions' && (
          <GuidedMissions
            onExecuteCommand={handleExecuteCommand}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'copilot' && (
          <AiSecurityCopilot
            cardDump={cardDump}
            deviceInfo={deviceInfo}
            onExecuteCommand={handleExecuteCommand}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'tags' && (
          <TagLibrary
            onExecuteCommand={handleExecuteCommand}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d15] py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            >
              <FantasmaLogo size={28} />
              <span className="font-semibold text-slate-300 group-hover:text-cyan-300 transition-colors">
                Un Fantasma En El Sistema
              </span>
            </a>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">Proxmark3 Web Studio</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>unfantasmaenelsistema.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => setIsOsGuideOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              Configuración Linux & Windows
            </button>
            <span className="text-slate-700">·</span>
            <span>Compatible con firmware oficial Iceman</span>
          </div>
        </div>
      </footer>

      {/* Modal for Windows & Linux Connection Setup */}
      <OsGuideModal
        isOpen={isOsGuideOpen}
        onClose={() => setIsOsGuideOpen(false)}
      />

      {/* Floating Persistent Antenna Health & VSWR Status Indicator */}
      <FloatingAntennaStatus
        deviceInfo={deviceInfo}
        onExecuteCommand={handleExecuteCommand}
        isExecuting={isExecuting}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
