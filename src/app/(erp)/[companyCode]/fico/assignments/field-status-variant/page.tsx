"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OBC5"
      sapAlias="FFSA"
      title="Assign Company Code to Field Status Variant"
      description="SAP Customizing Table (V_001_M): Assigns company codes to field status variants (e.g. FFSV-1000) controlling field requirements on G/L postings."
      apiEndpoint="/api/assignments/field-status"
      companyCode={companyCode}
      primaryKeys={["company_code"]}
      columns={[
        {
          key: "company_code",
          label: "Company Code",
          type: "autocomplete",
          apiUrl: "/api/legal-entities",
          dataKey: "legalEntities",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Company Code (OX02)"
        },
        {
          key: "field_status_variant_code",
          label: "Field Status Variant",
          type: "autocomplete",
          apiUrl: "/api/field-status-variants",
          dataKey: "fieldStatusVariants",
          codeField: "code",
          required: true,
          placeholder: "Select Variant (OBC4 / FFSV)"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OBC4", label: "Field Status Variant (FFSV)", route: "/fico/field-status-variants", description: "Define Field Status Variant" },
        { code: "FFSG", label: "Field Status Groups", route: "/fico/field-status-groups", description: "Field Groups" }
      ]}
    />
  );
}
