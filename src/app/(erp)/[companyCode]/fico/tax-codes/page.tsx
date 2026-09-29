"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FTXC"
      sapAlias="FTXP"
      title="Tax Codes"
      description="Define Tax Codes – GST0/5/12/18/28 IGST VAT 5 percent – rate ledger_account_code – strict usage: calculates tax amount on PO/SO/Billing – tax calc engine"
      apiEndpoint="/api/tax-codes"
      initialForm={{ code: '', name: '', rate: '18', ledger_account_code: '', description: '' }}
      fields={[
        { key: "code", label: "TAX_CODE", required: true, placeholder: "GST18" },
        { key: "name", label: "TAX_CODE_NAME", required: true, placeholder: "GST 18%" },
        { key: "rate", label: "TAX_RATE", required: true, placeholder: "18", description: "Tax rate percent – strict usage tax calculation" },
        { key: "ledger_account_code", label: "LEDGER_ACCOUNT_CODE", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "2000000003", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account for tax posting – e.g., GST payable" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required", route: "/fico/gl-accounts", description: "GL Account for tax" },
        { code: "FTGC", label: "Tax Group", route: "/fico/tax-groups", description: "Tax Group" },
        { code: "PPOC", label: "PO uses Tax Code", route: "/mm/po", description: "PO" },
        { code: "SBLC", label: "Billing uses Tax Code", route: "/sd/billing", description: "Billing" },
      ]}
    />
  );
}
