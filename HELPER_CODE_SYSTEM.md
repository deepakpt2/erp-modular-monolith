# Helper Code System – Short Intuitive Own IP – Final

## Problem
- Old SAP codes OX02, MM01, ME21N etc are 4-5 chars but SAP IP risk
- First new system FND-LE-CR was 8 chars, too long, users won't type
- Need short + intuitive + own IP

## Final Solution: 3-Char Short Codes – Object + Action

**Format: `XXC` where XX = object (2 letters intuitive), C = action (Create), E = Edit, V = View, L = List**

- **CGC** = Company Group Create (alias OX15, FND-CG-CR)
- **LEC** = Legal Entity Create (alias OX02, FND-LE-CR) – 3 chars, same length as old OX02 but intuitive LE=Legal Entity, C=Create
- **CAC** = Control Area Create (alias OX06, FND-CA-CR)
- **FCC** = Facility Create (alias OX10, FND-FAC-CR) – FC=Facility, C=Create
- **ILC** = Inventory Location Create (alias OX09, FND-IL-CR)
- **PDC** = Procurement Division Create (alias OX08, FND-PD-CR)
- **BTC** = Buyer Team Create (alias OME4, FND-BT-CR)
- **COC** = Commercial Org Create (alias OVX2, FND-CO-CR)
- **SCC** = Sales Channel Create (alias OVX1, FND-SC-CR)
- **PLC** = Product Line Create (alias OVX5, FND-PL-CR)
- **PUC** = Profit Unit Create (alias KE51, FND-PU-CR)
- **CUC** = Cost Unit Create (alias KS01, FND-CU-CR, CST-CU-CR)
- **BSC** = Business Segment Create
- **WHC** = Warehouse Site Create
- **DPC** = Dispatch Point Create
- **CPC** = Credit Policy Create (alias OB45, FIN-CP-CR)
- **FYC** = Fiscal Calendar Create (alias OB29, FIN-FC-CR)
- **PPC** = Posting Calendar Create (alias OBBO, FIN-PC-CR)
- **MTC** = Material Create (alias MM01, FND-MAT-CR) – MT=Material, C=Create
- **MTE** = Material Edit (alias MM02)
- **MTV** = Material View (alias MM03)
- **MTL** = Material List (alias MM60)
- **STV** = Stock View (alias MMBE)
- **PRC** = Purchase Requisition Create (alias ME51N, PUR-PR-CR)
- **PRE** = PR Edit (alias ME52N)
- **PRV** = PR View (alias ME53N)
- **POC** = Purchase Order Create (alias ME21N, PUR-PO-CR) – 3 chars, intuitive PO=Purchase Order, C=Create
- **POE** = PO Edit (alias ME22N)
- **POV** = PO View (alias ME23N)
- **GRC** = Goods Receipt Create (alias MIGO, INV-GR-PS) – GR=Goods Receipt, C=Create
- **IVC** = Invoice Verification Create (alias MIRO, PUR-IV-PS)
- **SOC** = Sales Order Create (alias VA01, SAL-SO-CR) – SO=Sales Order, C=Create
- **DLC** = Delivery Create (alias VL01N, SAL-DL-CR)
- **BLC** = Billing Create (alias VF01, SAL-BL-PS)
- **BMC** = BOM Create (alias CS01, MFG-BOM-CR)
- **WCC** = Work Center Create (alias CR01, MFG-WC-CR)
- **RTC** = Routing Create (alias CA01, MFG-RTG-CR)
- **MRP** = MRP Run (alias MD01, MFG-MRP-PS) – 3 chars, already short
- **CUL** = Cost Unit List (alias KSB1, CST-CU-LS)
- **CYC** = Currency Create (alias OY03, FIN-CUR-CR)
- **TXC** = Tax Code Create (alias FTXP, FIN-TX-CR)
- **UOC** = UoM Create (alias CUNI, FND-UOM-CR)
- **COA** = Chart of Accounts Create (alias OB13, FIN-COA-CR)
- **GLC** = GL Account Create (alias FS00, FIN-GL-CR)

