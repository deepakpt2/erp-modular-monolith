import os, re, glob

# Mapping: file path pattern -> (own_code, sap_alias, general_title, general_description, module)
mapping = {
    "mm/pr": ("PPRC", "ME51N", "Purchase Requests", "Create Purchase Request – internal material demand – raised by department – converted to Purchase Order – strict posting period + fiscal + workflow approval", "MM"),
    "mm/po": ("PPOC", "ME21N", "Purchase Orders", "Create Purchase Order – external procurement – vendor PO – references Purchase Request – updates PR converted, ELIKZ delivery completed – landed cost", "MM"),
    "mm/gr": ("IGRC", "MIGO", "Inventory Receipts", "Inventory Receipt 101 – inbound stock – facility + inventory location + lot – stock + value + – BSX inventory debit WRX GR/IR credit via OBYC – MAP recalc – movement 101 OMJJ – T0 BLOCKING", "MM"),
    "mm/iv": ("PIVC", "MIRO", "Invoice Verification", "Invoice Verification – vendor bill matching – PO + GR → IV – tolerance check OBA4 – WRX clearing – PRD price diff – auto account – strict", "MM"),
    "mm/physical-inventory": ("IPIC", "MI01", "Physical Inventory Documents", "Physical Inventory – count document – facility + inventory location + product – blocks 101/261/601 movements when active – count entry MI04 – post diff MI07 701/702 BSV", "MM"),
    "mm/sto": ("PSTC", "ME27", "Stock Transport Orders", "Stock Transport Order – inter-facility transfer – from facility to to facility – delivery VL10B – PGI 641 – GR 101 – intercompany billing", "MM"),
    "mm/sto-delivery": ("PSTD", "VL10B", "Stock Transport Shipments", "Process Stock Transport Shipment – delivery for STO – picking + PGI 641 – stock in transit", "MM"),
    "mm/gr-reversal": ("IGRC-REV", "MIGO-102", "Inventory Receipt Reversals", "Reversal of Inventory Receipt 101 – movement 102 – stock - value - – reverses BSX/WRX – immutable audit", "MM"),
    "mm/iv-reversal": ("PIVC-REV", "MIRO-REV", "Invoice Reversals", "Reversal of Invoice Verification – reverses WRX clearing", "MM"),
    "sales": ("SSOC", "VA01", "Sales Orders", "Create Sales Order – customer order – commercial org + sales channel + product line – pricing procedure + credit check FCPC + ATP availability – strict", "SD"),
    "sd/delivery": ("SDLC", "VL01N", "Outbound Deliveries", "Outbound Delivery – shipment – sales order → delivery – picking + packing – PGI 601 posts GBB COGS debit BSX credit via OBYC – MAP used – stock - – T0 BLOCKING", "SD"),
    "sd/billing": ("SBLC", "VF01", "Billing Documents", "Billing Document – customer invoice – delivery → billing – copy control VTFL – pricing + tax FTXC + due date FAPT + posting period FPPE + revenue account VKOA KOFI/KOFK chart+sales org+cust grp+mat grp → GL – Dr AR Cr Revenue+Tax – T0 BLOCKING", "SD"),
    "sd/billing-reversal": ("SBLC-REV", "VF11", "Billing Reversals", "Reversal of Billing – cancels invoice – reverses AR/Revenue/Tax – immutable audit", "SD"),
    "pp/bom": ("MBMC", "CS01", "Bills of Material", "Bill of Materials – product structure – parent product + component products + qty – used in MRP explosion MD01 + costing CK40N + production order MBMC → MMOC components – T0 BLOCKING", "PP"),
    "pp/work-centers": ("MWCC", "CR01", "Production Work Centers", "Production Work Center – machine/labor capacity – facility + cost unit + activity types – used in routing operations + capacity planning CM01 + costing", "PP"),
    "pp/routings": ("MRTC", "CA01", "Manufacturing Routings", "Manufacturing Routing – sequence of operations – work center + setup + run time – used in production order operations + costing CK40N", "PP"),
    "pp/mrp": ("MMRP", "MD01", "Requirements Planning", "Requirements Planning Run – MRP – net requirements calc: gross requirements - stock - scheduled receipts + safety stock = net – creates PR for Buy, Planned Order for Make – exception messages – MD04 stock/req list", "PP"),
    "pp/production-orders": ("MMOC", "CO01", "Manufacturing Orders", "Manufacturing Order – production order – BOM components + routing operations – status REL/CNF/TECO/CLSD – confirmation CO11N posts GI 261 GBB/BSX + GR 101 finished – costing – T0 BLOCKING", "PP"),
    "pp/kitting": ("MKTC", "KITTING", "Kitting – Assembly", "Kitting – stocked assembly – raw to finished via BOM – K01/K02", "PP"),
}

