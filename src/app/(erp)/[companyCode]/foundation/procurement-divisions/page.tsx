"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPDC"
      sapAlias="OX08"
      title="Procurement Division – Purchasing Organisation"
      description="Define Purchasing Organisation / Procurement Division – enterprise organizational unit responsible for procuring materials and services, negotiating conditions with vendors, and issuing purchase contracts. Pure definition transaction (OX08); assignments to Company Code (OX01) and Plants (OX17) are maintained separately."
      apiEndpoint="/api/procurement-divisions"
      initialForm={{ 
        code: '', 
        name: '', 
        description: '', 
        tenant_code: 'TEN-100' 
      }}
      fields={[
        { 
          key: "code", 
          label: "PROCUREMENT_DIVISION_CODE", 
          required: true, 
          placeholder: "", 
          description: "Purchasing Organization code (e.g. 1000, PO01, PD-100) – T024E-EKORG" 
        },
        { 
          key: "name", 
          label: "PROCUREMENT_DIVISION_NAME", 
          required: true, 
          placeholder: "", 
          description: "Name of the Purchasing Organization (e.g. Domestic Procurement, Central Purchasing) – T024E-EKOTX" 
        },
        { 
          key: "description", 
          label: "DESCRIPTION", 
          type: "textarea", 
          placeholder: "", 
          description: "Operational scope, commodity categories, and notes" 
        },
        { 
          key: "tenant_code", 
          label: "TENANT_CODE", 
          required: true, 
          placeholder: "TEN-100", 
          description: "System Client / Tenant identifier" 
        },
      ]}
      relatedLinks={[
        { code: "OX01", label: "Assign Purchasing Org to Company Code (OX01)", route: "/mm/assignments/purchasing-org-company-code", description: "Assign this Purchasing Organization to a Legal Entity / Company Code" },
        { code: "OX17", label: "Assign Purchasing Org to Plant (OX17)", route: "/mm/assignments/purchasing-org-plant", description: "Assign this Purchasing Organization to Plants for procurement operations" },
        { code: "EBTC", label: "Buyer Team / Purchasing Group (OME4)", route: "/foundation/buying-teams", description: "Define Buyer Teams (Purchasing Groups) operating within this Org" },
        { code: "PSUC", label: "Supplier / Vendor (XK01)", route: "/foundation/suppliers", description: "Maintain Purchasing Organization vendor data and terms" },
      ]}
    />
  );
}
