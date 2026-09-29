import os, re
root = "src/app/(erp)/[companyCode]"
for dirpath,_,files in os.walk(root):
    for fn in files:
        if fn != "page.tsx":
            continue
        full=os.path.join(dirpath,fn)
        txt=open(full,encoding="utf-8").read()
        fields = ["code","item_number","account_number","employee_number","pr_number","po_number","bom_number","order_number","delivery_number","sales_order","from_plant","to_plant","kit_number","routing_number","work_center_code","material","plant","vendor","customer","quantity","price","amount","invoice_number","company_code","company_group_code","currency_code","fiscal_calendar_code","legal_entity_code","control_area_code","cost_center","work_center","from_currency","to_currency","rate","valid_from","object_type","current_number","prefix","tenant_code","country","coa_code","parent_code","name","city","description"]
        for fld in fields:
            pattern = rf'(?<!as any\)\.)form\.{fld}\b'
            txt = re.sub(pattern, f'(form as any).{fld}', txt)
        txt = txt.replace('module="ADMIN"', 'module="FOUNDATION"')
        txt = txt.replace('module="WORKFLOW"', 'module="FOUNDATION"')
        open(full,"w",encoding="utf-8").write(txt)
