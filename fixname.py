import os
root="src"
for dirpath,_,files in os.walk(root):
    for f in files:
        if not f.endswith(".tsx") and not f.endswith(".ts"):
            continue
        full=os.path.join(dirpath,f)
        txt=open(full,encoding="utf-8").read()
        orig=txt
        txt=txt.replace("© 2026 Deepak Patil • ERP Modular Monolith • MIT License • Company: {companyCode}","© 2026 ERP Modular Monolith • MIT License • Company: {companyCode}")
        txt=txt.replace("© 2026 Deepak Patil • ERP Modular Monolith • MIT License • {title}","© 2026 ERP Modular Monolith • MIT License")
        txt=txt.replace("© 2026 Deepak Patil • ERP Modular Monolith • MIT License","© 2026 ERP Modular Monolith • MIT License")
        txt=txt.replace("© 2026 Deepak Patil • ERP Modular Monolith • MIT","© 2026 ERP Modular Monolith • MIT")
        txt=txt.replace("© 2026 Deepak Patil – ERP Modular Monolith – MIT License","© 2026 ERP Modular Monolith – MIT License")
        txt=txt.replace("© 2026 Deepak Patil","© 2026 ERP Modular Monolith")
        txt=txt.replace("© 2026 Deepak • ERP Modular Monolith • MIT","© 2026 ERP Modular Monolith • MIT")
        txt=txt.replace("© 2026 Deepak • MIT","© 2026 ERP Modular Monolith • MIT")
        txt=txt.replace("© 2026 Deepak","© 2026 ERP Modular Monolith")
        # also docs specific
        txt=txt.replace("Deepak Patil","")
        txt=txt.replace("Deepak","")
        # clean double spaces
        txt=txt.replace("  •"," •")
        txt=txt.replace("•  •","•")
        if txt!=orig:
            open(full,"w",encoding="utf-8").write(txt)
            print("FIXED",full)
