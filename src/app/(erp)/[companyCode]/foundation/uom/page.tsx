"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EUOC"
      sapAlias="CUNI"
      title="Units of Measure"
      description="Define Units of Measure – KG/L/PC/BOX – sample kept – strict usage: product base unit, conversion factors"
      apiEndpoint="/api/uom"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "UOM_CODE", required: true, placeholder: "KG" },
        { key: "name", label: "UOM_NAME", required: true, placeholder: "Kilogram" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product uses UOM", route: "/foundation/materials", description: "Product requires UOM" },
      ]}
    />
  );
}
