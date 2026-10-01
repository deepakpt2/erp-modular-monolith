"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="PRIC"
      sapAlias="PRIC"
      title="Pricing Procedure"
      description="Define Pricing Procedure – condition types PR00 price, K007 discount – strict usage: calculates pricing for SO/Billing – no dummy"
      apiEndpoint="/api/pricing-procedure"
      initialForm={{ code: '', name: '', condition_type: 'PR00', sequence: '10', calculation_type: 'FIXED', gl_account: '', description: '' }}
      fields={[
        { key: "code", label: "PRICING_PROCEDURE_CODE", required: true, placeholder: "", description: "Pricing procedure code" },
        { key: "name", label: "PRICING_PROCEDURE_NAME", required: true, placeholder: "" },
        { key: "condition_type", label: "CONDITION_TYPE", required: true, type: "select", options: ['PR00', 'K007', 'K005', 'MWST'], placeholder: "", description: "PR00 price, K007 discount, MWST tax" },
        { key: "sequence", label: "SEQUENCE", required: true, placeholder: "", description: "Sequence – order of calculation" },
        { key: "calculation_type", label: "CALCULATION_TYPE", type: "select", options: ['FIXED', 'PERCENT', 'QUANTITY'], placeholder: "" },
        { key: "gl_account", label: "GL_ACCOUNT", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account for condition" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required", route: "/fico/gl-accounts", description: "GL" },
        { code: "SSOC", label: "Sales Order uses Pricing", route: "/sales", description: "SO" },
        { code: "SBLC", label: "Billing uses Pricing", route: "/sd/billing", description: "Billing" },
      ]}
    />
  );
}
