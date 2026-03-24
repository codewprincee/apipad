import type { ApiRequest, ApiResponse } from '@/types';
import { buildUrl } from './utils';

export interface RequestExecutor {
  execute(request: ApiRequest): Promise<ApiResponse>;
}

export class FetchExecutor implements RequestExecutor {
  async execute(request: ApiRequest): Promise<ApiResponse> {
    const url = buildUrl(request.url, request.params.filter((p) => p.enabled));

    const headers: Record<string, string> = {};
    for (const h of request.headers) {
      if (h.enabled && h.key) {
        headers[h.key] = h.value;
      }
    }

    // Apply auth
    if (request.auth.type === 'bearer' && request.auth.token) {
      headers['Authorization'] = `Bearer ${request.auth.token}`;
    } else if (request.auth.type === 'basic' && request.auth.username) {
      const encoded = btoa(`${request.auth.username}:${request.auth.password || ''}`);
      headers['Authorization'] = `Basic ${encoded}`;
    } else if (request.auth.type === 'apikey' && request.auth.key && request.auth.value) {
      if (request.auth.addTo !== 'query') {
        headers[request.auth.key] = request.auth.value;
      }
    }

    let requestBody: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.bodyType !== 'none' && request.body) {
      requestBody = request.body;
    }

    const start = performance.now();

    try {
      // Use server-side proxy to bypass CORS
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: request.method,
          headers,
          requestBody,
        }),
      });

      const data = await res.json();

      // The proxy returns the upstream response data
      if (data.error) {
        return {
          status: 0,
          statusText: data.error,
          headers: {},
          body: `Error: ${data.error}`,
          time: performance.now() - start,
          size: 0,
        };
      }

      return {
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        body: data.body,
        time: data.time,
        size: data.size,
      };
    } catch (err: any) {
      const time = performance.now() - start;
      return {
        status: 0,
        statusText: err.message || 'Network Error',
        headers: {},
        body: `Error: ${err.message || 'Failed to fetch'}.\n\nCheck your connection and try again.`,
        time,
        size: 0,
      };
    }
  }
}
