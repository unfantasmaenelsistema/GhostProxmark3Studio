import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  Download, 
  Check, 
  Copy, 
  Key, 
  Lock, 
  Unlock, 
  Cpu, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CardDump } from '../types/proxmark';

interface SecurityAuditorProps {
  cardDump: CardDump;
  onRunAudit?: () => void;
}

export const SecurityAuditor: React.FC<SecurityAuditorProps> = ({ cardDump }) => {
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Default well-known factory keys
  const DEFAULT_KEYS = [
    'FFFFFFFFFFFF',
    'A0A1A2A3A4A5',
    'D3F7D3F7D3F7',
    '000000000000',
    'B0B1B2B3B4B5',
    'A0B0C0D0E0F0',
    '1A982C7E459A',
    '4D3A99C351DD',
    '1A2B3C4D5E6F',
  ];

  // Perform security checks over current card dump
  const runSecurityEvaluation = () => {
    let defaultKeySectorsCount = 0;
    let unlockedTrailerCount = 0;
    const findings: { severity: 'critical' | 'high' | 'medium' | 'info'; title: string; desc: string }[] = [];

    // 1. Check factory keys
    cardDump.sectors.forEach((sec) => {
      const isDefA = DEFAULT_KEYS.includes(sec.keyA.value.toUpperCase());
      const isDefB = DEFAULT_KEYS.includes(sec.keyB.value.toUpperCase());
      if (isDefA || isDefB) {
        defaultKeySectorsCount++;
      }
    });

    if (defaultKeySectorsCount > 0) {
      findings.push({
        severity: 'critical',
        title: `${defaultKeySectorsCount} sectores protegidos con claves de fábrica conocidas`,
        desc: `Se detectaron contraseñas estándar públicas (ej: FFFFFFFFFFFF o A0A1A2A3A4A5). Cualquier atacante con un lector básico o smartphone puede volcar y alterar estos sectores.`,
      });
    }

    // 2. Magic card / Backdoor check
    const isMagicCandidate = cardDump.type.toLowerCase().includes('magic') || cardDump.type.includes('Gen');
    if (isMagicCandidate) {
      findings.push({
        severity: 'high',
        title: 'Tarjeta China "Mágica" Re-escribible detectada (Gen1a / Gen2 CUID)',
        desc: 'El UID del Bloque 0 puede ser sobreescrito mediante comandos backdoor chinos o comandos directos de escritura. Esta credencial puede ser un clon ilegítimo.',
      });
    }

    // 3. Crypto-1 Algorithmic Weakness
    if (cardDump.type.includes('Classic')) {
      findings.push({
        severity: 'high',
        title: 'Cifrado obsoleto NXP Crypto-1 (Vulnerable a ataques Nested / Hardnested)',
        desc: 'El estándar MIFARE Classic carece de seguridad criptográfica moderna frente a dispositivos como Proxmark3 o Flipper Zero. Se recomienda migrar a MIFARE DESFire EV2/EV3 con AES-128.',
      });
    }

    // 4. Access Conditions
    cardDump.sectors.forEach((sec) => {
      if (sec.accessBits.toUpperCase() === 'FF078069' || sec.accessBits.toUpperCase() === '08778F69') {
        unlockedTrailerCount++;
      }
    });

    if (unlockedTrailerCount > 0) {
      findings.push({
        severity: 'medium',
        title: `${unlockedTrailerCount} sectores con permisos de trailer modificables`,
        desc: 'Los bits de acceso permiten reescribir la Key B y las condiciones de control sin requerir elevación de privilegios adicional.',
      });
    }

    // Calculate score (0 to 100) and Letter Grade (A to F)
    let score = 100;
    if (defaultKeySectorsCount >= 10) score -= 50;
    else if (defaultKeySectorsCount > 0) score -= 30;

    if (isMagicCandidate) score -= 20;
    if (cardDump.type.includes('Classic')) score -= 15;
    if (unlockedTrailerCount > 0) score -= 10;

    score = Math.max(10, Math.min(100, score));

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    let gradeColor = 'text-rose-500 border-rose-500/50 bg-rose-950/30';
    if (score >= 90) {
      grade = 'A';
      gradeColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';
    } else if (score >= 80) {
      grade = 'B';
      gradeColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30';
    } else if (score >= 65) {
      grade = 'C';
      gradeColor = 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    } else if (score >= 50) {
      grade = 'D';
      gradeColor = 'text-orange-500 border-orange-500/50 bg-orange-950/30';
    }

    return {
      score,
      grade,
      gradeColor,
      findings,
      defaultKeySectorsCount,
    };
  };

  const audit = runSecurityEvaluation();

  // Export full markdown security report
  const generateReportText = () => {
    const divider = '='.repeat(70);
    return `${divider}
INFORME FORENSE DE AUDITORÍA DE SEGURIDAD RFID / NFC
Generado por Proxmark3 Web Studio - unfantasmaenelsistema.com
Fecha: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}
${divider}

[+] INFORMACIÓN DEL OBJETIVO AUDITADO:
  - Tipo de tarjeta: ${cardDump.type}
  - UID: ${cardDump.uid}
  - ATQA: ${cardDump.atqa} | SAK: ${cardDump.sak}
  - Total de sectores: ${cardDump.sectors.length}

[+] CALIFICACIÓN DE SEGURIDAD:
  - Puntuación: ${audit.score} / 100
  - Calificación de riesgo: [ CLASE ${audit.grade} ]
  - Sectores con clave por defecto: ${audit.defaultKeySectorsCount} de ${cardDump.sectors.length}

[+] HALLAZGOS Y VULNERABILIDADES DETECTADAS:
${audit.findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   Detalle: ${f.desc}`).join('\n\n')}

