"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FRAD"
      sapAlias="VKOA"
      title="Revenue Account Determination – Sales"
      description="Define Revenue Account Determination – FRAD own IP (alias VKOA) – T0 BLOCKING – Condition technique: chart + sales org + customer group + material group + account assignment group → GL (KOFI/KOFK) – strict usage: Billing VF01 needs to find revenue GL, otherwise cannot post Dr AR Cr Revenue – NO DANGLING – used in POST /api/billing – determineRevenueAccount() – fallback logic exact→sales org→chart→default"
      apiEndpoint="/api/revenue-accounts"
      initialForm={{
        chart_of_accounts: 'KSCA',
        sales_org: '1000',
        customer_group: '01',
        material_group: '01',
        account_assignment_group: '01',
        transaction_key: 'KOFI',
        gl_account: '3000000001',
        description: '',
      }}
      fields={[
        { key: "chart_of_accounts", label: "CHART_OF_ACCOUNTS", required: true, placeholder: "", description: "Chart of Accounts – e.g., KSCA – used with sales org + customer group + material group + account assignment → GL – fallback if more specific not found" },
        { key: "sales_org", label: "SALES_ORG", placeholder: "", description: "Sales Org – e.g., 1000 – from commercial org ECOC – used in VKOA condition technique – if blank, fallback" },
        { key: "customer_group", label: "CUSTOMER_GROUP", placeholder: "", description: "Customer Group – e.g., 01 domestic – from customer master SCUC – used in VKOA" },
        { key: "material_group", label: "MATERIAL_GROUP", placeholder: "", description: "Material Group – e.g., 01 finished – from material EMTC category – used in VKOA" },
        { key: "account_assignment_group", label: "ACCOUNT_ASSIGNMENT_GROUP", placeholder: "", description: "Account Assignment Group – e.g., 01 – from material sales view – used in VKOA KOFK" },
        { key: "transaction_key", label: "TRANSACTION_KEY", required: true, type: "select", options: ["KOFI", "KOFK"], placeholder: "", description: "T0 BLOCKING – KOFI revenue without account assignment, KOFK revenue with account assignment – determines which GL account type – used in billing" },
        { key: "gl_account", label: "GL_ACCOUNT", required: true, type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "Revenue GL Account FK – must exist via FGLC – e.g., 3000000001 domestic revenue – Dr AR Cr Revenue in billing – T0 BLOCKING" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – explains condition technique – chart+sales org+cust grp+mat grp+acct assign → GL" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – revenue – required", route: "/fico/gl-accounts", description: "GL – revenue 3000000001" },
        { code: "FCOA", label: "Chart of Accounts – KSCA", route: "/fico/chart-of-accounts", description: "Chart" },
        { code: "ECOC", label: "Commercial Org – sales org – required", route: "/foundation/commercial-orgs", description: "Sales Org 1000" },
        { code: "SCUC", label: "Customer – customer group", route: "/foundation/customers", description: "Customer – cust group" },
        { code: "EMTC", label: "Product – material group", route: "/foundation/materials", description: "Material – mat group" },
        { code: "SBLC", label: "Billing VF01 – uses VKOA", route: "/sd/billing", description: "Billing – VKOA revenue" },
        { code: "FAUC", label: "Auto Account OBYC – BSX/WRX/GBB – related", route: "/fico/auto-account-determination", description: "OBYC – inventory" },
      ]}
    />
  );
}
