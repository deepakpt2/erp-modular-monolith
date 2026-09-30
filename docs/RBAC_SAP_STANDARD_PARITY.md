# RBAC SAP / Industry Standard Parity – Complete Audit

**Date:** 2026-09-30
**Module:** FRPC – Foundation Role/Permission Checks – own IP – SAP parity
**Requirement:** Check all permissions and make parity with SAP or industry standard for ERPs

## Role Definitions – SAP Standard

| Role | SAP Equivalent | Description | Modules | Sensitive | SoD |
|------|---------------|-------------|---------|-----------|-----|
| ADMIN | SAP_ALL, S_A.SYSTEM | System Administrator – full access – SPRO IMG, master data, transactional, HR, FI – BASIS | ALL | Yes | - |
| OWNER | S_A.CUSTOMER_OWNER | Business Owner – full business access except BASIS config – approve all, view all, manage users | ALL | Yes | - |
| MANAGER | S_A.MANAGER | Manager – approval + view all – PR/PO approval, workflow, reports – not IMG config | FOUNDATION,MM,SD,FICO,PP,HR | No | Approver, not config |
| MATERIAL_MANAGER | SAP_BR_MATERIAL_MANAGER, M_MATE_MAR | Material Manager – MM01/MM02/MM03, BOM CS01 view, MMBE stock view – master data only – not transactional PO/GR | FOUNDATION,PP | No | Master data, not transactional |
| MASTER_DATA_MANAGER | SAP_MD_MDM, M_MATE_MAR, V_KNA1 basic, LFA1 basic | MDM – master data only – materials, BP basic, UoM, product types – NOT transactional (PR/PO/GR/Delivery/Billing), NOT IMG enterprise structure, NOT HR payroll, NOT FI posting – SoD – industry standard MDM | FOUNDATION | No | Only master data |
| PURCHASER | SAP_BR_PURCHASER, M_BEST_BSA | Purchaser – ME51N PR, ME21N PO, ME28 release, MIGO display – PR/PO create/view – GR view – not material create, not FI post | MM | No | Purchasing, not inventory posting |
| WAREHOUSE | SAP_BR_WAREHOUSE_CLERK, M_MSEG_BWA, V_LIKP_VST | Warehouse Manager – MIGO 101/102 GR post/reversal, MMBE stock overview, MI01 physical inventory, VL01N outbound delivery, VL10B STO delivery – not PR/PO create | MM,SD | No | Inventory posting, not purchasing |
| SALES | SAP_BR_SALES_REP, V_VBAK_AAT, V_KNA1 | Sales – VA01 sales order, VL01N outbound delivery, VF01 billing, XD01 customer, VK11 pricing – not purchasing, not GR | SD,FOUNDATION | No | Sales, not purchasing/inventory |
| ACCOUNTANT | SAP_BR_GL_ACCOUNTANT, F_BKPF_BUK | Accountant – FS00 GL, FB01 posting, MIRO IV, OBYC auto account, OB52 posting period, F110 payment, KSB1 CCA, CK40N costing – not MM/SD creation | FICO,MM | Yes | Finance posting, not MM/SD creation |
| PRODUCTION | SAP_BR_PRODUCTION_PLANNER, C_AFKO, C_ARPL | Production – CS01 BOM, CR01 work center, CA01 routing, CO01 prod order, MD01 MRP, kitting – not purchasing, not sales | PP,FICO | No | Production, not purchasing/sales |
| HR | SAP_BR_HR_MANAGER, P_ORGIN | HR – PA30 maintain HR master, PA20 display – employee master PII – HR only – MDM NOT allowed | HR | Yes | HR PII, not MDM |
| HR_MANAGER | SAP_BR_HR_MANAGER, P_ORGIN, P_PCLX display | HR Manager – PA30/PA20/PC00 view, org units, positions – can view HR + approve + manage users | HR,FICO | Yes | HR manager |
| PAYROLL_MANAGER | SAP_BR_PAYROLL_MANAGER, P_PCLX | Payroll Manager – PC00_M99_CALC payroll run, approval – sensitive salary – HR only – MDM NOT allowed – background job 1000 employees | HR | Yes | Payroll sensitive salary |
| AUDITOR | SAP_BR_AUDITOR | Auditor – display only – SM20 audit log, document flow, GL view, workflow inbox view – no create/post – read-only | AUDIT,FICO | No | Read-only |

