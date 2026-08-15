export interface GuardianItem {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
}

export interface EmergencyContactItem {
  id: string;
  fullName: string;
  phone: string;
  relationship: string | null;
}

export interface StudentItem {
  id: string;
  fullName: string;
  birthDate: string | null;
  medicalAlerts: string | null;
}

export interface FamilySearchResult {
  id: string;
  guardians: GuardianItem[];
  students: StudentItem[];
}

export interface FamilyDetail {
  id: string;
  guardians: GuardianItem[];
  students: Array<StudentItem & { emergencyContacts: EmergencyContactItem[] }>;
}

export interface GroupSummary {
  id: string;
  name: string;
  program: { id: string; name: string };
  level: { id: string; name: string };
}

export interface StudentDetail extends StudentItem {
  family: { id: string; guardians: GuardianItem[] };
  emergencyContacts: EmergencyContactItem[];
  enrollments: Array<{
    id: string;
    status: string;
    startDate: string;
    group: GroupSummary;
  }>;
}
