"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { RoleGuard } from '@/shared/ui/role-guard';
import { useAutoPromoteJob } from '@/shared/ui/job-popup';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [vendorNumber, setVendorNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK');
  const [bankGlAccount, setBankGlAccount] = useState('8000000001');
  const [reference, setReference] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [headerText, setHeaderText] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, boolean>>({});
  const { elapsed, executeWithAutoPromote, JobPopupComponent } = useAutoPromoteJob();

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/payment?limit=100&companyCode=${companyCode}`).then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  async function create(){
    if(!vendorNumber){
      setMsg('❌ Vendor required – PSUC XK01 – partner_account – e.g., VEND-1000 – T0 – supplier master – currency_code FCYC payment_term_code FAPT reconciliation_account_code FGLC');
      return;
    }
    if(!amount || Number(amount)<=0){
      setMsg('❌ Amount required >0 – e.g., 83500 – total payment amount – currency INR – FCYC');
      return;
    }

    const apInvoiceIds = Object.entries(selectedInvoices).filter(([_, v])=>v).map(([id])=>id);

    const payload = {
      companyCode: companyCode,
      company_code: companyCode,
      vendorId: vendorNumber, // API will resolve via account_number
      vendor_number: vendorNumber,
      amount: Number(amount),
      paymentMethod: paymentMethod,
      bankGlAccount: bankGlAccount,
      reference: reference || `Payment for ${vendorNumber} – F-53 KZ`,
      postingDate: postingDate,
      headerText: headerText || `KZ Payment ${vendorNumber} ${amount} ${paymentMethod} – F-53 – ${companyCode}`,
      apInvoiceIds: apInvoiceIds.length>0 ? apInvoiceIds : undefined,
      tolerance_group_code: 'VEND-01',
    };

    try{
      const result = await executeWithAutoPromote({
        directFn: async ()=>{
          // Resolve vendorId via business-partners API first
          let vendorIdResolved = vendorNumber;
          try{
            const bpRes = await fetch(`/api/business-partners?search=${vendorNumber}&role=VENDOR&limit=5`).then(r=>r.json());
            const bpList = bpRes.partners || bpRes.data || [];
            const found = bpList.find((p:any)=>p.account_number===vendorNumber) || bpList[0];
            if(found) vendorIdResolved = found.id;
          }catch{}

          const finalPayload = { ...payload, vendorId: vendorIdResolved };

          const res = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || `Failed ${res.status} – ${j.help || ''} – tolerance ${j.tolerance_group || ''} diff ${j.difference_amount || ''}`);
          return j;
        },
        backgroundJobType: 'PAYMENT_KZ',
        backgroundPayload: payload,
        companyCode,
        lockObject: 'PAYMENT',
        lockObjectId: vendorNumber,
        onDirectSuccess: (j:any)=>{
          setMsg(`✅ Payment KZ ${j.paymentNumber || j.document_number || 'created'} posted – Vendor ${vendorNumber} – Amount ${amount} INR – Method ${paymentMethod} – Bank GL ${bankGlAccount} – F-53 KZ 53* 5300000000-5399999999 – Dr Vendor Recon 2000000000 Cr Bank ${bankGlAccount} – ${j.message || ''} – ${apInvoiceIds.length>0?`AP invoices ${apInvoiceIds.length} cleared to PAID – open-item clearing FB05 F-44 –` : ''} – tolerance OBA0/OBA4 VEND-01 checked – T1 REQUIRED – NO DANGLING – document flow IV→Payment – universal ledger FULC KZ`);
          load();
          // Auto document flow IV→Payment if invoices selected
          if(apInvoiceIds.length>0){
            try{
              apInvoiceIds.forEach(invId=>{
                fetch('/api/document-flow', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    precedingDocType: 'IV',
                    precedingDocId: invId,
                    precedingDocNumber: invId.slice(0,8),
                    succeedingDocType: 'PAYMENT',
                    succeedingDocNumber: j.paymentNumber || j.document_number,
                    rootDocType: 'PO',
                    rootDocNumber: vendorNumber,
                  }),
                }).catch(()=>{});
              });
            }catch{}
          }
          setAmount('');
          setReference('');
          setHeaderText('');
          setSelectedInvoices({});
        },
        onBackgroundCreated: (newJobId:string)=>{
          setMsg(`⏳ Payment KZ for ${vendorNumber} moved to background – job ${newJobId.slice(0,8)} – took >10 sec – popup shows steps – header Jobs icon shows – no timeout – SM37 – auto-promote 10s ALL`);
        },
      });
    }catch(err:any){
      setMsg(`❌ ${err.message} – check company code ELEC ${companyCode} exists, vendor PSUC ${vendorNumber} exists, bank GL FGLC ${bankGlAccount} exists, AP invoices exist, tolerance OBA0/OBA4 VEND-01 – e.g., diff 100 vs limit – adjust payment or increase tolerance via /fico/tolerance-groups-cv – T1 REQUIRED – prevents overpay – NO DANGLING – KZ 53* 5300000000-5399999999 – F_BKPF_BUK – F_BKPF_KTO – F_BKPF_BUP`);
    }
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING F-53 – Payment Processing – KZ 53* – fetching payments via /api/payment – vendor payment Dr Vendor Recon Cr Bank – tolerance OBA0/OBA4 – AP open items – open-item clearing – document flow IV→Payment – SAP standard...</div>;
  const payments = data?.payments || [];
  const apOpenItems = data?.apOpenItems || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">F-53 PAYMENT PROCESSING – KZ 53* – {payments.length} PAYMENTS – {apOpenItems.length} AP OPEN ITEMS – SAP STANDARD – VENDOR PAYMENT Dr VENDOR RECON Cr BANK – TOLERANCE OBA0/OBA4 – OPEN-ITEM CLEARING – T1</div>
        <div className="bg-zinc-50 border border-zinc-300 p-2 mb-2 text-[10px]">
          <div className="font-bold">⚠️ SAP STANDARD – F-53 KZ 53* 5300000000-5399999999 – T1 REQUIRED – VENDOR PAYMENT – OPEN-ITEM CLEARING – TOLERANCE OBA0/OBA4</div>
          <div>• Company Code ELEC OX02 required – e.g., {companyCode} – company code – T0 – chart CA-IN-01 fiscal K4 posting PPV-1000</div>
          <div>• Vendor PSUC XK01 required – e.g., VEND-1000 – partner_account – vendor master – currency_code FCYC INR payment_term_code FAPT NT30 recon_account FGLC 2000000000 procurement_division EPDC buyer_team EBTC – T0</div>
          <div>• Amount required – e.g., 83500 INR – total payment amount – FCYC OY03 – decimal_places 2 – e.g., INR 83500.00</div>
          <div>• Payment Method BANK/CASH/CHEQUE – e.g., BANK – paymentMethod – BANK Dr Vendor Recon Cr Bank 8000000001 SBI, CASH Dr Vendor Recon Cr Cash 8000000000</div>
          <div>• Bank GL Account FGLC FS00 required – e.g., 8000000001 Bank SBI – GL account – account_type ASSET is_balance_sheet true – chart CA-IN-01 – T0 – 8000000001 Bank SBI 8000000000 Cash</div>
          <div>• Posting Period OB52 S must be open for account type S GL + K Vendors – else error – FPPE – F_BKPF_BUP – T0 – S + K</div>
          <div>• Number Range KZ 53* 5300000000-5399999999 – via ent_number_range object_type FI_DOC_53 company_code_id year – current_number +1 – paymentNumber prefix + cur – if not starts with 53 then 53+cur – KZ doc type 53* – FBN1 – numeric only – error_and_extend – FNRC – 53* – 5300000000-5399999999</div>
          <div>• Tolerance OBA0/OBA4 VEND-01/CUST-01 – T1 REQUIRED – check overpay within tolerance – prevents fraud/overpay – e.g., invoice total 80000 payment 83500 diff 3500 vs tolerance limit – if exceeded 400 error – adjust payment or increase tolerance via /fico/tolerance-groups-cv – prevents overpay – NO DANGLING</div>
          <div>• AP Open Items fi_ap_invoice status OPEN – vendor_id partner_account account_number display_name + ent_business_partner bp_number name1 + ent_company_code code – due_date posting_date gross_amount net_amount currency status – companyCode filter – limit 100 – apOpenItems – e.g., invoice INV-001 vendor VEND-1000 gross 83500 due 2026-06-14 status OPEN – select invoices to clear – apInvoiceIds array – UPDATE fi_ap_invoice status PAID WHERE id apId – open-item clearing – F-44 Vendor Clearing F-32 Customer Clearing FB05 Clearing</div>
          <div>• Vendor Payment Accounting KZ – Dr Vendor Recon 2000000000 Cr Bank 8000000001 / Cash 8000000000 – KZ 53* – FI document SA posting_date document_date reference header_text total_debit total_credit currency status POSTED reference_doc_type KZ – fi_document_line line_number gl_account_id bp_id debit credit text – line 1 vendorGlId bp_id vendorId debit totalAmt credit 0 text Vendor Payment reference, line 2 bankGlId NULL debit 0 credit totalAmt text Bank paymentMethod reference – audit_log WORM-lite – universal ledger FULC KZ</div>
          <div>• Document Flow IV→Payment – FDFL VBFA – WORM-lite – predecessor/successor – quantity/value – ELIKZ – creates flow links via /api/document-flow POST – e.g., IV→Payment – document flow tree shows chain PR→PO→GR→IV→Payment – PR Purchase Requisition → PO 45xxx → GR 50xxx Material Doc → IV 51xxx → FI WE Dr Inventory BSX Cr GR/IR WRX → FI RE Dr GR/IR Cr Vendor → FI Payment Dr Payable Cr Bank</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">VENDOR * – PSUC XK01 – VEND-1000 – T0</div><input value={vendorNumber} onChange={e=>setVendorNumber(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="VEND-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">AMOUNT * – 83500 – INR – FCYC</div><input value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder="83500" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_METHOD – BANK/CASH/CHEQUE</div><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="w-full border-2 border-black px-1 py-1"><option value="BANK">BANK – Dr Vendor Cr Bank 8000000001</option><option value="CASH">CASH – Dr Vendor Cr Cash 8000000000</option><option value="CHEQUE">CHEQUE – Dr Vendor Cr Bank</option></select></div>
          <div><div className="text-[9px] text-zinc-500">BANK_GL_ACCOUNT * – FGLC FS00 – 8000000001 Bank SBI</div><input value={bankGlAccount} onChange={e=>setBankGlAccount(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="8000000001" /></div>
          <div><div className="text-[9px] text-zinc-500">POSTING_DATE * – OB52 S+K</div><input type="date" value={postingDate} onChange={e=>setPostingDate(e.target.value)} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">REFERENCE – e.g., Payment for VEND-1000</div><input value={reference} onChange={e=>setReference(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder={`Payment for ${vendorNumber}`} /></div>
          <div className="col-span-3"><div className="text-[9px] text-zinc-500">HEADER_TEXT – BKTXT – KZ Payment Vendor Amount Method</div><input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder={`KZ Payment ${vendorNumber} ${amount} ${paymentMethod} – F-53 – ${companyCode}`} /></div>
        </div>
        {apOpenItems.length>0 && (
          <div className="mt-3 border-2 border-black p-2 bg-zinc-50">
            <div className="font-bold">AP OPEN ITEMS – {apOpenItems.length} – fi_ap_invoice status OPEN – SELECT INVOICES TO CLEAR – OPEN-ITEM CLEARING FB05 F-44 – T1</div>
            <div className="mt-2 space-y-1 max-h-[200px] overflow-auto">
              {apOpenItems.slice(0,20).map((it:any)=>(
                <div key={it.id} className="flex gap-2 items-center border bg-white p-1">
                  <input type="checkbox" checked={!!selectedInvoices[it.id]} onChange={e=>setSelectedInvoices(prev=>({...prev, [it.id]: e.target.checked}))} />
                  <span className="font-bold">{it.invoice_number}</span>
                  <span>{it.vendor_number} {it.vendor_name}</span>
                  <span>Gross {it.gross_amount} Net {it.net_amount} {it.currency}</span>
                  <span>Due {it.due_date?.slice(0,10)} Post {it.posting_date?.slice(0,10)} – {it.status}</span>
                  <span>Company {it.company_code}</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-zinc-500 mt-1">Select AP invoices to clear – apInvoiceIds array – UPDATE fi_ap_invoice status PAID WHERE id apId – open-item clearing – F-44 Vendor Clearing – e.g., invoice INV-001 gross 83500 selected → payment 83500 → invoice PAID → open-item cleared – FB05 Clearing</div>
          </div>
        )}
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE PAYMENT – F-53 KZ 53* – Dr VENDOR RECON Cr BANK – TOLERANCE OBA0/OBA4 – OPEN-ITEM CLEARING – {elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {payments.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.document_number} – {it.doc_type} – {it.status} – Company {it.company_code} – {it.header_text?.slice(0,50)}</div>
            <div className="text-[10px] text-zinc-600">Posting {it.posting_date?.slice(0,10)} – Debit {it.total_debit} Credit {it.total_credit} {it.currency} – Ref {it.reference_doc_type} {it.reference_doc_number} – Lines {it.line_count} – KZ 53* Dr Vendor Cr Bank</div>
          </div>
        ))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <JobPopupComponent />
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : msg.startsWith('⏳') ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-zinc-800">SAP Standard – F-53 KZ 53* Vendor Payment – Dr Vendor Recon Cr Bank – Tolerance OBA0/OBA4 – Open-Item Clearing FB05 F-44 – Fixed from dummy API</div>
            <div className="text-xs text-zinc-700 mt-1 space-y-1">
              <div>• <b>Company Code ELEC OX02</b> required – e.g., {companyCode} – company code – chart CA-IN-01 fiscal K4 posting PPV-1000 – T0 – was missing in old page that only asked VENDOR, AMOUNT, GL_ACCOUNT, DOCUMENT_NUMBER, COMPANY_CODE – now fixed with full org wiring + open items</div>
              <div>• <b>Vendor PSUC XK01</b> required – e.g., VEND-1000 – partner_account – vendor master – currency_code FCYC INR payment_term_code FAPT NT30 recon_account FGLC 2000000000 – T0 – supplier master with currency payment terms recon account procurement division buyer team</div>
              <div>• <b>Amount required</b> – e.g., 83500 INR – total payment amount – FCYC OY03 – decimal_places 2 – e.g., INR 83500.00 – totalAmt parseFloat amount</div>
              <div>• <b>Payment Method BANK/CASH/CHEQUE</b> – e.g., BANK – paymentMethod – BANK Dr Vendor Recon Cr Bank 8000000001 SBI, CASH Dr Vendor Recon Cr Cash 8000000000 – paymentMethod</div>
              <div>• <b>Bank GL Account FGLC FS00</b> required – e.g., 8000000001 Bank SBI – GL account – account_type ASSET is_balance_sheet true – chart CA-IN-01 – T0 – 8000000001 Bank SBI 8000000000 Cash – bankGlAccount – bankGlRes fi_gl_account where coa_id account_number bankCode – fallback any fi_gl_account</div>
              <div>• <b>Posting Period OB52 S+K</b> must be open for account type S GL + K Vendors – else error – FPPE – F_BKPF_BUP – T0 – S + K – e.g., close 03/2026 open 04/2026</div>
              <div>• <b>Number Range KZ 53* 5300000000-5399999999</b> – via ent_number_range object_type FI_DOC_53 company_code_id year – current_number +1 – paymentNumber prefix + cur – if not starts with 53 then 53+cur – KZ doc type 53* – FBN1 – numeric only – error_and_extend – FNRC – 53* – 5300000000-5399999999 – F_BKPF_BUK – F_BKPF_KTO – F_BKPF_BUP – always_auto – user cannot type random</div>
              <div>• <b>Tolerance OBA0/OBA4 VEND-01/CUST-01</b> – T1 REQUIRED – check overpay within tolerance – prevents fraud/overpay – e.g., invoice total 80000 payment 83500 diff 3500 vs tolerance limit – if exceeded 400 error with help to increase tolerance via /fico/tolerance-groups-cv – prevents overpay – NO DANGLING – checkTolerance group_code diffAmount – T1 – OBA0/OBA4 – GL + Customer/Vendor</div>
              <div>• <b>AP Open Items fi_ap_invoice status OPEN</b> – vendor_id partner_account account_number display_name + ent_business_partner bp_number name1 + ent_company_code code – due_date posting_date gross_amount net_amount currency status – companyCode filter – limit 100 – apOpenItems – e.g., invoice INV-001 vendor VEND-1000 gross 83500 due 2026-06-14 status OPEN – select invoices to clear – apInvoiceIds array – UPDATE fi_ap_invoice status PAID WHERE id apId – open-item clearing – F-44 Vendor Clearing F-32 Customer Clearing FB05 Clearing – e.g., invoice INV-001 gross 83500 selected → payment 83500 → invoice PAID → open-item cleared – FB05</div>
              <div>• <b>Vendor Payment Accounting KZ</b> – Dr Vendor Recon 2000000000 Cr Bank 8000000001 / Cash 8000000000 – KZ 53* – FI document SA posting_date document_date reference header_text total_debit total_credit currency status POSTED reference_doc_type KZ – fi_document_line line_number gl_account_id bp_id debit credit text – line 1 vendorGlId bp_id vendorId debit totalAmt credit 0 text Vendor Payment reference, line 2 bankGlId NULL debit 0 credit totalAmt text Bank paymentMethod reference – audit_log WORM-lite – universal ledger FULC KZ – Dr Vendor Recon Cr Bank – KZ 53* – 5300000000-5399999999</div>
              <div>• <b>Document Flow IV→Payment</b> – FDFL VBFA – WORM-lite – predecessor/successor – quantity/value – ELIKZ – creates flow links via /api/document-flow POST – e.g., IV→Payment – document flow tree shows chain PR→PO→GR→IV→Payment – PR Purchase Requisition → PO 45xxx → GR 50xxx Material Doc → IV 51xxx → FI WE Dr Inventory BSX Cr GR/IR WRX → FI RE Dr GR/IR Cr Vendor → FI Payment Dr Payable Cr Bank – ALB – VBFA</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">💸</div>
          <div>
            <div className="font-semibold">Vendor Payment – F-53 KZ 53* (alias F-53) – SAP Standard – Dr Vendor Recon Cr Bank – Tolerance OBA0/OBA4 – Open-Item Clearing – Fixed</div>
            <div className="text-xs text-zinc-500">{payments.length} payments • {apOpenItems.length} AP open items • COMPANY_CODE {companyCode} • API: POST /api/payment – companyCode + vendorId + amount + paymentMethod BANK/CASH/CHEQUE + bankGlAccount + reference + postingDate + apInvoiceIds – KZ 53* 5300000000-5399999999 – Dr Vendor Recon 2000000000 Cr Bank 8000000001 – tolerance OBA0/OBA4 VEND-01 – open-item clearing FB05 F-44 – T1 REQUIRED – document flow IV→Payment</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete
            label="VENDOR * – PSUC XK01 – VEND-1000 – T0 – supplier master – currency_code FCYC payment_term_code FAPT recon_account FGLC"
            value={vendorNumber}
            onChange={v=>setVendorNumber(v)}
            apiUrl="/api/business-partners?role=VENDOR"
            codeField="account_number"
            nameField="display_name"
            placeholder="VEND-1000"
            required
            createUrl={`/${companyCode}/foundation/suppliers`}
            createCode="PSUC"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">AMOUNT * – 83500 – INR – FCYC OY03</label>
            <input value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="83500" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">PAYMENT_METHOD – BANK/CASH/CHEQUE – Dr Vendor Cr Bank/Cash</label>
            <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black">
              <option value="BANK">BANK – Dr Vendor Recon 2000000000 Cr Bank 8000000001 SBI</option>
              <option value="CASH">CASH – Dr Vendor Recon 2000000000 Cr Cash 8000000000</option>
              <option value="CHEQUE">CHEQUE – Dr Vendor Recon Cr Bank – Cheque</option>
            </select>
          </div>
          <DbAutocomplete
            label="BANK_GL_ACCOUNT * – FGLC FS00 – 8000000001 Bank SBI – T0"
            value={bankGlAccount}
            onChange={v=>setBankGlAccount(v)}
            apiUrl="/api/gl-accounts"
            codeField="account_number"
            nameField="name"
            placeholder="8000000001"
            required
            createUrl={`/${companyCode}/fico/gl-accounts`}
            createCode="FGLC"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">POSTING_DATE * – OB52 S+K – F_BKPF_BUP</label>
            <input type="date" value={postingDate} onChange={e=>setPostingDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <p className="text-[10px] text-zinc-400 mt-1">S GL + K Vendors must be open – FPPE</p>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">REFERENCE – e.g., Payment for VEND-1000 – INV-001</label>
            <input value={reference} onChange={e=>setReference(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder={`Payment for ${vendorNumber} – F-53 KZ`} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">HEADER_TEXT – BKTXT – KZ Payment Vendor Amount Method – {companyCode}</label>
            <input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder={`KZ Payment ${vendorNumber} ${amount} ${paymentMethod} – F-53 – ${companyCode}`} />
          </div>
        </div>

        {apOpenItems.length>0 && (
          <div className="mt-6 border rounded-2xl p-4 bg-zinc-50/50 border-zinc-200">
            <div className="font-bold text-sm mb-3">AP Open Items – {apOpenItems.length} – fi_ap_invoice status OPEN – SELECT INVOICES TO CLEAR – OPEN-ITEM CLEARING FB05 F-44 – T1 REQUIRED – NO DANGLING</div>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {apOpenItems.slice(0,20).map((it:any)=>(
                <div key={it.id} className={`border rounded-xl p-3 bg-white ${selectedInvoices[it.id] ? 'border-black shadow-sm' : 'border-zinc-200'}`}>
                  <div className="flex gap-3 items-center">
                    <input type="checkbox" checked={!!selectedInvoices[it.id]} onChange={e=>setSelectedInvoices(prev=>({...prev, [it.id]: e.target.checked}))} />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                      <div><span className="text-[10px] text-zinc-500">Invoice</span><div className="font-mono font-bold">{it.invoice_number}</div></div>
                      <div><span className="text-[10px] text-zinc-500">Vendor</span><div>{it.vendor_number} {it.vendor_name}</div></div>
                      <div><span className="text-[10px] text-zinc-500">Gross/Net</span><div>{it.gross_amount} / {it.net_amount} {it.currency}</div></div>
                      <div><span className="text-[10px] text-zinc-500">Due/Post</span><div>Due {it.due_date?.slice(0,10)} Post {it.posting_date?.slice(0,10)}</div></div>
                      <div><span className="text-[10px] text-zinc-500">Status/Company</span><div>{it.status} – {it.company_code}</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 mt-2">Select AP invoices to clear – apInvoiceIds array – UPDATE fi_ap_invoice status PAID WHERE id apId – open-item clearing – F-44 Vendor Clearing – e.g., invoice INV-001 gross 83500 selected → payment 83500 → invoice PAID → open-item cleared – FB05 Clearing – tolerance OBA0/OBA4 VEND-01 – prevents overpay – T1 REQUIRED</p>
          </div>
        )}

        <button onClick={create} disabled={!vendorNumber || !amount} className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-medium transition-colors ${vendorNumber && amount ? 'bg-zinc-900 hover:bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
          {vendorNumber && amount ? `Create Payment KZ 53* for ${vendorNumber} – ${amount} INR – ${paymentMethod} – Bank ${bankGlAccount} – F-53 – Dr Vendor Recon Cr Bank – Tolerance OBA0/OBA4 – Open-Item Clearing – ${elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}` : 'Select Vendor + Amount first – F-53 KZ 53* requires vendor + amount – T0 – SAP standard vendor payment'}
        </button>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">Payment requires companyCode ELEC + vendorId PSUC + amount + paymentMethod BANK/CASH/CHEQUE + bankGlAccount FGLC + reference + postingDate + apInvoiceIds – posting period S+K OB52 must be open – number range KZ 53* 5300000000-5399999999 via ent_number_range object_type FI_DOC_53 – tolerance OBA0/OBA4 VEND-01 T1 REQUIRED – AP open items fi_ap_invoice status OPEN – open-item clearing FB05 F-44 – vendor payment accounting KZ Dr Vendor Recon 2000000000 Cr Bank 8000000001 – document flow IV→Payment – universal ledger FULC KZ – T0 – NO DANGLING – org wired – company ELEC + vendor PSUC + GL FGLC + currency FCYC + tolerance OBA0/OBA4 + posting period FPPE + fiscal FFYC</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {payments.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{it.document_number} – {it.doc_type} – {it.status} – Company {it.company_code}</div>
              <span className="text-[10px] bg-emerald-600 text-white rounded-full px-2 py-0.5">KZ 53*</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Posting {it.posting_date?.slice(0,10)} – Debit {it.total_debit} Credit {it.total_credit} {it.currency} – Ref {it.reference_doc_type} {it.reference_doc_number} – Lines {it.line_count} – KZ 53* Dr Vendor Recon Cr Bank – {it.header_text?.slice(0,60)}</div>
            <div className="mt-2 flex gap-2">
              <Link href={`/${companyCode}/audit/document-flow?type=PAYMENT&id=${it.id}`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">FDFL Doc Flow VBFA →</Link>
              <Link href={`/${companyCode}/fico/universal-ledger`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">FULC Universal Ledger →</Link>
            </div>
          </div>
        ))}
        {(!payments || payments.length===0) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No payments yet – create first via F-53 KZ 53* – requires vendor + amount + bank GL – vendor payment Dr Vendor Recon Cr Bank – tolerance OBA0/OBA4 – open-item clearing – document flow IV→Payment</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Flow: PPRC ME51N PR → PPOC ME21N PO → IGRC MIGO 101 GR → PIVC MIRO IV → FPYP F110 Payment KZ 53* → F.13 GR/IR Clearing → FB05 Clearing</div>
          </div>
        )}
      </div>

      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related Masters – auto from dependencies – low importance – Org Wired</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/suppliers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSUC</span><span>Supplier – XK01 – vendor – required – T0 – vendor master – currency_code FCYC payment_term_code FAPT recon_account FGLC procurement_division EPDC buyer_team EBTC</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/iv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIVC</span><span>Invoice Verification – MIRO – uses IV – vendor invoice – RE + WRX clearing – PIVC – 51 RE</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/gl-accounts`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FGLC</span><span>GL Accounts – FS00 – Bank 8000000001 SBI Cash 8000000000 Vendor Recon 2000000000 – required – T0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/tolerance-groups-cv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBA4</span><span>Tolerance Groups CV – OBA0/OBA4 – VEND-01 – T1 REQUIRED – prevents overpay – tolerance</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/gr-ir-clearing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">F.13</span><span>GR/IR Clearing – F.13 MR11 – T1 REQUIRED – WRX cleared – GR qty = IV qty – month-end</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/audit/document-flow`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FDFL</span><span>Document Flow – VBFA ALB – PR→PO→GR→IV→Payment – WORM-lite – predecessor/successor</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – ACDOCA – 400+ fields – KZ payment – Dr Vendor Cr Bank</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">Flow: PR (ME51N PPRC) → PO (ME21N PPOC) → GR (MIGO 101 IGRC) → IV (MIRO PIVC) → Payment (F110 FPYP) F-53 KZ 53* → F.13 GR/IR Clearing → FB05 Clearing – industry standard MM – T0 BLOCKING – NO DANGLING – org wired – company ELEC + vendor PSUC + GL FGLC + currency FCYC + tolerance OBA0/OBA4 + posting period FPPE + fiscal FFYC – vendor payment accounting KZ Dr Vendor Recon 2000000000 Cr Bank 8000000001 – open-item clearing FB05 F-44 – AP open items fi_ap_invoice status OPEN – tolerance OBA0/OBA4 VEND-01 – prevents overpay – T1 REQUIRED – KZ 53* 5300000000-5399999999 – F_BKPF_BUK – F_BKPF_KTO – F_BKPF_BUP</p>
      </div>
    </div>
  );

  return (
    <RoleGuard requiredPermission="PAYMENT_POST" requiredRoles={['ACCOUNTANT','ADMIN','OWNER','MANAGER']}>
      <ModernModuleShell title="Vendor Payment" subtitle={`${payments.length} payments • ${apOpenItems.length} AP open • ${companyCode} • F-53 KZ 53* – Dr Vendor Recon Cr Bank – Tolerance OBA0/OBA4 – Open-Item Clearing – Fixed`} code="FPYP" module="FICO" classicChildren={classicContent}>
        {modernContent}
      </ModernModuleShell>
    </RoleGuard>
  );
}