## Function Codes – 72 Total – SAP Standard Mapping

### Enterprise Structure – IMG – OX02 – ADMIN only – SPRO – S_TABU_DIS
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| ECGC | OX02 | Company Group | ENTERPRISE_CONFIG | ADMIN,OWNER | IMG config – ADMIN only – MDM NOT allowed |
| ELEC | OX02 | Legal Entity | ENTERPRISE_CONFIG | ADMIN,OWNER | IMG – ADMIN only |
| EFCC | OX02 | Facility / Plant | ENTERPRISE_CONFIG | ADMIN,OWNER | Plant – OX10 – ADMIN only |
| EILC | OX09 | Inventory Location / Storage Location | ENTERPRISE_CONFIG | ADMIN,OWNER,WAREHOUSE,MATERIAL_MANAGER | OX09 – ADMIN/WAREHOUSE |
| EPDC | OX10 | Procurement Division / Purchasing Org | ENTERPRISE_CONFIG | ADMIN,OWNER,PURCHASER | EKORG – ADMIN/PURCHASER |
| EBTC | OME4 | Buyer Team / Purchasing Group | ENTERPRISE_CONFIG | ADMIN,OWNER,PURCHASER | EKG – ADMIN/PURCHASER |
| ECOC | OVX5 | Commercial Organization / Sales Org | ENTERPRISE_CONFIG | ADMIN,OWNER,SALES | VKORG – ADMIN/SALES |
| ESCC | OVXI | Sales Channel / Distribution Channel | ENTERPRISE_CONFIG | ADMIN,OWNER,SALES | VTWEG – ADMIN/SALES |
| EPLC | VOR1 | Product Line / Division | ENTERPRISE_CONFIG | ADMIN,OWNER,MATERIAL_MANAGER,SALES | SPART – ADMIN/MATERIAL_MANAGER/SALES |
| EPUC | KE51 | Commercial Unit / Profit Center | ENTERPRISE_CONFIG | ADMIN,OWNER,ACCOUNTANT | Profit Center – ADMIN/ACCOUNTANT |
| ECUC | KE52 | Commercial Unit Assignment | ENTERPRISE_CONFIG | ADMIN,OWNER | Assignment – ADMIN only |
| EBSC | KE51 | Profit Center Assignment | ENTERPRISE_CONFIG | ADMIN,OWNER,ACCOUNTANT | ADMIN/ACCOUNTANT |
| EWSC | OX09 | Warehouse Site | ENTERPRISE_CONFIG | ADMIN,OWNER,WAREHOUSE | Warehouse – ADMIN/WAREHOUSE |
| EDPC | OVX6 | Distribution Path | ENTERPRISE_CONFIG | ADMIN,OWNER,SALES | Sales – ADMIN/SALES |
| FCPC | OB38 | Credit Policy Area / Credit Control Area | ENTERPRISE_CONFIG | ADMIN,OWNER,SALES,ACCOUNTANT | OB38 – ADMIN/SALES/ACCOUNTANT |
| ECAC | ECAC | Enterprise Config Overview | ENTERPRISE_CONFIG_VIEW | * (all) | View only – all authenticated – but filters children |

