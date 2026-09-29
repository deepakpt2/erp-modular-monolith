import { NextResponse } from 'next/server';
import { FUNCTION_MAP } from '@/shared/kernel/functions';
import { FUNCTIONS } from '@/shared/lib/functions';

/**
 * Functions API – New Intuitive Helper Code System
 * Primary codes: FND-*, PUR-*, INV-*, MFG-*, SAL-*, FIN-*, CST-*, HRM-*, AUD-* – own IP
 * Old codes (OX02, MM01, ME21N etc) kept as aliases in searchable keywords
 * Function is destination, helper code is just identifier
 */

export async function GET() {
  const allCodesKernel = Object.entries(FUNCTION_MAP).map(([code, info]) => {
    return {
      code, // new intuitive primary helper code
      helperCode: code,
      aliases: (info as any).aliases || [],
      functionName: (info as any).desc,
      desc: (info as any).desc,
      module: (info as any).module,
      api: (info as any).api,
      configurable: (info as any).configurable || false,
      implemented: true,
      availableInApp: true,
      source: 'kernel/FUNCTION_MAP',
      note: 'Function is destination, new intuitive code is primary helper, old SAP-like codes kept as alias',
      isNewSystem: true,
    };
  });

  const allCodesUI = FUNCTIONS.map(tc => ({
    code: tc.code, // new intuitive primary
    helperCode: tc.code,
    aliases: tc.aliases || [],
    functionName: tc.description,
    desc: tc.description,
    module: tc.module,
    subModule: tc.subModule,
    type: tc.type,
    api: 'UI route ' + tc.route,
    route: tc.route,
    keywords: tc.keywords,
    implemented: true,
    availableInApp: true,
    source: 'lib/FUNCTIONS',
    note: 'Function is destination, new code primary, old codes alias',
    isNewSystem: true,
  }));

  // Merge unique by code – kernel takes precedence, but also merge aliases
  const mergedMap = new Map<string, any>();
  allCodesUI.forEach(t => mergedMap.set(t.code, t));
  allCodesKernel.forEach(t => {
    const existing = mergedMap.get(t.code);
    if (existing) {
      mergedMap.set(t.code, { ...existing, ...t, aliases: [...new Set([...(existing.aliases || []), ...(t.aliases || [])])] });
    } else {
      mergedMap.set(t.code, t);
    }
  });

  const merged = Array.from(mergedMap.values()).sort((a, b) => a.code.localeCompare(b.code));

  // Also collect all aliases for search validation
  const allAliases = merged.flatMap(m => m.aliases || []);
  const uniqueAliases = [...new Set(allAliases)].sort();

  return NextResponse.json({
    functions: merged,
    count: merged.length,
    kernelCount: allCodesKernel.length,
    uiCount: allCodesUI.length,
    aliasesCount: uniqueAliases.length,
    aliases: uniqueAliases,
    newSystem: {
      format: 'MODULE-OBJECT-ACTION',
      modules: {
        FND: 'Foundation (Enterprise, Material, Partner, UoM, etc)',
        PUR: 'Procurement (PR, PO, IV)',
        INV: 'Inventory (GR, Stock, Physical Inventory)',
        MFG: 'Manufacturing (BOM, Work Center, Routing, MRP)',
        SAL: 'Sales & Distribution (Sales Order, Delivery, Billing)',
        FIN: 'Financials (Chart, GL, Tax, Currency)',
        CST: 'Costing & Controlling (Cost Unit, Profit Unit, Costing Run)',
        HRM: 'Human Resources (Employee, Payroll)',
        AUD: 'Audit & Workflow',
      },
      actions: {
        CR: 'Create',
        CH: 'Change',
        DP: 'Display',
        LS: 'List / Report',
        PS: 'Post / Process',
        RL: 'Release / Approve',
        AS: 'Assign',
      },
      example: 'FND-LE-CR = Foundation Legal Entity Create (alias OX02), PUR-PO-CR = Procurement Purchase Order Create (alias ME21N)',
      autoGeneration: 'When new function implemented, generate code as MODULE-OBJECT-ACTION, add old SAP-like code (if any) as alias for backward search compatibility',
    },
    rule: 'Function is destination, new intuitive helper code (e.g., FND-LE-CR, PUR-PO-CR) is primary identifier – old codes (OX02, ME21N, MM01 etc) kept as searchable aliases, not primary',
    enforcement: {
      guideline: 'Every new API route must have new intuitive helper code as primary and be added to FUNCTION_MAP and FUNCTIONS with aliases for old codes if applicable',
      uiRequirement: 'Every new page must use ModernModuleShell with code prop = new intuitive code (FND-*, PUR-*, etc) – old alias shown as secondary muted badge',
      apiRequirement: 'Every new API must return code (new intuitive) + aliases (old codes) + functionName',
      check: 'GET /api/functions lists all implemented functions with new codes and aliases',
      newFunctionChecklist: [
        '1. Generate new intuitive code: MODULE-OBJECT-ACTION, e.g., FND-WH-CR for Warehouse Site Create',
        '2. Add to src/shared/kernel/functions.ts FUNCTION_MAP with new code as key, desc = function name, aliases = [old SAP code if any]',
        '3. Add to src/shared/lib/functions.ts FUNCTIONS array with code = new intuitive, aliases = [old codes]',
        '4. API response must include { code: newCode, aliases: oldCodes, functionName }',
        '5. UI page must use ModernModuleShell with code = new intuitive primary',
        '6. Search for old alias (e.g., OX02) should still find new function via alias',
      ],
    },
    note: 'Old helper codes like OX02, MM01, ME21N, MIGO etc are now aliases, not primary – new system FND-LE-CR, FND-MAT-CR, PUR-PO-CR, INV-GR-PS etc is primary own IP, intuitive, legal-safe',
  });
}
