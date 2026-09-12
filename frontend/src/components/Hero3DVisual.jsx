import React, { useEffect, useRef } from 'react';

export default function Hero3DVisual() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth || 400);
    let height = (canvas.height = 220);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 220;
    };
    window.addEventListener('resize', handleResize);

    // Node data representing statistical spending distribution in 3D projection
    const nodes = [
      // Normal cluster within 1-2 standard deviations
      { x: -70, y: -20, z: 20, baseColor: '#10b981', radius: 4, name: 'Normal' },
      { x: -40, y: 30, z: -10, baseColor: '#0ea5e9', radius: 3.5, name: 'Normal' },
      { x: -20, y: -40, z: 5, baseColor: '#10b981', radius: 4, name: 'Normal' },
      { x: 10, y: 15, z: -30, baseColor: '#0ea5e9', radius: 4, name: 'Normal' },
      { x: 30, y: -25, z: 15, baseColor: '#10b981', radius: 3.5, name: 'Normal' },
      { x: 50, y: 20, z: -15, baseColor: '#0ea5e9', radius: 4, name: 'Normal' },
      { x: -10, y: -10, z: 40, baseColor: '#10b981', radius: 4.5, name: 'Mean μ' },

      // Medium deviations
      { x: 80, y: -40, z: 10, baseColor: '#f59e0b', radius: 5, name: 'Variance' },
      { x: -90, y: 50, z: -20, baseColor: '#f59e0b', radius: 5, name: 'Velocity' },

      // Outlier 1: High Anomaly
      { x: -110, y: -65, z: 30, baseColor: '#f97316', radius: 6, name: 'High' },

      // HERO OUTLIER: Critical Anomaly (Z = 3.7, Velocity 4.2x)
      { x: 130, y: 65, z: -10, baseColor: '#e11d48', radius: 8.5, isCritical: true, name: 'Critical Anomaly (3.7σ)' }
    ];

    let angleY = 0;
    let angleX = 0.2;

    const render = () => {
      angleY += 0.008;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle orbital baseline rings (IQR and 3-Sigma threshold sphere)
      ctx.save();
      ctx.translate(cx, cy);

      // Baseline ellipse (Historical distribution)
      ctx.beginPath();
      ctx.ellipse(0, 0, 90, 45, angleY * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // 3-Sigma threshold perimeter
      ctx.beginPath();
      ctx.ellipse(0, 0, 140, 70, -angleY * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Project and sort 3D nodes
      const projected = nodes.map(node => {
        // Rotate around Y axis
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // Rotate around X axis
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        // Perspective projection
        const fov = 320;
        const scale = fov / (fov + z2);
        const px = x1 * scale;
        const py = y2 * scale;

        return {
          ...node,
          px,
          py,
          scale,
          z2
        };
      });

      // Sort back-to-front
      projected.sort((a, b) => b.z2 - a.z2);

      // Render connectors from mean to points
      const centerNode = projected.find(n => n.name === 'Mean μ') || { px: 0, py: 0 };
      projected.forEach(node => {
        if (node.isCritical) {
          // Vector to critical outlier
          ctx.beginPath();
          ctx.moveTo(centerNode.px, centerNode.py);
          ctx.lineTo(node.px, node.py);
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw nodes
      projected.forEach(node => {
        const radius = Math.max(2, node.radius * node.scale);
        
        if (node.isCritical) {
          // Outer glowing pulse
          const pulse = Math.sin(Date.now() * 0.005) * 4;
          const gradient = ctx.createRadialGradient(node.px, node.py, 0, node.px, node.py, radius * 3 + pulse);
          gradient.addColorStop(0, 'rgba(225, 29, 72, 0.8)');
          gradient.addColorStop(0.5, 'rgba(225, 29, 72, 0.25)');
          gradient.addColorStop(1, 'rgba(225, 29, 72, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius * 3 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.baseColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Label for critical outlier
        if (node.isCritical) {
          ctx.fillStyle = '#f43f5e';
          ctx.font = '10px -apple-system, sans-serif';
          ctx.fillText('3.7σ Outlier Flagged', node.px + 12, node.py + 4);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-[220px] rounded-xl overflow-hidden glass-card border border-white/10 flex flex-col justify-between p-4">
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
            3D Variance Space
          </span>
          <h4 className="text-sm font-semibold text-white mt-1">Multi-Indicator Dispersion Radar</h4>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal Baseline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Outlier Anomaly
          </span>
        </div>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="z-10 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/5">
        <span>Historical Mean Baseline: <strong className="text-slate-200">₹44.0L</strong></span>
        <span>Outlier Variance: <strong className="text-rose-400">+79.5% (Z = 3.7)</strong></span>
      </div>
    </div>
  );
}
