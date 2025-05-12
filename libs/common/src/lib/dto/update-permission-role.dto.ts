export type UpdatePermissionRoleDto = {
    login: string;
    role: 'viewer' | 'editor' | 'admin';
  }