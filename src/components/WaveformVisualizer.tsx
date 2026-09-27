import React, { useEffect, useRef } from 'react';
import { JarvisVoiceState } from '../types/jarvis';

interface WaveformVisualizerProps {
  state: JarvisVoiceState;
  amplitude: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ state, amplitude }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const isListening = state === 'listening';
      const isSpeaking = state === 'speaking';
      const isProcessing = state === 'processing';

      // Base line stroke
      const strokeColor = isListening
        ? 'rgba(245, 158, 11, '
        : isProcessing
        ? 'rgba(56, 189, 248, '
        : 'rgba(6, 182, 212, ';

      // Render 3 overlapping sine wave envelopes
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseAmp = (isSpeaking || isListening)
          ? (25 + amplitude * 45) * (1 - w * 0.25)
          : (isProcessing ? 14 : 4);

        const freq = 0.02 + w * 0.01;
        const speed = (w + 1) * phase;

        for (let x = 0; x < width; x++) {
          // Attenuate at the edges so the wave pinches cleanly to zero
          const edgeAttenuation = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * freq + speed) * baseAmp * edgeAttenuation;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = `${strokeColor}${w === 0 ? '0.9)' : '0.4)'}`;
        ctx.lineWidth = w === 0 ? 2 : 1.2;
        ctx.shadowColor = strokeColor.replace('rgba', 'rgb').replace(', ', ',').slice(0, -1) + ')';
        ctx.shadowBlur = w === 0 ? 8 : 4;
        ctx.stroke();
      }

      // Vertical holographic frequency bars on left and right
      const barCount = 18;
      const barWidth = 3;
      const gap = 4;
      const barBlockWidth = barCount * (barWidth + gap);

      // Draw mirrored bar spectrums
      for (let i = 0; i < barCount; i++) {
        const factor = (i + 1) / barCount;
        const barHeight = (isSpeaking || isListening)
          ? Math.max(3, Math.sin(phase * 2 + i * 0.4) * 22 * amplitude * factor + 6)
          : Math.max(2, Math.sin(phase + i * 0.3) * 5 + 3);

        ctx.fillStyle = `${strokeColor}0.65)`;
        // Left spectrum
        ctx.fillRect(20 + i * (barWidth + gap), centerY - barHeight / 2, barWidth, barHeight);
        // Right spectrum
        ctx.fillRect(width - 20 - barBlockWidth + i * (barWidth + gap), centerY - barHeight / 2, barWidth, barHeight);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, amplitude]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-xl h-20 bg-slate-950/60 border border-cyan-900/40 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
        {/* Subtle grid lines inside oscilloscope */}
        <div className="absolute inset-0 bg-hud-grid opacity-30 pointer-events-none" />
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-full relative z-10"
        />
        {/* Frequency annotation */}
        <div className="absolute top-1 left-2.5 text-[9px] font-mono text-cyan-500/70 tracking-wider">
          FREQ · 24.0 kHz · ACOUSTIC MATRIX
        </div>
        <div className="absolute bottom-1 right-2.5 text-[9px] font-mono text-slate-500 tracking-wider">
          HARMONIC FILTER: OPTIMAL
        </div>
      </div>
    </div>
  );
};
