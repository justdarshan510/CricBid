'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

export default function SignatureBuilderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [brushWidth, setBrushWidth] = useState(38);
  const [animationDuration, setAnimationDuration] = useState(7);
  const [base64PNG, setBase64PNG] = useState<string>('');
  const [svgPreview, setSvgPreview] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [animationStyle, setAnimationStyle] = useState<'single' | 'sequential'>('sequential');

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

    // Convert strokes array to SVG path D string components
    const dPaths = strokes.map(stroke => {
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
      svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482 467" width="100%" height="100%">
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
      stroke-dasharray: 4000;
      stroke-dashoffset: 4000;
      animation: draw-sig-single ${animationDuration}s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes draw-sig-single {
      0% { stroke-dashoffset: 4000; opacity: 1; }
      55% { stroke-dashoffset: 0; opacity: 1; }
      82% { stroke-dashoffset: 0; opacity: 1; }
      92% { stroke-dashoffset: 0; opacity: 0; }
      100% { stroke-dashoffset: 4000; opacity: 0; }
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
      stroke-dasharray: 1500;
      stroke-dashoffset: 1500;
      animation: draw-seq-${idx} ${animationDuration}s ease-in-out infinite;
    }
    @keyframes draw-seq-${idx} {
      0%, ${startPct.toFixed(1)}% {
        stroke-dashoffset: 1500;
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
        stroke-dashoffset: 1500;
        opacity: 0;
      }
    }`;
      }).join('\n');

      svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482 467" width="100%" height="100%">
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
    if (last && last.x === pos.x && last.y === pos.y) return;

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
      setStrokes(prev => [...prev, currentStrokeRef.current]);
    }
    currentStrokeRef.current = [];
  };

  const undoLastStroke = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const clearCanvas = () => {
    setStrokes([]);
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
                src="/dhoni-raw-signature.png" 
                alt="Guideline"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none opacity-25 z-0"
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
                className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2.5">
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