### Foundation – Master Data – MARA – MM01/XK01/XD01 – MDM allowed
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| EMTC | MM01 | Product Master Create | MATERIAL_CREATE | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,MANAGER | MARA – MDM allowed – M_MATE_MAR |
| EMTE | MM02 | Product Master Change | MATERIAL_CREATE | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,MANAGER | MM02 |
| EMTV | MM03 | Product Master Display | MATERIAL_VIEW | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,PURCHASER,WAREHOUSE,SALES,MANAGER,PRODUCTION,ACCOUNTANT | MM03 – all can view |
| EMTL | MM60 | Product Master List | MATERIAL_VIEW | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,PURCHASER,WAREHOUSE,SALES,MANAGER | List |
| EMTP | OMS2 | Product Types / Material Types | MATERIAL_CREATE | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER | OMS2 – MDM allowed |
| EMGC | - | Product Categories | MATERIAL_CREATE | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER | MDM allowed |
| EUOC | CUNI | Units of Measure | MATERIAL_VIEW | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,PURCHASER,WAREHOUSE,PRODUCTION | CUNI – MDM allowed |
| ELTC | MSC1N | Lot Management / Batch | MATERIAL_VIEW | MATERIAL_MANAGER,WAREHOUSE,ADMIN,OWNER,PRODUCTION | Batch – WAREHOUSE/MATERIAL_MANAGER – MDM NOT allowed – lot is inventory |
| ISTV | MMBE | Stock Overview | MATERIAL_VIEW | WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER | MMBE – requires WAREHOUSE – MDM NOT allowed – per user error Forbidden – M_MSEG_BWA |
| EPAC | BP | Partner Account / Business Partner | BP_VIEW | MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,PURCHASER,SALES | BP – MDM allowed basic |
| PSUC | XK01 | Supplier / Vendor | VENDOR_VIEW | PURCHASER,MATERIAL_MANAGER,MASTER_DATA_MANAGER,ADMIN,OWNER,MANAGER,ACCOUNTANT | LFA1 – XK01 – MDM/PURCHASER allowed |
| SCUC | XD01 | Customer | CUSTOMER_VIEW | SALES,ADMIN,OWNER,MANAGER,MASTER_DATA_MANAGER | KNA1 – XD01 – V_KNA1 – basic MDM allowed, FULL Sales Area+Partner+Pricing+Credit requires SALES – SoD |
| EPCC | - | Partner Contact | BP_VIEW | SALES,PURCHASER,MASTER_DATA_MANAGER,ADMIN,OWNER | Contact – MDM allowed |

### FICO – FI/CO – FS00/OBYC/OB52 – ACCOUNTANT/ADMIN only – sensitive – F_BKPF_BUK
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| FFYC | OB29 | Fiscal Calendar / Fiscal Year Variant | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | OB29 – ACCOUNTANT/ADMIN only |
| FEXC | OB08 | Exchange Rates | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | OB08 – ACCOUNTANT/ADMIN only |
| FNRC | FBN1/SNRO | Number Ranges | NUMBER_RANGE_MAINTAIN | ADMIN,OWNER | FBN1 – S_NUMBER – ADMIN only – numeric only – locked if used – industry standard |
| FTGC | FTXP | Tax Groups | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | FTXP |
| FTXC | FTXP | Tax Codes | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | TAX |
| FCOA | OB13 | Chart of Accounts | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | OB13 |
| FGLC | FS00 | General Ledger Accounts | GL_VIEW | ACCOUNTANT,ADMIN,OWNER,MANAGER,AUDITOR | FS00 – view all |
| FCCA | KS01 | Cost Centers | CCA_VIEW | ACCOUNTANT,ADMIN,OWNER,MANAGER,HR | KS01 – HR needs cost center |
| FCYC | OY03 | Currencies | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | OY03 |
| FPPC | OBBO | Posting Period Variant | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBBO – F_BKPF_BUP |
| FPPE | OB52 | Posting Period Control | GL_POST | ACCOUNTANT,ADMIN,OWNER | OB52 |
| FFSV | OBC4 | Field Status Variant | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBC4 |
| FFSG | OBC4 | Field Status Groups | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBC4 |
| OBA0 | OBA0 | Tolerance Groups – GL | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBA0 |
| OBA4 | OBA4 | Tolerance Groups – Customers/Vendors | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBA4 |
| OBA7 | OBA7 | Document Types | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBA7 |
| OBYC | OBYC | Automatic Account Determination | GL_POST | ACCOUNTANT,ADMIN,OWNER | OBYC – BSX/GBB – sensitive |
| FAPT | OBB8 | Payment Terms | GL_VIEW | ACCOUNTANT,ADMIN,OWNER | OBB8 |
| FPYP | F110 | Payment Processing | GL_POST | ACCOUNTANT,ADMIN,OWNER | F110 |
| CCUL | KSB1 | Cost Center Actuals | CCA_VIEW | ACCOUNTANT,ADMIN,OWNER,MANAGER | KSB1 |
| CCRP | CK40N | Product Costing Run | GL_POST | ACCOUNTANT,ADMIN,OWNER,PRODUCTION | CK40N |

