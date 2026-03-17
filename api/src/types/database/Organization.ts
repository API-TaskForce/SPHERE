export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
