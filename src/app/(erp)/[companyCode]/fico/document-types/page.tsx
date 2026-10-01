"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBA7"
      sapAlias="OBA7"
      title="Document Types"
      description="Define Document Types – e.g., SA GL posting, KA vendor invoice, KG vendor credit memo, RV customer invoice – strict usage: assigns number range, field status variant, reverse doc type"
      apiEndpoint="/api/document-types"
      initialForm={{ code: '', name: '', description: '', number_range_code: '' }}
      fields={[
        { key: "code", label: "DOCUMENT_TYPE_CODE", required: true, placeholder: "", description: "Doc type code – e.g., SA GL, KA vendor invoice, KG vendor credit, RV customer invoice, RE vendor invoice" },
        { key: "name", label: "DOCUMENT_TYPE_NAME", required: true, placeholder: "" },
        { key: "number_range_code", label: "NUMBER_RANGE_CODE", type: "autocomplete", apiUrl: "/api/number-ranges", dataKey: "numberRanges", codeField: "code", placeholder: "", createUrl: "/fico/number-ranges", createCode: "FNRC", description: "Number range FK – defines number range for this doc type – strict usage" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "FNRC", label: "Number Ranges – required", route: "/fico/number-ranges", description: "Number Range" },
        { code: "OBC4", label: "Field Status Variant", route: "/fico/field-status-variants", description: "Field Status Variant" },
        { code: "FPPE", label: "Posting Period Control", route: "/fico/posting-periods", description: "Posting period" },
      ]}
    />
  );
}
