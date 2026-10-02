"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OBBP"
      sapAlias="FPPA"
      title="Assign Company Code to Posting Period Variant"
      description="Industry Standard Customizing: Connects company codes to posting period variants to control open/closed posting windows in OB52."
      apiEndpoint="/api/assignments/posting-period"
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
          key: "posting_period_variant_code",
          label: "Posting Period Variant",
          type: "autocomplete",
          apiUrl: "/api/posting-period-variants",
          dataKey: "postingPeriodVariants",
          codeField: "code",
          required: true,
          placeholder: "Select PPV (OBBO / FPPC)"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OBBO", label: "Posting Period Variant (FPPC)", route: "/fico/posting-period-variants", description: "Define Variant" },
        { code: "OB52", label: "Open / Close Periods (FPPE)", route: "/fico/posting-periods", description: "Period Controls" }
      ]}
    />
  );
}
