export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  uuid: string;
  name: string;
  email: string;
  role_id: number;
  role: Role | null;
  created_at: string;
}
