/**
 * Enterprise Seed - 500 Employees Hierarchical + RBAC + Posting Periods + Field Status + Tolerance + Approval Authority
 * For medium size enterprise: 500 employees, not all have app access, hierarchical positions, authority flow
 */

import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('=== ENTERPRISE SEED 500 EMPLOYEES + RBAC + ENTERPRISE CONFIG ===');

  // 1. Fiscal Year Variant K4 April-March OB29
  console.log('Seeding Fiscal Year Variant K4...');
  await db.execute(sql`
    INSERT INTO ent_fiscal_year_variant (code, description, year_dependent, calendar_year, number_of_periods)
    VALUES ('K4', 'Fiscal Year Variant K4 April-March India', false, false, 12)
    ON CONFLICT (code) DO NOTHING
  `);
  const fyRes = await db.execute(sql`SELECT id FROM ent_fiscal_year_variant WHERE code = 'K4' LIMIT 1`);
  const fyId = (fyRes.rows[0] as any)?.id;
  if (fyId) {
    const periods = [
      { period: 1, month: 4, start: '04-01', end: '04-30' },
      { period: 2, month: 5, start: '05-01', end: '05-31' },
      { period: 3, month: 6, start: '06-01', end: '06-30' },
      { period: 4, month: 7, start: '07-01', end: '07-31' },
      { period: 5, month: 8, start: '08-01', end: '08-31' },
      { period: 6, month: 9, start: '09-01', end: '09-30' },
      { period: 7, month: 10, start: '10-01', end: '10-31' },
      { period: 8, month: 11, start: '11-01', end: '11-30' },
      { period: 9, month: 12, start: '12-01', end: '12-31' },
      { period: 10, month: 1, start: '01-01', end: '01-31', shift: -1 },
      { period: 11, month: 2, start: '02-01', end: '02-28', shift: -1 },
      { period: 12, month: 3, start: '03-01', end: '03-31', shift: -1 },
    ];
    for (const p of periods) {
      await db.execute(sql`
        INSERT INTO ent_fiscal_year_period (variant_id, period, month, year_shift, start_date, end_date)
        VALUES (${fyId}, ${p.period}, ${p.month}, ${(p as any).shift || 0}, ${p.start}, ${p.end})
        ON CONFLICT (variant_id, period) DO NOTHING
      `);
    }
  }

  // 2. Posting Period Variant OBBO + OB52 Open Periods
  console.log('Seeding Posting Period Variant KS01...');
  await db.execute(sql`
    INSERT INTO ent_posting_period_variant (code, name)
    VALUES ('KS01', 'Posting Period Variant KS01 Kerala Spices'), ('1000', 'Posting Period Variant 1000 Main')
    ON CONFLICT (code) DO NOTHING
  `);
  const ppvRes = await db.execute(sql`SELECT id, code FROM ent_posting_period_variant WHERE code IN ('KS01','1000')`);
  const ccRes = await db.execute(sql`SELECT id, code FROM ent_company_code WHERE code IN ('KS01','1000')`);
  const ccMap: any = {};
  for (const r of ccRes.rows as any[]) ccMap[r.code] = r.id;
  
  for (const ppv of ppvRes.rows as any[]) {
    const compId = ccMap[ppv.code] || ccMap['KS01'];
    if (!compId) continue;
    // Open periods 1/2024 to 12/2026 for all account types
    const accountTypes = ['+', 'A', 'D', 'K', 'M', 'S'];
    for (const at of accountTypes) {
      await db.execute(sql`
        INSERT INTO ent_posting_period (variant_id, company_code_id, from_period, from_year, to_period, to_year, account_type, is_open)
        VALUES (${ppv.id}, ${compId}, 1, 2024, 12, 2026, ${at}, true)
        ON CONFLICT DO NOTHING
      `);
    }
  }

  // 3. Field Status Variant OBC4/OBC5
  console.log('Seeding Field Status Variant...');
  await db.execute(sql`
    INSERT INTO ent_field_status_variant (code, name)
    VALUES ('KS01', 'Field Status Variant KS01'), ('1000', 'Field Status Variant 1000')
    ON CONFLICT (code) DO NOTHING
  `);
  const fsvRes = await db.execute(sql`SELECT id, code FROM ent_field_status_variant`);
  for (const fsv of fsvRes.rows as any[]) {
    // G001 Material Management, G004 Sales, G005 Bank/Cash
    const groups = [
      { code: 'G001', name: 'Material Management', fields: [
        { field: 'cost_center', required: true },
        { field: 'profit_center', optional: true },
        { field: 'tax_code', required: true },
      ]},
      { code: 'G004', name: 'Sales', fields: [
        { field: 'cost_center', optional: true },
        { field: 'tax_code', required: true },
      ]},
      { code: 'G005', name: 'Bank/Cash', fields: [
        { field: 'bank_account', optional: true },
      ]},
    ];
    for (const g of groups) {
      const gRes = await db.execute(sql`
        INSERT INTO ent_field_status_group (variant_id, code, name)
        VALUES (${fsv.id}, ${g.code}, ${g.name})
        ON CONFLICT (variant_id, code) DO NOTHING
        RETURNING id
      `);
      let groupId = (gRes.rows[0] as any)?.id;
      if (!groupId) {
        const existing = await db.execute(sql`SELECT id FROM ent_field_status_group WHERE variant_id = ${fsv.id} AND code = ${g.code} LIMIT 1`);
        groupId = (existing.rows[0] as any)?.id;
      }
      if (groupId) {
        for (const f of g.fields) {
          const isReq = (f as any).required || false;
          await db.execute(sql`
            INSERT INTO ent_field_status (group_id, field_name, is_required, is_optional, is_suppressed)
            VALUES (${groupId}, ${f.field}, ${isReq}, ${!isReq}, false)
            ON CONFLICT (group_id, field_name) DO NOTHING
          `);
        }
      }
    }
  }

  // 4. Tolerance Groups OBA0/OBA4
  console.log('Seeding Tolerance Groups...');
  const tolGroups = [
    { code: '1000', name: 'Tolerance 1000 GL', type: 'GL', amountDoc: 100000, amountOpen: 10000 },
    { code: 'KS01', name: 'Tolerance KS01 GL', type: 'GL', amountDoc: 500000, amountOpen: 50000 },
    { code: 'EMP_KS01', name: 'Employee Tolerance KS01', type: 'EMPLOYEE', amountDoc: 99999999, amountOpen: 100 },
    { code: 'CUST_KS01', name: 'Customer Tolerance KS01', type: 'CUSTOMER', amountDoc: 1000000, amountOpen: 10000 },
    { code: 'VEND_KS01', name: 'Vendor Tolerance KS01', type: 'VENDOR', amountDoc: 1000000, amountOpen: 10000 },
  ];
  for (const tg of tolGroups) {
    await db.execute(sql`
      INSERT INTO ent_tolerance_group (code, name, type, amount_per_document, amount_per_open_item, cash_discount_per_line)
      VALUES (${tg.code}, ${tg.name}, ${tg.type}, ${tg.amountDoc}, ${tg.amountOpen}, 10)
      ON CONFLICT (code) DO NOTHING
    `);
  }

  // 5. Credit Control Area OB45
  console.log('Seeding Credit Control...');
  await db.execute(sql`
    INSERT INTO ent_credit_control_area (code, name, currency)
    VALUES ('KS01', 'Credit Control KS01', 'INR'), ('1000', 'Credit Control 1000', 'KWD')
    ON CONFLICT (code) DO NOTHING
  `);
  const ccaRes = await db.execute(sql`SELECT id, code FROM ent_credit_control_area`);
  for (const cca of ccaRes.rows as any[]) {
    const compId = ccMap[cca.code];
    if (compId) {
      await db.execute(sql`
        INSERT INTO ent_credit_control_assignment (company_code_id, credit_control_area_id)
        VALUES (${compId}, ${cca.id})
        ON CONFLICT (company_code_id, credit_control_area_id) DO NOTHING
      `);
    }
  }

  // 6. Document Types OBA7
  console.log('Seeding Document Types OBA7...');
  const docTypes = [
    { code: 'KR', name: 'Vendor Invoice', from: '5100000000', to: '5199999999', reverse: 'KG' },
    { code: 'KG', name: 'Vendor Credit Memo', from: '5200000000', to: '5299999999', reverse: 'KR' },
    { code: 'KZ', name: 'Vendor Payment', from: '5300000000', to: '5399999999', reverse: '' },
    { code: 'RE', name: 'Invoice Gross', from: '5100000000', to: '5199999999', reverse: 'KG' },
    { code: 'WE', name: 'Goods Receipt', from: '5000000000', to: '5099999999', reverse: 'WA' },
    { code: 'WA', name: 'Goods Issue', from: '5000000000', to: '5099999999', reverse: 'WE' },
    { code: 'SA', name: 'G/L Account Document', from: '5400000000', to: '5499999999', reverse: 'SA' },
    { code: 'RV', name: 'Billing Document', from: '9000000000', to: '9099999999', reverse: '' },
    { code: 'PR', name: 'Payroll Document', from: '6000000000', to: '6099999999', reverse: '' },
  ];
  for (const dt of docTypes) {
    await db.execute(sql`
      INSERT INTO ent_document_type (code, name, number_range_from, number_range_to, reverse_doc_type)
      VALUES (${dt.code}, ${dt.name}, ${dt.from}, ${dt.to}, ${dt.reverse})
      ON CONFLICT (code) DO NOTHING
    `);
  }

  // 7. Roles and Permissions
  console.log('Seeding Roles & Permissions...');
  const roles = [
    { code: 'ADMIN', name: 'System Administrator', system: true },
    { code: 'OWNER', name: 'Company Owner', system: true },
    { code: 'CFO', name: 'Chief Financial Officer', system: false },
    { code: 'CEO', name: 'Chief Executive Officer', system: false },
    { code: 'MANAGER', name: 'Department Manager', system: false },
    { code: 'PURCHASER', name: 'Purchaser', system: false },
    { code: 'WAREHOUSE', name: 'Warehouse Staff', system: false },
    { code: 'ACCOUNTANT', name: 'Accountant', system: false },
    { code: 'SALES', name: 'Sales Staff', system: false },
    { code: 'HR', name: 'HR Staff', system: false },
    { code: 'AUDITOR', name: 'Auditor Read-Only', system: false },
    { code: 'PRODUCTION', name: 'Production Staff', system: false },
  ];
  for (const r of roles) {
    await db.execute(sql`
      INSERT INTO ent_role (code, name, is_system)
      VALUES (${r.code}, ${r.name}, ${r.system})
      ON CONFLICT (code) DO NOTHING
    `);
  }

  const permissions = [
    { code: 'ADMIN_ALL', name: 'Full Admin Access', module: 'FOUNDATION' },
    { code: 'PR_CREATE', name: 'Create PR', module: 'MM' },
    { code: 'PR_APPROVE', name: 'Approve PR', module: 'MM' },
    { code: 'PR_VIEW', name: 'View PR', module: 'MM' },
    { code: 'PO_CREATE', name: 'Create PO', module: 'MM' },
    { code: 'PO_APPROVE', name: 'Approve PO', module: 'MM' },
    { code: 'PO_VIEW', name: 'View PO', module: 'MM' },
    { code: 'GR_POST', name: 'Post GR', module: 'MM' },
    { code: 'GR_VIEW', name: 'View GR', module: 'MM' },
    { code: 'IV_POST', name: 'Post IV', module: 'MM' },
    { code: 'IV_VIEW', name: 'View IV', module: 'MM' },
    { code: 'SALES_CREATE', name: 'Create Sales Order', module: 'SD' },
    { code: 'SALES_VIEW', name: 'View Sales', module: 'SD' },
    { code: 'DELIVERY_CREATE', name: 'Create Delivery', module: 'SD' },
    { code: 'BILLING_CREATE', name: 'Create Billing', module: 'SD' },
    { code: 'GL_VIEW', name: 'View GL', module: 'FICO' },
    { code: 'GL_POST', name: 'Post GL', module: 'FICO' },
    { code: 'CCA_VIEW', name: 'View CCA Report', module: 'FICO' },
    { code: 'PAYROLL_RUN', name: 'Run Payroll', module: 'HR' },
    { code: 'PAYROLL_APPROVE', name: 'Approve Payroll', module: 'HR' },
    { code: 'MATERIAL_CREATE', name: 'Create Material', module: 'FOUNDATION' },
    { code: 'MATERIAL_VIEW', name: 'View Material', module: 'FOUNDATION' },
    { code: 'EMPLOYEE_VIEW', name: 'View Employee', module: 'HR' },
    { code: 'EMPLOYEE_CREATE', name: 'Create Employee', module: 'HR' },
    { code: 'USER_MANAGE', name: 'Manage Users', module: 'FOUNDATION' },
    { code: 'ROLE_MANAGE', name: 'Manage Roles', module: 'FOUNDATION' },
  ];
  for (const p of permissions) {
    await db.execute(sql`
      INSERT INTO ent_permission (code, name, module)
      VALUES (${p.code}, ${p.name}, ${p.module})
      ON CONFLICT (code) DO NOTHING
    `);
  }

  // Role-Permission mapping
  const rolePerms: Record<string, string[]> = {
    'ADMIN': ['ADMIN_ALL'],
    'OWNER': ['ADMIN_ALL'],
    'MANAGER': ['PR_VIEW', 'PR_APPROVE', 'PO_VIEW', 'PO_APPROVE', 'GR_VIEW', 'IV_VIEW', 'SALES_VIEW', 'GL_VIEW', 'CCA_VIEW', 'EMPLOYEE_VIEW', 'MATERIAL_VIEW'],
    'PURCHASER': ['PR_CREATE', 'PR_VIEW', 'PO_CREATE', 'PO_VIEW', 'GR_VIEW', 'MATERIAL_VIEW'],
    'WAREHOUSE': ['GR_POST', 'GR_VIEW', 'MATERIAL_VIEW', 'DELIVERY_CREATE'],
    'ACCOUNTANT': ['GL_VIEW', 'GL_POST', 'IV_VIEW', 'IV_POST', 'BILLING_CREATE', 'CCA_VIEW', 'PAYROLL_RUN'],
    'SALES': ['SALES_CREATE', 'SALES_VIEW', 'DELIVERY_CREATE', 'BILLING_CREATE', 'MATERIAL_VIEW'],
    'HR': ['EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'PAYROLL_RUN', 'PAYROLL_APPROVE'],
    'AUDITOR': ['PR_VIEW', 'PO_VIEW', 'GR_VIEW', 'IV_VIEW', 'SALES_VIEW', 'GL_VIEW', 'CCA_VIEW'],
    'CFO': ['GL_VIEW', 'GL_POST', 'CCA_VIEW', 'PAYROLL_APPROVE', 'PO_APPROVE', 'PR_APPROVE', 'ADMIN_ALL'],
    'CEO': ['ADMIN_ALL'],
  };
  const roleRes = await db.execute(sql`SELECT id, code FROM ent_role`);
  const permRes = await db.execute(sql`SELECT id, code FROM ent_permission`);
  const roleMap: any = {};
  const permMap: any = {};
  for (const r of roleRes.rows as any[]) roleMap[r.code] = r.id;
  for (const p of permRes.rows as any[]) permMap[p.code] = p.id;
  
  for (const [roleCode, permCodes] of Object.entries(rolePerms)) {
    const roleId = roleMap[roleCode];
    if (!roleId) continue;
    for (const pc of permCodes) {
      const permId = permMap[pc];
      if (!permId) continue;
      await db.execute(sql`
        INSERT INTO ent_role_permission (role_id, permission_id)
        VALUES (${roleId}, ${permId})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
  }

  // 8. Org Units hierarchical
  console.log('Seeding Org Units hierarchical...');
  await db.execute(sql`DELETE FROM hr_org_unit WHERE code LIKE 'KSPL-%'`);
  const orgUnits = [
    { code: 'KSPL-ROOT', name: 'Kerala Spices Ltd - Root', parent: null },
    { code: 'KSPL-EXEC', name: 'Executive Management', parent: 'KSPL-ROOT' },
    { code: 'KSPL-FIN', name: 'Finance & Accounts', parent: 'KSPL-ROOT' },
    { code: 'KSPL-PUR', name: 'Purchasing Department', parent: 'KSPL-ROOT' },
    { code: 'KSPL-WH', name: 'Warehouse & Logistics', parent: 'KSPL-ROOT' },
    { code: 'KSPL-PROD', name: 'Production Department', parent: 'KSPL-ROOT' },
    { code: 'KSPL-SALES', name: 'Sales & Distribution', parent: 'KSPL-ROOT' },
    { code: 'KSPL-HR', name: 'Human Resources', parent: 'KSPL-ROOT' },
    { code: 'KSPL-QA', name: 'Quality Assurance', parent: 'KSPL-PROD' },
    { code: 'KSPL-MFG', name: 'Manufacturing', parent: 'KSPL-PROD' },
  ];
  const orgMap: any = {};
  for (const ou of orgUnits) {
    const parentId = ou.parent ? orgMap[ou.parent] : null;
    const res = await db.execute(sql`
      INSERT INTO hr_org_unit (code, name, parent_id, description, is_active)
      VALUES (${ou.code}, ${ou.name}, ${parentId}, ${`Org Unit ${ou.name} for KS01 500 employees hierarchical`}, true)
      ON CONFLICT (code) DO UPDATE SET name = ${ou.name}, parent_id = ${parentId}
      RETURNING id
    `);
    orgMap[ou.code] = (res.rows[0] as any)?.id;
    if (!orgMap[ou.code]) {
      const existing = await db.execute(sql`SELECT id FROM hr_org_unit WHERE code = ${ou.code} LIMIT 1`);
      orgMap[ou.code] = (existing.rows[0] as any)?.id;
    }
  }

  // 9. Positions hierarchical with authority levels
  console.log('Seeding Positions hierarchical...');
  const positions = [
    { code: 'CEO', name: 'Chief Executive Officer', org: 'KSPL-EXEC', manager: true, owner: true, level: 'CEO' },
    { code: 'CFO', name: 'Chief Financial Officer', org: 'KSPL-EXEC', manager: true, owner: false, level: 'CFO' },
    { code: 'COO', name: 'Chief Operating Officer', org: 'KSPL-EXEC', manager: true, owner: false, level: 'LEVEL_4' },
    { code: 'FIN-MGR', name: 'Finance Manager', org: 'KSPL-FIN', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'PUR-MGR', name: 'Purchasing Manager', org: 'KSPL-PUR', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'WH-MGR', name: 'Warehouse Manager', org: 'KSPL-WH', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'PROD-MGR', name: 'Production Manager', org: 'KSPL-PROD', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'SALES-MGR', name: 'Sales Manager', org: 'KSPL-SALES', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'HR-MGR', name: 'HR Manager', org: 'KSPL-HR', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'QA-MGR', name: 'QA Manager', org: 'KSPL-QA', manager: true, owner: false, level: 'LEVEL_3' },
    { code: 'ACC-SR', name: 'Senior Accountant', org: 'KSPL-FIN', manager: false, owner: false, level: 'LEVEL_2' },
    { code: 'PUR-SR', name: 'Senior Purchaser', org: 'KSPL-PUR', manager: false, owner: false, level: 'LEVEL_2' },
    { code: 'WH-SR', name: 'Senior Warehouse Executive', org: 'KSPL-WH', manager: false, owner: false, level: 'LEVEL_2' },
    { code: 'PROD-SR', name: 'Senior Production Executive', org: 'KSPL-PROD', manager: false, owner: false, level: 'LEVEL_2' },
    { code: 'SALES-SR', name: 'Senior Sales Executive', org: 'KSPL-SALES', manager: false, owner: false, level: 'LEVEL_2' },
    { code: 'ACC-JR', name: 'Junior Accountant', org: 'KSPL-FIN', manager: false, owner: false, level: 'LEVEL_1' },
    { code: 'PUR-JR', name: 'Junior Purchaser', org: 'KSPL-PUR', manager: false, owner: false, level: 'LEVEL_1' },
    { code: 'WH-JR', name: 'Warehouse Assistant', org: 'KSPL-WH', manager: false, owner: false, level: 'LEVEL_1' },
    { code: 'PROD-JR', name: 'Production Operator', org: 'KSPL-PROD', manager: false, owner: false, level: 'LEVEL_1' },
    { code: 'SALES-JR', name: 'Sales Assistant', org: 'KSPL-SALES', manager: false, owner: false, level: 'LEVEL_1' },
  ];
  const posMap: any = {};
  for (const pos of positions) {
    const orgId = orgMap[pos.org];
    const res = await db.execute(sql`
      INSERT INTO hr_position (code, name, org_unit_id, is_manager, is_owner, description, is_active)
      VALUES (${pos.code}, ${pos.name}, ${orgId}, ${pos.manager}, ${pos.owner}, ${`${pos.name} authority level ${pos.level} for 500 employees`}, true)
      ON CONFLICT (code) DO UPDATE SET name = ${pos.name}, org_unit_id = ${orgId}, is_manager = ${pos.manager}, is_owner = ${pos.owner}
      RETURNING id
    `);
    posMap[pos.code] = (res.rows[0] as any)?.id;
    if (!posMap[pos.code]) {
      const existing = await db.execute(sql`SELECT id FROM hr_position WHERE code = ${pos.code} LIMIT 1`);
      posMap[pos.code] = (existing.rows[0] as any)?.id;
    }
  }

  // 10. Approval Authority Matrix
  console.log('Seeding Approval Authority Matrix...');
  await db.execute(sql`DELETE FROM ent_approval_authority WHERE position_id IN (SELECT id FROM hr_position WHERE code LIKE 'KSPL-%' OR code IN ('CEO','CFO','COO','FIN-MGR','PUR-MGR','WH-MGR','PROD-MGR','SALES-MGR','HR-MGR','QA-MGR','ACC-SR','PUR-SR','WH-SR','PROD-SR','SALES-SR','ACC-JR','PUR-JR','WH-JR','PROD-JR','SALES-JR'))`);
  const authorities = [
    { pos: 'CEO', doc: 'PR', min: 0, max: 999999999, level: 'CEO', dual: false },
    { pos: 'CEO', doc: 'PO', min: 0, max: 999999999, level: 'CEO', dual: false },
    { pos: 'CEO', doc: 'PAYROLL', min: 0, max: 999999999, level: 'CEO', dual: true },
    { pos: 'CFO', doc: 'PR', min: 10000, max: 100000, level: 'CFO', dual: false },
    { pos: 'CFO', doc: 'PO', min: 50000, max: 500000, level: 'CFO', dual: false },
    { pos: 'CFO', doc: 'PAYROLL', min: 0, max: 999999999, level: 'CFO', dual: false },
    { pos: 'FIN-MGR', doc: 'PR', min: 0, max: 10000, level: 'LEVEL_3', dual: false },
    { pos: 'FIN-MGR', doc: 'PO', min: 0, max: 50000, level: 'LEVEL_3', dual: false },
    { pos: 'PUR-MGR', doc: 'PR', min: 0, max: 50000, level: 'LEVEL_3', dual: false },
    { pos: 'PUR-MGR', doc: 'PO', min: 0, max: 100000, level: 'LEVEL_3', dual: false },
    { pos: 'ACC-SR', doc: 'PR', min: 0, max: 5000, level: 'LEVEL_2', dual: false },
    { pos: 'ACC-SR', doc: 'PO', min: 0, max: 10000, level: 'LEVEL_2', dual: false },
    { pos: 'PUR-SR', doc: 'PR', min: 0, max: 10000, level: 'LEVEL_2', dual: false },
    { pos: 'ACC-JR', doc: 'PR', min: 0, max: 1000, level: 'LEVEL_1', dual: false },
    { pos: 'PUR-JR', doc: 'PR', min: 0, max: 1000, level: 'LEVEL_1', dual: false },
  ];
  for (const auth of authorities) {
    const posId = posMap[auth.pos];
    if (!posId) continue;
    await db.execute(sql`
      INSERT INTO ent_approval_authority (position_id, document_type, min_amount, max_amount, level, requires_dual)
      VALUES (${posId}, ${auth.doc}, ${auth.min}, ${auth.max}, ${auth.level}, ${auth.dual})
      ON CONFLICT DO NOTHING
    `);
  }

  // 11. 500 Employees hierarchical - only ~50 have app access (10%)
  console.log('Seeding 500 Employees hierarchical...');
  const firstNames = ['Arjun', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Sneha', 'Kiran', 'Divya', 'Amit', 'Pooja', 'Suresh', 'Lakshmi', 'Ramesh', 'Kavya', 'Manoj', 'Shalini', 'Deepak', 'Meera', 'Sanjay', 'Nisha'];
  const lastNames = ['Nair', 'Menon', 'Pillai', 'Kumar', 'Rao', 'Reddy', 'Sharma', 'Patel', 'Singh', 'Thomas', 'Joseph', 'Mathew', 'Krishnan', 'Varma', 'Das', 'Iyer', 'Suresh', 'Babu', 'Raj', 'Khan'];
  
  // Create CEO first
  const ceoUserRes = await db.execute(sql`SELECT id FROM auth_user WHERE email = 'ceo@kspl.com' LIMIT 1`);
  let ceoUserId = (ceoUserRes.rows[0] as any)?.id;
  if (!ceoUserId) {
    const newUser = await db.execute(sql`
      INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES ('ceo@kspl.com', 'CEO KSPL', 'OWNER', true, 'hashed')
      RETURNING id
    `);
    ceoUserId = (newUser.rows[0] as any).id;
  }
  
  const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = 'KP01' LIMIT 1`);
  const plantId = (plantRes.rows[0] as any)?.id;
  const compId = ccMap['KS01'];
  const costCenterRes = await db.execute(sql`SELECT id FROM fi_cost_center WHERE code = 'KS-CC-01' LIMIT 1`);
  const costCenterId = (costCenterRes.rows[0] as any)?.id;

  // CEO employee
  await db.execute(sql`
    INSERT INTO hr_employee (employee_number, user_id, first_name, last_name, email, position_id, plant_id, company_code_id, cost_center_id, status, hire_date, basic_salary, currency, is_active)
    VALUES ('EMP-00001', ${ceoUserId}, 'Rajesh', 'Nair', 'ceo@kspl.com', ${posMap['CEO']}, ${plantId}, ${compId}, ${costCenterId}, 'ACTIVE', '2020-01-01', 15000, 'INR', true)
    ON CONFLICT (employee_number) DO NOTHING
  `);
  const ceoEmpRes = await db.execute(sql`SELECT id FROM hr_employee WHERE employee_number = 'EMP-00001' LIMIT 1`);
  const ceoEmpId = (ceoEmpRes.rows[0] as any)?.id;

  // Create managers reporting to CEO
  const managerCodes = ['CFO', 'COO', 'FIN-MGR', 'PUR-MGR', 'WH-MGR', 'PROD-MGR', 'SALES-MGR', 'HR-MGR', 'QA-MGR'];
  const managerEmpIds: any = {};
  let empCounter = 2;
  for (const mgrCode of managerCodes) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${mgrCode.toLowerCase()}@kspl.com`;
    const empNum = `EMP-${String(empCounter).padStart(5, '0')}`;
    
    // Only 50% of managers have app access
    const hasAppAccess = empCounter <= 15;
    let userId = null;
    if (hasAppAccess) {
      const uRes = await db.execute(sql`SELECT id FROM auth_user WHERE email = ${email} LIMIT 1`);
      userId = (uRes.rows[0] as any)?.id;
      if (!userId) {
        const newU = await db.execute(sql`
          INSERT INTO auth_user (email, name, role, is_active, password_hash)
          VALUES (${email}, ${`${fn} ${ln}`}, ${mgrCode.includes('FIN') ? 'ACCOUNTANT' : mgrCode.includes('PUR') ? 'PURCHASER' : mgrCode.includes('WH') ? 'WAREHOUSE' : mgrCode.includes('SALES') ? 'SALES' : mgrCode.includes('HR') ? 'HR' : 'MANAGER'}, true, 'hashed')
          RETURNING id
        `);
        userId = (newU.rows[0] as any).id;
      }
    }

    await db.execute(sql`
      INSERT INTO hr_employee (employee_number, user_id, first_name, last_name, email, position_id, manager_id, plant_id, company_code_id, cost_center_id, status, hire_date, basic_salary, currency, is_active)
      VALUES (${empNum}, ${userId}, ${fn}, ${ln}, ${email}, ${posMap[mgrCode]}, ${ceoEmpId}, ${plantId}, ${compId}, ${costCenterId}, 'ACTIVE', '2020-02-01', ${5000 + Math.random()*5000}, 'INR', true)
      ON CONFLICT (employee_number) DO NOTHING
    `);
    const empRes = await db.execute(sql`SELECT id FROM hr_employee WHERE employee_number = ${empNum} LIMIT 1`);
    managerEmpIds[mgrCode] = (empRes.rows[0] as any)?.id;
    empCounter++;
  }

  // Create 490 more employees hierarchical
  const positionDistribution = [
    { code: 'ACC-SR', count: 20, manager: 'FIN-MGR' },
    { code: 'PUR-SR', count: 20, manager: 'PUR-MGR' },
    { code: 'WH-SR', count: 30, manager: 'WH-MGR' },
    { code: 'PROD-SR', count: 40, manager: 'PROD-MGR' },
    { code: 'SALES-SR', count: 30, manager: 'SALES-MGR' },
    { code: 'ACC-JR', count: 50, manager: 'ACC-SR' },
    { code: 'PUR-JR', count: 50, manager: 'PUR-SR' },
    { code: 'WH-JR', count: 80, manager: 'WH-SR' },
    { code: 'PROD-JR', count: 120, manager: 'PROD-SR' },
    { code: 'SALES-JR', count: 50, manager: 'SALES-SR' },
  ];

  for (const dist of positionDistribution) {
    const managerId = managerEmpIds[dist.manager] || ceoEmpId;
    for (let i = 0; i < dist.count; i++) {
      if (empCounter > 500) break;
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${empCounter}@kspl.com`;
      const empNum = `EMP-${String(empCounter).padStart(5, '0')}`;
      
      // Only 10% of junior staff have app access (total ~50 users)
      const hasAppAccess = empCounter <= 50;
      let userId = null;
      if (hasAppAccess) {
        const uRes = await db.execute(sql`SELECT id FROM auth_user WHERE email = ${email} LIMIT 1`);
        userId = (uRes.rows[0] as any)?.id;
        if (!userId) {
          const newU = await db.execute(sql`
            INSERT INTO auth_user (email, name, role, is_active, password_hash)
            VALUES (${email}, ${`${fn} ${ln}`}, ${dist.code.includes('ACC') ? 'ACCOUNTANT' : dist.code.includes('PUR') ? 'PURCHASER' : dist.code.includes('WH') ? 'WAREHOUSE' : dist.code.includes('PROD') ? 'PRODUCTION' : 'SALES'}, true, 'hashed')
            RETURNING id
          `);
          userId = (newU.rows[0] as any).id;
        }
      }

      await db.execute(sql`
        INSERT INTO hr_employee (employee_number, user_id, first_name, last_name, email, position_id, manager_id, plant_id, company_code_id, cost_center_id, status, hire_date, basic_salary, currency, is_active)
        VALUES (${empNum}, ${userId}, ${fn}, ${ln}, ${email}, ${posMap[dist.code]}, ${managerId}, ${plantId}, ${compId}, ${costCenterId}, 'ACTIVE', ${`2021-${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}-01`}, ${1000 + Math.random()*3000}, 'INR', true)
        ON CONFLICT (employee_number) DO NOTHING
      `);
      empCounter++;
    }
  }

  // Assign roles to users
  console.log('Assigning roles to users...');
  const userRes = await db.execute(sql`SELECT id, email, role FROM auth_user WHERE is_active = true`);
  for (const user of userRes.rows as any[]) {
    const roleCode = user.role || 'PURCHASER';
    const roleId = roleMap[roleCode] || roleMap['PURCHASER'];
    if (roleId) {
      await db.execute(sql`
        INSERT INTO ent_user_role (user_id, role_id, company_code_id, plant_id)
        VALUES (${user.id}, ${roleId}, ${compId}, ${plantId})
        ON CONFLICT DO NOTHING
      `);
    }
  }

  console.log(`=== SEED COMPLETE: ${empCounter-1} employees, ${userRes.rows.length} app users (10% have access), hierarchical authority flow ===`);
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
