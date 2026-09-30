"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FTXC"
      sapAlias="FTXP"
      title="Tax Codes – Tax Classification – GST – HSN"
      description="Define Tax Codes – tax classification – e.g., GST0 0%, GST5 5%, GST12 12%, GST18 18%, GST28 28%, IGST18, VAT – rate, ledger account, HSN code, GST type CGST/SGST/IGST/UTGST/CESS, tax rule type INPUT/OUTPUT/BOTH/NONE/EXEMPT, reverse charge – strict industry standard: calculates tax amount on PO, SO, IV, Billing – tax calc engine – tax/HSN or equivalent tax classification – financial – own names"
      apiEndpoint="/api/tax-codes"
      initialForm={{ 
        code: '', 
        name: '', 
        description: '',
        rate: '18', 
        type: 'BOTH',
        gst_type: 'CGST',
        hsn_code: '09041110',
        ledger_account_code: '2000000003',
        is_reverse_charge: 'false',
        is_active: 'true'
      }}
      fields={[
        { key: "code", label: "TAX_CODE", required: true, placeholder: "GST18", description: "Tax code – e.g., GST0 0%, GST5 5%, GST12 12%, GST18 18%, GST28 28%, IGST18 18% IGST – tax code – industry standard – own name – FTXC – tax classification – determines tax rate" },
        { key: "name", label: "TAX_CODE_NAME", required: true, placeholder: "GST 18% – CGST+SGST", description: "Tax code name – e.g., GST 18% – descriptive" },
        { key: "description", label: "DESCRIPTION", placeholder: "GST 18% – CGST 9% + SGST 9% – for domestic", description: "Description – tax code purpose – e.g., GST 18% for domestic sales – CGST+SGST" },
        { key: "rate", label: "TAX_RATE_PERCENT", required: true, placeholder: "18", description: "Tax rate percent – e.g., 18 – 0/5/12/18/28 – strict usage tax calculation – e.g., PO line amount 1000 * 18% = 180 tax – industry standard – tax calc engine" },
        { key: "type", label: "TAX_RULE_TYPE", type: "select", options: ["INPUT", "OUTPUT", "BOTH", "NONE", "EXEMPT"], placeholder: "BOTH", description: "Tax rule type – INPUT (purchase), OUTPUT (sales), BOTH, NONE, EXEMPT – e.g., GST18 BOTH for purchase and sales – industry standard – determines if tax applicable on input/output" },
        { key: "gst_type", label: "GST_TYPE", type: "select", options: ["CGST", "SGST", "IGST", "UTGST", "CESS", "VAT", "NONE"], placeholder: "CGST", description: "GST type – CGST Central GST, SGST State GST, IGST Integrated GST, UTGST, CESS, VAT, NONE – e.g., CGST 9% + SGST 9% = 18% for intra-state, IGST 18% for inter-state – industry standard – India GST" },
        { key: "hsn_code", label: "HSN_CODE", type: "autocomplete", apiUrl: "/api/hsn-codes", dataKey: "hsnCodes", codeField: "code", placeholder: "09041110", createUrl: "/fico/hsn-codes", createCode: "FTXC", description: "HSN/SAC code – e.g., 09041110 Pepper Black pepper 5% GST, 15159040 Spice oils 12%, 33012937 Essential oils 18% – HSN determines tax rate via tax classification – tax/HSN or equivalent tax classification – industry standard – FTXC – wired from foundation – used in material master HSN_CODE – MARA STEUC" },
        { key: "ledger_account_code", label: "TAX_LEDGER_ACCOUNT_CODE", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "2000000003", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account for tax posting – e.g., 2000000003 GST Payable 18% – GL account – tax payable/receivable – industry standard – FGLC – tax posting to GL" },
        { key: "is_reverse_charge", label: "IS_REVERSE_CHARGE", type: "select", options: ["true", "false"], placeholder: "false", description: "Reverse charge – true if tax under reverse charge mechanism – e.g., true for import, services – industry standard – reverse charge – tax" },
        { key: "is_active", label: "IS_ACTIVE", type: "select", options: ["true", "false"], placeholder: "true", description: "Active – true if tax code active for use – industry standard" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – tax payable/receivable – required – FGLC", route: "/fico/gl-accounts", description: "GL Account – e.g., 2000000003 GST Payable 18% – tax posting" },
        { code: "FTGC", label: "Tax Group – groups tax codes", route: "/fico/tax-groups", description: "Tax Group – e.g., GST group – groups tax codes for reporting" },
        { code: "FTXC", label: "HSN Codes – 09041110 pepper 5% – HSN/SAC – FTXC", route: "/fico/hsn-codes", description: "HSN Codes – HSN/SAC – 09041110 Pepper, 090831 Cardamom, 1515 oils – GST rate – tax classification" },
        { code: "EMTC", label: "Product Master – uses HSN_CODE – FTXC – tax classification", route: "/foundation/materials", description: "Product – HSN_CODE 09041110 – tax classification – determines tax rate in PO/SO/Billing" },
        { code: "PPOC", label: "Purchase Order – ME21N – uses Tax Code – GST18", route: "/mm/po", description: "PO – tax code GST18 – calculates tax amount – PO line tax" },
        { code: "VASL", label: "Sales Order – VA01 – uses Tax Code – GST18 – tax calc", route: "/sd/sales-orders", description: "SO – tax code – tax calculation – pricing procedure" },
        { code: "SBLC", label: "Billing – VF01 – uses Tax Code – GST18 – tax calc – MWST", route: "/sd/billing", description: "Billing – tax code – MWST condition – tax amount – billing" },
        { code: "PIVC", label: "Invoice Verification – MIRO – uses Tax Code – tax", route: "/mm/iv", description: "IV – tax code – invoice verification – tax" },
      ]}
    />
  );
}