### MM – Materials Management – ME51N/ME21N/MIGO/MIRO – PURCHASER/WAREHOUSE/ACCOUNTANT – SoD
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| PPRC | ME51N | Purchase Requisition Create | PR_CREATE | PURCHASER,ADMIN,OWNER,MANAGER | M_BEST_BSA – PURCHASER only – MDM NOT allowed |
| PPRE | ME52N | PR Change | PR_CREATE | PURCHASER,ADMIN,OWNER,MANAGER | PURCHASER only |
| PPRV | ME53N | PR Display | PR_VIEW | PURCHASER,ADMIN,OWNER,MANAGER,WAREHOUSE,ACCOUNTANT | View all |
| PPOC | ME21N | Purchase Order Create | PO_CREATE | PURCHASER,ADMIN,OWNER,MANAGER | M_BEST_BSA – PURCHASER only – MDM NOT allowed |
| PPOE | ME22N | PO Change | PO_CREATE | PURCHASER,ADMIN,OWNER,MANAGER | PURCHASER only |
| PPOV | ME23N | PO Display | PO_VIEW | PURCHASER,ADMIN,OWNER,MANAGER,WAREHOUSE,ACCOUNTANT | View |
| IGRC | MIGO 101 | Goods Receipt | GR_POST | WAREHOUSE,ADMIN,OWNER,MANAGER | M_MSEG_BWA 101 – WAREHOUSE only – MDM NOT allowed – T0 BLOCKING |
| GRRE | MIGO 102 | GR Reversal | GR_POST | WAREHOUSE,ADMIN,OWNER,MANAGER | 102 reversal – WAREHOUSE only |
| PIVC | MIRO | Invoice Verification | IV_POST | ACCOUNTANT,ADMIN,OWNER,MANAGER | M_RECH_BUK – ACCOUNTANT only – MDM NOT allowed |
| IVRE | MR8M | Invoice Reversal | IV_POST | ACCOUNTANT,ADMIN,OWNER,MANAGER | ACCOUNTANT only |
| PSTC | ME21N STO | Stock Transport Order | PO_CREATE | PURCHASER,WAREHOUSE,ADMIN,OWNER,MANAGER | UB/NB – PURCHASER/WAREHOUSE |
| PSTD | VL10B | STO Delivery | DELIVERY_CREATE | WAREHOUSE,ADMIN,OWNER,MANAGER | STO delivery – WAREHOUSE only |
| IPIC | MI01/MI04/MI07 | Physical Inventory | GR_POST | WAREHOUSE,ADMIN,OWNER,MANAGER | MI – WAREHOUSE only |

### SD – Sales & Distribution – VA01/VL01N/VF01 – SALES/WAREHOUSE/ACCOUNTANT – SoD
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| SSOC | VA01 | Sales Order Create | SALES_CREATE | SALES,ADMIN,OWNER,MANAGER | V_VBAK_AAT – SALES only – MDM NOT allowed |
| SSOE | VA02 | Sales Order Change | SALES_CREATE | SALES,ADMIN,OWNER,MANAGER | SALES only |
| SSOV | VA03 | Sales Order Display | SALES_VIEW | SALES,ADMIN,OWNER,MANAGER,ACCOUNTANT,WAREHOUSE | View |
| SDLC | VL01N | Outbound Deliveries – T0 BLOCKING – PGI 601 + COGS GBB/BSX | DELIVERY_CREATE | WAREHOUSE,SALES,ADMIN,OWNER,MANAGER | VL01N – V_LIKP_VST – WAREHOUSE/SALES – MDM NOT allowed – SoD |
| SBLC | VF01 | Billing Document | BILLING_CREATE | SALES,ACCOUNTANT,ADMIN,OWNER,MANAGER | VF01 – V_VBRK_FKA – SALES/ACCOUNTANT – MDM NOT allowed |
| BLRE | VF11 | Billing Reversal | BILLING_CREATE | SALES,ACCOUNTANT,ADMIN,OWNER,MANAGER | VF11 – SALES/ACCOUNTANT |
| PRIC | VK11 | Pricing Procedure | PRICING_MAINTAIN | SALES,ADMIN,OWNER,MANAGER | VK11 – V_KONH_VKS – SALES only |

