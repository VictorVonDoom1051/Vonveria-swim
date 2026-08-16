export interface OrganizationData {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  defaultEnrollmentFee: string | null;
  defaultAnnualFee: string | null;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null;
}
