# Helper Code System – Short Module-Grouped 4-Char – Final V3

## Evolution
- Old SAP: OX02, MM01, ME21N – 4-5 chars, SAP IP risk, not module grouped intuitively
- V2: FND-LE-CR – 8 chars, too long, users won't type ❌
- V2.1: LEC – 3 chars, short but not module grouped ❌
- **V3 Final: ELEC – 4 chars, short + module grouped + intuitive ✅ – User selected 4char_module + c_e_v**

## Final Format: `MOOA` = Module(1) + Object(2) + Action(1) = 4 chars

- **Module (1st letter):**
  - E = Enterprise / Foundation (Company Group, Legal Entity, Facility, etc)
  - P = Procurement (PR, PO, STO)
  - I = Inventory (GR, Stock, Physical Inventory)
  - M = Manufacturing (BOM, Work Center, Routing, MRP)
  - S = Sales (SO, Delivery, Billing)
  - F = Financials (Chart, GL, Tax, Currency, Credit Policy, Fiscal)
  - C = Costing & Controlling (Cost Unit, Profit Unit, Costing Run)
  - H = HR (Employee, Payroll)
  - A = Audit & Workflow (Flow, Log)

- **Object (middle 2 letters, intuitive):**
  - CG = Company Group, LE = Legal Entity, CA = Control Area, FC = Facility, IL = Inventory Location, PD = Procurement Division, BT = Buyer Team, CO = Commercial Org, SC = Sales Channel, PL = Product Line, PU = Profit Unit, CU = Cost Unit, BS = Business Segment, WH = Warehouse, DP = Dispatch Point, CP = Credit Policy, FY = Fiscal Year, PP = Posting Period, MT = Material, PR = Purchase Requisition, PO = Purchase Order, GR = Goods Receipt, IV = Invoice Verification, SO = Sales Order, DL = Delivery, BL = Billing, BM = BOM, WC = Work Center, RT = Routing, MR = MRP, ST = Stock, PI = Physical Inventory, CY = Currency, TX = Tax, UO = UoM, COA = Chart (3 letters but we use COA as special), GL = GL Account, etc

- **Action (last letter, c_e_v you selected):**
  - C = Create
  - E = Edit / Change
  - V = View / Display
  - L = List / Report
  - P = Post / Process
  - R = Release / Approve
  - A = Assign

## Examples – Short + Module Grouped + Intuitive

