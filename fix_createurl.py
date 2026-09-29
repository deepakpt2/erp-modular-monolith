import os, re
root="src/app/(erp)/[companyCode]"
for dirpath,_,files in os.walk(root):
    for fn in files:
        if fn!="page.tsx":
            continue
        full=os.path.join(dirpath,fn)
        txt=open(full,encoding="utf-8").read()
        # Fix createUrl=`...` -> createUrl={`...`}
        # Pattern: createUrl=`/${companyCode}/...`  -> createUrl={`/${companyCode}/...`}
        txt = re.sub(r'createUrl=`(/[^`]*?)\`', r'createUrl={`\1`}', txt)
        # Also fix createUrl=`/${companyCode}...` without closing backtick correctly
        # The previous regex should handle
        open(full,"w",encoding="utf-8").write(txt)
        if "createUrl=" in txt:
            # check if any still has createUrl=` without {
            if re.search(r'createUrl=`', txt):
                print(f"Still has issue {full}")
                # try another fix
                txt2 = re.sub(r'createUrl=`', 'createUrl={`', txt)
                txt2 = re.sub(r'`\n\s+createCode', '`}\n            createCode', txt2)
                open(full,"w",encoding="utf-8").write(txt2)
                print(f"Fixed second pass {full}")