## Why 3-Char Works
- Same length as old 4-char OX02, MM01, ME21N (actually shorter: 3 vs 4-5)
- Intuitive: LE=Legal Entity, C=Create – you can guess LEC = Legal Entity Create
- Easy to type: 3 keystrokes vs 8 for FND-LE-CR
- Own IP: CGC, LEC, FCC etc are not SAP codes, we own them
- Extensible: Add E for Edit, V for View, L for List – LEE = Legal Entity Edit, LEV = Legal Entity View, LEL = Legal Entity List
- Searchable: Old codes OX02, MM01, ME21N, FND-LE-CR all kept as aliases in keywords + aliases array – search still works

## Dual Alias System
- Primary badge: black badge `↳ LEC` – new short own IP
- Secondary badge: muted `alias OX02, FND-LE-CR` – old codes searchable
- Search: typing OX02, FND-LE-CR, or LEC all find same function Define Legal Entity
- Command palette placeholder: "Search function: Create Purchase Order, LEC, POC, MTC... (alias OX02, ME21N, MM01 also work)"

## Auto-Generation for New Functions
When new function implemented:
1. Pick object 2 letters: e.g., WH=Warehouse, DP=Dispatch Point, CG=Company Group
2. Pick action 1 letter: C=Create, E=Edit, V=View, L=List, P=Post, R=Release
3. Combine: WHC = Warehouse Create, WHE = Warehouse Edit, WHV = View, WHL = List
4. Check uniqueness – if exists, add number: WHC2 etc
5. Add to FUNCTIONS with code: WHC, aliases: [old SAP code if any, long FND-WH-CR if previously used]
6. Badge shows WHC primary, aliases secondary

Example new:
- Profit Unit Create: PUC (already)
- Profit Unit Edit: PUE
- Profit Unit View: PUV
- Profit Unit List: PUL

## Full Mapping Table

| Short New (primary, 3-char) | Long New (alias, 8-char) | Old SAP (alias, 4-5-char) | Description |
|---|---|---|---|
| CGC | FND-CG-CR | OX15 | Company Group Create |
| LEC | FND-LE-CR | OX02 | Legal Entity Create |
| CAC | FND-CA-CR | OX06 | Control Area Create |
| FCC | FND-FAC-CR | OX10 | Facility Create |
| ILC | FND-IL-CR | OX09 | Inventory Location Create |
| PDC | FND-PD-CR | OX08 | Procurement Division Create |
| BTC | FND-BT-CR | OME4 | Buyer Team Create |
| COC | FND-CO-CR | OVX2 | Commercial Org Create |
| SCC | FND-SC-CR | OVX1 | Sales Channel Create |
| PLC | FND-PL-CR | OVX5 | Product Line Create |
| PUC | FND-PU-CR | KE51 | Profit Unit Create |
| CUC | FND-CU-CR | KS01 | Cost Unit Create |
| BSC | FND-BS-CR | - | Business Segment Create |
| WHC | FND-WH-CR | - | Warehouse Site Create |
| DPC | FND-DP-CR | - | Dispatch Point Create |
| MTC | FND-MAT-CR | MM01 | Material Create |
| POC | PUR-PO-CR | ME21N | Purchase Order Create |
| PRC | PUR-PR-CR | ME51N | Purchase Requisition Create |
| GRC | INV-GR-PS | MIGO | Goods Receipt Create |
| SOC | SAL-SO-CR | VA01 | Sales Order Create |

## Implementation Done
- lib/functions.ts: all codes now 3-char short primary, aliases include both long FND-* and old OX*/MM*/ME* codes
- kernel/functions.ts: same short primary with aliases
- UI: badges show short primary + alias secondary
- Search: searches primary + all aliases
- Build passes 76 routes
