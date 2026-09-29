"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FAPT"
      sapAlias="FAPT"
      title="Payment Terms"
      description="Define Payment Terms – e.g., NT30 Net 30, 2 percent 10 Net 30 – strict usage: calculates due date from posting date + days – used in PO, SO, IV, Billing"
      apiEndpoint="/api/payment-terms"
      initialForm={{ code: '', name: '', days: '30', discount_percent: '0', discount_days: '0', description: '' }}
      fields={[
        { key: "code", label: "PAYMENT_TERM_CODE", required: true, placeholder: "NT30", description: "Payment term code – e.g., NT30, NT15, 2-10-N30" },
        { key: "name", label: "PAYMENT_TERM_NAME", required: true, placeholder: "Net 30 Days" },
        { key: "days", label: "DUE_DAYS", required: true, placeholder: "30", description: "Days until due – strict usage due date calc" },
        { key: "discount_percent", label: "DISCOUNT_PERCENT", placeholder: "0", description: "Discount percent if paid early" },
        { key: "discount_days", label: "DISCOUNT_DAYS", placeholder: "0", description: "Discount days – pay within this for discount" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Payment due 30 days from invoice" },
      ]}
      relatedLinks={[
        { code: "PPOC", label: "Purchase Order uses Payment Terms", route: "/mm/po", description: "PO" },
        { code: "SSOC", label: "Sales Order uses Payment Terms", route: "/sales", description: "SO" },
        { code: "SBLC", label: "Billing uses Payment Terms", route: "/sd/billing", description: "Billing" },
      ]}
    />
  );
}
