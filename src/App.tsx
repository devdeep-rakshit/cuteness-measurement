import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, SwitchCamera, Download, RotateCcw, Heart, Sparkles } from 'lucide-react';

const filters = [
  { id: 'pinkish', name: 'Pinkish', emoji: '🌸', css: 'saturate(1.08) sepia(.08) hue-rotate(315deg) brightness(1.04)' },
  { id: 'none', name: 'None', emoji: '✨', css: 'none' },
  { id: 'kawaii', name: 'Kawaii', emoji: '🎀', css: 'saturate(1.22) sepia(.12) hue-rotate(320deg) brightness(1.08)' },
  { id: 'bunny', name: 'Bunny', emoji: '🐰', css: 'saturate(1.12) sepia(.08) hue-rotate(325deg) brightness(1.05)' },
  { id: 'cat', name: 'Cat', emoji: '🐱', css: 'saturate(1.1) sepia(.05) hue-rotate(320deg) brightness(1.04)' },
  { id: 'heart', name: 'Heart', emoji: '💗', css: 'saturate(1.18) sepia(.12) hue-rotate(325deg) brightness(1.07)' },
  { id: 'dreamy', name: 'Dreamy', emoji: '🌙', css: 'saturate(.95) brightness(1.13) contrast(.92)' },
];

const messages = [
  'Your smile is pure sunshine ☀️',
  'Certified cutie energy detected 💖',
  'That face deserves a thousand hearts 💗',
  'Kawaii levels are going through the roof 🎀',
  'The camera is blushing now 🌸',
  'Too adorable for ordinary math ✨',
  'Main-character cuteness unlocked 💫',
  'Warning: extreme charm detected 🐰',
  'You make cute look effortless 💕',
];
const compliments = [
  '100% CUTE! 💖',
  'Certified Cutie! ✨',
  'Maximum Kawaii Achieved! 🎀',
  'Sunshine in human form! ☀️',
  'Cuteness level: LEGENDARY! 🐰',
  'Too adorable to calculate! 💗',
];
const saveMessages = [
  'Main-character energy ✨',
  'Certified heart-stealer 💘',
  'A little sunshine for your gallery ☀️',
  'Cute today, iconic forever 🎀',
  'Proof that magic is real 🌸',
  'Warning: dangerously adorable 💗',
  'Keep this smile close 💫',
  'Kawaii masterpiece unlocked 🐰',
  'The world got 100% cuter 💕',
  'One photo, endless charm ✨',
];

