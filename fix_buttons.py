import os, re
root = "src/app/(erp)/[companyCode]"

for dirpath,_,files in os.walk(root):
    for fn in files:
        if fn != "page.tsx":
            continue
        full = os.path.join(dirpath,fn)
        txt = open(full, encoding="utf-8").read()
        original = txt
        # Fix buttons like + Create Company Group ECGC -> Create Company Group
        # Pattern: >+ Create ...</button> -> >Create ...</button> without code suffix
        # Replace "+ Create Company Group ECGC" -> "Create Company Group"
        # Replace "+ Create Legal Entity ELEC LE-2000 ISL" -> "Create Legal Entity"
        # General: remove leading "+ " and trailing code like ECGC, ELEC, etc and extra like LE-2000 ISL
        # Look for button text patterns

        # Fix modern buttons
        txt = re.sub(r'>\+ Create Company Group ECGC<', '>Create Company Group<', txt)
        txt = re.sub(r'>\+ Create Legal Entity ELEC LE-2000 ISL<', '>Create Legal Entity<', txt)
        txt = re.sub(r'>\+ Create Control Area ECOC<', '>Create Control Area<', txt)
        txt = re.sub(r'>\+ Create Facility EFCC FAC-2000<', '>Create Facility<', txt)
        txt = re.sub(r'>\+ Create Commercial Org ECOC SO-2000<', '>Create Commercial Org<', txt)
        txt = re.sub(r'>\+ Create Warehouse EWSC WH-2000<', '>Create Warehouse Site<', txt)

        # Generic: >+ Create <NAME> <CODE> (maybe extra) < -> >Create <NAME><
        # Match >+ Create XXXXX ... <CODE><
        txt = re.sub(r'>\+ Create ([A-Za-z0-9 /-]+?) (?:ECGC|ELEC|EFCC|EILC|ECOC|ESCC|EPLC|EPDC|EBTC|EDPC|EWSC|EPUC|ECUC|EBSC|FCPC|ECAC|FFYC|FEXC|FNRC|FTGC|FCOA|FGLC|FCCA|FCYC|ME51N|ME21N|MIGO|MIRO|VA01|VF01|VL01N|CS01|CA01|CR01|KITTING|MD01|MI01|F-53|KSB1|CK40N|OBBO|OB52|FS00|KS01|FTXP|OY03|OB13)[^<]*<', r'>Create \1<', txt)

        # Also for generic "+ Create XYZ" without code but with long suffix
        txt = re.sub(r'>\+ Create ([A-Za-z ]+?) (?:ECGC|ELEC|EFCC|EILC|ECOC|ESCC|EPLC|EPDC|EBTC|EDPC|EWSC|EPUC|ECUC|EBSC|FCPC|ECAC|FFYC|FEXC|FNRC|FTGC)[^<]*<', r'>Create \1<', txt)

        # For buttons like "+ Create Company Group" -> "Create Company Group"
        txt = re.sub(r'>\+ Create ', '>Create ', txt)

        # For buttons like "+ Create" alone keep Create
        txt = re.sub(r'>\+ Create<', '>Create<', txt)

        # For buttons like "CREATE ME51N" in classic? Those are ok but we want "CREATE" ?
        # In classic content, button says "CREATE ME51N" – should be "CREATE" – but keep code? User says button should only show "create company code" or similar nor some long string. Code is already present in form heading. So button should be "Create Company Code" not "Create Company Code ECGC ..."
        # For modern, we already did

        # Also fix buttons that say "Create Control Area ECOC" etc already fixed

        # For generic forms like "Create Purchase Requisitions" etc – we have "Create ME51N" – should be "Create Purchase Requisition"
        # Our patch for mm/pr etc: button text is "CREATE ME51N" – should be "Create"
        # Let's fix all "CREATE ME51N" etc to "CREATE"
        txt = re.sub(r'>CREATE [A-Z0-9-]+<', '>CREATE<', txt)

        if txt != original:
            open(full, "w", encoding="utf-8").write(txt)
            print(f"Fixed {full}")

