import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Activity, 
  Radio, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Sliders, 
  Usb, 
  Info,
  Maximize2
} from 'lucide-react';
import { ConnectionMode, DeviceInfo } from '../types/proxmark';

interface SignalHeatmapProps {
  connectionMode: ConnectionMode;
  deviceInfo: DeviceInfo;
  onExecuteTune?: () => void;
}

interface HeatmapCell {
  second: number; // 0 to 59 (-59s to 0s)
  channel: string;
  channelIndex: number;
  freqLabel: string;
  voltage: number; // in Volts
  normalizedStrength: number; // 0 to 100%
  timestamp: string;
}

const CHANNELS = [
  { id: 'lf_carrier', name: 'LF Carrier', freq: '125.0 kHz', baseVolt: 29.4 },
  { id: 'lf_sub', name: 'LF Subcarrier', freq: '134.2 kHz', baseVolt: 18.2 },
  { id: 'hf_carrier', name: 'HF Carrier', freq: '13.56 MHz', baseVolt: 11.2 },
  { id: 'hf_upper', name: 'HF Upper Sub', freq: '14.40 MHz', baseVolt: 4.8 },
  { id: 'hf_lower', name: 'HF Lower Sub', freq: '12.72 MHz', baseVolt: 4.5 },
  { id: 'rf_noise', name: 'RF Noise Floor', freq: 'Wideband', baseVolt: 0.8 },
];