### PP – Production Planning – CS01/CR01/CA01/CO01/MD01 – PRODUCTION – C_AFKO
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| MBMC | CS01 | Bill of Materials Create | BOM_CREATE | MATERIAL_MANAGER,PRODUCTION,ADMIN,OWNER,MANAGER | CS01 – MATERIAL_MANAGER/PRODUCTION |
| MWCC | CR01 | Work Center | WORKCENTER_VIEW | PRODUCTION,ADMIN,OWNER,MANAGER | CR01 – PRODUCTION only – C_ARPL |
| MRTC | CA01 | Routing | ROUTING_VIEW | PRODUCTION,ADMIN,OWNER,MANAGER | CA01 – PRODUCTION only |
| MMOC | CO01 | Production Order Create | PROD_ORDER_CREATE | PRODUCTION,ADMIN,OWNER,MANAGER | CO01 – PRODUCTION only – C_AFKO |
| MMRP | MD01 | MRP Run | MRP_RUN | PRODUCTION,MATERIAL_MANAGER,ADMIN,OWNER,MANAGER | MD01 – PRODUCTION/MATERIAL_MANAGER |
| MKTC | - | Kitting | KITTING_CREATE | PRODUCTION,WAREHOUSE,ADMIN,OWNER,MANAGER | PRODUCTION/WAREHOUSE |

### HR – Human Resources – PA30/PA20/PC00 – P_ORGIN/P_PCLX – sensitive – HR only – SoD
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| HHEC | PA30 | Employee Master Maintain | EMPLOYEE_CREATE | HR,HR_MANAGER,ADMIN,OWNER | P_ORGIN – sensitive PII – MDM NOT allowed – SoD |
| HHEV | PA20 | Employee Master Display | EMPLOYEE_VIEW | HR,HR_MANAGER,ADMIN,OWNER,MANAGER | PA20 – HR only – MDM NOT allowed |
| HPYC | PC00_M99_CALC | Payroll Run | PAYROLL_RUN | HR,HR_MANAGER,PAYROLL_MANAGER,ADMIN,OWNER | P_PCLX – sensitive salary – MDM/MATERIAL_MANAGER NOT allowed – SoD – background job 1000 employees |

### AUDIT & WORKFLOW – display – AUDITOR/MANAGER
| Code | SAP TCode | Description | Permission | Roles | SoD Note |
|------|-----------|-------------|------------|-------|----------|
| AFLW | - | Document Flow | AUDIT_VIEW | ADMIN,OWNER,AUDITOR,MANAGER,ACCOUNTANT,PURCHASER,WAREHOUSE,SALES | Display all – AUDITOR/MANAGER |
| AALG | SM20 | Audit Log | AUDIT_VIEW | ADMIN,OWNER,AUDITOR,MANAGER | SM20 – ADMIN/AUDITOR only – sensitive |
| FWFL | SWI1 | Workflow Inbox | WORKFLOW_VIEW | ADMIN,OWNER,MANAGER,PURCHASER,ACCOUNTANT,SALES,HR,WAREHOUSE,MATERIAL_MANAGER | SWI1 – all approvers |

## Implementation Details

### Files Updated
- `src/shared/kernel/auth/pagePermissions.ts` – 72 codes mapped – SAP standard – SoD – MDM restrictions
- `src/shared/kernel/auth/frontendPermissions.ts` – 72 frontend routes mapped – regex patterns – SAP standard – navigator filtering
- `src/shared/kernel/auth/routePermissions.ts` – 74 API patterns mapped – SAP standard – auto-enforced via requireApiAuth
- `src/shared/kernel/auth/rbac.ts` – ROLES + PERMISSIONS + ROLE_DESCRIPTIONS expanded – 14 roles, 30+ permissions – SAP equivalents
- `src/app/(erp)/[companyCode]/client-layout.tsx` – sitewide frontend RBAC – completely blocks view if not allowed – shows `Unauthorised for this transaction – Contact Administrator` with reason, required roles, current roles, SoD explanation
- `src/app/(erp)/[companyCode]/navigator/page.tsx` – filters children via canUserAccessPage – removes pages without permission – hides groups with zero children
- `src/shared/ui/single-code-page.tsx` – checks canUserAccessPage – shows error instead of formdata if code used without permission