[+] RECOMENDACIONES DE MITIGACIÓN:
  1. Sustituir todas las claves de fábrica por claves pseudoaleatorias de 48 bits generadas por CSPRNG.
  2. Migrar la infraestructura de control de acceso a MIFARE DESFire EV3 o Seos con autenticación mutua AES-128.
  3. Deshabilitar compatibilidad con credenciales de tecnología mixta (CSN / UID puro) en los lectores físicos.

${divider}
FIN DEL INFORME
${divider}`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadReport = () => {
    const content = generateReportText();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_rfid_${cardDump.uid.replace(/\s+/g, '')}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Auditor de Seguridad de Credenciales (Security Scorecard)
            </h1>
            <p className="text-xs text-slate-400">
              Evaluación automatizada de vectores de ataque, claves por defecto y clonabilidad sobre el volcado activo.
            </p>
          </div>
        </div>

        {/* Big Scorecard Badge */}
        <div className="flex items-center gap-4 self-start md:self-auto bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <div className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center font-black ${audit.gradeColor}`}>
            <span className="text-2xl font-mono leading-none">{audit.grade}</span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Clase</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">Puntaje Global:</span>
            <div className="text-lg font-bold font-mono text-slate-100">
              {audit.score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-rose-400 block font-medium">
              {audit.score < 50 ? 'Nivel Crítico de Inseguridad' : 'Riesgo Moderado'}
            </span>
          </div>
        </div>
      </div>

      {/* Target Details & Action bar */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">UID:</span>
            <span className="text-cyan-300 font-bold">{cardDump.uid}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">Tipo:</span>
            <span className="text-slate-200">{cardDump.type}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">Sectores:</span>
            <span className="text-emerald-400 font-bold">{cardDump.sectors.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors border border-slate-700"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Copiado' : 'Copiar Informe'}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Informe (.md)</span>
          </button>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Vulnerabilidades y Hallazgos Forenses ({audit.findings.length})
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {audit.findings.map((item, idx) => {
            const badgeBg = item.severity === 'critical' 
              ? 'bg-rose-950/50 text-rose-300 border-rose-800/80' 
              : item.severity === 'high' 
              ? 'bg-orange-950/50 text-orange-300 border-orange-800/80' 
              : 'bg-amber-950/50 text-amber-300 border-amber-800/80';

            return (
              <div 
                key={idx} 
                className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeBg}`}>
                      {item.severity}
                    </span>
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-100">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-0 sm:pl-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Security Table */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Auditoría Sectorial de Contraseñas (Crypto-1 Keys)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {audit.defaultKeySectorsCount} sectores vulnerables
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Sector</th>
                <th className="py-2.5 px-4">Clave A</th>
                <th className="py-2.5 px-4">Clave B</th>
                <th className="py-2.5 px-4">Bits de Acceso</th>
                <th className="py-2.5 px-4 text-right">Estado de Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {cardDump.sectors.map((sec) => {
                const isDefA = DEFAULT_KEYS.includes(sec.keyA.value.toUpperCase());
                const isDefB = DEFAULT_KEYS.includes(sec.keyB.value.toUpperCase());
                const isVuln = isDefA || isDefB;

                return (
                  <tr key={sec.sector} className="hover:bg-slate-900/40">
                    <td className="py-2 px-4 font-bold text-slate-200">
                      Sector {sec.sector.toString().padStart(2, '0')}
                    </td>
                    <td className="py-2 px-4">
                      <span className={isDefA ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {sec.keyA.value}
                      </span>
                      {isDefA && <span className="ml-1.5 text-[9px] text-rose-500 font-sans font-bold">[DEFAULT]</span>}
                    </td>
                    <td className="py-2 px-4">
                      <span className={isDefB ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {sec.keyB.value}
                      </span>
                      {isDefB && <span className="ml-1.5 text-[9px] text-rose-500 font-sans font-bold">[DEFAULT]</span>}
                    </td>
                    <td className="py-2 px-4 text-slate-400">
                      {sec.accessBits}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {isVuln ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50 font-sans font-medium">
                          <ShieldAlert className="w-3 h-3" />
                          Clave Pública
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 font-sans font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Personalizada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
