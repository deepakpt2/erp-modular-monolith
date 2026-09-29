# New Intuitive Helper Code System – Legal-Safe & Own IP

## Why New System?
- Old codes OX02, OX10, MM01, ME21N etc are SAP-identical → legal risk if used as primary
- Requirement: Helper codes kept as-is for search, but we need OUR OWN intuitive system as primary
- Solution: Dual system – new intuitive code is primary badge, old code kept as alias in search keywords + secondary muted badge

## Design Principles
1. **Intuitive**: Module-Object-Action readable by any user
2. **Hierarchical**: 3-4 parts, dash separated
3. **No SAP collision**: No OX, MM, ME, MIGO etc as primary
4. **Extensible**: Auto-generatable for new functions
5. **Searchable**: Old codes remain searchable via alias

## Format

```
<MODULE>-<OBJECT>-<ACTION>  OR  <MODULE>-<SUBMODULE>-<OBJECT>-<ACTION> for complex
```

- MODULE (3 letters):
  - FND = Foundation (Enterprise, Material, Partner, etc)
  - PUR = Procurement (MM-PUR)
  - INV = Inventory (MM-IM, MM-PI, Stock)
  - MFG = Manufacturing (PP)
  - SAL = Sales & Distribution (SD)
  - FIN = Financials (FICO FI)
  - CST = Costing & Controlling (FICO CO)
  - HRM = Human Resources (HR)
  - AUD = Audit & Workflow

- OBJECT (2-4 letters, intuitive):
  - Enterprise: CG=Company Group, LE=Legal Entity, CA=Control Area, FAC=Facility, IL=Inventory Location, PD=Procurement Division, BT=Buyer Team, CO=Commercial Org, SC=Sales Channel, PL=Product Line, PU=Profit Unit, CU=Cost Unit, BS=Business Segment, WH=Warehouse Site, DP=Dispatch Point, CC=Credit Policy, FC=Fiscal Calendar, PC=Posting Calendar
  - Material: MAT=Material/Item, CAT=Category, UOM=Unit, BCH=Batch
  - Procurement: PR=Purchase Requisition, PO=Purchase Order, GR=Goods Receipt, IV=Invoice Verification, STO=Stock Transport, PI=Physical Inventory
  - Manufacturing: BOM=Bill of Material, WC=Work Center, RTG=Routing, MRP=MRP, ORD=Production Order, KIT=Kitting
  - Sales: SO=Sales Order, DL=Delivery, BL=Billing
  - Financial: COA=Chart of Accounts, GL=GL Account, TX=Tax, PAY=Payment, CUR=Currency
  - HR: ORG=Org Unit, POS=Position, EMP=Employee, PAY=Payroll
  - Audit: FLOW=Document Flow, LOG=Audit Log, WF=Workflow

- ACTION (2 letters):
  - CR = Create
  - CH = Change / Edit
  - DP = Display / View
  - LS = List / Overview / Report
  - PS = Post / Process
  - RL = Release / Approve

Examples:
- FND-CG-CR = Foundation Company Group Create (old OX15)
- FND-LE-CR = Foundation Legal Entity Create (old OX02)
- FND-LE-CH = Foundation Legal Entity Change
- FND-FAC-CR = Foundation Facility Create (old OX10)
- FND-IL-CR = Foundation Inventory Location Create (old OX09)
- FND-PD-CR = Foundation Procurement Division Create (old OX08)
- FND-BT-CR = Foundation Buyer Team Create (old OME4)
- FND-CO-CR = Foundation Commercial Org Create (old OVX2)
- FND-SC-CR = Foundation Sales Channel Create (old OVX1)
- FND-PL-CR = Foundation Product Line Create (new ORG-PL-01)
- FND-PU-CR = Foundation Profit Unit Create (new ORG-PU-01)
- FND-CU-CR = Foundation Cost Unit Create (old KS01)
- FND-BS-CR = Foundation Business Segment Create (new ORG-BS-01)
- FND-WH-CR = Foundation Warehouse Site Create (new ORG-WH-01)
- FND-DP-CR = Foundation Dispatch Point Create (new ORG-DP-01)

Procurement:
- PUR-PR-CR = Procurement Purchase Requisition Create (old ME51N)
- PUR-PR-CH = Change PR (ME52N)
- PUR-PR-DP = Display PR (ME53N)
- PUR-PO-CR = Purchase Order Create (ME21N)
- PUR-PO-CH = Change PO (ME22N)
- PUR-PO-DP = Display PO (ME23N)
- INV-GR-PS = Inventory Goods Receipt Post (MIGO 101)
- PUR-IV-PS = Procurement Invoice Verification Post (MIRO)

Manufacturing:
- MFG-BOM-CR = Manufacturing BOM Create (CS01)
- MFG-WC-CR = Work Center Create (CR01)
- MFG-RTG-CR = Routing Create (CA01)
- MFG-MRP-PS = MRP Run Post (MD01)

Sales:
- SAL-SO-CR = Sales Order Create (VA01)
- SAL-DL-CR = Delivery Create (VL01N)
- SAL-BL-PS = Billing Post (VF01)

