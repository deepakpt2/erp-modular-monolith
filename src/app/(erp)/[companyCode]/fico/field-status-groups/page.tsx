"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBC5"
      sapAlias="OBC5"
      title="Field Status Groups"
      description="Define Field Status Groups – defines which fields are required/suppressed/optional per GL group – strict usage: cost center required for expense GL, suppressed for cash"
      apiEndpoint="/api/field-status-groups"
      initialForm={{ variant_code: '1000', group_code: '', field_name: 'cost_center', status: 'R', description: '' }}
      fields={[
        { key: "variant_code", label: "FIELD_STATUS_VARIANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/field-status-variants", dataKey: "fieldStatusVariants", codeField: "code", placeholder: "1000", createUrl: "/fico/field-status-variants", createCode: "OBC4", description: "Variant FK – must exist via OBC4" },
        { key: "group_code", label: "FIELD_STATUS_GROUP_CODE", required: true, placeholder: "G001", description: "Group code – e.g., G001 expense, G002 cash" },
        { key: "field_name", label: "FIELD_NAME", required: true, type: "select", options: ['cost_center', 'profit_center', 'tax_code', 'payment_term', 'reference', 'text', 'assignment'], placeholder: "cost_center", description: "Field name – which field to control" },
        { key: "status", label: "STATUS", required: true, type: "select", options: ['R', 'S', 'O', 'D'], placeholder: "R", description: "R=Required, S=Suppressed, O=Optional, D=Display – strict enforcement" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Cost center required for expense accounts" },
      ]}
      relatedLinks={[
        { code: "OBC4", label: "Field Status Variant – required", route: "/fico/field-status-variants", description: "Variant" },
        { code: "FGLC", label: "GL Account uses Field Status", route: "/fico/gl-accounts", description: "GL Account has field status group" },
      ]}
    />
  );
}
