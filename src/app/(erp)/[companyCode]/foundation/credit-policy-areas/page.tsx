"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCPC"
      sapAlias="OB45"
      title="Credit Policy Area"
      description="Define Credit Policy Area – commercial customer credit control boundary risk management area – strict usage: credit limit checked on sales order, exposure calculated"
      apiEndpoint="/api/credit-policy-areas"
      initialForm={{ code: '', name: '', description: '', credit_limit: '1000000', risk_category: 'LOW', currency_code: 'INR' }}
      fields={[
        { key: "code", label: "CREDIT_POLICY_AREA_CODE", required: true, placeholder: "", description: "Credit policy area code – e.g., CPA-1000" },
        { key: "name", label: "CREDIT_POLICY_AREA_NAME", required: true, placeholder: "" },
        { key: "credit_limit", label: "CREDIT_LIMIT", placeholder: "", description: "Credit limit amount – strict usage in SO credit check" },
        { key: "risk_category", label: "RISK_CATEGORY", type: "select", options: ['LOW', 'MEDIUM', 'HIGH'], placeholder: "", description: "Risk category – determines block/warning" },
        { key: "currency_code", label: "CURRENCY_CODE", type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "SCUC", label: "Customer uses FCPC", route: "/foundation/customers", description: "Customer requires Credit Policy" },
        { code: "SSOC", label: "Sales Order checks FCPC", route: "/sales", description: "Sales Order credit check" },
      ]}
    />
  );
}
