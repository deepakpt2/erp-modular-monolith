"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
import { RoleGuard } from '@/shared/ui/role-guard';

export default function Page() {
  return (
    <RoleGuard requiredPermission="USER_MANAGE" requiredRoles={['ADMIN','OWNER','HR','MANAGER']}>
      <SingleCodePage
        code="FUSC"
        sapAlias="SU01"
        title="User Maintenance"
        description="User Maintenance – administrative user maintenance account profiles tracking reset credentials authorization access rules – strict usage: users assigned roles, roles control function access – ADMIN/HR/MANAGER only – S_USER_GRP – MDM NOT allowed – SoD"
        apiEndpoint="/api/users"
        initialForm={{ email: '', name: '', role: 'USER', description: '' }}
        fields={[
          { key: "email", label: "EMAIL", required: true, placeholder: "", description: "User email – unique – login credential – SU01" },
          { key: "name", label: "USER_NAME", required: true, placeholder: "" },
          { key: "role", label: "ROLE_CODE", required: true, type: "autocomplete", apiUrl: "/api/roles", dataKey: "roles", codeField: "code", placeholder: "", createUrl: "/foundation/roles", createCode: "FROC", description: "Role FK – must exist via FROC – controls access – S_USER_AGR" },
          { key: "description", label: "DESCRIPTION", type: "textarea" },
        ]}
        relatedLinks={[
          { code: "FROC", label: "Role – required", route: "/foundation/roles", description: "Role – FROC (legacy PFCG) – S_USER_AGR" },
          { code: "ECGC", label: "Company Group – access", route: "/foundation/company-groups", description: "Company Group – OX02" },
        ]}
      />
    </RoleGuard>
  );
}
