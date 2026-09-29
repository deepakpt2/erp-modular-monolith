"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FROC"
      sapAlias="PFCG"
      title="Role Maintenance"
      description="Role Maintenance – profile governance security tracking matrix setup access permission paths – strict usage: roles control access to functions – e.g., ADMIN can create company groups, USER can create PR"
      apiEndpoint="/api/roles"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "ROLE_CODE", required: true, placeholder: "ADMIN", description: "Role code – e.g., ADMIN, USER, MANAGER, PURCHASER" },
        { key: "name", label: "ROLE_NAME", required: true, placeholder: "Administrator" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Administrator role with full access" },
      ]}
      relatedLinks={[
        { code: "FUSC", label: "User Maintenance uses Roles", route: "/foundation/users", description: "User requires role" },
        { code: "ECGC", label: "Company Group – ADMIN access", route: "/foundation/company-groups", description: "Company Group" },
      ]}
    />
  );
}
