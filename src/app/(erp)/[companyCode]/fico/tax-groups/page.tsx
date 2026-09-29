"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FTGC"
      sapAlias="OB40"
      title="Tax Groups"
      description="Define Tax Groups – group code rate – e.g., GST 18 percent – strict usage: groups tax codes for GL posting"
      apiEndpoint="/api/tax-groups"
      initialForm={{ code: '', name: '', rate: '18', description: '' }}
      fields={[
        { key: "code", label: "TAX_GROUP_CODE", required: true, placeholder: "GST-18" },
        { key: "name", label: "TAX_GROUP_NAME", required: true, placeholder: "GST 18%" },
        { key: "rate", label: "TAX_RATE", required: true, placeholder: "18", description: "Tax rate percent" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FTXC", label: "Tax Codes uses Tax Group", route: "/fico/tax-codes", description: "Tax Codes" },
      ]}
    />
  );
}
