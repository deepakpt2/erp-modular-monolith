"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ELTC"
      sapAlias="MSC3N"
      title="Lot Management – Batch/Lot – Expiry/Shelf Life – Storage"
      description="Define Lots – batch/lot numbers – expiry date, manufacturing date, vendor lot, shelf life days, lot control, kit, landed cost – strict industry standard: lot tracked in stock and GR – batch/lot capability where required – e.g., food, pharma – material with lot_control true requires lot in GR 101 and GI 261 – expiry managed – shelf life – storage/facility extension – storage holds all storage-related including kit, lot, batch, expiry, shelf_life – industry standard – own names – MSC3N"
      apiEndpoint="/api/lots"
      initialForm={{ 
        lot_number: '', 
        material_code: '', 
        facility_code: '', 
        inventory_location_code: 'SL01',
        vendor_lot_number: '',
        manufacturing_date: '2026-05-15',
        expiry_date: '2027-05-15', 
        shelf_life_days: '365',
        quantity: '100',
        uom_code: 'KG',
        is_kit: 'false',
        description: '' 
      }}
      fields={[
        { key: "lot_number", label: "LOT_NUMBER", required: true, placeholder: "", description: "Lot number – batch – e.g., LOT-1000, BATCH-2026-001 – batch/lot number – industry standard – own name – ELTC – batch/lot capability – material with lot_control true requires lot in GR 101 – e.g., MAT-SPICE-001 lot LOT-1000 expiry 2027-05-15" },
        { key: "material_code", label: "MATERIAL_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "", createUrl: "/foundation/materials", createCode: "EMTC", description: "Material code – e.g., 10000001 MAT-SPICE-001 – material that is lot-managed – EMTC – product master with lot_control true – industry standard – T0 BLOCKING" },
        { key: "facility_code", label: "FACILITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "", createUrl: "/foundation/facilities", createCode: "EFCC", description: "Facility – plant – e.g., 1000 – FAC-1000 – plant – storage location/facility – organisation – EFCC EFCC (legacy OX10) – lot belongs to facility + storage location" },
        { key: "inventory_location_code", label: "INVENTORY_LOCATION_CODE", type: "autocomplete", apiUrl: "/api/inventory-locations", dataKey: "inventoryLocations", codeField: "code", placeholder: "", createUrl: "/foundation/inventory-locations", createCode: "EILC", description: "Inventory location – storage location – e.g., SL01 Raw Materials – EILC EILC (legacy OX09) – storage location/facility – organisation – storage location – lot stored in facility + sloc" },
        { key: "vendor_lot_number", label: "VENDOR_LOT_NUMBER", placeholder: "", description: "Vendor lot number – supplier batch number – e.g., VEND-LOT-2026-001 – vendor lot – tracked from supplier – industry standard – vendor lot" },
        { key: "manufacturing_date", label: "MANUFACTURING_DATE", placeholder: "", description: "Manufacturing date – e.g., 2026-05-15 – mfg date – when lot produced – industry standard – mfg date" },
        { key: "expiry_date", label: "EXPIRY_DATE", placeholder: "", description: "Expiry date – e.g., 2027-05-15 – expiry – when lot expires – industry standard – expiry managed – FEFO first expiry first out – e.g., food, pharma – shelf life" },
        { key: "shelf_life_days", label: "SHELF_LIFE_DAYS", placeholder: "", description: "Shelf life days – e.g., 365 – days from mfg to expiry – shelf_life – storage-related – Basic only General, Storage holds all storage-related including kit, lot, batch, expiry, shelf_life – industry standard – ELTC" },
        { key: "quantity", label: "QUANTITY", placeholder: "", description: "Quantity – e.g., 100 – lot quantity – in UoM – e.g., 100 KG – stock quantity per lot" },
        { key: "uom_code", label: "UOM_CODE", type: "autocomplete", apiUrl: "/api/uom", dataKey: "uoms", codeField: "code", placeholder: "", createUrl: "/foundation/uom", createCode: "EUOC", description: "UoM code – e.g., KG – unit of measure – EUOC EUOC (legacy CUNI) – base UoM – lot quantity in UoM" },
        { key: "is_kit", label: "IS_KIT", type: "select", options: ["true", "false"], placeholder: "", description: "Is kit – true if lot is kit (assembly of components) – kit – storage-related – Basic only General, Storage holds all storage-related including kit, lot, batch, expiry, shelf_life – industry standard – kit & lot / batch & expiry should move to Storage as storage-related – ELTC" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – lot purpose – e.g., Lot for Black Pepper" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – EMTC – lot_control true – requires lot – T0", route: "/foundation/materials", description: "Product – EMTC – lot_control true – material is lot-managed – requires lot in GR 101 and GI 261 – e.g., spices, oils" },
        { code: "EFCC", label: "Facility – plant – 1000 – required – EFCC OX10", route: "/foundation/facilities", description: "Facility – plant – 1000 – FAC-1000 – plant – organisation – plant" },
        { code: "EILC", label: "Inventory Location – sloc – SL01 – EILC OX09", route: "/foundation/inventory-locations", description: "Inventory Location – storage location – SL01 Raw – organisation – storage location/facility" },
        { code: "EUOC", label: "Base UoM – EUOC – KG/PC/BOX – CUNI", route: "/foundation/uom", description: "Base UoM – EUOC EUOC (legacy CUNI) – KG/PC/BOX" },
        { code: "IGRC", label: "Goods Receipt – IGRC GR_PO (legacy IGRC (legacy MIGO) 101) – creates lot – batch", route: "/mm/gr", description: "GR 101 – creates lot if lot_control true – batch creation – lot number auto or manual" },
        { code: "FSTL", label: "Stock Ledger – material ledger – uses lot – batch stock", route: "/foundation/stock", description: "Stock Ledger – total stock/value, MAP, S/V, batch, lot – batch stock – lot tracked" },
        { code: "ISTV", label: "Stock – ISTV – uses Lot – batch stock", route: "/foundation/stock", description: "Stock – uses Lot – batch stock" },
      ]}
    />
  );
}
