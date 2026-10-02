"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OB37"
      sapAlias="FLFA"
      title="Assign Company Code to Fiscal Year Variant"
      description="Industry Standard Customizing: Connects statutory company codes to fiscal year calendars (e.g. K4 calendar year or V3 non-calendar April–March)."
      apiEndpoint="/api/assignments/fyv"
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
          key: "fiscal_year_variant_code",
          label: "Fiscal Year Variant",
          type: "autocomplete",
          apiUrl: "/api/fiscal-calendars",
          dataKey: "fiscalCalendars",
          codeField: "code",
          required: true,
          placeholder: "Select FYV (OB29 / FFYC)"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OB29", label: "Fiscal Calendar (FFYC)", route: "/fico/fiscal-calendars", description: "Define Fiscal Year Variant" }
      ]}
    />
  );
}
