import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Loader2, 
  Play, 
  Copy, 
  Check, 
  HelpCircle, 
  Terminal, 
  Key, 
  Radio, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { CardDump, DeviceInfo } from '../types/proxmark';
import { generateDomainExpertReply } from '../services/offlineExpertEngine';

interface AiSecurityCopilotProps {
  cardDump: CardDump;
  deviceInfo: DeviceInfo;
  onExecuteCommand: (cmd: string) => void;
  onNavigateToTab: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedCommands?: string[];
}

export const AiSecurityCopilot: React.FC<AiSecurityCopilotProps> = ({
  cardDump,
  deviceInfo,
  onExecuteCommand,
  onNavigateToTab,
}) => {
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `¡Hola! Soy tu **Copiloto IA de Proxmark3 Web Studio** (*unfantasmaenelsistema.com*).\n\nHe detectado tu tarjeta activa en antena: **${cardDump.type}** (UID: \`${cardDump.uid}\`).\n\nPuedo guiarte paso a paso con los comandos de la CLI de Iceman para auditarla, descifrar sus claves o resolver problemas de acoplamiento de antena. ¿En qué objetivo estás trabajando hoy?`,
      timestamp: new Date().toTimeString().slice(0, 5),
      suggestedCommands: ['hw tune', 'hf mf chk --1k', 'hf mf autopwn --1k'],
    },
  ]);

  const quickPrompts = [
    '¿Qué comando debo ejecutar a continuación?',
    '¿Cómo descifro los sectores con ataque autopwn?',
    '¿Cómo clono esta credencial a un chip T5577 o Magic Gen2?',
    'La antena marca poco voltaje, ¿cómo lo soluciono?',
  ];

  // Extract commands in backticks from response text
  const extractCommands = (text: string): string[] => {
    const regex = /`([^`]+)`/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const cmd = match[1].trim();
      if (cmd.startsWith('hf ') || cmd.startsWith('lf ') || cmd.startsWith('hw ') || cmd.startsWith('data ')) {
        if (!matches.includes(cmd)) {
          matches.push(cmd);
        }
      }
    }
    return matches;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    const cardContext = {
      uid: cardDump.uid,
      type: cardDump.type,
      atqa: cardDump.atqa,
      sak: cardDump.sak,
      sectorsCount: cardDump.sectors.length,
    };
    const deviceStatus = {
      lfVoltage: deviceInfo.lfVoltage,
      hfVoltage: deviceInfo.hfVoltage,
      version: deviceInfo.version,
    };

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, cardContext, deviceStatus }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const replyText = data.reply || 'No se recibió respuesta del asistente.';
      const suggestedCmds = extractCommands(replyText);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toTimeString().slice(0, 5),
        suggestedCommands: suggestedCmds.length > 0 ? suggestedCmds : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      // No backend reachable (e.g. static deployment without a Node server):
      // fall back to the offline rule-based expert engine instead of erroring out.
      const replyText = generateDomainExpertReply(query, cardContext, deviceStatus);
      const suggestedCmds = extractCommands(replyText);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-offline-${Date.now()}`,
          sender: 'assistant',
          text: `_[Modo experto offline — sin conexión al servidor de IA]_\n\n${replyText}`,
          timestamp: new Date().toTimeString().slice(0, 5),
          suggestedCommands: suggestedCmds.length > 0 ? suggestedCmds : undefined,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Copiloto IA de Seguridad Proxmark3</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                  Gemini 3.8 Flash
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Tu mentor interactivo de ingeniería inversa RFID/NFC: te indica los comandos exactos y el orden de los pasos a seguir.
              </p>
            </div>
          </div>

          {/* Target telemetry badge */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block">Tarjeta en Antena:</span>
              <span className="text-cyan-300 font-bold">{cardDump.uid} ({cardDump.type})</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block">Voltajes LC:</span>
              <span className="text-emerald-400 font-bold">LF: {deviceInfo.lfVoltage}V / HF: {deviceInfo.hfVoltage}V</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Sugerencias:
        </span>
        {quickPrompts.map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(promptText)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#0b101b] hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap text-xs disabled:opacity-50"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-[#080d16] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center shrink-0 text-cyan-400 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-slate-950 font-medium ml-auto'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 mb-1 font-mono">
                  <span>{msg.sender === 'user' ? 'Tú (Analista)' : 'Copiloto Proxmark3'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap space-y-2">
                  {msg.text}
                </div>

                {/* Extracted Interactive Command Pills */}
                {msg.suggestedCommands && msg.suggestedCommands.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold block">
                      Comandos directos sugeridos:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedCommands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-slate-950 border border-cyan-800/60 rounded-lg px-2.5 py-1 font-mono text-[11px] text-cyan-300"
                        >
                          <span>{cmd}</span>
                          <button
                            onClick={() => copyToClipboard(cmd)}
                            className="p-1 hover:text-white"
                            title="Copiar comando"
                          >
                            {copiedText === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => {
                              onExecuteCommand(cmd);
                              onNavigateToTab('terminal');
                            }}
                            className="p-1 text-cyan-400 hover:text-cyan-200"
                            title="Ejecutar en la Consola Interactiva"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center shrink-0 text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span className="font-mono text-cyan-400 animate-pulse">
                El Copiloto IA está analizando los registros y comandos recomendados...
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t border-slate-800 pt-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Pregunta a la IA: '¿Cuál es el siguiente paso para auditar esta tarjeta?', '¿Cómo clono el UID?'..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-colors disabled:opacity-40 shrink-0"
            title="Enviar pregunta a la IA"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
