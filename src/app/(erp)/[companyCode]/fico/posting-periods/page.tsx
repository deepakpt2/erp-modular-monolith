"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FPPE"
      sapAlias="OB52"
      title="Posting Period Control – Fiscal/Posting Period – Open/Close"
      description="Define Posting Period Control – open/close posting periods – variant, account type A/D/K/M/S/V/+, from/to period/year, from/to account range, authorization group, is_open – strict industry standard: enforces OB52 T0 BLOCKING – rejects posting if period closed – e.g., close 03/2026 open 04/2026 – fiscal/posting period – financial – own names – F_BKPF_BUP"
      apiEndpoint="/api/posting-periods"
      initialForm={{ 
        variant_code: 'PPV-1000', 
        account_type: 'S', 
        from_account: '1000000000',
        to_account: '1999999999',
        authorization_group: 'AUTH01',
        from_period: '1', 
        from_year: '2026', 
        to_period: '12', 
        to_year: '2026', 
        is_open: 'true', 
        description: 'GL open 1-12 2026 for 1000000000-1999999999 – AUTH01' 
      }}
      fields={[
        { key: "variant_code", label: "POSTING_PERIOD_VARIANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/posting-period-variants", dataKey: "postingPeriodVariants", codeField: "code", placeholder: "", createUrl: "/fico/posting-period-variants", createCode: "FPPC", description: "Variant code – e.g., PPV-1000 – must exist via FPPC OBBO – posting period variant – assigned to company code 1000→PPV-1000 – industry standard" },
        { key: "account_type", label: "ACCOUNT_TYPE", required: true, type: "select", options: ['+', 'A', 'D', 'K', 'M', 'S', 'V'], placeholder: "", description: "Account type – + All, A Assets, D Customers, K Vendors, M Materials, S GL Accounts, V Contract – strict enforcement – e.g., S for GL 1000000000-1999999999, M for materials – industry standard – OB52 – F_BKPF_BUP" },
        { key: "from_account", label: "FROM_ACCOUNT", placeholder: "", description: "From account – e.g., 1000000000 – account range from – for account type S GL – from/to account – e.g., 1000000000-1999999999 – industry standard – FPPE enhanced – from/to account range" },
        { key: "to_account", label: "TO_ACCOUNT", placeholder: "", description: "To account – e.g., 1999999999 – account range to – for S GL – to account – industry standard – FPPE enhanced" },
        { key: "authorization_group", label: "AUTHORIZATION_GROUP", placeholder: "", description: "Authorization group – e.g., AUTH01 – auth group – F_BKPF_BUP – allows open/close per auth group – industry standard – FPPE enhanced – from/to account + auth group" },
        { key: "from_period", label: "FROM_PERIOD", required: true, placeholder: "", description: "From period – 1-12 – e.g., 1 April for K4 – fiscal period – industry standard" },
        { key: "from_year", label: "FROM_YEAR", required: true, placeholder: "", description: "From year – e.g., 2026 – fiscal year – industry standard" },
        { key: "to_period", label: "TO_PERIOD", required: true, placeholder: "", description: "To period – 1-12 – e.g., 12 March for K4 – to period" },
        { key: "to_year", label: "TO_YEAR", required: true, placeholder: "", description: "To year – e.g., 2026 – to year" },
        { key: "is_open", label: "IS_OPEN", required: true, type: "select", options: ["true", "false"], placeholder: "", description: "Is open – true open, false closed – strict enforcement – T0 BLOCKING – rejects posting if closed – e.g., close 03/2026 open 04/2026 – industry standard – OB52" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – e.g., GL open 1-12 2026 – explains open/close – industry standard" },
      ]}
      relatedLinks={[
        { code: "FPPC", label: "Posting Period Variant – PPV-1000 – required – OBBO", route: "/fico/posting-period-variants", description: "Variant – PPV-1000 assigned to company 1000 – FPPC" },
        { code: "FFYC", label: "Fiscal Calendar – K4 April-March – year-dependent 1-12 + special 13-16 + factory IN01", route: "/fico/fiscal-calendars", description: "Fiscal Calendar – K4 – year-dependent periods 1-12 + special 13-16 + factory calendar IN01 – FFYC OB29" },
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01 – OPERATIONAL – AG01", route: "/fico/chart-of-accounts", description: "Chart – CA-IN-01 – OPERATIONAL – AG01" },
        { code: "FGLC", label: "GL Account – 1000000000-1999999999 – account type S", route: "/fico/gl-accounts", description: "GL – 1000000000-1999999999 – S – from/to account" },
        { code: "IGRC", label: "Goods Receipt MIGO 101 – checks OB52 posting period – T0", route: "/mm/gr", description: "GR 101 – checks posting period – T0 BLOCKING – BSX/WRX" },
        { code: "PIVC", label: "Invoice Verification MIRO – checks OB52", route: "/mm/iv", description: "IV – checks posting period – WRX/BSX" },
        { code: "SBLC", label: "Billing VF01 – checks OB52", route: "/sd/billing", description: "Billing – checks posting period" },
        { code: "FPYP", label: "Payment F110 – checks OB52", route: "/fico/payment", description: "Payment – checks posting period" },
      ]}
    />
  );
}
