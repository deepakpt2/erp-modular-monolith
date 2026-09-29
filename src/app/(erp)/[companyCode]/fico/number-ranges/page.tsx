"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FNRC"
      sapAlias="FBN1"
      title="Number Ranges"
      description="Define Number Ranges – object type prefix current_number fiscal_year – atomic next via /api/number-ranges/next – strict usage: generates unique document numbers for PR PO GR IV SO DL BL etc."
      apiEndpoint="/api/number-ranges"
      initialForm={{ code: '', object_type: 'PR', prefix: 'PR-', current_number: '0', fiscal_year: '2026', description: '' }}
      fields={[
        { key: "code", label: "NUMBER_RANGE_CODE", required: true, placeholder: "PR-2026", description: "Number range code – e.g., PR-2026, PO-2026" },
        { key: "object_type", label: "OBJECT_TYPE", required: true, type: "select", options: ['PR', 'PO', 'GR', 'IV', 'SO', 'DL', 'BL', 'STO', 'PI', 'PROD', 'MRP', 'PAY', 'JRNL'], placeholder: "PR", description: "Object type – PR purchase requisition, PO purchase order, GR goods receipt, etc." },
        { key: "prefix", label: "PREFIX", required: true, placeholder: "PR-", description: "Prefix – e.g., PR- generates PR-5000000001" },
        { key: "current_number", label: "CURRENT_NUMBER", placeholder: "0", description: "Current number – starts at 0, increments atomically" },
        { key: "fiscal_year", label: "FISCAL_YEAR", placeholder: "2026", description: "Fiscal year – for fiscal year dependent number ranges" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "PPRC", label: "PR uses Number Range", route: "/mm/pr", description: "Purchase Requisition" },
        { code: "PPOC", label: "PO uses Number Range", route: "/mm/po", description: "Purchase Order" },
        { code: "IGRC", label: "GR uses Number Range", route: "/mm/gr", description: "Goods Receipt" },
        { code: "OBA7", label: "Document Types uses Number Range", route: "/fico/document-types", description: "Document Types" },
      ]}
    />
  );
}