| **New 4-Char Primary (black badge)** | 3-Char Alias | Long Alias (8-char) | Old SAP Alias | Function (destination) | Module Grouped? | Length | Legal-Safe? |
|---|---|---|---|---|---|---|---|
| **ECGC** | CGC | FND-CG-CR | OX15 | Company Group Create | E=Enterprise | 4 = OX02 | ✅ Module1 |
| **ELEC** | LEC | FND-LE-CR | OX02 | **Legal Entity Create** | E=Enterprise | 4 = OX02 | ✅ Module1 |
| **ECAC** | CAC | FND-CA-CR | OX06 | Control Area Create | E=Enterprise | 4 | ✅ Module1 |
| **EFCC** | FCC | FND-FAC-CR | OX10 | Facility Create | E=Enterprise | 4 = OX10 | ✅ Module1 |
| **EILC** | ILC | FND-IL-CR | OX09 | Inventory Location Create | E=Enterprise | 4 = OX09 | ✅ Module1 |
| **EPDC** | PDC | FND-PD-CR | OX08 | Procurement Division Create | E=Enterprise | 4 = OX08 | ✅ Module1 |
| **EBTC** | BTC | FND-BT-CR | OME4 | Buyer Team Create | E=Enterprise | 4 = OME4 | ✅ Module1 |
| **ECOC** | COC | FND-CO-CR | OVX2 | Commercial Org Create | E=Enterprise | 4 = OVX2 | ✅ Module1 |
| **ESCC** | SCC | FND-SC-CR | OVX1 | Sales Channel Create | E=Enterprise | 4 = OVX1 | ✅ Module1 |
| **EPLC** | PLC | FND-PL-CR | - | Product Line Create | E=Enterprise | 4 | ✅ Module1 |
| **EPUC** | PUC | FND-PU-CR | - | Profit Unit Create | E=Enterprise | 4 | ✅ Module1 |
| **ECUC** | CUC | FND-CU-CR | KS01 | Cost Unit Create | E=Enterprise (also C=Costing CCUC) | 4 = KS01 | ✅ Module1 |
| **EBSC** | BSC | FND-BS-CR | - | Business Segment Create | E=Enterprise | 4 | ✅ Module1 |
| **EWHC** | WHC | FND-WH-CR | - | Warehouse Site Create | E=Enterprise | 4 | ✅ Module1 |
| **EDPC** | DPC | FND-DP-CR | - | Dispatch Point Create | E=Enterprise | 4 | ✅ Module1 |
| **EMTC** | MTC | FND-MAT-CR | MM01 | **Product Create – Legal-safe (was Material Create)** – prod_item.item_number (was material_number) | E=Enterprise | 4 = MM01 | ✅ Module2 – Legal-safe prod_item |
| **EMTE** | MTE | FND-MAT-CH | MM02 | Product Edit – Legal-safe (was Material Change) | E=Enterprise | 4 = MM02 | ✅ Module2 |
| **EMTV** | MTV | FND-MAT-DP | MM03 | Product View – Legal-safe (was Material Display) | E=Enterprise | 4 = MM03 | ✅ Module2 |
| **EMTL** | MTL | FND-MAT-LS | MM60 | Product List – Legal-safe (was Material Overview) | E=Enterprise | 4 = MM60 | ✅ Module2 |
| **EMTP** | MTP | FND-MT-CR | OMS2 | **Product Type Create – Legal-safe RAW/FINISHED/SEMI (was Material Types ROH/FERT/HALB)** – prod_item_type | E=Enterprise | 4 = OMS2 | ✅ Module2 – ROH→RAW, FERT→FINISHED, HALB→SEMI |
| **EMGC** | MGC | FND-MG-CR | OMSF | Product Category Create – Legal-safe (was Material Groups) – prod_category | E=Enterprise | 4 = OMSF | ✅ Module2 |
| **EUOC** | UOC | FND-UOM-CR | CUNI | **UoM Create – Legal-safe core_unit_measure KG/L/PC/BOX sample kept (was CUNI)** | E=Enterprise | 4 = CUNI | ✅ Module2 – sample kept |
| **ELTC** | LTC | FND-LOT-CR | MSC3N | Lot Create – Legal-safe inv_lot.lot_number (was Batch) | E=Enterprise | 4 | ✅ Module2 – Batch→Lot |
| **PPOC** | POC | PUR-PO-CR | ME21N | **PO Create** | P=Procurement | 4 < 5 (ME21N) | ⏳ Module6 |
| **PPRC** | PRC | PUR-PR-CR | ME51N | PR Create | P=Procurement | 4 < 5 | ⏳ Module6 |
| **IGRC** | GRC | INV-GR-PS | MIGO | Goods Receipt Create | I=Inventory | 4 = MIGO | ⏳ Module6 |
| **SSOC** | SOC | SAL-SO-CR | VA01 | Sales Order Create | S=Sales | 4 = VA01 | ⏳ Module8 |
| **SDLC** | DLC | SAL-DL-CR | VL01N | Delivery Create | S=Sales | 4 < 5 | ⏳ Module8 |
| **SBLC** | BLC | SAL-BL-PS | VF01 | Billing Create | S=Sales | 4 = VF01 | ⏳ Module8 |
| **MBMC** | BMC | MFG-BOM-CR | CS01 | BOM Create | M=Manufacturing | 4 = CS01 | ⏳ Module7 |
| **MWCC** | WCC | MFG-WC-CR | CR01 | Work Center Create | M=Manufacturing | 4 = CR01 | ⏳ Module7 |
| **MRTC** | RTC | MFG-RTG-CR | CA01 | Routing Create | M=Manufacturing | 4 = CA01 | ⏳ Module7 |
| **FCYC** | CYC | FIN-CUR-CR | OY03 | Currency Create | F=Financials | 4 = OY03 | ✅ Module1 |
| **FTXC** | TXC | FIN-TX-CR | FTXP | Tax Create | F=Financials | 4 = FTXP | ✅ Module1 |
| **FCOA** | COA | FIN-COA-CR | OB13 | Chart of Accounts Create | F=Financials | 4 = OB13 | ✅ Module1 |
| **FGLC** | GLC | FIN-GL-CR | FS00 | GL Create | F=Financials | 4 = FS00 | ✅ Module1 |

### Module 2 – Product Catalog – Legal-Safe Mapping Details

