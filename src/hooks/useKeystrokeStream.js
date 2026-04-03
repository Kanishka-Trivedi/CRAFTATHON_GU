'use client';
import { useEffect, useRef } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/keystrokes';
const POST_FALLBACK = process.env.NEXT_PUBLIC_TELEMETRY_POST || 'http://localhost:5000/api/telemetry';

export default function useKeystrokeStream({ userId, sessionId, deviceId = 'web' }) {
  const wsRef = useRef(null);
  const bufferRef = useRef([]);
  const keyDownMap = useRef(new Map());

  useEffect(() => {
    if (!userId || !sessionId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    const flush = async () => {
      const buf = bufferRef.current;
      if (!buf.length) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ userId, sessionId, deviceId, events: buf }));
        bufferRef.current = [];
      } else if (POST_FALLBACK) {
        try {
          await fetch(POST_FALLBACK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionId, deviceId, events: buf })
          });
          bufferRef.current = [];
        } catch (err) {
          // keep buffer; will retry on next flush
        }
      }
    };

    const onKeyDown = (e) => {
      const now = performance.now();
      keyDownMap.current.set(e.code, now);
      bufferRef.current.push({ t: now, type: 'down', code: e.code });
      if (bufferRef.current.length >= 50) flush();
    };

    const onKeyUp = (e) => {
      const now = performance.now();
      const start = keyDownMap.current.get(e.code);
      bufferRef.current.push({
        t: now,
        type: 'up',
        code: e.code,
        dwell: start ? now - start : undefined
      });
      keyDownMap.current.delete(e.code);
      if (bufferRef.current.length >= 50) flush();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const interval = setInterval(flush, 1000);

    ws.onerror = () => { /* ignore; fallback will kick in */ };

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      clearInterval(interval);
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [userId, sessionId, deviceId]);
}