Financial:
- FIN-COA-CR = Financial Chart of Accounts Create (OB13)
- FIN-GL-CR = GL Account Create (FS00)
- CST-CU-CR = Costing Cost Unit Create (KS01)
- FIN-TX-CR = Tax Code Create (FTXP)
- FIN-CUR-CR = Currency Create (OY03)

## Migration Plan

- Update FunctionCode interface to add `aliases?: string[]` and `newCode` as primary
- Primary `code` field will be new intuitive code (FND-LE-CR etc)
- Old SAP codes (OX02, MM01 etc) moved to `aliases` array + kept in keywords for search
- Search function updated to search aliases
- UI badge shows new code as primary (dark), old code as secondary muted if exists
- Existing routes keep working – search for OX02 still finds FND-LE-CR because OX02 in alias
- Auto-generation for new functions: use same pattern MODULE-OBJECT-ACTION with sequence if needed

## Full Mapping – Module 1 + Existing

| Old Code (alias) | New Intuitive Primary | Description | Route |
|---|---|---|---|
| OX15 | FND-CG-CR | Define Company Group | /foundation/enterprise-structure?tab=company-group |
| OX02 | FND-LE-CR | Define Legal Entity | ?tab=legal-entity |
| OX06 (new) | FND-CA-CR | Define Control Area | ?tab=control-area |
| OX10 | FND-FAC-CR | Define Facility | ?tab=facility |
| OX09 | FND-IL-CR | Define Inventory Location | ?tab=inventory-location |
| OX08 | FND-PD-CR | Define Procurement Division | ?tab=procurement |
| OME4 | FND-BT-CR | Define Buyer Team | ?tab=procurement |
| OVX2 | FND-CO-CR | Define Commercial Org | ?tab=commercial |
| OVX1 | FND-SC-CR | Define Sales Channel | ?tab=commercial |
| ORG-PL-01 | FND-PL-CR | Define Product Line | ?tab=commercial |
| ORG-PU-01 | FND-PU-CR | Define Profit Unit | ?tab=profit |
| KS01 | FND-CU-CR | Define Cost Unit | ?tab=cost |
| ORG-BS-01 | FND-BS-CR | Define Business Segment | ?tab=segment |
| ORG-WH-01 | FND-WH-CR | Define Warehouse Site | ?tab=warehouse |
| ORG-DP-01 | FND-DP-CR | Define Dispatch Point | ?tab=dispatch |
| OB45 | FIN-CC-CR | Define Credit Policy Area | /fico/company-master |
| OB29 | FIN-FC-CR | Define Fiscal Calendar | |
| OBBO | FIN-PC-CR | Define Posting Calendar | |
| MM01 | FND-MAT-CR | Create Material | /foundation/materials?mode=create |
| MM02 | FND-MAT-CH | Change Material | ?mode=change |
| MM03 | FND-MAT-DP | Display Material | ?mode=display |
| MMBE | INV-STK-DP | Stock Overview | /foundation/stock |
| ME51N | PUR-PR-CR | Create Purchase Requisition | /mm/pr?mode=create |
| ME21N | PUR-PO-CR | Create Purchase Order | /mm/po?mode=create |
| MIGO | INV-GR-PS | Goods Receipt Post | /mm/gr?mode=101 |
| MIRO | PUR-IV-PS | Invoice Verification Post | /mm/iv?mode=create |
| VA01 | SAL-SO-CR | Create Sales Order | /sales?mode=create |
| VL01N | SAL-DL-CR | Create Delivery | /sd/delivery |
| VF01 | SAL-BL-PS | Create Billing | /sd/billing |
| CS01 | MFG-BOM-CR | Create BOM | /pp/bom |
| CR01 | MFG-WC-CR | Create Work Center | /pp/work-centers |
| CA01 | MFG-RTG-CR | Create Routing | /pp/routings |
| KS01 (cost) | CST-CU-CR | Create Cost Unit | /fico/cost-centers (duplicate but okay) – will use FND-CU-CR as primary for foundation, CST-CU-CR for costing report |
| FTXP | FIN-TX-CR | Define Tax Code | /fico/tax-codes |
| OY03 | FIN-CUR-CR | Define Currency | /fico/currencies |
| CUNI | FND-UOM-CR | Define UoM | /foundation/uom |

## Auto-Generation Rule for New Functions

When new function implemented:
1. Determine MODULE (FND, PUR, INV, MFG, SAL, FIN, CST, HRM, AUD)
2. Determine OBJECT (2-4 letters intuitive)
3. Determine ACTION (CR, CH, DP, LS, PS, RL)
4. Check if code exists – if exists, add sequence: FND-LE-CR-02 etc
5. Add entry to FUNCTIONS with new code as primary, old SAP code (if any) as alias
6. Helper code badge will show new code

## Implementation Steps

1. Update FunctionCode interface: add aliases?: string[]
2. Update all FUNCTIONS entries: code = new intuitive, aliases = [old code], keywords include old code
3. Update searchFunctions to search aliases
4. Update UI components that show code badge to show new code primary + old alias secondary muted
5. Update enterprise-structure page tabs to show new codes as primary
6. Build and push

