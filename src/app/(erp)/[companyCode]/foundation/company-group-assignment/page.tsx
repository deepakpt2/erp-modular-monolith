"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function CompanyGroupAssignmentPage({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      code={codeOverride || "ECGA"}
      sapAlias="OX16"
      title={titleOverride || "Assign Company Group to Legal Entity"}
      description="Assign Legal Entity (Company Code) to Company Group – SAP OX16 parity – links statutory company code to consolidation holding group"
      apiEndpoint="/api/company-group-assignment"
      defaultMode={defaultMode || "create"}
      initialForm={{ legal_entity_code: '', company_group_code: '', description: '' }}
      fields={[
        { 
          key: "legal_entity_code", 
          label: "LEGAL_ENTITY_CODE", 
          required: true, 
          type: "autocomplete", 
          apiUrl: "/api/legal-entities", 
          dataKey: "legalEntities", 
          codeField: "code", 
          placeholder: "", 
          createUrl: "/foundation/legal-entities", 
          createCode: "ELEC", 
          description: "Legal Entity / Company Code (OX02 / ELEC)" 
        },
        { 
          key: "company_group_code", 
          label: "COMPANY_GROUP_CODE", 
          required: true, 
          type: "autocomplete", 
          apiUrl: "/api/company-groups", 
          dataKey: "companyGroups", 
          codeField: "code", 
          placeholder: "", 
          createUrl: "/foundation/company-groups", 
          createCode: "ECGC", 
          description: "Company Group / Holding Consolidation Unit (OX15 / ECGC)" 
        },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "OX15", label: "Company Group (ECGC)", route: "/foundation/company-groups", description: "Define Company Group" },
        { code: "OX02", label: "Legal Entity (ELEC)", route: "/foundation/legal-entities", description: "Define Legal Entity" },
        { code: "ECAC", label: "Enterprise Structure Hub", route: "/foundation/enterprise-structure", description: "Overview of all enterprise assignments" },
      ]}
    />
  );
}
