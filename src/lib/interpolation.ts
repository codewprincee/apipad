import type { ApiRequest, KeyValuePair } from '@/types';
import { resolveDynamicVariables } from './dynamic-vars';

export function interpolate(template: string, vars: Record<string, string>): string {
  // First resolve dynamic variables like {{$uuid}}, {{$timestamp}}
  let result = resolveDynamicVariables(template);
  // Then resolve environment variables like {{baseUrl}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return vars[name] !== undefined ? vars[name] : match;
  });
  return result;
}

export function interpolateRequest(
  request: ApiRequest,
  vars: Record<string, string>
): ApiRequest {
  return {
    ...request,
    url: interpolate(request.url, vars),
    headers: request.headers.map((h) => ({
      ...h,
      key: interpolate(h.key, vars),
      value: interpolate(h.value, vars),
    })),
    params: request.params.map((p) => ({
      ...p,
      key: interpolate(p.key, vars),
      value: interpolate(p.value, vars),
    })),
    body: interpolate(request.body, vars),
    auth: {
      ...request.auth,
      token: request.auth.token ? interpolate(request.auth.token, vars) : undefined,
      username: request.auth.username ? interpolate(request.auth.username, vars) : undefined,
      password: request.auth.password ? interpolate(request.auth.password, vars) : undefined,
      key: request.auth.key ? interpolate(request.auth.key, vars) : undefined,
      value: request.auth.value ? interpolate(request.auth.value, vars) : undefined,
    },
  };
}
