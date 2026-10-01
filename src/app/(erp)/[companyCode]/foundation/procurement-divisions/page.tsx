"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPDC"
      sapAlias="OX08"
      title="Procurement Division – Purchasing Organisation"
      description="Define Procurement Division – purchasing organisation – procurement division – e.g., PD-100 Direct Materials, PO01 Spices Purchasing – strict industry standard: purchasing organisation – org assignment – company code to purchasing org, plant to purchasing org – e.g., 1000→PO01, 1000→1000 PO01 – used in PR, PO, GR, IV – purchasing organisation/group – organisation – own names – OX08"
      apiEndpoint="/api/procurement-divisions"
      initialForm={{ 
        code: '', 
        name: '', 
        legal_entity_code: '1000',
        description: '', 
        tenant_code: 'TEN-100' 
      }}
      fields={[
        { key: "code", label: "PROCUREMENT_DIVISION_CODE", required: true, placeholder: "", description: "Procurement division code – purchasing organisation – e.g., PO01 Spices Purchasing, PD-100 Direct Materials – industry standard – purchasing org – OX08 – EPDC – used in PR, PO – org assignment – company code to purchasing org, plant to purchasing org – e.g., 1000→PO01" },
        { key: "name", label: "PROCUREMENT_DIVISION_NAME", required: true, placeholder: "", description: "Procurement division name – e.g., Spices Purchasing – descriptive" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal entity – company code – e.g., 1000 – LE-1000 – company code to purchasing org assignment – 1000→PO01 – industry standard – FCRL" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – procurement division purpose – e.g., Spices Purchasing handles raw materials" },
        { key: "tenant_code", label: "TENANT_CODE", required: true, placeholder: "", description: "Tenant code – default TEN-100 – tenant" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – company code – 1000 – required – ELEC ELEC (legacy OX02) – company to purchasing org", route: "/foundation/legal-entities", description: "Legal Entity – 1000 – LE-1000 – company code – company to purchasing org assignment 1000→PO01" },
        { code: "EFCC", label: "Facility – plant – 1000 – plant to purchasing org – 1000→PO01", route: "/foundation/facilities", description: "Facility – plant – FAC-1000 – 1000 – plant to purchasing org assignment" },
        { code: "EBTC", label: "Buyer Team – purchasing group – uses EPDC – EBTC OME4", route: "/foundation/buying-teams", description: "Buyer Team – purchasing group – e.g., BT-100 Raw Materials Team – buyer determination in PR/PO" },
        { code: "PSUC", label: "Supplier – vendor – uses EPDC – PSUC XK01 – procurement division", route: "/foundation/suppliers", description: "Supplier – vendor master – procurement_division_code PO01 – purchasing org" },
        { code: "PPRC", label: "Purchase Requisition – PPRC (legacy ME51N) – uses purchasing org/group", route: "/mm/pr", description: "PR – uses purchasing org PO01 + purchasing group BT-100" },
        { code: "PPOC", label: "Purchase Order – PPOC (legacy ME21N) – uses purchasing org/group – PO01", route: "/mm/po", description: "PO – uses purchasing org PO01 + group BT-100 + supplier" },
        { code: "FCRL", label: "Company Relationships – 1000→PO01 – purchasing org assignment", route: "/foundation/enterprise-structure", description: "Company Relationships – FCRL – 1000→CA01/CRED-1000/CA-IN-01/K4/PPV-1000/FFSV-1000/BA01/SO01/PO01 – intercompany 1000→1100" },
      ]}
    />
  );
}