base = "src/app/(erp)/[companyCode]"

for rel_path, (own_code, sap_alias, gen_title, gen_desc, module) in mapping.items():
    file_path = os.path.join(base, rel_path, "page.tsx")
    if not os.path.exists(file_path):
        print(f"SKIP not found {file_path}")
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace code="ME51N" etc with own_code
    # Pattern: code="ME51N" or code="MIGO" etc
    content = re.sub(r'code="[^"]+"', f'code="{own_code}"', content)

    # Replace title="Purchase Requisitions" etc – first occurrence in ModernModuleShell
    # Use regex for title="..."
    # We replace title prop with general title
    content = re.sub(r'title="[^"]+"', f'title="{gen_title}"', content, count=1)

    # Replace subtitle – second title? Actually ModernModuleShell has subtitle prop as second arg – we will replace subtitle content to include own_code alias sap_alias
    # Replace classicContent header: e.g., ME51N PURCHASE REQUISITIONS CREATE – we replace with own_code + gen_title
    # For classicContent: <div className=\"font-bold border-b-2 border-black pb-1 mb-2\">ME51N PURCHASE REQUISITIONS CREATE
    content = re.sub(r'<div className="font-bold border-b-2 border-black pb-1 mb-2">[^<]+</div>',
                     f'<div className="font-bold border-b-2 border-black pb-1 mb-2">{own_code} {gen_title.upper()} – {sap_alias} ALIAS – GENERAL ERP – {{Array.isArray(items)?items.length:0}} RECORDS</div>',
                     content)

    # For modernContent header: <div className=\"font-semibold\">Purchase Requisitions – ME51N</div>
    content = re.sub(r'<div className="font-semibold">[^<]+</div>',
                     f'<div className="font-semibold">{gen_title} – {own_code} (alias {sap_alias}) – General ERP</div>',
                     content)

    # Replace any remaining SAP-specific jargon in comments – keep general
    # Replace "Material" with "Product" in form labels where appropriate – but careful
    # Replace "PLANT" label with "FACILITY" – general ERP
    content = content.replace("PLANT * (DB: EFCC)", "FACILITY * (DB: EFCC)")
    content = content.replace("PLANT *", "FACILITY *")
    content = content.replace("MATERIAL * (DB: EMTC)", "PRODUCT * (DB: EMTC)")
    content = content.replace("MATERIAL *", "PRODUCT *")
    content = content.replace("SALES_ORDER * (DB: VA01)", "SALES_ORDER * (DB: SSOC)")
    content = content.replace("Goods Receipt", "Inventory Receipt")
    content = content.replace("GOODS RECEIPT", "INVENTORY RECEIPT")
    content = content.replace("Goods Issue", "Inventory Issue")
    content = content.replace("GOODS ISSUE", "INVENTORY ISSUE")
    content = content.replace("Purchase Requisitions", "Purchase Requests")
    content = content.replace("PURCHASE REQUISITIONS", "PURCHASE REQUESTS")
    content = content.replace("Purchase Requisition", "Purchase Request")
    content = content.replace("Material Master", "Product Master")
    content = content.replace("MATERIAL", "PRODUCT")

    # Ensure code badge shows own_code primary, alias secondary – we already set code prop
    # Add alias badge in modernContent if not present – we have subtitle that includes count
    # Replace any remaining "ME51N" in button text "Create ME51N" with "Create PPRC"
    content = re.sub(r'Create (ME51N|ME21N|MIGO|MIRO|VL01N|VF01|CS01|CR01|CA01|MD01|CO01|VA01)', f'Create {own_code}', content)

    # Replace API description: API: POST /api/... keep but add general term
    # Ensure description uses general term
    # For related links – already general, but ensure EMTC not Material
    content = content.replace("Material – required", "Product – required")
    content = content.replace("Facility – required", "Facility – required")

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {rel_path} → {own_code} alias {sap_alias} – {gen_title}")

print("Done patching general ERP terms")
