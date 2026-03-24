import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const TIMEOUT_MS = 30_000;

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal',
]);

function isBlockedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(hostname)) return true;
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return true;
    // Block private IP ranges
    if (/^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, method, headers, requestBody } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    if (isBlockedHost(url)) {
      return NextResponse.json({ error: 'Requests to internal/private hosts are not allowed' }, { status: 403 });
    }

    const init: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
      signal: AbortSignal.timeout(TIMEOUT_MS),
    };

    if (requestBody && method !== 'GET' && method !== 'HEAD') {
      init.body = requestBody;
    }

    const start = performance.now();
    const res = await fetch(url, init);
    const time = performance.now() - start;

    const responseBody = await res.text();
    const size = new TextEncoder().encode(responseBody).length;

    if (size > MAX_BODY_SIZE) {
      return NextResponse.json({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody.slice(0, MAX_BODY_SIZE) + '\n\n[Response truncated at 1MB]',
        time,
        size,
      });
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body: responseBody,
      time,
      size,
    });
  } catch (err: any) {
    const message = err.name === 'TimeoutError'
      ? 'Request timed out after 30 seconds'
      : err.message || 'Proxy request failed';

    return NextResponse.json({
      status: 0,
      statusText: message,
      headers: {},
      body: `Error: ${message}`,
      time: 0,
      size: 0,
    }, { status: 502 });
  }
}
