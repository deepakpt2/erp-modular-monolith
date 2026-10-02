"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EFCC"
      sapAlias="OX10"
      title="Facility / Plant"
      description="Define Facility / Plant – operational manufacturing plant, distribution center, fulfillment hub, or physical site. Pure definition transaction; assignment to Company Code is performed separately in OX18."
      apiEndpoint="/api/facilities"
      initialForm={{ code: '', name: '', city: '', country: 'IN', address: '', description: '' }}
      fields={[
        { key: "code", label: "FACILITY_CODE", required: true, placeholder: "", description: "Plant / Facility code (e.g. 1000, 1100, FAC-1000)" },
        { key: "name", label: "FACILITY_NAME", required: true, placeholder: "", description: "Name of the Facility / Plant" },
        { key: "city", label: "CITY", placeholder: "", description: "City or location" },
        { key: "country", label: "COUNTRY", placeholder: "IN", description: "Country code (e.g. IN, US, DE, KW)" },
        { key: "address", label: "ADDRESS", type: "textarea", placeholder: "", description: "Street address and physical site details" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Operational notes and plant scope" },
      ]}
      relatedLinks={[
        { code: "OX18", label: "Assign Plant to Company Code (OX18)", route: "/mm/assignments/plant-company-code", description: "Connect Plant to Legal Entity / Company Code" },
        { code: "EILC", label: "Inventory Location (OX09)", route: "/foundation/inventory-locations", description: "Define Storage Locations under this Plant" },
        { code: "OX17", label: "Assign Purchasing Org to Plant (OX17)", route: "/mm/assignments/purchasing-plant", description: "Enable Purchasing Organization for this Plant" },
        { code: "EWSC", label: "Warehouse Site (EWHC)", route: "/foundation/warehouse-sites", description: "Assign Warehouse Number to Plant & Storage Location" },
      ]}
    />
  );
}
