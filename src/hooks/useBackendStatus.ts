import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const HEALTH_URL = API_URL ? `${API_URL.replace(/\/api\/?$/, '')}/actuator/health` : 'http://localhost:8080/actuator/health';

export type BackendStatus = 'checking' | 'online' | 'waking' | 'offline';

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const start = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(HEALTH_URL, { signal: controller.signal });
        clearTimeout(timeout);
        if (cancelled) return;
        const elapsed = Date.now() - start;
        if (res.ok) {
          setStatus(elapsed > 2000 ? 'waking' : 'online');
        } else {
          setStatus('offline');
        }
      } catch {
        if (!cancelled) setStatus('offline');
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  return status;
}
