# VonverIA Swim - Beta Internal Testing Guide

**Build Date:** 2026-08-15  
**Version:** 0.4.0 (M1 + M2 + M3 + M4 Simplified)

---

## Quick Start

### Credentials

#### Admin (Dirección) — Full Access
- **Email:** `sistemas@vonveria.mx`
- **Password:** `12345678acs`
- **Role:** Dirección (Director)
- **Access:** All modules, settings, reports, billing, instructor management

#### Instructor — Class View Only
- **Email:** `instructor@vonveria.mx`
- **Password:** `12345678acs`
- **Role:** Instructor (Maestra Andrea)
- **Access:** View today's classes, student roster, record attendance

---

## Testing Flows

### 1. **Instructor Daily Class View** (`/hoy`)
**Objective:** Verify instructor can see their assigned classes and students

**Steps:**
1. Login as `instructor@vonveria.mx` / `12345678acs`
2. You should see "Hola, Maestra Andrea" greeting
3. Class "Clase 9-10AM" should appear (next Monday 09:00-10:00)
4. Three students listed: Juan García, María García, Carlos García
5. Student icons are green (present by default)

**Expected Result:** ✅ Class and student roster visible, read-only view

---

### 2. **Admin Dashboard - Classes View** (`/clases`)
**Objective:** Verify admin can see all classes, instructors, and group status

**Steps:**
1. Login as `sistemas@vonveria.mx` / `12345678acs`
2. Navigate to **Clases** (in left sidebar)
3. You should see a table with:
   - **Grupo:** Clase 9-10AM
   - **Programa / Nivel:** Basico / Inicial
   - **Sucursal:** Sucursal Piloto · Alberca Principal
   - **Instructor:** Maestra Andrea
   - **Cupo:** 3/10
   - **Estado:** Publicado (green badge)

**Expected Result:** ✅ All groups visible with instructor assignment and occupancy

---

### 3. **Attendance Recording** (`/hoy` as Admin/Recepcion)
**Objective:** Verify admin/recepcion can mark student absences with notes

**Steps:**
1. Login as admin (`sistemas@vonveria.mx` / `12345678acs`)
2. Navigate to **Hoy** (or click class link from `/clases`)
3. In the Asistencia section, click on a student icon (Juan García)
4. Modal should open with:
   - Title: "Marcar ausencia"
   - Text area for optional notes
   - Button: "Marcar ausente" (red)
5. Add a note (e.g., "Enfermo") and click "Marcar ausente"
6. The student's icon should turn red (absent)
7. Click the student again and verify:
   - The note persists
   - Button now says "Revertir"
8. Click "Revertir" - icon should turn green again

**Expected Result:** ✅ Absence marked, note saved, reversion works

---

### 4. **Student Management** (`/alumnos`)
**Objective:** Verify family and student creation, search, and enrollment

**Steps:**
1. Login as admin
2. Navigate to **Alumnos**
3. **Search:** Search for "García" - should find the demo students
4. **View Student:** Click "Juan García" to see details
5. **Verify Enrollment:** Should show:
   - Group: Clase 9-10AM
   - Billing: Mensualidad $1,500/month (due day 15)
6. **Billing Section:** Should show monthly charge created

**Expected Result:** ✅ Students searchable, enrollment visible with charges

---

### 5. **Billing Overview** (`/pagos`)
**Objective:** Verify billing system shows charges and balances

**Steps:**
1. Login as admin
2. Navigate to **Pagos**
3. You should see:
   - Total adeudos (amounts due)
   - List of charges for students
4. Click on a charge to see details
5. **Record Payment:**
   - Click "Registrar pago"
   - Select student: Juan García
   - Enter amount: 1,500
   - Method: Efectivo (Cash)
   - Charge should mark as PAID
6. **View Receipt:** Click the payment to see printable receipt

**Expected Result:** ✅ Charges visible, payments recordable, receipts work

---

### 6. **Organization Branding** (`/settings/organization`)
**Objective:** Verify org configuration and dynamic branding

**Steps:**
1. Login as admin
2. Navigate to **Configuración → Organización**
3. You should see:
   - **Nombre:** Escuela Piloto VonverIA Swim
   - **Zona horaria:** America/Mexico_City
   - **Moneda:** MXN
   - **Branding:**
     - Primary Color: #003366 (deep blue)
     - Accent Color: #00a4cc (turquoise)
4. Try changing a color and refresh - change should persist

