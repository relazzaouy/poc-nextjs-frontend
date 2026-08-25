import CallBackend from './call-backend';

// Baked in at build time by Next.js. On Render this comes from the service's
// NEXT_PUBLIC_API_URL environment variable, forwarded as a Docker build arg.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function Home() {
  return (
    <main>
      <h1>Multi-Repo CI/CD POC</h1>
      <CallBackend apiUrl={apiUrl} />
      <p className="meta">
        Backend base URL: <code>{apiUrl || '(NEXT_PUBLIC_API_URL is not set)'}</code>
      </p>
    </main>
  );
}
