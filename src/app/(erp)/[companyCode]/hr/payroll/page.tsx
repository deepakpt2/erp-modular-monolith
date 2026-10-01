"use client";
import { useSearchParams } from 'next/navigation';
import { SingleCodePage } from '@/shared/ui/single-code-page';
import { RoleGuard } from '@/shared/ui/role-guard';

export default function Page() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'maintain';

  // Mode handling – HHEC (PA30) HR Master, HHEV (PA20) Display, HPYC (PC00) Payroll Run all historically pointed to /hr/payroll?mode=...
  // Now we split: maintain/display use employees API, run uses payroll-run API – but keep backward compat for old links
  // Also enforce RBAC – master data manager cannot access payroll – industry standard SoD

  if (mode === 'run') {
    return (
      <RoleGuard requiredPermission="PAYROLL_RUN" requiredRoles={['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER']}>
        <SingleCodePage
          code="HPYC"
          sapAlias="PC00"
          title="Payroll Run – via /hr/payroll?mode=run – redirect to /hr/payroll-run"
          description="Payroll Run – wage type calculation – use /hr/payroll-run for new – this is backward compat for old route /1000/hr/payroll?mode=run"
          apiEndpoint="/api/payroll-run"
          initialForm={{ employee_code: '', payroll_period: '2026-05', description: '' }}
          fields={[
            { key: "employee_code", label: "EMPLOYEE_CODE", type: "autocomplete", apiUrl: "/api/hr/employees", dataKey: "employees", codeField: "employee_number", placeholder: "", createUrl: "/hr/employees", createCode: "HHEC", description: "Employee code – if empty runs for all employees" },
            { key: "payroll_period", label: "PAYROLL_PERIOD", required: true, placeholder: "", description: "Payroll period – YYYY-MM – e.g., 2026-05 for May 2026" },
            { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
          ]}
          relatedLinks={[
            { code: "HHEC", label: "Employee Master – required", route: "/hr/employees", description: "Employee Master" },
            { code: "HPYC", label: "Payroll Run – new route", route: "/hr/payroll-run", description: "Payroll Run new route /hr/payroll-run" },
          ]}
        />
      </RoleGuard>
    );
  }

  // Default – HR Master Maintain/Display – HHEC/HHEV
  return (
    <RoleGuard requiredPermission="EMPLOYEE_VIEW" requiredRoles={['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER']}>
      <SingleCodePage
        code="HHEC"
        sapAlias="PA30"
        title="HR Master Maintain"
        description="Maintain HR Master – employee profiles – alias PA30 – uses employees page – strict usage: employee master data – fixed 404 by using /api/hr/employees not /api/employees"
        apiEndpoint="/api/hr/employees"
        initialForm={{ employee_number: '', first_name: '', last_name: '', position: '', company_code: '', cost_center_code: '', basic_salary: '3000', description: '' }}
        fields={[
          { key: "employee_number", label: "EMPLOYEE_CODE", required: true, placeholder: "" },
          { key: "first_name", label: "FIRST_NAME", required: true, placeholder: "" },
          { key: "last_name", label: "LAST_NAME", placeholder: "" },
          { key: "position", label: "POSITION", placeholder: "" },
          { key: "company_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
          { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "", createUrl: "/fico/cost-centers", createCode: "FCCA" },
          { key: "basic_salary", label: "BASIC_SALARY", required: true, placeholder: "" },
          { key: "description", label: "DESCRIPTION", type: "textarea" },
        ]}
        relatedLinks={[
          { code: "HHEC", label: "Employee Master", route: "/hr/employees", description: "Employee Master – canonical route" },
          { code: "HPYC", label: "Payroll Run", route: "/hr/payroll-run", description: "Payroll Run – requires PAYROLL_RUN permission – HR only – not master data manager – SoD" },
        ]}
      />
    </RoleGuard>
  );
}
