import os, re
root = "src/app/(erp)/[companyCode]"
for dirpath,_,files in os.walk(root):
    for fn in files:
        if fn != "page.tsx":
            continue
        full=os.path.join(dirpath,fn)
        txt=open(full,encoding="utf-8").read()
        # Fix double braces
        txt = re.sub(r'e\.target\.value(\.toUpperCase\(\))?\}\}\)\}', r'e.target.value\1})}', txt)
        txt = txt.replace('}})}', '})}')
        txt = re.sub(r'\}\}\)\}', '})}', txt)
        txt = txt.replace('{{...form', '{...form')
        txt = txt.replace('{{Array.isArray', '{Array.isArray')
        txt = txt.replace('{{msg &&', '{msg &&')
        txt = txt.replace('{{(Array.isArray', '{(Array.isArray')
        txt = txt.replace('{{(!items', '{(!items')
        txt = txt.replace('{{Object.entries', '{Object.entries')
        txt = txt.replace('{{JSON.stringify', '{JSON.stringify')
        txt = txt.replace('{{(it.code', '{(it.code')
        txt = txt.replace('{{`rounded', '{`rounded')
        txt = re.sub(r'setForm\(\{\{\{\{', 'setForm({{', txt)
        txt = re.sub(r'setForm\(\{\{\{', 'setForm({{', txt)
        # Fix import duplicates
        txt = txt.replace("import { ModernModuleShell } from '@/shared/ui/modern-module-shell';\nimport { ModernModuleShell } from '@/shared/ui/modern-module-shell';", "import { ModernModuleShell } from '@/shared/ui/modern-module-shell';")
        txt = txt.replace("import { DbAutocomplete } from '@/shared/ui/db-autocomplete';\nimport { DbAutocomplete } from '@/shared/ui/db-autocomplete';", "import { DbAutocomplete } from '@/shared/ui/db-autocomplete';")
        # Ensure ModernModuleShell import exists if DbAutocomplete exists
        if "DbAutocomplete" in txt and "ModernModuleShell" not in txt:
            txt = "import { ModernModuleShell } from '@/shared/ui/modern-module-shell';\n" + txt
        # Ensure ModernModuleShell import is from modern-module-shell not db-autocomplete
        txt = txt.replace("import { ModernModuleShell } from '@/shared/ui/db-autocomplete';", "import { ModernModuleShell } from '@/shared/ui/modern-module-shell';")
        open(full,"w",encoding="utf-8").write(txt)
