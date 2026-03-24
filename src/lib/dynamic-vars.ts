const DYNAMIC_VAR_REGEX = /\{\{\$(\w+)(?:\(([^)]*)\))?\}\}/g;

function resolveDynamic(name: string, args?: string): string {
  switch (name) {
    case 'uuid':
      return crypto.randomUUID();
    case 'timestamp':
      return String(Date.now());
    case 'isoTimestamp':
      return new Date().toISOString();
    case 'randomInt': {
      const [minStr = '0', maxStr = '1000'] = (args || '').split(',').map((s) => s.trim());
      const min = parseInt(minStr, 10) || 0;
      const max = parseInt(maxStr, 10) || 1000;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    case 'randomFloat':
      return (Math.random() * 1000).toFixed(4);
    case 'randomString': {
      const len = parseInt(args || '16', 10) || 16;
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    case 'randomEmail':
      return `user${Math.floor(Math.random() * 99999)}@example.com`;
    case 'randomBoolean':
      return String(Math.random() > 0.5);
    case 'randomColor':
      return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
    default:
      return `{{$${name}}}`;
  }
}

export function resolveDynamicVariables(template: string): string {
  return template.replace(DYNAMIC_VAR_REGEX, (_, name, args) => resolveDynamic(name, args));
}

export const DYNAMIC_VARIABLES = [
  { name: '$uuid', description: 'Random UUID v4', example: 'a1b2c3d4-...' },
  { name: '$timestamp', description: 'Unix timestamp (ms)', example: '1711234567890' },
  { name: '$isoTimestamp', description: 'ISO 8601 timestamp', example: '2026-03-24T12:00:00Z' },
  { name: '$randomInt', description: 'Random integer (0-1000)', example: '742' },
  { name: '$randomInt(1,100)', description: 'Random int in range', example: '57' },
  { name: '$randomFloat', description: 'Random float', example: '423.1892' },
  { name: '$randomString', description: 'Random 16-char string', example: 'a8f3k2m9p...' },
  { name: '$randomString(8)', description: 'Random N-char string', example: 'k3m9a8f2' },
  { name: '$randomEmail', description: 'Random email', example: 'user42@example.com' },
  { name: '$randomBoolean', description: 'true or false', example: 'true' },
  { name: '$randomColor', description: 'Random hex color', example: '#3a7bf2' },
];
