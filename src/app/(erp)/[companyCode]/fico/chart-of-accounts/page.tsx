"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCOA"
      sapAlias="OB13"
      title="Chart of Accounts"
      description="Define Chart of Accounts – KSCA – general CoA – strict usage: groups GL accounts – e.g., KSCA India"
      apiEndpoint="/api/chart-of-accounts"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "CHART_OF_ACCOUNTS_CODE", required: true, placeholder: "KSCA" },
        { key: "name", label: "CHART_OF_ACCOUNTS_NAME", required: true, placeholder: "India Chart of Accounts" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account uses CoA", route: "/fico/gl-accounts", description: "GL Account requires Chart" },
        { code: "OBYC", label: "Auto Account uses CoA", route: "/fico/auto-account-determination", description: "Auto Account" },
      ]}
    />
  );
}