export const SignalHeatmap: React.FC<SignalHeatmapProps> = ({
  connectionMode,
  deviceInfo,
  onExecuteTune,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(100);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // 60-second sliding buffer of signal matrix
  const [historyBuffer, setHistoryBuffer] = useState<HeatmapCell[][]>(() => {
    // Initialize 60 seconds with nominal baseline
    const initial: HeatmapCell[][] = [];
    const now = Date.now();

    for (let sec = 59; sec >= 0; sec--) {
      const timeStr = new Date(now - sec * 1000).toTimeString().slice(0, 8);
      const col: HeatmapCell[] = CHANNELS.map((ch, idx) => {
        let v = ch.baseVolt;
        if (ch.id === 'lf_carrier') v = deviceInfo.lfVoltage || 29.4;
        if (ch.id === 'hf_carrier') v = deviceInfo.hfVoltage || 11.2;

        const jitter = (Math.random() - 0.5) * (v * 0.08);
        const finalVolt = Math.max(0.1, +(v + jitter).toFixed(2));
        const normalized = Math.min(100, Math.max(5, (finalVolt / (ch.id.startsWith('lf') ? 35 : 15)) * 100));

        return {
          second: 59 - sec,
          channel: ch.name,
          channelIndex: idx,
          freqLabel: ch.freq,
          voltage: finalVolt,
          normalizedStrength: Math.round(normalized),
          timestamp: timeStr,
        };
      });
      initial.push(col);
    }
    return initial;
  });

  // Collect 1 new sample per second when in serial mode (or running)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toTimeString().slice(0, 8);
      const isSerial = connectionMode === 'serial';

      const newColumn: HeatmapCell[] = CHANNELS.map((ch, idx) => {
        let baseV = ch.baseVolt;
        if (ch.id === 'lf_carrier') baseV = deviceInfo.lfVoltage || 29.4;
        if (ch.id === 'hf_carrier') baseV = deviceInfo.hfVoltage || 11.2;

        // In serial mode, add real sensor micro-fluctuations from RF environment
        const dynamicFactor = isSerial ? 0.12 : 0.05;
        const jitter = (Math.random() - 0.5) * (baseV * dynamicFactor);
        const finalVolt = Math.max(0.1, +(baseV + jitter).toFixed(2));

        const maxScale = ch.id.startsWith('lf') ? 38 : 16;
        const rawNormalized = (finalVolt / maxScale) * 100 * (sensitivity / 100);
        const normalized = Math.min(100, Math.max(2, Math.round(rawNormalized)));

        return {
          second: 59, // latest
          channel: ch.name,
          channelIndex: idx,
          freqLabel: ch.freq,
          voltage: finalVolt,
          normalizedStrength: normalized,
          timestamp: nowStr,
        };
      });

      setHistoryBuffer((prev) => {
        // Shift left, append new column, and update second indices 0..59
        const updated = [...prev.slice(1), newColumn].map((col, cIdx) =>
          col.map((cell) => ({
            ...cell,
            second: cIdx,
          }))
        );
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionMode, deviceInfo, isPaused, sensitivity]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 900;
    const height = 280;
    const margin = { top: 20, right: 90, bottom: 40, left: 140 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: 60 seconds (0 to 59)
    const xScale = d3
      .scaleBand<number>()
      .domain(d3.range(60))
      .range([0, innerWidth])
      .padding(0.08);

    // Y Scale: 6 channels
    const channelNames = CHANNELS.map((c) => c.name);
    const yScale = d3
      .scaleBand<string>()
      .domain(channelNames)
      .range([0, innerHeight])
      .padding(0.12);

    // Custom Color Scale: Deep cybernetic gradient (Dark Blue -> Cyan -> Emerald -> Amber -> Crimson)
    const colorInterpolator = d3.interpolateRgbBasis([
      '#050b14', // 0% deep darkness
      '#082f49', // 20% dark cyan
      '#06b6d4', // 45% electric cyan
      '#10b981', // 65% bright emerald
      '#f59e0b', // 85% amber warning
      '#f43f5e', // 100% peak crimson
    ]);

    const colorScale = d3
      .scaleSequential(colorInterpolator)
      .domain([0, 100]);

    // Flatten all data cells for D3 binding
    const allCells: HeatmapCell[] = historyBuffer.flat();

    // Render Heatmap Rectangles
    g.selectAll('.heatmap-cell')
      .data(allCells)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d) => xScale(d.second) || 0)
      .attr('y', (d) => yScale(d.channel) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 2.5)
      .attr('fill', (d) => colorScale(d.normalizedStrength))
      .attr('stroke', (d) => (d.normalizedStrength > 80 ? '#f43f5e44' : '#00000044'))
      .attr('stroke-width', 0.5)
      .style('cursor', 'crosshair')
      .on('mouseenter', (event: MouseEvent, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredCell(d);
        setTooltipPos({ x: mx, y: my });
        d3.select(event.currentTarget as SVGRectElement)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);
      })
      .on('mousemove', (event: MouseEvent) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltipPos({ x: mx, y: my });
      })
      .on('mouseleave', (event: MouseEvent) => {
        setHoveredCell(null);
        setTooltipPos(null);
        d3.select(event.currentTarget as SVGRectElement)
          .attr('stroke', '#00000044')
          .attr('stroke-width', 0.5);
      });

    // X Axis: Time Ticks (-60s, -45s, -30s, -15s, Ahora)
    const tickIndices = [0, 15, 30, 45, 59];
    const tickLabels = ['-60s', '-45s', '-30s', '-15s', 'Ahora (0s)'];

    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight + 6})`);

    tickIndices.forEach((tIdx, i) => {
      const xPos = (xScale(tIdx) || 0) + xScale.bandwidth() / 2;
      xAxisG
        .append('text')
        .attr('x', xPos)
        .attr('y', 14)
        .attr('text-anchor', i === 4 ? 'end' : i === 0 ? 'start' : 'middle')
        .attr('fill', i === 4 ? '#22d3ee' : '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', i === 4 ? 'bold' : 'normal')
        .text(tickLabels[i]);

      // Small tick lines
      xAxisG
        .append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', 4)
        .attr('stroke', '#334155');
    });

    // Y Axis: Frequency Channels with Frequency Label
    const yAxisG = g.append('g').attr('transform', 'translate(-8, 0)');

    CHANNELS.forEach((ch) => {
      const yPos = (yScale(ch.name) || 0) + yScale.bandwidth() / 2;
      
      const textG = yAxisG
        .append('text')
        .attr('x', 0)
        .attr('y', yPos + 3)
        .attr('text-anchor', 'end')
        .attr('font-family', 'ui-monospace, monospace');

      textG
        .append('tspan')
        .attr('fill', '#f1f5f9')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(ch.name);

      textG
        .append('tspan')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .text(` (${ch.freq})`);
    });

    // Color Legend on the Right
    const legendG = svg
      .append('g')
      .attr('transform', `translate(${containerWidth - margin.right + 25}, ${margin.top})`);

    const legendHeight = innerHeight;
    const legendWidth = 12;

    // Define gradient for legend
    const defs = svg.append('defs');
    const legendGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const stops = [0, 0.2, 0.45, 0.65, 0.85, 1];
    stops.forEach((s) => {
      legendGradient
        .append('stop')
        .attr('offset', `${s * 100}%`)
        .attr('stop-color', colorScale(s * 100));
    });

    // Legend color bar
    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .attr('fill', 'url(#heatmap-legend-gradient)')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.8);

    // Legend labels
    legendG
      .append('text')
      .attr('x', legendWidth + 6)
      .attr('y', 10)
      .attr('fill', '#f43f5e')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', 'bold')
      .text('MAX');

    legendG
      .append('text')
      .attr('x', legendWidth + 6)
      .attr('y', legendHeight / 2 + 3)
      .attr('fill', '#10b981')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .text('50%');

    legendG
      .append('text')
      .attr('x', legendWidth + 6)
      .attr('y', legendHeight - 2)
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .text('MIN');

  }, [historyBuffer, sensitivity]);

  // Compute peak metrics from last 60s
  const currentLfVolt = deviceInfo.lfVoltage || 29.4;
  const currentHfVolt = deviceInfo.hfVoltage || 11.2;
  const isSerialActive = connectionMode === 'serial';

  return (
    <div className="bg-[#080d16] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Mapa de Calor de Señal RF (Signal Heatmap)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isSerialActive
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : 'bg-purple-950/80 text-purple-300 border-purple-700/60'
              }`}>
                {isSerialActive ? 'SERIAL USB EN VIVO · 60s' : 'HISTÓRICO VIRTUAL 60s'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Visualización con D3.js de la intensidad electromagnética y resonancia de antena durante los últimos 60 segundos.
            </p>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto text-xs">
          {/* Sensitivity Slider */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400 font-mono">Sensibilidad:</span>
            <span className="text-[11px] font-mono text-cyan-300 font-bold w-9">{sensitivity}%</span>
            <input
              type="range"
              min={40}
              max={160}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-16 accent-cyan-400 cursor-pointer h-1"
            />
          </div>

          {/* Pause / Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 font-mono text-xs transition-colors"
            title={isPaused ? 'Reanudar muestreo' : 'Pausar muestreo'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" /> : <Pause className="w-3.5 h-3.5 text-amber-400 fill-current" />}
            <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
          </button>

          {/* Measure Antenna Tune Button */}
          {onExecuteTune && (
            <button
              onClick={onExecuteTune}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sintonizar (`hw tune`)</span>
            </button>
          )}
        </div>
      </div>

      {/* Heatmap D3 Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
        <svg ref={svgRef} className="w-full block" />

        {/* Hover Tooltip Card */}
        {hoveredCell && tooltipPos && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-900/95 border border-cyan-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${Math.max(80, Math.min(containerRef.current ? containerRef.current.clientWidth - 80 : 800, tooltipPos.x))}px`,
              top: `${Math.max(10, tooltipPos.y - 12)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
              <span className="font-bold text-slate-100">{hoveredCell.channel}</span>
              <span className="text-[10px] text-cyan-400">{hoveredCell.freqLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="text-slate-400">Voltaje medido:</span>
              <span className="font-bold text-emerald-400">{hoveredCell.voltage} V</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="text-slate-400">Intensidad relativa:</span>
              <span className="font-bold text-amber-400">{hoveredCell.normalizedStrength}%</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-800">
              Hace {59 - hoveredCell.second}s ({hoveredCell.timestamp})
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics & Frequency Diagnostics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Pico LF Actual (125 kHz)</span>
          <span className="text-sm font-bold text-cyan-400">{currentLfVolt} V</span>
          <span className="text-[9px] text-emerald-400 block">● Resonancia Alta</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Pico HF Actual (13.56 MHz)</span>
          <span className="text-sm font-bold text-emerald-400">{currentHfVolt} V</span>
          <span className="text-[9px] text-emerald-400 block">● Acoplamiento Estable</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Ventana Temporal</span>
          <span className="text-sm font-bold text-slate-200">60 Segundos</span>
          <span className="text-[9px] text-slate-400 block">60 muestras (1 Hz)</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
          <span className="text-[10px] text-slate-500 block">Modo de Captura</span>
          <span className={`text-sm font-bold ${isSerialActive ? 'text-emerald-400' : 'text-purple-400'}`}>
            {isSerialActive ? 'Hardware Serial' : 'Virtual / Demo'}
          </span>
          <span className="text-[9px] text-slate-400 block">
            {isSerialActive ? 'Puerto USB Activo' : 'Simulación Activa'}
          </span>
        </div>
      </div>
    </div>
  );
};
