"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCOA"
      sapAlias="OB13"
      title="Chart of Accounts"
      description="Define Chart of Accounts – KSCA / CA-IN-01 – general CoA – strict usage: groups GL accounts – e.g., KSCA India – per guide needs language EN, chart_of_accounts_code CA-IN-01 is example code"
      apiEndpoint="/api/chart-of-accounts"
      initialForm={{ code: '', name: '', description: '', language: 'EN' }}
      fields={[
        { key: "code", label: "CHART_OF_ACCOUNTS_CODE", required: true, placeholder: "", description: "Chart code – e.g., CA-IN-01 per guide – KSCA, INT" },
        { key: "name", label: "CHART_OF_ACCOUNTS_NAME", required: true, placeholder: "" },
        { key: "language", label: "LANGUAGE", required: true, placeholder: "", description: "Language – EN per guide – FCOA (legacy OB13) dont have language EN to add – now added" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account uses CoA", route: "/fico/gl-accounts", description: "GL Account requires Chart – create CA-IN-01 first" },
        { code: "OBYC", label: "Auto Account uses CoA", route: "/fico/auto-account-determination", description: "Auto Account – INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB needs CoA" },
        { code: "FFYC", label: "Fiscal Year Variant K4 – needed for ELEC", route: "/fico/fiscal-calendars", description: "Create K4 before ELEC – fiscal_year_variant K4" },
        { code: "FSSV", label: "Field Status Variant FSSV-1000", route: "/fico/field-status-variants", description: "Create FSSV-1000 before ELEC – field_status_variant" },
        { code: "FPPC", label: "Posting Period Variant PPV-1000", route: "/fico/posting-period-variants", description: "Create PPV-1000 before ELEC – posting_period_variant" },
        { code: "FCPC", label: "Credit Control Area CRED-1000 – must exist before FCOA (legacy OB13)/ELEC", route: "/foundation/credit-policy-areas", description: "credit_control_area CRED-1000 didnt create before FCOA (legacy OB13) – create first" },
        { code: "ECGC", label: "Company Group – root", route: "/foundation/company-groups", description: "ECGC-FMCG-01 must exist before ELEC" },
        { code: "ELEC", label: "Legal Entity uses CoA – needs CA-IN-01", route: "/foundation/legal-entities", description: "ELEC 1000 needs chart_of_accounts_code CA-IN-01, fiscal_year_variant K4, field_status_variant FSSV-1000, posting_period_variant PPV-1000, credit_control_area CRED-1000" },
      ]}
    />
  );
}
