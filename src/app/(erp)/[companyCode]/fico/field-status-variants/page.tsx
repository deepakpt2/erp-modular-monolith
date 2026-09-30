"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FFSV"
      sapAlias="OBC4"
      title="Field Status Variant"
      description="Define Field Status Variant – groups field status groups – e.g., FFSV-1000 Standard – strict usage: assigned to company code, controls required/suppressed fields per GL account – per guide FFSV-1000 must exist before ELEC – Create Field Status Variant has form now with code to search FSSV/OBC4"
      apiEndpoint="/api/field-status-variants"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "FIELD_STATUS_VARIANT_CODE", required: true, placeholder: "FFSV-1000", description: "Variant code – e.g., FFSV-1000 per guide – 1000 Standard – searchable via FSSV or OBC4" },
        { key: "name", label: "FIELD_STATUS_VARIANT_NAME", required: true, placeholder: "Field Status Variant 1000 – India" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Field Status Variant for India – controls field status groups G001 etc – required before ELEC" },
      ]}
      relatedLinks={[
        { code: "FFSG", label: "Field Status Groups uses FSSV", route: "/fico/field-status-groups", description: "Field Status Groups requires Variant FFSV-1000 – OBC5" },
        { code: "FCOA", label: "Chart of Accounts CA-IN-01", route: "/fico/chart-of-accounts", description: "Chart of Accounts must exist before ELEC" },
        { code: "FFYC", label: "Fiscal Year Variant K4", route: "/fico/fiscal-calendars", description: "Fiscal Year Variant K4 must exist before ELEC" },
        { code: "FPPC", label: "Posting Period Variant PPV-1000", route: "/fico/posting-period-variants", description: "Posting Period Variant must exist before ELEC" },
        { code: "FCPC", label: "Credit Control Area CRED-1000", route: "/foundation/credit-policy-areas", description: "Credit Control Area must exist before OB13/ELEC" },
        { code: "ELEC", label: "Legal Entity uses Field Status FFSV-1000", route: "/foundation/legal-entities", description: "Legal Entity needs field_status_variant FFSV-1000 – must exist before ELEC" },
      ]}
    />
  );
}