export default function App() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef<number>(0);
  const lastDetection = useRef(0);
  const startedAt = useRef(0);
  const elapsedRef = useRef(0);
  const previousFrameAt = useRef(0);
  const completedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [face, setFace] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [filter, setFilter] = useState('none');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(0);
  const [result, setResult] = useState<{ src: string; score: number; complete: boolean } | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const active = filters.find(f => f.id === filter) ?? filters[1];
  const progress = Math.min(100, elapsed / 150);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    setReady(false);
  }, []);

  const start = useCallback(async (mode: 'user' | 'environment' = facing) => {
    setError('');
    setLoading(true);
    stop();
    setFace(false);
    setModelReady(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access needs HTTPS. Open this website using its GitHub Pages link in Chrome.');
      }
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1600 } },
      });
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
      setFacing(mode);
      setReady(true);
      try {
        const modelPath = `${import.meta.env.BASE_URL}models`;
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        setModelReady(true);
        setError('');
      } catch (e) {
        const detail = e instanceof Error ? e.message : 'Unknown model loading error';
        setError(`Camera is on, but the local face model did not load: ${detail}. You can still capture a photo.`);
      }
      startedAt.current = 0;
      elapsedRef.current = 0;
      previousFrameAt.current = 0;
      completedRef.current = false;
      setElapsed(0);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      setError(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Allow camera access in Chrome site settings, then retry.'
        : err.message || 'Could not open the camera. Close other camera apps and try again.');
    } finally {
      setLoading(false);
    }
  }, [facing, stop]);

  const capture = useCallback((score: number, complete: boolean) => {
    const v = video.current;
    const c = canvas.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = active.css;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(c.width * 0.1)}px serif`;
    if (filter === 'bunny') ctx.fillText('🐰', c.width / 2, c.height * .22);
    if (filter === 'cat') ctx.fillText('🐱', c.width / 2, c.height * .22);
    if (filter === 'heart' || filter === 'kawaii') {
      for (let i = 0; i < 10; i++) {
        ctx.fillText(i % 2 ? '✨' : '💗', (i * 173 + 61) % c.width, (i * 251 + 83) % (c.height * .75));
      }
    }
    setSavedMessage('');
    setResult({ src: c.toDataURL('image/png'), score: Math.round(score), complete });
  }, [active.css, facing, filter]);

  useEffect(() => {
    let dead = false;
    const loop = async (now: number) => {
      if (dead) return;
      const v = video.current;
      if (v && v.readyState >= 2 && modelReady && now - lastDetection.current > 250) {
        lastDetection.current = now;
        try {
          const detections = await faceapi.detectAllFaces(
            v,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 }),
          );
          if (!dead) {
            const hasFace = detections.length > 0;
            const now = Date.now();
            setFace(hasFace);
            if (hasFace && !completedRef.current) {
              if (!startedAt.current) {
                startedAt.current = now;
                previousFrameAt.current = now;
                elapsedRef.current = 0;
                setElapsed(0);
              } else if (previousFrameAt.current) {
                const delta = Math.min(now - previousFrameAt.current, 350);
                const ms = Math.min(15000, elapsedRef.current + delta);
                elapsedRef.current = ms;
                setElapsed(ms);
                if (ms >= 15000) {
                  completedRef.current = true;
                  startedAt.current = 0;
                  previousFrameAt.current = 0;
                  capture(100, true);
                }
              }
              previousFrameAt.current = now;
            } else {
              previousFrameAt.current = 0;
            }
          }
        } catch {
          if (!dead) {
            setFace(false);
            previousFrameAt.current = 0;
          }
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      dead = true;
      cancelAnimationFrame(raf.current);
    };
  }, [ready, modelReady, capture]);

  useEffect(() => {
    const id = window.setInterval(() => setMessage(i => (i + 1) % messages.length), 1900);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => {
    stream.current?.getTracks().forEach(track => track.stop());
    cancelAnimationFrame(raf.current);
  }, []);

  const reset = () => {
    startedAt.current = 0;
    elapsedRef.current = 0;
    previousFrameAt.current = 0;
    completedRef.current = false;
    setElapsed(0);
    setResult(null);
    setSavedMessage('');
    setMessage(0);
  };

  const save = () => {
    if (!result) return;
    const msg = saveMessages[Math.floor(Math.random() * saveMessages.length)];
    const image = new Image();
    image.onload = () => {
      const output = document.createElement('canvas');
      output.width = image.naturalWidth;
      output.height = image.naturalHeight;
      const ctx = output.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      const bannerHeight = Math.max(118, output.height * 0.17);
      ctx.fillStyle = 'rgba(207, 48, 112, 0.84)';
      ctx.fillRect(0, 0, output.width, bannerHeight);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(output.width * 0.075)}px sans-serif`;
      ctx.fillText('100% CUTE 💖', output.width / 2, bannerHeight * 0.36, output.width * 0.92);
      ctx.font = `700 ${Math.round(output.width * 0.034)}px sans-serif`;
      ctx.fillText(msg, output.width / 2, bannerHeight * 0.73, output.width * 0.92);
      const a = document.createElement('a');
      a.href = output.toDataURL('image/png');
      a.download = '100-percent-cute.png';
      a.click();
      setSavedMessage(`Saved with 100% CUTE 💖 · ${msg}`);
    };
    image.onerror = () => setSavedMessage('Could not prepare the photo. Please try saving again.');
    image.src = result.src;
  };

  return <main className="app">
    <header><span>🎀</span><b> Cuteness Measurement</b><span>✨</span></header>
    <section className="card">
      {!result && <>
        <div className="view">
          <video ref={video} playsInline muted className={facing === 'user' ? 'mirror' : ''} style={{ filter: active.css }} />
          <canvas ref={canvas} hidden />
          {!ready && <div className="placeholder">
            <div className="bigbow">🎀</div>
            <h2>Your cute moment awaits</h2>
            <p>Allow camera access to begin your kawaii measurement.</p>
            <button className="pink" onClick={() => start()} disabled={loading}>
              <Camera size={18}/>{loading ? 'Opening camera…' : 'Open Camera'}
            </button>
          </div>}
        </div>
        {ready && <div className="status">{!modelReady ? '📷 Camera ready · loading local face detector' : face ? '💖 Face detected!' : '🔎 Looking for a face…'}</div>}
        {ready && <div className="meter">
          <strong>{Math.round(progress)}<small>%</small></strong>
          <div className="track"><i style={{ width: progress + '%' }}/><span>💗</span></div>
          <b key={message} className="measure-message">
            {modelReady ? (face ? messages[message] : 'Bring your cute face into the frame 🎀') : 'Warming up the cuteness scanner… ✨'}
          </b>
          <small>{Math.floor(elapsed / 1000)} / 15 seconds</small>
        </div>}
        {error && <p className="error">{error} <button onClick={() => start(facing)}>Retry</button></p>}
        <div className="filter-title">✨ Choose your vibe ✨</div>
        <div className="filters">{filters.map(f =>
          <button key={f.id} className={filter === f.id ? 'chosen' : ''} onClick={() => setFilter(f.id)}>
            <span>{f.emoji}</span>{f.name}
          </button>
        )}</div>
        <div className="controls">
          <div className="shutter" role="img" aria-label="Automatic capture at 100%"><Sparkles size={26}/></div>
          <button className="side" disabled={!ready} onClick={() => start(facing === 'user' ? 'environment' : 'user')} aria-label="Switch camera"><SwitchCamera/></button>
        </div>
        <p className="note"><Sparkles size={13}/> Just for fun, not a scientific score <Heart size={12}/></p>
      </>}
      {result && <>
        <div className="result-photo"><img src={result.src} alt="Captured photo"/></div>
        <div className="result">
          <small>{result.complete ? 'MEASUREMENT COMPLETE' : 'SNAPSHOT CAPTURED'}</small>
          <h1>{result.complete ? compliments[Math.floor(Date.now() / 1000) % compliments.length] : 'Cute moment captured! 💗'}</h1>
          <p>{result.complete ? 'Your smile can brighten anyone’s day.' : 'You captured your cuteness moment. Keep going to reach 100%!'}</p>
          <div className="actions">
            <button onClick={reset}><RotateCcw size={16}/> Try Again</button>
            <button className="pink" onClick={save}><Download size={16}/> Save Photo</button>
          </div>
          {savedMessage && <p className="saved-message" role="status">{savedMessage}</p>}
        </div>
        <button className="retake" onClick={() => { reset(); if (!stream.current) start(); }}>Retake photo</button>
      </>}
    </section>
    <footer>Made with 🎀 and a little sparkle dust</footer>
  </main>;
}
