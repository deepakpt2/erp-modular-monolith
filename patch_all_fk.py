import os, re, json

root = "src/app/(erp)/[companyCode]"

# Enhanced field map with codeField, api, filter
field_map = {
    "material": {"api": "/api/materials", "code": "EMTC", "create": "/foundation/materials", "label": "MATERIAL", "codeField": "item_number", "nameField": "description"},
    "component": {"api": "/api/materials", "code": "EMTC", "create": "/foundation/materials", "label": "COMPONENT", "codeField": "item_number", "nameField": "description"},
    "plant": {"api": "/api/facilities", "code": "EFCC", "create": "/foundation/enterprise-structure?focus=EFCC", "label": "PLANT", "codeField": "code", "nameField": "name"},
    "from_plant": {"api": "/api/facilities", "code": "EFCC", "create": "/foundation/enterprise-structure?focus=EFCC", "label": "FROM_PLANT", "codeField": "code"},
    "to_plant": {"api": "/api/facilities", "code": "EFCC", "create": "/foundation/enterprise-structure?focus=EFCC", "label": "TO_PLANT", "codeField": "code"},
    "facility_code": {"api": "/api/facilities", "code": "EFCC", "create": "/foundation/enterprise-structure?focus=EFCC", "label": "FACILITY_CODE", "codeField": "code"},
    "storage_location": {"api": "/api/inventory-locations", "code": "EILC", "create": "/foundation/enterprise-structure?focus=EILC", "label": "STORAGE_LOCATION", "codeField": "code"},
    "vendor": {"api": "/api/business-partners?role=VENDOR", "code": "PSUC", "create": "/foundation/partners?role=VENDOR", "label": "VENDOR", "codeField": "account_number", "nameField": "display_name"},
    "customer": {"api": "/api/business-partners?role=CUSTOMER", "code": "SCUC", "create": "/foundation/partners?role=CUSTOMER", "label": "CUSTOMER", "codeField": "account_number", "nameField": "display_name"},
    "company_code": {"api": "/api/company-codes", "code": "OX02", "create": "/fico/company-master", "label": "COMPANY_CODE", "codeField": "code"},
    "company_group_code": {"api": "/api/company-groups", "code": "ECGC", "create": "/foundation/enterprise-structure?focus=ECGC", "label": "COMPANY_GROUP_CODE", "codeField": "code"},
    "currency_code": {"api": "/api/currencies", "code": "FCYC", "create": "/fico/currencies", "label": "CURRENCY_CODE", "codeField": "code"},
    "from_currency": {"api": "/api/currencies", "code": "FCYC", "create": "/fico/currencies", "label": "FROM_CURRENCY", "codeField": "code"},
    "to_currency": {"api": "/api/currencies", "code": "FCYC", "create": "/fico/currencies", "label": "TO_CURRENCY", "codeField": "code"},
    "fiscal_calendar_code": {"api": "/api/fiscal-calendars", "code": "FFYC", "create": "/fico/posting-period?focus=FFYC", "label": "FISCAL_CALENDAR_CODE", "codeField": "code"},
    "legal_entity_code": {"api": "/api/legal-entities", "code": "ELEC", "create": "/foundation/enterprise-structure?focus=ELEC", "label": "LEGAL_ENTITY_CODE", "codeField": "code"},
    "control_area_code": {"api": "/api/control-areas", "code": "ECOC", "create": "/foundation/enterprise-structure?focus=ECOC", "label": "CONTROL_AREA_CODE", "codeField": "code"},
    "cost_center": {"api": "/api/cost-centers", "code": "FCCA", "create": "/fico/cost-centers", "label": "COST_CENTER", "codeField": "code"},
    "work_center": {"api": "/api/work-centers", "code": "CR01", "create": "/pp/work-centers", "label": "WORK_CENTER", "codeField": "code"},
    "work_center_code": {"api": "/api/work-centers", "code": "CR01", "create": "/pp/work-centers", "label": "WORK_CENTER_CODE", "codeField": "code"},
    "routing_number": {"api": "/api/routings", "code": "CA01", "create": "/pp/routings", "label": "ROUTING_NUMBER", "codeField": "routing_number"},
    "bom_number": {"api": "/api/bom", "code": "CS01", "create": "/pp/bom", "label": "BOM_NUMBER", "codeField": "bom_number"},
    "kit_number": {"api": "/api/kitting", "code": "KITTING", "create": "/pp/kitting", "label": "KIT_NUMBER", "codeField": "kit_number"},
    "sales_order": {"api": "/api/sales-orders", "code": "VA01", "create": "/sales", "label": "SALES_ORDER", "codeField": "order_number"},
    "delivery_number": {"api": "/api/delivery", "code": "VL01N", "create": "/sd/delivery", "label": "DELIVERY_NUMBER", "codeField": "delivery_number"},
    "gl_account": {"api": "/api/gl-accounts", "code": "FGLC", "create": "/fico/gl-accounts", "label": "GL_ACCOUNT", "codeField": "account_number", "nameField": "name"},
    "ledger_account_code": {"api": "/api/gl-accounts", "code": "FGLC", "create": "/fico/gl-accounts", "label": "LEDGER_ACCOUNT_CODE", "codeField": "account_number", "nameField": "name"},
    "procurement_division_code": {"api": "/api/procurement-divisions", "code": "EPDC", "create": "/foundation/enterprise-structure?focus=EPDC", "label": "PROCUREMENT_DIVISION_CODE", "codeField": "code"},
    "employee_number": {"api": "/api/hr/employees", "code": "HEMC", "create": "/hr/employees", "label": "EMPLOYEE_NUMBER", "codeField": "employee_number"},
    "tenant_code": {"api": "/api/tenants", "code": "TENANT", "create": "/foundation/enterprise-structure?focus=ECGC", "label": "TENANT_CODE", "codeField": "code"},
    "country": {"api": "/api/countries", "code": "COUNTRY", "create": "/foundation/enterprise-structure?focus=ELEC", "label": "COUNTRY", "codeField": "code", "nameField": "name"},
    "coa_code": {"api": "/api/chart-of-accounts", "code": "FCOA", "create": "/fico/chart-of-accounts", "label": "COA_CODE", "codeField": "code"},
    "parent_code": {"api": "/api/cost-units", "code": "ECUC", "create": "/foundation/enterprise-structure?focus=ECUC", "label": "PARENT_CODE", "codeField": "code"},
}

