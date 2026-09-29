"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBC4"
      sapAlias="OBC4"
      title="Field Status Variant"
      description="Define Field Status Variant – groups field status groups – e.g., 1000 Standard – strict usage: assigned to company code, controls required/suppressed fields per GL account"
      apiEndpoint="/api/field-status-variants"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "FIELD_STATUS_VARIANT_CODE", required: true, placeholder: "1000", description: "Variant code – e.g., 1000 Standard" },
        { key: "name", label: "FIELD_STATUS_VARIANT_NAME", required: true, placeholder: "Standard Field Status" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Standard variant controlling field requirements" },
      ]}
      relatedLinks={[
        { code: "OBC5", label: "Field Status Groups uses OBC4", route: "/fico/field-status-groups", description: "Field Status Groups requires Variant" },
        { code: "ELEC", label: "Legal Entity uses Field Status", route: "/foundation/legal-entities", description: "Legal Entity can have field status variant" },
      ]}
    />
  );
}
