"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function CompanyGroupsPage() {
  return (
    <SingleCodePage
      code="ECGC"
      sapAlias="OX15"
      title="Company Group"
      description="Define Company Group – enterprise holding umbrella corporation group structure – root parent, used by Legal Entity"
      apiEndpoint="/api/company-groups"
      initialForm={{ code: '', name: '', description: '', tenant_code: 'TEN-100' }}
      fields={[
        { key: 'code', label: 'COMPANY_GROUP_CODE', required: true, placeholder: 'CG-100', description: 'Unique code – e.g., CG-100, CG-200 – used as FK in Legal Entity' },
        { key: 'name', label: 'COMPANY_GROUP_NAME', required: true, placeholder: 'Global Holdings', description: 'Name of company group' },
        { key: 'description', label: 'DESCRIPTION', type: 'textarea', placeholder: 'Holding company for all legal entities' },
        { key: 'tenant_code', label: 'TENANT_CODE', required: true, placeholder: 'TEN-100', description: 'Tenant code – default TEN-100' },
      ]}
      relatedLinks={[
        { code: 'ELEC', label: 'Legal Entity uses ECGC', route: '/foundation/legal-entities', description: 'Legal Entity requires Company Group' },
        { code: 'ECAC', label: 'Enterprise Config', route: '/foundation/enterprise-structure', description: 'Overview hub' },
      ]}
    />
  );
}
