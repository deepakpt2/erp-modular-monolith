"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EBSC"
      sapAlias="KE51"
      title="Profit Center Assignment – Profit Center – Organisation"
      description="Define Profit Center Assignment – assigns profit center to legal entity (company code), cost center, business segment – strict industry standard: profit center reporting – e.g., PC-1000 Production Profit Center assigned to LE-1000 legal entity + CC-1000 cost center + BA01 business area – used in universal ledger FUNL profit center, stock ledger, billing, costing – organisation – profit center – own names – KE51"
      apiEndpoint="/api/profit-center-assign"
      initialForm={{ 
        profit_center_code: '', 
        legal_entity_code: '1000', 
        cost_center_code: 'CC-1000', 
        business_segment_code: 'BA01',
        control_area_code: 'CA01',
        description: 'Profit Center PC-1000 assigned to LE-1000 + CC-1000 + BA01 – profit reporting' 
      }}
      fields={[
        { key: "profit_center_code", label: "PROFIT_CENTER_CODE", required: true, type: "autocomplete", apiUrl: "/api/profit-units", dataKey: "profitUnits", codeField: "code", placeholder: "", createUrl: "/foundation/commercial-units", createCode: "EPUC", description: "Profit center code – e.g., PC-1000 Production Profit Center, PU-1000 – profit center – organisation – profit center – own name – KE51 – EPUC – used in universal ledger FUNL profit_center, stock ledger, billing, costing – T0" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal entity – company code – e.g., 1000 – LE-1000 – company code – organisation – company code – ELEC OX02 – profit center assigned to legal entity – industry standard" },
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "", createUrl: "/fico/cost-centers", createCode: "FCCA", description: "Cost center – e.g., CC-1000 Production Cost Center, CU-1000 – cost center – organisation – cost center – FCCA KS01 – cost center assigned to profit center – industry standard – cost unit required for expense GL via field status OBC5" },
        { key: "business_segment_code", label: "BUSINESS_SEGMENT_CODE", type: "autocomplete", apiUrl: "/api/business-segments", dataKey: "businessSegments", codeField: "code", placeholder: "", createUrl: "/foundation/enterprise-structure", createCode: "FCRL", description: "Business segment – business area – e.g., BA01 Spices – business area – organisation – FCRL – business area – segment reporting – industry standard – BA01" },
        { key: "control_area_code", label: "CONTROL_AREA_CODE", placeholder: "", description: "Management control area – e.g., CA01 – control area – OX06 – groups profit centers and cost centers – industry standard" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – e.g., PC-1000 Production Profit Center assigned to LE-1000 + CC-1000 + BA01 – profit reporting – industry standard" },
      ]}
      relatedLinks={[
        { code: "EPUC", label: "Profit Unit – Commercial Unit – PU-1000 – Profit Center – KE51 – required", route: "/foundation/commercial-units", description: "Profit Unit – Commercial Unit – PU-1000 – Profit Center – profitability unit – enterprise profit tracking" },
        { code: "ELEC", label: "Legal Entity – company code – 1000 – required – ELEC OX02", route: "/foundation/legal-entities", description: "Legal Entity – statutory company code – 1000 – LE-1000 – chart CA-IN-01, fiscal K4, posting PPV-1000, credit CRED-1000" },
        { code: "FCCA", label: "Cost Center – Cost Unit – CC-1000 – KS01 – required", route: "/fico/cost-centers", description: "Cost Unit – Cost Center – CU-1000 – CC-1000 – cost unit required for expense GL via field status OBC5, actuals via CCA report KSB1" },
        { code: "FCRL", label: "Company Relationships – business area BA01 – business segment", route: "/foundation/enterprise-structure", description: "Company Relationships – BA01 Spices, SEG01, SO01, PO01, CA01, intercompany 1000→1100 – FCRL" },
        { code: "FUNL", label: "Universal Ledger – ACDOCA – 400+ fields – profit_center – uses profit center", route: "/fico/universal-ledger", description: "Universal Ledger – 400+ fields – profit_center PC-1000, business_area BA01, cost_center CC-1000 – posts profit center" },
        { code: "FSTL", label: "Stock Ledger – material ledger – profit center – uses profit center", route: "/foundation/stock", description: "Stock Ledger – total stock/value, MAP, S/V, batch, profit center" },
      ]}
    />
  );
}