files = [
    "fico/company-master/page.tsx",
    "fico/payment/page.tsx",
    "foundation/roles/page.tsx",
    "foundation/users/page.tsx",
    "hr/employees/page.tsx",
    "hr/payroll/page.tsx",
    "mm/pr/page.tsx",
    "mm/po/page.tsx",
    "mm/gr/page.tsx",
    "mm/iv/page.tsx",
    "mm/sto/page.tsx",
    "mm/physical-inventory/page.tsx",
    "pp/bom/page.tsx",
    "pp/kitting/page.tsx",
    "pp/mrp/page.tsx",
    "pp/routings/page.tsx",
    "pp/work-centers/page.tsx",
    "sales/page.tsx",
    "sd/billing/page.tsx",
    "sd/delivery/page.tsx",
    "fico/fiscal-calendars/page.tsx",
    "fico/exchange-rates/page.tsx",
    "fico/number-ranges/page.tsx",
    "fico/tax-groups/page.tsx",
]

for rel in files:
    full = os.path.join(root, rel)
    if not os.path.exists(full):
        continue
    content = open(full, encoding="utf-8").read()
    # Find form fields
    m = re.search(r"useState\(\{([^}]+)\}\)", content, re.S)
    if not m:
        continue
    fields_str = m.group(1)
    fields = []
    for part in fields_str.split(","):
        kv = part.strip().split(":")
        if kv[0]:
            key = kv[0].strip().strip('"\'')
            if key and " " not in key and key not in ["companyCode","company_code_id"]:
                fields.append(key)
    # Build modern inputs
    modern_inputs = []
    for fld in fields:
        cfg = field_map.get(fld)
        if cfg:
            codeField = cfg.get("codeField","code")
            nameField = cfg.get("nameField","name")
            api = cfg["api"]
            label = cfg["label"]
            create = cfg["create"]
            create_code = cfg["code"]
            # Build createUrl with companyCode interpolation
            # create may already have ?focus
            if "?" in create:
                create_url = f"`/${{companyCode}}{create}&`"
                # Actually we need to handle: createUrl={`/${companyCode}/...?focus=...`}
                # Simpler: use template literal
                create_url = f"`/${{companyCode}}{create}`"
            else:
                create_url = f"`/${{companyCode}}{create}`"
            modern = f'''          <DbAutocomplete
            label="{label} *"
            value={{(form as any).{fld}}}
            onChange={{v=>setForm({{{{...form,{fld}:v}}}})}}
            apiUrl="{api}"
            codeField="{codeField}"
            nameField="{nameField}"
            placeholder="{label}"
            required
            createUrl={create_url}
            createCode="{create_code}"
            companyCode={{companyCode}}
          />'''
            modern_inputs.append(modern)
        else:
            is_code = "code" in fld.lower() or "number" in fld.lower() or fld.lower() in ["name","quantity","amount","rate"]
            req = "*" if fld.lower() in ["code","name","quantity","amount","rate","city","country","currency_code","company_group_code","fiscal_calendar_code"] or is_code else ""
            modern = f'''          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">{fld.upper()} {req}</label>
            <input value={{(form as any).{fld}}} onChange={{e=>setForm({{{{...form,{fld}:e.target.value{".toUpperCase()" if is_code else ""}}}}})}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black {"uppercase" if is_code else ""}" placeholder="{fld.upper()}" />
          </div>'''
            modern_inputs.append(modern)

    # Replace modern grid
    # Find the modern grid block
    # We need to replace the content between <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> and </div>\n        <button onClick={create}
    modern_grid_pattern = r'<div className="grid grid-cols-1 md:grid-cols-3 gap-4">.*?        </div>\n        <button onClick=\{create\}'
    modern_grid_repl = '<div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n' + "\n".join(modern_inputs) + '\n        </div>\n        <button onClick={create}'
    content_new = re.sub(modern_grid_pattern, modern_grid_repl, content, flags=re.S)

    # Also ensure import exists
    if "DbAutocomplete" not in content_new:
        content_new = content_new.replace("import { ModernModuleShell }", "import { ModernModuleShell } from '@/shared/ui/modern-module-shell';\nimport { DbAutocomplete }")

    if content_new != content:
        open(full, "w", encoding="utf-8").write(content_new)
        print(f"UPDATED {rel} with {len([f for f in fields if f in field_map])} autocomplete / {len(fields)} total")
    else:
        print(f"NO CHANGE {rel}")

