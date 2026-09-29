"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FUSC"
      sapAlias="SU01"
      title="User Maintenance"
      description="User Maintenance – administrative user maintenance account profiles tracking reset credentials authorization access rules – strict usage: users assigned roles, roles control function access"
      apiEndpoint="/api/users"
      initialForm={{ email: '', name: '', role: 'USER', description: '' }}
      fields={[
        { key: "email", label: "EMAIL", required: true, placeholder: "user@company.com", description: "User email – unique – login credential" },
        { key: "name", label: "USER_NAME", required: true, placeholder: "John Doe" },
        { key: "role", label: "ROLE_CODE", required: true, type: "autocomplete", apiUrl: "/api/roles", dataKey: "roles", codeField: "code", placeholder: "USER", createUrl: "/foundation/roles", createCode: "FROC", description: "Role FK – must exist via FROC – controls access" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FROC", label: "Role – required", route: "/foundation/roles", description: "Role" },
        { code: "ECGC", label: "Company Group – access", route: "/foundation/company-groups", description: "Company Group" },
      ]}
    />
  );
}
