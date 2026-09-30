"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
import { RoleGuard } from '@/shared/ui/role-guard';

export default function Page() {
  return (
    <RoleGuard requiredPermission="PAYROLL_RUN" requiredRoles={['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER']}>
      <SingleCodePage
        code="HPYC"
        sapAlias="PC00"
        title="Payroll Run"
        description="Payroll Run – wage type calculation deductions net pay – strict usage: payroll run calculates gross/net via wage types – e.g., basic salary + allowances - deductions = net pay – posts to FI via automatic account determination – no dummy"
        apiEndpoint="/api/payroll-run"
        initialForm={{ employee_code: '', payroll_period: '2026-05', description: '' }}
        fields={[
          { key: "employee_code", label: "EMPLOYEE_CODE", type: "autocomplete", apiUrl: "/api/hr/employees", dataKey: "employees", codeField: "employee_number", placeholder: "EMP-1000", createUrl: "/hr/employees", createCode: "HHEC", description: "Employee code – if empty runs for all employees" },
          { key: "payroll_period", label: "PAYROLL_PERIOD", required: true, placeholder: "2026-05", description: "Payroll period – YYYY-MM – e.g., 2026-05 for May 2026" },
          { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Payroll run May 2026" },
        ]}
        relatedLinks={[
          { code: "HHEC", label: "Employee Master – required", route: "/hr/employees", description: "Employee Master" },
          { code: "OBYC", label: "Auto Account – payroll posting", route: "/fico/auto-account-determination", description: "Auto account for payroll GL" },
          { code: "FCCA", label: "Cost Center – payroll cost", route: "/fico/cost-centers", description: "Cost Center for payroll allocation" },
        ]}
      />
    </RoleGuard>
  );
}