| Old SAP-like Table/Field/Enum | New Legal-Safe Own IP | Helper Code | Notes |
|---|---|---|---|
| ent_material_master | prod_item | EMTC | central master with contextual views |
| material_number | item_number | EMTC | neutral item_number |
| base_uom | base_unit | EUOC | core_unit_measure |
| ent_material_group | prod_category | EMGC | category_code FOOD/SPICE sample kept |
| ent_uom | core_unit_measure | EUOC | KG/G/L/ML/PC/BOX/PACK/KIT/M/TON sample kept – fresh empty but common sample kept |
| ent_material_type | prod_item_type | EMTP | configurable |
| ROH | RAW | EMTP | Raw Material – legal-safe |
| FERT | FINISHED | EMTP | Finished Goods – legal-safe |
| HALB | SEMI | EMTP | Semi-Finished – legal-safe |
| HAWA | TRADING | EMTP | Trading Goods – legal-safe |
| VERP | PACKAGING | EMTP | Packaging – legal-safe |
| NLAG | CONSUMABLE | EMTP | Non-Stock – legal-safe |
| DIEN | SERVICE | EMTP | Service – legal-safe |
| ent_material_plant | prod_facility_profile | EMTC | facility_id (was plant_id) |
| price_control S/V | pricing_method STANDARD/MOVING_AVG | EMTC | legal-safe |
| expiry_control BLOCK/WARNING/RESTRICTED_USE | lot_control BLOCKED/WARN/RESTRICTED | EMTC | legal-safe |
| mrp_type PD/ND/VB/VM | planning_type MRP/NO_PLANNING/MANUAL_REORDER/REORDER_POINT | EMTC | legal-safe |
| lot_size EX/FX/HB | lot_sizing LOT_FOR_LOT/FIXED/MAX_LEVEL | EMTC | legal-safe |
| procurement_type F/E/X | procurement_method BUY/MAKE/BOTH | EMTC | legal-safe |
| purchasing_group | buyer_group | EMTC | BUY-001 alias 001 |
| purchasing_org | procurement_division | EMTC | PD-1000 alias 1000 |
| ent_material_sales | prod_commercial_profile | EMTC | commercial_org (was sales_org) |
| sales_org VKORG | commercial_org CO-1000 | EMTC | legal-safe |
| distribution_channel VTWEG | sales_channel CH-10 | EMTC | legal-safe |
| division SPART | product_line PL-00 | EMTC | legal-safe |
| sales_uom | commercial_unit | EMTC | EUOC |
| delivering_plant | fulfilling_facility | EMTC | org_facility |
| ent_material_classification | prod_item_classification | EMTC | class_type BATCH/MATERIAL (was 001/023) |
| ent_material_quality | prod_quality_profile | EMTC | quality_control_key QC-001 (was qm_control_key 0001) |
| qm_control_key 0001 | quality_control_key QC-001 | EMTC | legal-safe |
| inspection_type 01 | inspection_type RECEIPT | EMTC | legal-safe |
| is_qm_active | is_quality_active | EMTC | legal-safe |
| ent_batch | inv_lot | ELTC | lot_number (was batch_number) |
| batch_number | lot_number | ELTC | inv_lot.lot_number |
| Fresh empty for items, sample UoM/Category kept | - | - | INR default, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Currencies INR, UoM KG/L/PC/BOX – as per requirement fresh empty but common sample data kept for user convenience |


## Why 4-Char Module-Grouped Works
- **Short**: 4 chars = same length as OX02, MM01, ME21N – easy to type, not 8-char FND-LE-CR
- **Module grouped**: First letter tells module – E=Enterprise, P=Procurement, I=Inventory, M=Manufacturing, S=Sales, F=Financials, C=Costing, H=HR, A=Audit – you can filter by module: all E* are Enterprise, all P* are Procurement, all S* are Sales
- **Intuitive**: Middle 2 letters = object, last = action – ELEC = Enterprise Legal Entity Create, you can guess LE=Legal Entity, C=Create
- **Own IP**: ECGC, ELEC, PPOC etc are not SAP codes, we own them
- **Searchable**: Old codes OX02, MM01, ME21N, long FND-LE-CR, short LEC all kept as aliases – typing any finds same function

## Action Variants (c_e_v pattern you selected)
- **C** = Create – ELEC = Legal Entity Create
- **E** = Edit – ELEE = Legal Entity Edit (Enterprise Legal Edit)
- **V** = View – ELEV = Legal Entity View
- **L** = List – ELEL = Legal Entity List
- **P** = Post – IGRC = Inventory GR Create/Post, PIVC = Procurement IV Post
- **R** = Release – PPRL = PR Release, PPOR = PO Release

Example for Legal Entity:
- ELEC = Create
- ELEE = Edit (E + LE + E)
- ELEV = View (E + LE + V)
- ELEL = List (E + LE + L)

Example for PO:
- PPOC = Create (P + PO + C)
- PPOE = Edit (P + PO + E)
- PPOV = View (P + PO + V)
- PPOL = List (P + PO + L) – if needed

## Auto-Generation for New Functions
When new function implemented:
1. Module: E/P/I/M/S/F/C/H/A
2. Object: 2 letters intuitive, e.g., WH=Warehouse, DP=Dispatch Point
3. Action: C/E/V/L/P/R/A
4. Combine: MOOA = 4-char, e.g., EWHC = Enterprise Warehouse Create
5. Check uniqueness – if exists, add number or use 5-char
6. Add to FUNCTIONS: code: EWHC, aliases: [old SAP code if any, long FND-WH-CR, short WHC]
7. Badge shows EWHC primary, aliases secondary

## Implementation Done
- lib/functions.ts: all codes now 4-char module grouped primary, aliases include 3-char short (LEC), long (FND-LE-CR), old SAP (OX02, MM01 etc)
- kernel/functions.ts: same 4-char primary with aliases
- UI: badges show 4-char primary + aliases, enterprise-structure tabs show 4-char primary
- Search: searches primary + all aliases
- Build passes 76 routes
