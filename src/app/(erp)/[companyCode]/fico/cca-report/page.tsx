"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="CCUL"
      sapAlias="KSB1"
      title="Cost Center Actuals Report"
      description="Cost Center Actual Line Items – actual expenditure line items ledger tracking overview – strict usage: shows actual postings per cost center from GL, production orders, payroll – plan/actual variance"
      apiEndpoint="/api/cca-report"
      initialForm={{ cost_center_code: '', from_date: '', to_date: '', description: '' }}
      fields={[
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "", createUrl: "/fico/cost-centers", createCode: "FCCA", description: "Cost center to report – if empty all cost centers" },
        { key: "from_date", label: "FROM_DATE", placeholder: "", description: "From date – e.g., start of fiscal year" },
        { key: "to_date", label: "TO_DATE", placeholder: "", description: "To date" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FCCA", label: "Cost Center – required", route: "/fico/cost-centers", description: "Cost Center" },
        { code: "MMOC", label: "Production Order – actuals", route: "/pp/production-orders", description: "Production Order posts to cost center" },
        { code: "HPYC", label: "Payroll Run – actuals", route: "/hr/payroll-run", description: "Payroll posts to cost center" },
      ]}
    />
  );
}
