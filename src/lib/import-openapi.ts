import type { ApiCollection, ApiRequest, ApiFolder, HttpMethod, KeyValuePair } from '@/types';
import { generateId } from './utils';

interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema?: { type?: string; default?: any; example?: any };
  example?: any;
}

interface OpenAPIRequestBody {
  content?: Record<string, { schema?: any; example?: any }>;
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  security?: Record<string, string[]>[];
  tags?: string[];
}

interface OpenAPIPath {
  [method: string]: OpenAPIOperation;
}

interface OpenAPISpec {
  openapi?: string;
  info?: { title?: string; version?: string };
  servers?: { url: string }[];
  paths?: Record<string, OpenAPIPath>;
  components?: {
    securitySchemes?: Record<string, {
      type: string;
      scheme?: string;
      bearerFormat?: string;
      in?: string;
      name?: string;
    }>;
  };
}

const VALID_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function extractExample(schema: any): string {
  if (!schema) return '';
  if (schema.example !== undefined) return JSON.stringify(schema.example, null, 2);
  if (schema.type === 'object' && schema.properties) {
    const obj: Record<string, any> = {};
    for (const [key, prop] of Object.entries(schema.properties) as [string, any][]) {
      if (prop.example !== undefined) obj[key] = prop.example;
      else if (prop.type === 'string') obj[key] = '';
      else if (prop.type === 'integer' || prop.type === 'number') obj[key] = 0;
      else if (prop.type === 'boolean') obj[key] = false;
      else if (prop.type === 'array') obj[key] = [];
      else obj[key] = null;
    }
    return JSON.stringify(obj, null, 2);
  }
  return '';
}

function operationToRequest(
  path: string,
  method: string,
  op: OpenAPIOperation,
  baseUrl: string,
): ApiRequest {
  const params: KeyValuePair[] = [];
  const headers: KeyValuePair[] = [{ key: 'Content-Type', value: 'application/json', enabled: true }];

  if (op.parameters) {
    for (const param of op.parameters) {
      const val = param.example ?? param.schema?.example ?? param.schema?.default ?? '';
      if (param.in === 'query') {
        params.push({ key: param.name, value: String(val), enabled: true });
      } else if (param.in === 'header') {
        headers.push({ key: param.name, value: String(val), enabled: true });
      }
    }
  }

  let body = '';
  let bodyType: ApiRequest['bodyType'] = 'none';
  if (op.requestBody?.content) {
    const jsonContent = op.requestBody.content['application/json'];
    if (jsonContent) {
      bodyType = 'json';
      body = jsonContent.example
        ? JSON.stringify(jsonContent.example, null, 2)
        : extractExample(jsonContent.schema);
    }
  }

  const url = `${baseUrl}${path}`;

  return {
    id: generateId(),
    name: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
    method: method.toUpperCase() as HttpMethod,
    url,
    headers,
    params,
    body,
    bodyType,
    auth: { type: 'none' },
  };
}

export function importOpenAPICollection(json: string): ApiCollection {
  const spec: OpenAPISpec = JSON.parse(json);

  if (!spec.openapi && !spec.paths) {
    throw new Error('Not a valid OpenAPI spec');
  }

  const title = spec.info?.title || 'OpenAPI Import';
  const baseUrl = spec.servers?.[0]?.url || '';
  const tagFolders = new Map<string, ApiFolder>();
  const ungrouped: ApiRequest[] = [];

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!VALID_METHODS.has(method.toLowerCase())) continue;

      const req = operationToRequest(path, method, op as OpenAPIOperation, baseUrl);
      const tag = (op as OpenAPIOperation).tags?.[0];

      if (tag) {
        if (!tagFolders.has(tag)) {
          tagFolders.set(tag, { id: generateId(), name: tag, requests: [], expanded: true });
        }
        tagFolders.get(tag)!.requests.push(req);
      } else {
        ungrouped.push(req);
      }
    }
  }

  return {
    id: generateId(),
    name: title,
    folders: Array.from(tagFolders.values()),
    requests: ungrouped,
  };
}
