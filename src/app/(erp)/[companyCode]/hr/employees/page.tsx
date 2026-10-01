"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
import { RoleGuard } from '@/shared/ui/role-guard';

export default function Page() {
  return (
    <RoleGuard requiredPermission="EMPLOYEE_VIEW" requiredRoles={['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER']}>
      <SingleCodePage
        code="HHEC"
        sapAlias="PA30"
        title="Employee Master"
        description="Maintain Employee Master – employee profiles records – position, company code, cost center, basic salary – strict usage: used in payroll run wage calc, cost center actuals"
        apiEndpoint="/api/hr/employees"
        initialForm={{ employee_number: '', first_name: '', last_name: '', position: '', company_code: '', cost_center_code: '', basic_salary: '3000', description: '' }}
        fields={[
          { key: "employee_number", label: "EMPLOYEE_CODE", required: true, placeholder: "", description: "Employee code – e.g., EMP-1000 – unique" },
          { key: "first_name", label: "FIRST_NAME", required: true, placeholder: "" },
          { key: "last_name", label: "LAST_NAME", placeholder: "" },
          { key: "position", label: "POSITION", placeholder: "" },
          { key: "company_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – company code" },
          { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "", createUrl: "/fico/cost-centers", createCode: "FCCA", description: "Cost center for payroll allocation – strict usage CCA report" },
          { key: "basic_salary", label: "BASIC_SALARY", required: true, placeholder: "", description: "Basic salary – e.g., 3000 – used in payroll run wage calc gross pay" },
          { key: "description", label: "DESCRIPTION", type: "textarea" },
        ]}
        relatedLinks={[
          { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
          { code: "FCCA", label: "Cost Center – required", route: "/fico/cost-centers", description: "Cost Center for payroll" },
          { code: "HPYC", label: "Payroll Run uses Employee", route: "/hr/payroll-run", description: "Payroll Run" },
          { code: "CCUL", label: "CCA Report uses Employee", route: "/fico/cca-report", description: "CCA Report" },
        ]}
      />
    </RoleGuard>
  );
}
