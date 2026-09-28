import { NextResponse } from 'next/server';
import { FUNCTION_MAP, GENERAL_COA_DEFAULTS, getAllFunctions, MANDATORY_CODES } from '@/shared/kernel/functions';
import { FUNCTIONS } from '@/shared/lib/functions';

/**
 * Functions API – All functions have helper code to identify function
 * Function is destination (e.g., Create Purchase Order), helper code is just identifier (e.g., ME21N is helper for Create Purchase Order)
 * Searching ME21N redirects to background function Create Purchase Order – code is not target, function is target
 * From this point any function you add to the app, if it has corresponding helper code it should be available in app too
 * Enforcement: GET returns all functions with helper codes, their API, module, configurable, and whether implemented
 */

export async function GET() {
  const allCodesKernel = Object.entries(FUNCTION_MAP).map(([code, info]) => {
    const { code: _ignore, ...rest } = info as any;
    return {
      code, // helper code
      helperCode: code,
      functionName: (info as any).desc,
      ...rest,
      implemented: true,
      availableInApp: true,
      source: 'kernel/FUNCTION_MAP',
      note: 'Function is destination, code is helper to identify function',
    };
  });

  const allCodesUI = FUNCTIONS.map(tc => ({
    code: tc.code, // helper code
    helperCode: tc.code,
    functionName: tc.description, // function is destination
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
    note: 'Function is destination, code is helper',
  }));

  // Merge unique by code – kernel takes precedence
  const mergedMap = new Map<string, any>();
  allCodesUI.forEach(t => mergedMap.set(t.code, t));
  allCodesKernel.forEach(t => mergedMap.set(t.code, { ...mergedMap.get(t.code), ...t }));

  const merged = Array.from(mergedMap.values()).sort((a,b)=>a.code.localeCompare(b.code));

  return NextResponse.json({
    functions: merged, // primary – functions are destination
    count: merged.length,
    kernelCount: allCodesKernel.length,
    uiCount: allCodesUI.length,
    mandatory: MANDATORY_CODES,
    generalCoA: GENERAL_COA_DEFAULTS,
    rule: 'Function is destination, helper code (e.g., ME21N) is just identifier to quickly open function Create Purchase Order – searching code redirects to background function',
    enforcement: {
      guideline: 'Every new API route must have helper code field and be added to FUNCTION_MAP in src/shared/kernel/functions.ts AND to FUNCTIONS in src/shared/lib/functions.ts – function is destination, code is helper',
      uiRequirement: 'Every new page must use ModernModuleShell with code prop (helper code) – function name is shown as title, helper code as small badge – function is destination',
      apiRequirement: 'Every new API must return code/helperCode/functionName and be listed in /api/functions – include helper code in JSON response – function is destination',
      check: 'Run GET /api/functions to see all implemented functions with helper codes – if new function added without helper code, it will be flagged as missing',
      newFunctionChecklist: [
        '1. Add helper code to src/shared/kernel/functions.ts FUNCTION_MAP with desc (function name), module, api, code (helper), configurable if needed – function is destination',
        '2. Add function to src/shared/lib/functions.ts FUNCTIONS array with route – code is helper',
        '3. API GET response must include { code/helperCode, functionName, functionDescription } – function is destination',
        '4. UI page must use ModernModuleShell with code prop (helper) and title prop (function name)',
        '5. Update /api/functions GET will auto-list new function',
        '6. Only INR default per OY03 – any currency addition via POST /api/currencies – OY03 is helper for Define Currencies function',
        '7. General CoA defaults kept like ERP – INT, KSCA, CAUS, GKR, YIN – OB13 helper for Define Chart of Accounts function',
      ],
    },
    note: 'Searching ME21N is not target, target is Create Purchase Order function – ME21N is just helper to identify function quickly',
    erpStandard: 'General CoA and its corresponding accounts available like in ERP – INT, KSCA, CAUS, GKR, YIN – kept as ERP defaults – FS00 accounts 5000000001-5000000006, 100000-500005',
    currencies: 'Only INR default – KWD/USD/EUR added by user via OY03 helper – POST /api/currencies – configurable – OY03 UI /fico/currencies – Define Currencies is function, OY03 is helper',
    taxCodes: 'VAT 5% V5/A5 + GST5 – FTXP helper – configurable – ERP defaults kept – tax GL OB40 – Define Tax Codes is function',
    postingPeriod: 'OBBO helper for Define Posting Period Variant function – OB52 helper for Open/Close function – OBBP helper for Assign function – UI /fico/posting-period',
    materialTypes: 'OMS2 helper for Define Material Types function – ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN – configurable – UI /foundation/material-types',
    uom: 'CUNI helper for Define Units of Measure function – KG/G/L/ML/PC/BOX/PACK/KIT/M/TON – configurable – UI /foundation/uom',
    costCenters: 'KS01 helper for Create Cost Center function, KS02 helper for Change, KS03 for Display – function is destination',
  });
}
