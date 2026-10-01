"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
import { RoleGuard } from '@/shared/ui/role-guard';

export default function Page() {
  return (
    <RoleGuard requiredPermission="ROLE_MANAGE" requiredRoles={['ADMIN','OWNER']}>
      <SingleCodePage
        code="FROC"
        sapAlias="PFCG"
        title="Role Maintenance"
        description="Role Maintenance – profile governance security tracking matrix setup access permission paths – strict usage: roles control access to functions – e.g., ADMIN can create company groups, USER can create PR – ADMIN only – S_USER_AGR"
        apiEndpoint="/api/roles"
        initialForm={{ code: '', name: '', description: '' }}
        fields={[
          { key: "code", label: "ROLE_CODE", required: true, placeholder: "", description: "Role code – e.g., ADMIN, USER, MANAGER, PURCHASER – S_USER_AGR" },
          { key: "name", label: "ROLE_NAME", required: true, placeholder: "" },
          { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
        ]}
        relatedLinks={[
          { code: "FUSC", label: "User Maintenance uses Roles", route: "/foundation/users", description: "User requires role – SU01" },
          { code: "ECGC", label: "Company Group – ADMIN access", route: "/foundation/company-groups", description: "Company Group – OX02" },
        ]}
      />
    </RoleGuard>
  );
}