**Expected Result:** ✅ Settings load, colors apply dynamically

---

### 7. **User Management** (`/settings/users`)
**Objective:** Verify admin can manage users and roles

**Steps:**
1. Login as admin
2. Navigate to **Configuración → Usuarios**
3. You should see:
   - **sistemas@vonveria.mx** (Dirección)
   - **instructor@vonveria.mx** (Instructor)
4. Click on instructor to view role assignment

**Expected Result:** ✅ Users list works, roles visible

---

### 8. **Audit Log** (`/settings/audit`)
**Objective:** Verify audit trail of actions

**Steps:**
1. Login as admin
2. Navigate to **Configuración → Auditoría**
3. You should see log entries for:
   - User logins
   - Attendance changes
   - Payment records
   - Organization updates
4. Each entry should show actor, action, date, and details

**Expected Result:** ✅ Audit trail complete and searchable

---

## Key Features by Role

### Dirección (Admin)
- ✅ View all students and families
- ✅ Create and manage groups/classes
- ✅ Assign instructors
- ✅ View class rosters
- ✅ Record attendance and absences
- ✅ Record payments and track billing
- ✅ Close cash drawers
- ✅ View comprehensive audit logs
- ✅ Configure organization and branding
- ✅ Manage users and roles

### Instructor (Maestra Andrea)
- ✅ View today's classes (next 7 days)
- ✅ See assigned students
- ✅ **Read-only:** Cannot record attendance (Recepción/Dirección only)
- ✅ View navigation limited to: Hoy, Asistencia (placeholder), Evaluaciones (placeholder)

### Recepción (Not yet seeded, but supported)
- ✅ Same billing/attendance/student capabilities as Dirección
- ❌ Cannot adjust/refund/delete audit

---

## What's Implemented (Milestones)

### ✅ M1 - Organization, Access & Design
- Organization configuration
- User authentication & sessions
- Role-based access control (RBAC)
- Responsive layout
- Dynamic branding
- Audit logging foundation

### ✅ M2 - Families, Students, Facilities & Classes
- Family and student management
- Facilities (branches, pools, lanes)
- Programs and levels
- Group creation and scheduling
- Enrollment with capacity checks
- Session generation from schedule rules

### ✅ M3 - Billing
- Charge creation (enrollment fees, monthly, packages, single class)
- Payment recording with auto-allocation
- Adjustments and refunds (admin only)
- Package credit system with unit consumption
- Cash closing & settlement
- Printable receipts
- Monthly fee auto-generation (worker job)

### ✅ M4 - Attendance (Simplified Scope)
- **Simplified to absence notifications only** (no Hikvision integration, no biometric readers)
- Manual attendance recording
- Mark student as absent with optional notes
- Revert absence back to present
- Attendance visible to authorized roles only
- Audit trail for attendance changes

---

## Known Limitations & Next Steps

### Not Implemented Yet
- ❌ M5: Skill assessments and level advancement
- ❌ M6: Production deployment & compliance
- ❌ Hikvision biometric integration (planned for future)
- ❌ Email/SMS notifications
- ❌ WhatsApp integration
- ❌ CFDI/Fiscal receipts
- ❌ Mobile app
- ❌ Public family portal

### Testing Notes
- All data is **test/demo data** — safe to modify
- Database resets when `pnpm db:seed` is run
- No real payments processed (administrative record-keeping only)
- Timezone: America/Mexico_City (MXN currency)

---

## Troubleshooting

### Servers Not Starting
```bash
cd C:\Users\siste\OneDrive\Desktop\VonverIA-Swim
pnpm --parallel --filter "./apps/*" dev
```

### Database Issues
```bash
pnpm db:reset    # Nukes and reseeds
pnpm db:migrate  # Runs pending migrations
pnpm db:seed     # Populates demo data
```

### Port Conflicts
- API: 3001
- Web: 3100
- Worker: background service

Kill processes and retry:
```bash
# Find and kill node processes on those ports
netstat -ano | findstr ":3001 :3100"
taskkill /PID <PID> /F
```

---

## Contact & Feedback

For issues or feedback during testing:
- **Email:** sistemas@acstechnology.mx
- **Internal Wiki:** [Your team's wiki]
- **Issue Tracker:** [GitHub/Linear link]

---

**Last Updated:** 2026-08-15  
**Built with:** TypeScript, Next.js, NestJS, PostgreSQL, Prisma
