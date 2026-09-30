import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * HR Employee API – Legal-safe own IP – Module 9 HR Foundation
 * New: hr_employee_master (was hr_employee) – employeeNumber EMP-10000001, userId, firstName lastName, email phone, positionId, managerId, facilityId FAC-1000 was plant_id, legalEntityId LE-1000 was company_code_id, costUnitId ECUC was cost_center_id, status ACTIVE/ON_LEAVE/TERMINATED/PROBATION, hireDate terminationDate, basicSalary, currencyCode INR was KWD, isActive
 * Helper code: HEMC HR Employee Master Create (alias EMC, PA30, FIN-HR-CR) – 4-char MOOA H=HR EM=Employee M=Master? Actually HEMC = HR Employee Master Create – module grouped intuitive, same length as PA30 but own IP
 * Fallback to legacy hr_employee
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');

  try {
    let rows: any[] = [];
    let table = 'hr_employee_master';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT e.id, e.employee_number, e.first_name, e.last_name, e.email, e.phone, e.status, e.hire_date, e.termination_date, e.basic_salary, e.currency_code as currency, e.is_active,
               p.code as position_code, p.name as position_name,
               ou.code as org_unit_code, ou.name as org_unit_name,
               f.code as facility_code, f.name as facility_name,
               le.code as legal_entity_code, le.name as legal_entity_name,
               cu.code as cost_unit_code, cu.name as cost_unit_name,
               m.employee_number as manager_number, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM hr_employee_master e
        LEFT JOIN hr_position_new p ON e.position_id = p.id
        LEFT JOIN hr_organization_unit ou ON p.organization_unit_id = ou.id
        LEFT JOIN org_facility f ON e.facility_id = f.id
        LEFT JOIN org_legal_entity le ON e.legal_entity_id = le.id
        LEFT JOIN org_cost_unit cu ON e.cost_unit_id = cu.id
        LEFT JOIN hr_employee_master m ON e.manager_id = m.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (e.employee_number ILIKE ${`%${search}%`} OR e.first_name ILIKE ${`%${search}%`} OR e.last_name ILIKE ${`%${search}%`} OR e.email ILIKE ${`%${search}%`})`;
      if (status) query = sql`${query} AND e.status = ${status}::hr_employment_status_new`;
      if (facilityId) query = sql`${query} AND e.facility_id = ${facilityId}`;
      query = sql`${query} ORDER BY e.employee_number LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('hr_employee_master not yet fallback hr_employee:', newErr.message);
      dbSource = 'db-legacy';
      table = 'hr_employee';
      legalSafe = false;
      let query = sql`
        SELECT e.id, e.employee_number, e.first_name, e.last_name, e.email, e.phone, e.status, e.hire_date, e.termination_date, e.basic_salary, e.currency, e.is_active,
               p.code as position_code, p.name as position_name,
               ou.code as org_unit_code, ou.name as org_unit_name,
               pl.code as facility_code, pl.name as facility_name,
               cc.code as legal_entity_code, cc.name as legal_entity_name,
               cc2.code as cost_unit_code, cc2.name as cost_unit_name,
               m.employee_number as manager_number, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM hr_employee e
        LEFT JOIN hr_position p ON e.position_id = p.id
        LEFT JOIN hr_org_unit ou ON p.org_unit_id = ou.id
        LEFT JOIN ent_plant pl ON e.plant_id = pl.id
        LEFT JOIN ent_company_code cc ON e.company_code_id = cc.id
        LEFT JOIN hr_employee m ON e.manager_id = m.id
        LEFT JOIN ent_company_code cc2 ON e.cost_center_id = cc2.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (e.employee_number ILIKE ${`%${search}%`} OR e.first_name ILIKE ${`%${search}%`} OR e.last_name ILIKE ${`%${search}%`} OR e.email ILIKE ${`%${search}%`})`;
      if (status) query = sql`${query} AND e.status = ${status}::employment_status`;
      if (facilityId) query = sql`${query} AND e.plant_id = ${facilityId}`;
      query = sql`${query} ORDER BY e.employee_number LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      data: rows,
      employees: rows,
      count: rows.length,
      code: 'HEMC',
      aliasCodes: ['EMC', 'PA30', 'FIN-HR-CR'],
      helperCode: 'HEMC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'HR Employee – HEMC legal-safe own IP (was PA30) – employeeNumber EMP-10000001, firstName lastName, email, positionId, managerId, facilityId FAC-1000 was plant_id, legalEntityId LE-1000 was company_code_id, costUnitId ECUC was cost_center_id, status ACTIVE/ON_LEAVE/TERMINATED/PROBATION, currencyCode INR was KWD',
      explanation: 'HR employee legal-safe hr_employee_master – employeeNumber EMP-10000001, userId, firstName lastName, email phone, positionId, managerId, facilityId FAC-1000 was plant_id, legalEntityId LE-1000 was company_code_id, costUnitId ECUC was cost_center_id, status ACTIVE/ON_LEAVE/TERMINATED/PROBATION, hireDate terminationDate, basicSalary, currencyCode INR was KWD, isActive – Code HEMC primary alias EMC/PA30 – 4-char MOOA H=HR EM=Employee C=Create – module grouped intuitive, same length as PA30 but own IP – fresh empty but facility/legalEntity/costUnit kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { employee_number, first_name, last_name, email, phone, position_id, manager_id, facility_id, plant_id, legal_entity_id, company_code_id, cost_unit_id, cost_center_id, status, hire_date, basic_salary, currency_code } = body;

    if (!first_name || !last_name || !email || !position_id) return NextResponse.json({ error: 'first_name, last_name, email, position_id required' }, { status: 400 });

    let facilityIdResolved = facility_id || plant_id;
    let legalEntityIdResolved = legal_entity_id || company_code_id;
    let costUnitIdResolved = cost_unit_id || cost_center_id;

    let empNumber = employee_number;
    if (!empNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number FROM core_number_range WHERE object_type = 'EMPLOYEE'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
                    empNumber = `${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'EMPLOYEE'::core_nr_object_type`);
        } else {
          empNumber = `EMP-${Date.now()}`;
        }
      } catch {
        empNumber = `EMP-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO hr_employee_master (employee_number, first_name, last_name, email, phone, position_id, manager_id, facility_id, plant_id, legal_entity_id, company_code_id, cost_unit_id, cost_center_id, status, hire_date, basic_salary, currency_code, currency)
        VALUES (${empNumber}, ${first_name}, ${last_name}, ${email}, ${phone || null}, ${position_id}, ${manager_id || null}, ${facilityIdResolved || null}, ${facilityIdResolved || null}, ${legalEntityIdResolved || null}, ${legalEntityIdResolved || null}, ${costUnitIdResolved || null}, ${costUnitIdResolved || null}, ${status || 'ACTIVE'}::hr_employment_status_new, ${hire_date ? new Date(hire_date) : new Date()}, ${basic_salary || '0'}, ${currency_code || 'INR'}, ${currency_code || 'INR'})
        ON CONFLICT (employee_number) DO UPDATE SET first_name = ${first_name}, last_name = ${last_name}, email = ${email}
        RETURNING id, employee_number
      `);
      return NextResponse.json({ success: true, employee: res.rows[0], employeeNumber: empNumber, code: 'HEMC', message: `HR Employee ${empNumber} created – HEMC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('hr_employee_master insert failed fallback:', newErr.message);
      try {
        const res = await db.execute(sql`
          INSERT INTO hr_employee (employee_number, first_name, last_name, email, phone, position_id, manager_id, plant_id, company_code_id, cost_center_id, status, hire_date, basic_salary, currency)
          VALUES (${empNumber}, ${first_name}, ${last_name}, ${email}, ${phone || null}, ${position_id}, ${manager_id || null}, ${facilityIdResolved || null}, ${legalEntityIdResolved || null}, ${costUnitIdResolved || null}, ${status || 'ACTIVE'}::employment_status, ${hire_date ? new Date(hire_date) : new Date()}, ${basic_salary || '0'}, ${currency_code || 'KWD'})
          ON CONFLICT (employee_number) DO UPDATE SET first_name = ${first_name}, last_name = ${last_name}, email = ${email}
          RETURNING id, employee_number
        `);
        return NextResponse.json({ success: true, employee: res.rows[0], employeeNumber: empNumber, message: `HR Employee ${empNumber} created – PA30 legacy`, legalSafe: false });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, employee_number, status, is_active } = body;
    if (!id && !employee_number) return NextResponse.json({ error: 'id or employee_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_employee_master SET status = COALESCE(${status}::hr_employment_status_new, status), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, employee_number, status`);
      else res = await db.execute(sql`UPDATE hr_employee_master SET status = COALESCE(${status}::hr_employment_status_new, status), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE employee_number = ${employee_number} RETURNING id, employee_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, employee: res.rows[0], code: 'HEMC', message: `HR Employee ${res.rows[0].employee_number} status ${status} – HEMC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_employee SET status = COALESCE(${status}::employment_status, status), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, employee_number, status`);
      else res = await db.execute(sql`UPDATE hr_employee SET status = COALESCE(${status}::employment_status, status), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE employee_number = ${employee_number} RETURNING id, employee_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'HR Employee not found' }, { status: 404 });
      return NextResponse.json({ success: true, employee: res.rows[0], message: `HR Employee ${res.rows[0].employee_number} status ${status} – PA30 legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const employee_number = searchParams.get('employee_number');
    if (!id && !employee_number) return NextResponse.json({ error: 'id or employee_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM hr_employee_master WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_employee_master WHERE employee_number = ${employee_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM hr_employee WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_employee WHERE employee_number = ${employee_number}`);
    }

    return NextResponse.json({ success: true, code: 'HEMC', message: `HR Employee ${employee_number || id} deleted – HEMC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
