'use client';

import { useState } from 'react';

type HelloResponse = {
  message: string;
  timestamp: string;
};

export default function CallBackend({ apiUrl }: { apiUrl: string }) {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function callBackend() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured for this build.');
      }

      const res = await fetch(`${apiUrl}/api/hello`);
      if (!res.ok) {
        throw new Error(`Backend responded with HTTP ${res.status}`);
      }

      setData((await res.json()) as HelloResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={callBackend} disabled={loading}>
        {loading ? 'Calling...' : 'Call Backend'}
      </button>

      {data && (
        <div className="panel">
          <h2>Backend response</h2>
          <pre>
            {data.message}
            {'\n'}
            {data.timestamp}
          </pre>
        </div>
      )}

      {error && (
        <div className="panel error">
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
    </>
  );
}
