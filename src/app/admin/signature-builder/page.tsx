'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

// AI Helper: Maps user drawn strokes to the closest target template strokes, aligning drawing directions
const mapUserStrokesToTemplate = (
  userStrokes: { x: number; y: number }[][],
  templateStrokes: { x: number; y: number }[][]
) => {
  if (userStrokes.length === 0 || templateStrokes.length === 0) return [];

  const availableTemplates = templateStrokes.map((stroke, index) => ({
    stroke,
    index,
    used: false
  }));

  return userStrokes.map(userStroke => {
    if (userStroke.length === 0) return [];

    let bestIndex = -1;
    let minDistance = Infinity;

    availableTemplates.forEach((temp, idx) => {
      if (temp.used) return;

      let sumDist = 0;
      const sample = userStroke.filter((_, i) => i % 5 === 0);
      if (sample.length === 0) return;

      sample.forEach(u => {
        let nearest = Infinity;
        temp.stroke.forEach(t => {
          const d = (u.x - t.x) ** 2 + (u.y - t.y) ** 2;
          if (d < nearest) nearest = d;
        });
        sumDist += Math.sqrt(nearest);
      });
      const avgDist = sumDist / sample.length;

      if (avgDist < minDistance) {
        minDistance = avgDist;
        bestIndex = idx;
      }
    });

    if (bestIndex === -1) {
      return userStroke;
    }

    availableTemplates[bestIndex].used = true;
    const matchedTemplate = availableTemplates[bestIndex].stroke;

    const userStart = userStroke[0];
    const tempStart = matchedTemplate[0];
    const tempEnd = matchedTemplate[matchedTemplate.length - 1];

    const distToStart = (userStart.x - tempStart.x) ** 2 + (userStart.y - tempStart.y) ** 2;
    const distToEnd = (userStart.x - tempEnd.x) ** 2 + (userStart.y - tempEnd.y) ** 2;

    const finalStroke = distToEnd < distToStart ? [...matchedTemplate].reverse() : matchedTemplate;

    return finalStroke;
  });
};

