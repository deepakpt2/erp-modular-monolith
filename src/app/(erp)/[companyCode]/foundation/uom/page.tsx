"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EUOC"
      sapAlias="CUNI"
      title="Units of Measure – Base UoM – KG/PC/BOX"
      description="Define Units of Measure – base UoM – e.g., KG Kilogram, PC Piece, BOX Box, L Liter, M Meter, BAG Bag – strict industry standard: base unit in material master – used in PO, SO, GR, inventory – conversion – e.g., 1 BOX = 10 KG, 1 KG = 1000 G – UoM – own names – CUNI"
      apiEndpoint="/api/uom"
      initialForm={{ code: '', name: '', symbol: '', is_base: 'true', base_uom_code: '', conversion_factor: '1', description: '' }}
      fields={[
        { key: "code", label: "UOM_CODE", required: true, placeholder: "KG", description: "UoM code – e.g., KG Kilogram, PC Piece, BOX Box, L Liter, M Meter, BAG Bag – base UoM – industry standard – own name – EUOC – base unit in material master – used in PO, SO, GR, inventory" },
        { key: "name", label: "UOM_NAME", required: true, placeholder: "Kilogram", description: "UoM name – e.g., Kilogram – descriptive – used in material master" },
        { key: "symbol", label: "UOM_SYMBOL", placeholder: "kg", description: "UoM symbol – e.g., kg for KG, pc for PC – display – industry standard" },
        { key: "is_base", label: "IS_BASE_UOM", type: "select", options: ["true", "false"], placeholder: "true", description: "Is base UoM – true if base unit – e.g., KG base, BOX not base with conversion 1 BOX = 10 KG – industry standard – base UoM" },
        { key: "base_uom_code", label: "BASE_UOM_CODE", type: "autocomplete", apiUrl: "/api/uom", dataKey: "uoms", codeField: "code", placeholder: "KG", createUrl: "/foundation/uom", createCode: "EUOC", description: "Base UoM code – e.g., KG – for conversion – if is_base false, base_uom_code required + conversion_factor – e.g., BOX base KG factor 10 means 1 BOX = 10 KG – industry standard – UoM conversion" },
        { key: "conversion_factor", label: "CONVERSION_FACTOR", placeholder: "1", description: "Conversion factor – e.g., 10 – 1 BOX = 10 KG – factor – industry standard – conversion – e.g., 1 BOX = 10 KG, 1 KG = 1000 G" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Kilogram – KG – base UoM – used in material master – conversion 1 BOX = 10 KG", description: "Description – UoM purpose – e.g., Kilogram base UoM" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – EMTC – uses Base UoM – KG/PC – T0", route: "/foundation/materials", description: "Product – EMTC – base_uom KG/PC/BOX – base unit – used in PO, SO, GR, inventory – single source" },
        { code: "EMGC", label: "Product Categories – EMGC – CAT-SPICE – OMSF", route: "/foundation/material-categories", description: "Product Categories – EMGC OMSF" },
        { code: "EMTP", label: "Product Types – EMTP – RAW/FINISHED – OMS2", route: "/foundation/material-types", description: "Product Types – RAW/FINISHED – determines valuation class" },
        { code: "PPOC", label: "Purchase Order – ME21N – uses UoM – KG/PC – PO UoM", route: "/mm/po", description: "PO – UoM from material master – PO UoM" },
        { code: "LTCC", label: "Lot Control – batch/lot – uses UoM – KG/PC – lot", route: "/foundation/lots", description: "Lot – batch/lot – uses UoM – lot quantity in UoM" },
      ]}
    />
  );
}
