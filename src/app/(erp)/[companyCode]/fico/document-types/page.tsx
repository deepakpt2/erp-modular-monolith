"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function DocumentTypesPage() {
  return (
    <SingleCodePage
      code="OBA7"
      sapAlias="OBA7"
      title="Document Types – Financial Accounting"
      description="Industry Standard Configuration  Defines Document Types used to classify accounting transactions (e.g., SA for G/L Postings, KR for Vendor Invoices, KZ for Vendor Payments, DR for Customer Invoices). Assigns the Number Range interval (e.g. 01, 10, 19), reverse document type, allowed account types, and control indicators."
      apiEndpoint="/api/document-types"
      referenceConfig={{
        keyField: "code",
        displayField: "name",
        label: "Create with Reference – Copy Document Type",
        excludedFields: ["code", "id", "created_at", "updated_at"]
      }}
      initialForm={{
        code: '',
        name: '',
        number_range_code: '01',
        reverse_document_type: '',
        is_allowed_asset: 'true',
        is_allowed_customer: 'true',
        is_allowed_vendor: 'true',
        is_allowed_material: 'true',
        is_allowed_gl: 'true',
        is_negative_posting_allowed: 'false',
        reference_required: 'false',
        doc_header_required: 'false',
        description: ''
      }}
      fields={[
        {
          key: "code",
          label: "DOCUMENT_TYPE",
          required: true,
          placeholder: "e.g. SA, KR, KZ, DR, DZ, RE, WA, WE",
          description: "2-character Document Type key (e.g. SA for General Ledger, KR for Vendor Invoice)"
        },
        {
          key: "name",
          label: "DOCUMENT_TYPE_NAME",
          required: true,
          placeholder: "e.g. G/L Account Document, Vendor Invoice",
          description: "Description of the document type"
        },
        {
          key: "number_range_code",
          label: "NUMBER_RANGE_INTERVAL",
          required: true,
          type: "autocomplete",
          apiUrl: "/api/number-ranges",
          dataKey: "numberRanges",
          codeField: "code",
          placeholder: "Select interval (e.g. 01, 10, 19, 50)",
          createUrl: "/fico/number-ranges",
          createCode: "FNRC",
          description: "2-character Number Range Interval maintained in FBN1 (e.g. 01 for 0100000000–0199999999)"
        },
        {
          key: "reverse_document_type",
          label: "REVERSE_DOCUMENT_TYPE",
          placeholder: "e.g. AB (Optional)",
          description: "Default document type used when reversing documents of this type"
        },
        {
          key: "is_allowed_gl",
          label: "ACCOUNT_TYPE_GL_ALLOWED",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Account Type Allowed: G/L Accounts"
        },
        {
          key: "is_allowed_vendor",
          label: "ACCOUNT_TYPE_VENDOR_ALLOWED",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Account Type Allowed: Vendor (K)"
        },
        {
          key: "is_allowed_customer",
          label: "ACCOUNT_TYPE_CUSTOMER_ALLOWED",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Account Type Allowed: Customer (D)"
        },
        {
          key: "is_allowed_asset",
          label: "ACCOUNT_TYPE_ASSET_ALLOWED",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Account Type Allowed: Asset (A)"
        },
        {
          key: "is_allowed_material",
          label: "ACCOUNT_TYPE_MATERIAL_ALLOWED",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Account Type Allowed: Material (M)"
        },
        {
          key: "reference_required",
          label: "REFERENCE_NUMBER_REQUIRED",
          required: true,
          type: "select",
          options: ["false", "true"],
          description: "Control Data: Reference number is mandatory during posting"
        },
        {
          key: "doc_header_required",
          label: "DOC_HEADER_TEXT_REQUIRED",
          required: true,
          type: "select",
          options: ["false", "true"],
          description: "Control Data: Document header text is mandatory during posting"
        },
        {
          key: "is_negative_posting_allowed",
          label: "NEGATIVE_POSTING_ALLOWED",
          required: true,
          type: "select",
          options: ["false", "true"],
          description: "Permits negative postings for reversal documents without inflating turnover"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "Statutory purpose or operational posting notes",
          description: "Business context and accounting policy notes"
        }
      ]}
      relatedLinks={[
        { code: "FBN1", label: "Number Ranges (FNRC)", route: "/fico/number-ranges", description: "Maintain Number Range Intervals" },
        { code: "FB01", label: "Post Document", route: "/fico/journal-entries", description: "Enter Financial Documents" },
        { code: "OB52", label: "Posting Period Control (FPPE)", route: "/fico/posting-periods", description: "Open/Close Posting Periods" },
      ]}
    />
  );
}