export default function SignatureBuilderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [brushWidth, setBrushWidth] = useState(38);
  const [animationDuration, setAnimationDuration] = useState(12);
  const [base64PNG, setBase64PNG] = useState<string>('');
  const [svgPreview, setSvgPreview] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [animationStyle, setAnimationStyle] = useState<'single' | 'sequential'>('sequential');
  const [targetPoints, setTargetPoints] = useState<{ x: number; y: number }[]>([]);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const templateStrokesRef = useRef<{ x: number; y: number }[][]>([]);
  const [useAISnap, setUseAISnap] = useState(true);

  // Load target template strokes for AI matching on mount
  useEffect(() => {
    async function loadTargetStrokes() {
      try {
        const res = await fetch('/dhoni-traced-strokes.json');
        if (res.ok) {
          const data = await res.json();
          templateStrokesRef.current = data;
          setTargetPoints(data.flat());
        }
      } catch (err) {
        console.error('Error loading target strokes:', err);
      }
    }
    loadTargetStrokes();
  }, []);

  // AI Matching Score Calculation using Modified Chamfer Distance
  useEffect(() => {
    if (strokes.length === 0 || targetPoints.length === 0) {
      setMatchScore(null);
      return;
    }

    const userPoints = strokes.flat();
    if (userPoints.length === 0) {
      setMatchScore(null);
      return;
    }

    // Subsample to optimize speed
    const userSample = userPoints.length > 500 
      ? userPoints.filter((_, i) => i % Math.ceil(userPoints.length / 500) === 0)
      : userPoints;
      
    const targetSample = targetPoints.length > 500
      ? targetPoints.filter((_, i) => i % Math.ceil(targetPoints.length / 500) === 0)
      : targetPoints;

    let sumUserToTarget = 0;
    for (const u of userSample) {
      let minDist = Infinity;
      for (const t of targetSample) {
        const d = (u.x - t.x) ** 2 + (u.y - t.y) ** 2;
        if (d < minDist) minDist = d;
      }
      sumUserToTarget += Math.sqrt(minDist);
    }
    const avgUserToTarget = sumUserToTarget / userSample.length;

    let sumTargetToUser = 0;
    for (const t of targetSample) {
      let minDist = Infinity;
      for (const u of userSample) {
        const d = (t.x - u.x) ** 2 + (t.y - u.y) ** 2;
        if (d < minDist) minDist = d;
      }
      sumTargetToUser += Math.sqrt(minDist);
    }
    const avgTargetToUser = sumTargetToUser / targetSample.length;

    const chamferDist = (avgUserToTarget + avgTargetToUser) / 2;

    // Scale score: average of 35px error sets it to 0%
    const score = Math.max(0, Math.min(100, Math.round(100 - (chamferDist * 2.8))));
    setMatchScore(score);
  }, [strokes, targetPoints]);

  // Load the gold signature PNG and convert to base64 on mount
  useEffect(() => {
    async function loadSignature() {
      try {
        const res = await fetch('/dhoni-signature.png');
        if (!res.ok) throw new Error('Could not load dhoni-signature.png');
        const blob = await res.blob();
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          // Extract just the raw base64 data without data:image/png;base64,
          const base64 = resultStr.split(',')[1];
          setBase64PNG(base64);
        };
      } catch (err: any) {
        console.error('Error loading signature PNG:', err);
        setErrorMessage('Could not load base gold signature PNG. Make sure it exists in public/dhoni-signature.png');
      }
    }
    loadSignature();
  }, []);

  // Redraw strokes on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid guidance
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Draw all completed strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke, idx) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      // Use different colors for strokes to show ordering
      const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6'];
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 4;
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();

      // Draw stroke order indicator text at the start of each stroke
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Stroke ${idx + 1}`, stroke[0].x + 5, stroke[0].y - 5);
    });
  }, [strokes]);

  // Generate SVG content dynamically based on current drawing paths
  useEffect(() => {
    if (!base64PNG || strokes.length === 0) {
      setSvgPreview('');
      return;
    }

    // Map strokes using AI snap if enabled
    const finalStrokes = useAISnap && templateStrokesRef.current.length > 0
      ? mapUserStrokesToTemplate(strokes, templateStrokesRef.current)
      : strokes;

    // Convert strokes array to SVG path D string components
    const dPaths = finalStrokes.map(stroke => {
      if (stroke.length === 0) return '';
      let d = `M ${stroke[0].x} ${stroke[0].y}`;
      for (let i = 1; i < stroke.length; i++) {
        d += ` L ${stroke[i].x} ${stroke[i].y}`;
      }
      return d;
    }).filter(d => d !== '');

    let svgStr = '';

    if (animationStyle === 'single') {
      // 1. Continuous single-path reveal animation
      const combinedD = dPaths.join(' ');
      svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482 467" width="100%" height="100%" preserveAspectRatio="none">
  <defs>
    <mask id="sig-mask" maskUnits="userSpaceOnUse">
      <rect width="100%" height="100%" fill="black" />
      <path class="mask-path stroke-single" d="${combinedD}" />
    </mask>
  </defs>
  <style>
    .mask-path {
      stroke: white;
      stroke-width: ${brushWidth};
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      opacity: 1;
    }
    .stroke-single {
      stroke-dasharray: 10000;
      stroke-dashoffset: 10000;
      animation: draw-sig-single ${animationDuration}s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes draw-sig-single {
      0% { stroke-dashoffset: 10000; opacity: 1; }
      55% { stroke-dashoffset: 0; opacity: 1; }
      82% { stroke-dashoffset: 0; opacity: 1; }
      92% { stroke-dashoffset: 0; opacity: 0; }
      100% { stroke-dashoffset: 10000; opacity: 0; }
    }
  </style>
  <image href="data:image/png;base64,${base64PNG}" width="482" height="467" mask="url(#sig-mask)" />
</svg>`;
    } else {
      // 2. Sequential multi-stroke reveal animation
      // Each stroke is drawn separately in sequence
      const pathElements = dPaths.map((d, idx) => {
        return `<path class="mask-path stroke-${idx}" d="${d}" />`;
      }).join('\n      ');

      const styleRules = dPaths.map((_, idx) => {
        // Distribute animation start/end points across the timeline
        // Active draw phase is 0% to 65% of the total animation duration
        // Remain visible 65% to 82%, fade 82% to 92%, hidden 92% to 100%
        const segmentShare = 65 / dPaths.length;
        const startPct = idx * segmentShare;
        const endPct = (idx + 1) * segmentShare;

        return `
    .stroke-${idx} {
      stroke-dasharray: 10000;
      stroke-dashoffset: 10000;
      animation: draw-seq-${idx} ${animationDuration}s ease-in-out infinite;
    }
    @keyframes draw-seq-${idx} {
      0%, ${startPct.toFixed(1)}% {
        stroke-dashoffset: 10000;
        opacity: 0;
      }
      ${(startPct + 0.5).toFixed(1)}% {
        opacity: 1;
      }
      ${endPct.toFixed(1)}%, 82% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
      92% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
      100% {
        stroke-dashoffset: 10000;
        opacity: 0;
      }
    }`;
      }).join('\n');

      svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482 467" width="100%" height="100%" preserveAspectRatio="none">
  <defs>
    <mask id="sig-mask" maskUnits="userSpaceOnUse">
      <rect width="100%" height="100%" fill="black" />
      ${pathElements}
    </mask>
  </defs>
  <style>
    .mask-path {
      stroke: white;
      stroke-width: ${brushWidth};
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      opacity: 0;
    }
    ${styleRules}
  </style>
  <image href="data:image/png;base64,${base64PNG}" width="482" height="467" mask="url(#sig-mask)" />
</svg>`;
    }

    setSvgPreview(svgStr);
  }, [strokes, base64PNG, brushWidth, animationDuration, animationStyle]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const pos = getMousePos(e);
    currentStrokeRef.current = [pos];

    // Begin drawing locally
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw initial dot
    ctx.beginPath();
    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6'];
    ctx.strokeStyle = colors[strokes.length % colors.length];
    ctx.lineWidth = 4;
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();

    // Start tracking lines
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    const last = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    if (last) {
      // Filter out small mouse jitters and pauses (must move at least 3 pixels)
      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      if (dx * dx + dy * dy < 9) return;
    }

    currentStrokeRef.current.push(pos);

    // Draw segment directly with zero lag
    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6'];
    ctx.strokeStyle = colors[strokes.length % colors.length];
    ctx.lineWidth = 4;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current.length > 0) {
      const completedStroke = [...currentStrokeRef.current];
      setStrokes(prev => [...prev, completedStroke]);
    }
    currentStrokeRef.current = [];
  };

  const undoLastStroke = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const clearCanvas = () => {
    setStrokes([]);
  };

  const loadTracedSignature = async () => {
    try {
      const res = await fetch('/dhoni-traced-strokes.json');
      if (!res.ok) throw new Error('Could not load auto-traced signature');
      const data = await res.json();
      setStrokes(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to load auto-traced coordinates. Please try again.');
    }
  };

  const handleSaveSignature = async () => {
    if (!svgPreview) return;
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/save-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ svgContent: svgPreview }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error saving:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to connect to saving server endpoint.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1710] text-[#F2EAD8] font-sans pb-12">
      {/* Top Navbar */}
      <nav className="navbar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-black tracking-tight text-[#D4963A]">CricBid</span>
          <span className="text-xs font-bold bg-[#D4963A]/10 text-[#D4963A] border border-[#D4963A]/25 px-2 py-0.5 rounded-full">Admin Dashboard</span>
        </div>
        <Link href="/lobby" className="btn-secondary px-4 py-2 text-xs">
          ← Back to Lobby
        </Link>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">CSK Signature Drawing Board</h1>
          <p className="text-sm text-[#F2EAD8]/60 max-w-3xl">
            Trace over Dhoni's signature guidelines. The coordinates of your mouse path will be recorded sequentially and compile an animated SVG reveal mask. This lets you align the signing order, direction, and timings to fit how a real player signs!
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-red-950/20 border border-red-500/25 text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Drawing Board (Col 6) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <h2 className="section-label">1. Draw Stroke Flow</h2>
            <div 
              className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/40 shadow-xl"
              style={{ width: '602px', height: '584px' }}
            >
              {/* Dhoni guideline background image */}
              <img 
                src="/dhoni-signature.png" 
                alt="Guideline"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none opacity-35 z-0"
                referrerPolicy="no-referrer"
              />

              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={482}
                height={467}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute inset-0 w-full h-full object-fill z-10 cursor-crosshair"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2.5">
              <button 
                onClick={loadTracedSignature} 
                className="btn-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg"
              >
                ✨ Auto-Trace Template
              </button>
              <button 
                onClick={undoLastStroke} 
                disabled={strokes.length === 0}
                className="btn-secondary px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↩ Undo Last Stroke
              </button>
              <button 
                onClick={clearCanvas} 
                disabled={strokes.length === 0}
                className="btn-secondary px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-red-400 border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                🗑 Clear All
              </button>
            </div>
          </div>

          {/* RIGHT: Live Preview & Configurations (Col 6) */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            <h2 className="section-label">2. Settings &amp; Live Writing Preview</h2>
            
            {/* AI Similarity Analyzer Panel */}
            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-[#F2EAD8]/60 tracking-wider">AI Tracing Match Analyzer</h3>
                <span className="text-[9px] font-bold bg-[#D4963A]/10 text-[#D4963A] border border-[#D4963A]/25 px-2 py-0.5 rounded-full">Modified Chamfer Distance</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-black text-white w-16">
                  {matchScore !== null ? `${matchScore}%` : '—'}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-[#F1C40F] to-emerald-500 transition-all duration-300"
                      style={{ width: `${matchScore ?? 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#F2EAD8]/40">
                    {matchScore === null && 'Start tracing to analyze matching accuracy...'}
                    {matchScore !== null && matchScore < 50 && 'Keep drawing to cover all guidelines...'}
                    {matchScore !== null && matchScore >= 50 && matchScore < 75 && 'Good start! Refine your alignment...'}
                    {matchScore !== null && matchScore >= 75 && matchScore < 90 && 'Great accuracy! Almost perfect!'}
                    {matchScore !== null && matchScore >= 90 && 'Master class tracing! Click apply to update!'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tuning Panel */}
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Brush Width */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#F2EAD8]/60 tracking-wider">Mask Brush Width ({brushWidth}px)</label>
                  <input 
                    type="range" 
                    min="15" 
                    max="60" 
                    value={brushWidth} 
                    onChange={e => setBrushWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4963A]"
                  />
                  <span className="text-[9px] text-[#F2EAD8]/40 block mt-0.5">Thicker brushes ensure full coverage.</span>
                </div>

                {/* Animation Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#F2EAD8]/60 tracking-wider">Write Loop Speed ({animationDuration}s)</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="12" 
                    value={animationDuration} 
                    onChange={e => setAnimationDuration(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4963A]"
                  />
                  <span className="text-[9px] text-[#F2EAD8]/40 block mt-0.5">Duration for the signature loop sequence.</span>
                </div>
              </div>

              {/* Animation Style Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD8]/60 tracking-wider block">Animation Stroke Order Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input 
                      type="radio" 
                      name="animStyle" 
                      value="sequential"
                      checked={animationStyle === 'sequential'} 
                      onChange={() => setAnimationStyle('sequential')}
                      className="accent-[#D4963A]"
                    />
                    <span>Sequential (Lift Pen between strokes)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input 
                      type="radio" 
                      name="animStyle" 
                      value="single"
                      checked={animationStyle === 'single'} 
                      onChange={() => setAnimationStyle('single')}
                      className="accent-[#D4963A]"
                    />
                    <span>Continuous (Single sweep)</span>
                  </label>
                </div>
              </div>

              {/* AI Snapping / Redrawing Mode Toggle */}
              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD8]/60 tracking-wider block">AI Processing Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useAISnap} 
                      onChange={e => setUseAISnap(e.target.checked)}
                      className="accent-[#D4963A] rounded border-white/10"
                    />
                    <span className="text-white">AI Snap &amp; Redraw (Smooths shaky strokes into perfect template curves)</span>
                  </label>
                </div>
                <span className="text-[9px] text-[#F2EAD8]/40 block">
                  Captures the direction and order of your hand strokes, but redraws them using perfectly smooth vector curves instead of shaky hand lines.
                </span>
              </div>
            </div>

            {/* Live Animation Preview Box */}
            <div className="flex flex-col space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#F2EAD8]/60 tracking-wider">Live Animated SVG Preview</span>
              <div 
                className="relative border border-white/10 rounded-2xl bg-black/60 shadow-xl overflow-hidden flex items-center justify-center"
                style={{ width: '602px', height: '584px' }}
              >
                {svgPreview ? (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: svgPreview }}
                  />
                ) : (
                  <div className="text-center p-6 space-y-1">
                    <p className="text-sm font-bold">Waiting for your strokes...</p>
                    <p className="text-xs text-[#F2EAD8]/40 max-w-[300px]">Draw over the template on the left and see your handwriting loop preview immediately here!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Button */}
            {svgPreview && (
              <button
                onClick={handleSaveSignature}
                disabled={saveStatus === 'saving'}
                className="btn-primary w-full py-4 text-sm font-black tracking-wide rounded-xl shadow-lg shadow-[#D4963A]/15 active:scale-[0.99] transition-transform"
              >
                {saveStatus === 'saving' && 'Saving SVG...'}
                {saveStatus === 'idle' && '💾 Apply & Update Signature in Lobby'}
                {saveStatus === 'saved' && '✓ Signature Updated Successfully!'}
                {saveStatus === 'error' && '❌ Error saving, try again'}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