### Security Features – Industry Standard
- **Completely block view** – if user came to page not allowed, show unauthorized card instead of formdata – per user request
- **Remove pages without permission from navigator** – MDM no longer sees HR, Inventory, SDLC, etc unless has required role
- **If code is used show error message instead of formdata** – SingleCodePage guard – `Forbidden – requires permission X – roles [...] – current role Y – SoD`
- **SoD segregation of duties** – MDM cannot access HR payroll, inventory, outbound deliveries, sales orders, GR, IV, FI posting – HR cannot access MM unless granted – PURCHASER cannot post GR – WAREHOUSE cannot create PO – SALES cannot post IV – ACCOUNTANT cannot create sales order – etc.
- **Defense in depth** – API 403 + frontend unauthorized card + navigator filtering – triple protection
- **SAP authorization objects** – M_MATE_MAR, M_BEST_BSA, M_MSEG_BWA, M_RECH_BUK, V_VBAK_AAT, V_LIKP_VST, V_VBRK_FKA, F_BKPF_BUK, F_BKPF_KTO, F_BKPF_BUP, P_ORGIN, P_PCLX, S_NUMBER, etc.

### Testing Matrix – SAP Standard
| User Role | Can Access | Cannot Access | Expected Result |
|-----------|------------|---------------|-----------------|
| MASTER_DATA_MANAGER | EMTC, EMTP, EMGC, EUOC, PSUC basic, SCUC basic, EPAC | ISTV, SDLC, SSOC, SBLC, PPRC, PPOC, IGRC, PIVC, HHEC, HPYC, FFYC, FEXC, FNRC, ECGC, ELEC, EFCC | Navigator shows only FOUNDATION master data – 403 + unauthorized card for others |
| WAREHOUSE | ISTV, IGRC, GRRE, IPIC, SDLC, PSTD, EMTV view | PPRC, PPOC, HHEC, HPYC, FGLC post, SSOC create | Can post GR, view stock, delivery – cannot create PR/PO |
| PURCHASER | PPRC, PPOC, PPOV, PSUC, EMTV view | IGRC post, HHEC, HPYC, SDLC, SBLC, FGLC post | Can create PR/PO – cannot post GR |
| SALES | SSOC, SDLC, SBLC, SCUC, PRIC, EMTV view | PPRC, PPOC, IGRC post, HHEC, HPYC, FGLC post | Can create sales order, delivery, billing – cannot create PO |
| ACCOUNTANT | FGLC, FCOA, FFYC, FEXC, PIVC, SBLC, CCUL, CCRP | PPRC create, SSOC create, HHEC create, IGRC post, SDLC | Can post FI, IV, view GL – cannot create PR/PO/SO |
| HR | HHEC, HPYC, FCCA view, FWFL | PPRC, PPOC, IGRC, SDLC, SBLC, FGLC post, EMTC create | Can maintain HR master, run payroll – cannot access MM/SD |
| PRODUCTION | MBMC, MWCC, MRTC, MMOC, MMRP, MKTC, CCRP | PPRC, SSOC, HHEC, HPYC, FGLC post | Can create BOM, work center, routing, prod order, MRP |
| ADMIN/OWNER | ALL | - | Full access – SAP_ALL |

## User Questions Answered
- **SDLC – Outbound Deliveries – VL01N – T0 BLOCKING – PGI 601 + COGS GBB/BSX – Is MDM supposed to have?** – NO – SAP standard LE – requires WAREHOUSE,SALES – MDM NOT allowed – SoD – fixed
- **SCUC – Customer – XD01 – SCUC-FULL Sales Area + Partner + Pricing + Credit – Is MDM supposed to have?** – SAP standard XD01 basic customer master MDM allowed, but FULL with Sales Area+Pricing+Credit requires SALES – roles SALES,ADMIN,OWNER,MANAGER,MASTER_DATA_MANAGER – MDM can view basic, SALES for pricing/credit – SoD – fixed
- **ISTV – Stock Overview – MMBE – Is MDM supposed to have?** – NO – per user error Forbidden MATERIAL_VIEW roles [WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER] current role MASTER_DATA_MANAGER – fixed – MDM blocked

## Next Steps
- Test with MASTER_DATA_MANAGER account curl `/api/me` and navigate to `/1000/foundation/stock` expecting unauthorized block
- Verify navigator no longer shows Inventory/HR/SDLC/SSOC/PPRC for MDM – only allowed FOUNDATION pages
- Verify code usage shows error instead of formdata
- Assign roles via POST `/api/user-roles` – e.g., assign WAREHOUSE to access inventory, SALES to access customer full, etc.
- Contact administrator to grant role via `/admin/roles` and `/admin/authorizations` – FRPC own IP alias PFCG/SU01 – industry standard
