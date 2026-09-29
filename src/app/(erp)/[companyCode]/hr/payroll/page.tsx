"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="HHEC"
      sapAlias="PA30"
      title="HR Master Maintain"
      description="Maintain HR Master – employee profiles – alias PA30 – uses employees page – strict usage: employee master data"
      apiEndpoint="/api/employees"
      initialForm={{ employee_number: '', first_name: '', last_name: '', position: '', company_code: '', cost_center_code: '', basic_salary: '3000', description: '' }}
      fields={[
        { key: "employee_number", label: "EMPLOYEE_CODE", required: true, placeholder: "EMP-1000" },
        { key: "first_name", label: "FIRST_NAME", required: true, placeholder: "John" },
        { key: "last_name", label: "LAST_NAME", placeholder: "Doe" },
        { key: "position", label: "POSITION", placeholder: "Production Supervisor" },
        { key: "company_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "CC-1000", createUrl: "/fico/cost-centers", createCode: "FCCA" },
        { key: "basic_salary", label: "BASIC_SALARY", required: true, placeholder: "3000" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "HHEC", label: "Employee Master", route: "/hr/employees", description: "Employee Master" },
        { code: "HPYC", label: "Payroll Run", route: "/hr/payroll-run", description: "Payroll Run" },
      ]}
    />
  );
}
