import type { ApiRequest } from '@/types';
import { buildUrl } from './utils';

export type CodeLanguage = 'curl' | 'javascript' | 'python' | 'go';

export interface CodeGenResult {
  language: CodeLanguage;
  label: string;
  code: string;
}

function getHeaders(req: ApiRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of req.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }
  if (req.auth.type === 'bearer' && req.auth.token) {
    headers['Authorization'] = `Bearer ${req.auth.token}`;
  } else if (req.auth.type === 'basic' && req.auth.username) {
    headers['Authorization'] = `Basic ${btoa(`${req.auth.username}:${req.auth.password || ''}`)}`;
  } else if (req.auth.type === 'apikey' && req.auth.key && req.auth.value && req.auth.addTo !== 'query') {
    headers[req.auth.key] = req.auth.value;
  }
  return headers;
}

function hasBody(req: ApiRequest): boolean {
  return req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none' && !!req.body;
}

function toCurl(req: ApiRequest): string {
  const url = buildUrl(req.url, req.params.filter((p) => p.enabled));
  const headers = getHeaders(req);
  const parts = [`curl -X ${req.method}`];
  parts.push(`  '${url}'`);
  for (const [k, v] of Object.entries(headers)) {
    parts.push(`  -H '${k}: ${v}'`);
  }
  if (hasBody(req)) {
    parts.push(`  -d '${req.body.replace(/'/g, "'\\''")}'`);
  }
  return parts.join(' \\\n');
}

function toJavaScript(req: ApiRequest): string {
  const url = buildUrl(req.url, req.params.filter((p) => p.enabled));
  const headers = getHeaders(req);
  const lines: string[] = [];
  lines.push(`const response = await fetch('${url}', {`);
  lines.push(`  method: '${req.method}',`);
  if (Object.keys(headers).length > 0) {
    lines.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},`);
  }
  if (hasBody(req)) {
    lines.push(`  body: ${JSON.stringify(req.body)},`);
  }
  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await response.json();`);
  lines.push(`console.log(data);`);
  return lines.join('\n');
}

function toPython(req: ApiRequest): string {
  const url = buildUrl(req.url, req.params.filter((p) => p.enabled));
  const headers = getHeaders(req);
  const lines: string[] = [];
  lines.push(`import requests`);
  lines.push(``);
  const args: string[] = [];
  if (Object.keys(headers).length > 0) {
    lines.push(`headers = ${JSON.stringify(headers, null, 4)}`);
    args.push('headers=headers');
  }
  if (hasBody(req)) {
    lines.push(`data = ${JSON.stringify(req.body)}`);
    args.push('data=data');
  }
  lines.push(``);
  const method = req.method.toLowerCase();
  const argStr = args.length > 0 ? `, ${args.join(', ')}` : '';
  lines.push(`response = requests.${method}('${url}'${argStr})`);
  lines.push(`print(response.status_code)`);
  lines.push(`print(response.json())`);
  return lines.join('\n');
}

function toGo(req: ApiRequest): string {
  const url = buildUrl(req.url, req.params.filter((p) => p.enabled));
  const headers = getHeaders(req);
  const lines: string[] = [];
  lines.push(`package main`);
  lines.push(``);
  lines.push(`import (`);
  lines.push(`\t"fmt"`);
  lines.push(`\t"io"`);
  lines.push(`\t"net/http"`);
  if (hasBody(req)) lines.push(`\t"strings"`);
  lines.push(`)`);
  lines.push(``);
  lines.push(`func main() {`);
  if (hasBody(req)) {
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(req.body)})`);
    lines.push(`\treq, _ := http.NewRequest("${req.method}", "${url}", body)`);
  } else {
    lines.push(`\treq, _ := http.NewRequest("${req.method}", "${url}", nil)`);
  }
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`\treq.Header.Set("${k}", "${v}")`);
  }
  lines.push(``);
  lines.push(`\tclient := &http.Client{}`);
  lines.push(`\tresp, _ := client.Do(req)`);
  lines.push(`\tdefer resp.Body.Close()`);
  lines.push(``);
  lines.push(`\tresBody, _ := io.ReadAll(resp.Body)`);
  lines.push(`\tfmt.Println(string(resBody))`);
  lines.push(`}`);
  return lines.join('\n');
}

export function generateCode(req: ApiRequest): CodeGenResult[] {
  return [
    { language: 'curl', label: 'cURL', code: toCurl(req) },
    { language: 'javascript', label: 'JavaScript', code: toJavaScript(req) },
    { language: 'python', label: 'Python', code: toPython(req) },
    { language: 'go', label: 'Go', code: toGo(req) },
  ];
}
