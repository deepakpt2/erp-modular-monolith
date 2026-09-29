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

| **New 4-Char Primary (black badge)** | 3-Char Alias | Long Alias (8-char) | Old SAP Alias | Function (destination) | Module Grouped? | Length |
|---|---|---|---|---|---|---|
| **ECGC** | CGC | FND-CG-CR | OX15 | Company Group Create | E=Enterprise | 4 = OX02 |
| **ELEC** | LEC | FND-LE-CR | OX02 | **Legal Entity Create** | E=Enterprise | 4 = OX02 |
| **ECAC** | CAC | FND-CA-CR | OX06 | Control Area Create | E=Enterprise | 4 |
| **EFCC** | FCC | FND-FAC-CR | OX10 | Facility Create | E=Enterprise | 4 = OX10 |
| **EILC** | ILC | FND-IL-CR | OX09 | Inventory Location Create | E=Enterprise | 4 = OX09 |
| **EPDC** | PDC | FND-PD-CR | OX08 | Procurement Division Create | E=Enterprise | 4 = OX08 |
| **EBTC** | BTC | FND-BT-CR | OME4 | Buyer Team Create | E=Enterprise | 4 = OME4 |
| **ECOC** | COC | FND-CO-CR | OVX2 | Commercial Org Create | E=Enterprise | 4 = OVX2 |
| **ESCC** | SCC | FND-SC-CR | OVX1 | Sales Channel Create | E=Enterprise | 4 = OVX1 |
| **EPLC** | PLC | FND-PL-CR | - | Product Line Create | E=Enterprise | 4 |
| **EPUC** | PUC | FND-PU-CR | - | Profit Unit Create | E=Enterprise | 4 |
| **ECUC** | CUC | FND-CU-CR | KS01 | Cost Unit Create | E=Enterprise (also C=Costing CCUC) | 4 = KS01 |
| **EBSC** | BSC | FND-BS-CR | - | Business Segment Create | E=Enterprise | 4 |
| **EWHC** | WHC | FND-WH-CR | - | Warehouse Site Create | E=Enterprise | 4 |
| **EDPC** | DPC | FND-DP-CR | - | Dispatch Point Create | E=Enterprise | 4 |
| **EMTC** | MTC | FND-MAT-CR | MM01 | **Material Create** | E=Enterprise | 4 = MM01 |
| **PPOC** | POC | PUR-PO-CR | ME21N | **PO Create** | P=Procurement | 4 < 5 (ME21N) |
| **PPRC** | PRC | PUR-PR-CR | ME51N | PR Create | P=Procurement | 4 < 5 |
| **IGRC** | GRC | INV-GR-PS | MIGO | Goods Receipt Create | I=Inventory | 4 = MIGO |
| **SSOC** | SOC | SAL-SO-CR | VA01 | Sales Order Create | S=Sales | 4 = VA01 |
| **SDLC** | DLC | SAL-DL-CR | VL01N | Delivery Create | S=Sales | 4 < 5 |
| **SBLC** | BLC | SAL-BL-PS | VF01 | Billing Create | S=Sales | 4 = VF01 |
| **MBMC** | BMC | MFG-BOM-CR | CS01 | BOM Create | M=Manufacturing | 4 = CS01 |
| **MWCC** | WCC | MFG-WC-CR | CR01 | Work Center Create | M=Manufacturing | 4 = CR01 |
| **MRTC** | RTC | MFG-RTG-CR | CA01 | Routing Create | M=Manufacturing | 4 = CA01 |
| **FCYC** | CYC | FIN-CUR-CR | OY03 | Currency Create | F=Financials | 4 = OY03 |
| **FTXC** | TXC | FIN-TX-CR | FTXP | Tax Create | F=Financials | 4 = FTXP |
| **EUOC** | UOC | FND-UOM-CR | CUNI | UoM Create | E=Enterprise | 4 = CUNI |
| **FCOA** | COA | FIN-COA-CR | OB13 | Chart of Accounts Create | F=Financials | 4 = OB13 |
| **FGLC** | GLC | FIN-GL-CR | FS00 | GL Create | F=Financials | 4 = FS00 |

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
