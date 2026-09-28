/**
 * API Code Enforcement Helper
 * From this point any function you add to the app, if it has corresponding ERP Code it should be available in app too
 * Usage: Every API route should return code and functionDescription in GET, and be listed in FUNCTION_MAP
 */

import { FUNCTION_MAP } from './functions';

export function withCodeMeta(code: string, data: any) {
  const meta = FUNCTION_MAP[code as keyof typeof FUNCTION_MAP];
  return {
    code,
    functionDescription: meta?.desc || code,
    functionModule: meta?.module || 'UNKNOWN',
    ...data,
  };
}

export function requireCode(code: string) {
  if (!FUNCTION_MAP[code as keyof typeof FUNCTION_MAP]) {
    throw new Error(`FUNCTION_CODE ${code} not found in FUNCTION_MAP – Add it per rule: From this point any function you add to the app, if it has corresponding ERP Code it should be available in app too. Add to src/shared/kernel/functions.ts and src/shared/lib/functions.ts`);
  }
  return FUNCTION_MAP[code as keyof typeof FUNCTION_MAP];
}
