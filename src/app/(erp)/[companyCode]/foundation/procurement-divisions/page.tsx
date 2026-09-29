"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPDC"
      sapAlias="OX08"
      title="Procurement Division"
      description="Define Procurement Division – purchasing organization commercial vendor negotiation team"
      apiEndpoint="/api/procurement-divisions"
      initialForm={{ code: '', name: '', description: '', tenant_code: 'TEN-100' }}
      fields={[
        { key: "code", label: "PROCUREMENT_DIVISION_CODE", required: true, placeholder: "PD-100" },
        { key: "name", label: "PROCUREMENT_DIVISION_NAME", required: true, placeholder: "Direct Materials" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
        { key: "tenant_code", label: "TENANT_CODE", required: true, placeholder: "TEN-100" },
      ]}
      relatedLinks={[
        { code: "EBTC", label: "Buyer Team uses EPDC", route: "/foundation/buying-teams", description: "Buyer Team" },
        { code: "PSUC", label: "Supplier uses EPDC", route: "/foundation/suppliers", description: "Supplier" },
      ]}
    />
  );
}
