"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="HHEC"
      sapAlias="PA30"
      title="Employee Master"
      description="Maintain Employee Master – employee profiles records – position, company code, cost center, basic salary – strict usage: used in payroll run wage calc, cost center actuals"
      apiEndpoint="/api/employees"
      initialForm={{ employee_number: '', first_name: '', last_name: '', position: '', company_code: '', cost_center_code: '', basic_salary: '3000', description: '' }}
      fields={[
        { key: "employee_number", label: "EMPLOYEE_CODE", required: true, placeholder: "EMP-1000", description: "Employee code – e.g., EMP-1000 – unique" },
        { key: "first_name", label: "FIRST_NAME", required: true, placeholder: "John" },
        { key: "last_name", label: "LAST_NAME", placeholder: "Doe" },
        { key: "position", label: "POSITION", placeholder: "Production Supervisor" },
        { key: "company_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – company code" },
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "CC-1000", createUrl: "/fico/cost-centers", createCode: "FCCA", description: "Cost center for payroll allocation – strict usage CCA report" },
        { key: "basic_salary", label: "BASIC_SALARY", required: true, placeholder: "3000", description: "Basic salary – e.g., 3000 – used in payroll run wage calc gross pay" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "FCCA", label: "Cost Center – required", route: "/fico/cost-centers", description: "Cost Center for payroll" },
        { code: "HPYC", label: "Payroll Run uses Employee", route: "/hr/payroll-run", description: "Payroll Run" },
        { code: "CCUL", label: "CCA Report uses Employee", route: "/fico/cca-report", description: "CCA Report" },
      ]}
    />
  );
}
