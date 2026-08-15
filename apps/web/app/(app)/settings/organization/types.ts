export interface OrganizationData {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null;
}
