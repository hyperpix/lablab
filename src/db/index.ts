/**
 * Apexo — Neon DB data access layer
 *
 * All public functions execute parameterised SQL against the Neon serverless
 * PostgreSQL database.  Types mirror the original PouchDB schema models so
 * that the rest of the application can be migrated incrementally.
 */

export { default as sql } from "./client";
// Refresh trigger
import sql from "./client";

// ─── TypeScript interfaces ────────────────────────────────────────────────────

export interface ToothData {
  ISO: number;
  condition:
    | "sound"
    | "filled"
    | "compromised"
    | "endo"
    | "missing"
    | "rotated"
    | "displaced"
    | "gum-recessed";
  notes: string[];
}

export interface PatientLabel {
  text: string;
  type: string;
}

export interface Patient {
  id: string;
  name: string;
  birth_year: number;
  gender: "male" | "female";
  tags: string;
  notes: string;
  address: string;
  email: string;
  phone: string;
  medical_history: string[];
  gallery: string[];
  galbum: string;
  teeth: ToothData[];
  labels: PatientLabel[];
  allergies: string[];
  next_recall_date: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentPrescriptionRef {
  prescription: string;
  id: string;
}

export interface Appointment {
  id: string;
  treatment_id: string | null;
  treatment_ids: string[];
  patient_id: string;
  staff_ids: string[];
  /** epoch milliseconds */
  date: number;
  /** duration in milliseconds */
  time: number;
  involved_teeth: number[];
  paid_amount: number;
  final_price: number;
  units: number;
  is_done: boolean;
  complaint: string;
  diagnosis: string;
  notes: string;
  prescriptions: AppointmentPrescriptionRef[];
  /** Tracked in DB but reminder sending is not yet implemented. */
  reminder_24h_sent: boolean;
  /** Tracked in DB but reminder sending is not yet implemented. */
  reminder_1h_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentForm {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  acknowledged: boolean;
  signed_date: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  amount: number;
  paid_amount: number;
  notes: string;
  issued_date: number;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  type: string;
  expenses: number;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string | null;
  operates: boolean;
  on_duty_days: string[];
  can_edit_staff: boolean;
  can_edit_patients: boolean;
  can_edit_ortho: boolean;
  can_edit_appointments: boolean;
  can_edit_treatments: boolean;
  can_edit_prescriptions: boolean;
  can_edit_settings: boolean;
  can_edit_labwork: boolean;
  can_view_staff: boolean;
  can_view_patients: boolean;
  can_view_ortho: boolean;
  can_view_appointments: boolean;
  can_view_treatments: boolean;
  can_view_prescriptions: boolean;
  can_view_settings: boolean;
  can_view_stats: boolean;
  can_view_labwork: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabWork {
  id: string;
  case_title: string;
  case_details: string;
  patient_id: string;
  operating_staff_ids: string[];
  involved_teeth: number[];
  lab_name: string;
  lab_contact: string;
  price: number;
  is_paid: boolean;
  is_sent: boolean;
  sent_date: number;
  is_received: boolean;
  received_date: number;
  created_at: string;
  updated_at: string;
}

export type PrescriptionForm =
  | "capsule"
  | "tablet"
  | "syrup"
  | "injection"
  | "drops"
  | "suppository";

export interface Prescription {
  id: string;
  name: string;
  dose_in_mg: number;
  times_per_day: number;
  units_per_time: number;
  form: PrescriptionForm;
  created_at: string;
  updated_at: string;
}

export interface PatientPrescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  issued_date: number;
  created_at: string;
  updated_at: string;
}

export interface OrthoVisitPhoto {
  id: string;
  photoID: string;
  comment: string;
}

export interface OrthoVisit {
  id: string;
  visitNumber: number;
  date: number;
  appliance: string;
  target: string;
  photos: OrthoVisitPhoto[];
}

export interface OrthoCase {
  id: string;
  patient_id: string;
  lips: string;
  facial_profile: string;
  nasio_labial_angle: number;
  oral_hygiene: string;
  skeletal_relationship: number;
  molars_relationship: number;
  canine_relationship: number;
  over_jet: number;
  over_bite: number;
  cross_scissor_bite: number[];
  u_space_available: number;
  u_space_needed: number;
  l_space_available: number;
  l_space_needed: number;
  problems_list: string[];
  treatment_plan_appliance: string[];
  next_visit_notes: string[];
  is_started: boolean;
  is_finished: boolean;
  started_date: number;
  finished_date: number;
  visits: OrthoVisit[];
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | "equipment"
  | "supplies"
  | "utilities"
  | "staff"
  | "rent"
  | "marketing"
  | "other";

export interface Supplier {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // due amount
  paid_amount: number;
  category: ExpenseCategory;
  date: number;
  notes: string;
  items: string[];
  photos: string[];
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Statistics {
  totalPatients: number;
  totalAppointments: number;
  revenue: number;
  appointmentsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  treatmentFrequency: { treatment: string; count: number }[];
}

export interface DentalChartLogEntry {
  id: string;
  patient_id: string;
  tooth_iso: number;
  old_condition: string;
  new_condition: string;
  changed_at: string;
}

export interface TreatmentPlanItem {
  id: string;
  treatment_id: string;
  price: number;
  is_done: boolean;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  title: string;
  items: TreatmentPlanItem[];
  status: "draft" | "accepted" | "completed" | "cancelled";
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Investigation {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  test_name: string;
  laboratory: string;
  status: "pending" | "in_progress" | "completed";
  result: string;
  date: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "absent";
}

export interface ReferralSource {
  id: string;
  name: string;
  type: string;
  specialty: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  head_staff_id: string | null;
  rooms: number;
  status: "active" | "inactive";
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Cast a raw DB row to the correct numeric types that Neon returns as strings */
function rowToPatient(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    name: row.name as string,
    birth_year: Number(row.birth_year),
    gender: row.gender as "male" | "female",
    tags: row.tags as string,
    notes: (row.notes as string) ?? "",
    address: row.address as string,
    email: row.email as string,
    phone: row.phone as string,
    medical_history: (row.medical_history as string[]) ?? [],
    gallery: (row.gallery as string[]) ?? [],
    galbum: row.galbum as string,
    teeth: (row.teeth as ToothData[]) ?? [],
    labels: (row.labels as PatientLabel[]) ?? [],
    allergies: (row.allergies as string[]) ?? [],
    next_recall_date:
      row.next_recall_date != null ? Number(row.next_recall_date) : null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToAppointment(row: Record<string, unknown>): Appointment {
  const treatmentIds = (row.treatment_ids as string[] | null) ?? [];
  const legacyId = row.treatment_id as string | null;
  return {
    id: row.id as string,
    treatment_id: legacyId,
    treatment_ids:
      treatmentIds.length > 0 ? treatmentIds : legacyId ? [legacyId] : [],
    patient_id: row.patient_id as string,
    staff_ids: (row.staff_ids as string[]) ?? [],
    date: Number(row.date),
    time: Number(row.time),
    involved_teeth: (row.involved_teeth as number[]) ?? [],
    paid_amount: Number(row.paid_amount),
    final_price: Number(row.final_price),
    units: Number(row.units),
    is_done: Boolean(row.is_done),
    complaint: row.complaint as string,
    diagnosis: row.diagnosis as string,
    notes: row.notes as string,
    prescriptions: (row.prescriptions as AppointmentPrescriptionRef[]) ?? [],
    reminder_24h_sent: Boolean(row.reminder_24h_sent),
    reminder_1h_sent: Boolean(row.reminder_1h_sent),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToTreatment(row: Record<string, unknown>): Treatment {
  return {
    id: row.id as string,
    type: row.type as string,
    expenses: Number(row.expenses),
    duration: Number(row.duration ?? 45),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToStaffMember(row: Record<string, unknown>): StaffMember {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    pin: row.pin as string | null,
    operates: Boolean(row.operates),
    on_duty_days: (row.on_duty_days as string[]) ?? [],
    can_edit_staff: Boolean(row.can_edit_staff),
    can_edit_patients: Boolean(row.can_edit_patients),
    can_edit_ortho: Boolean(row.can_edit_ortho),
    can_edit_appointments: Boolean(row.can_edit_appointments),
    can_edit_treatments: Boolean(row.can_edit_treatments),
    can_edit_prescriptions: Boolean(row.can_edit_prescriptions),
    can_edit_settings: Boolean(row.can_edit_settings),
    can_edit_labwork: Boolean(row.can_edit_labwork),
    can_view_staff: Boolean(row.can_view_staff),
    can_view_patients: Boolean(row.can_view_patients),
    can_view_ortho: Boolean(row.can_view_ortho),
    can_view_appointments: Boolean(row.can_view_appointments),
    can_view_treatments: Boolean(row.can_view_treatments),
    can_view_prescriptions: Boolean(row.can_view_prescriptions),
    can_view_settings: Boolean(row.can_view_settings),
    can_view_stats: Boolean(row.can_view_stats),
    can_view_labwork: Boolean(row.can_view_labwork),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToLabWork(row: Record<string, unknown>): LabWork {
  return {
    id: row.id as string,
    case_title: row.case_title as string,
    case_details: row.case_details as string,
    patient_id: row.patient_id as string,
    operating_staff_ids: (row.operating_staff_ids as string[]) ?? [],
    involved_teeth: (row.involved_teeth as number[]) ?? [],
    lab_name: row.lab_name as string,
    lab_contact: row.lab_contact as string,
    price: Number(row.price),
    is_paid: Boolean(row.is_paid),
    is_sent: Boolean(row.is_sent),
    sent_date: Number(row.sent_date),
    is_received: Boolean(row.is_received),
    received_date: Number(row.received_date),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToPrescription(row: Record<string, unknown>): Prescription {
  return {
    id: row.id as string,
    name: row.name as string,
    dose_in_mg: Number(row.dose_in_mg),
    times_per_day: Number(row.times_per_day),
    units_per_time: Number(row.units_per_time),
    form: row.form as PrescriptionForm,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToOrthoCase(row: Record<string, unknown>): OrthoCase {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    lips: row.lips as string,
    facial_profile: row.facial_profile as string,
    nasio_labial_angle: Number(row.nasio_labial_angle),
    oral_hygiene: row.oral_hygiene as string,
    skeletal_relationship: Number(row.skeletal_relationship),
    molars_relationship: Number(row.molars_relationship),
    canine_relationship: Number(row.canine_relationship),
    over_jet: Number(row.over_jet),
    over_bite: Number(row.over_bite),
    cross_scissor_bite: (row.cross_scissor_bite as number[]) ?? [],
    u_space_available: Number(row.u_space_available),
    u_space_needed: Number(row.u_space_needed),
    l_space_available: Number(row.l_space_available),
    l_space_needed: Number(row.l_space_needed),
    problems_list: (row.problems_list as string[]) ?? [],
    treatment_plan_appliance: (row.treatment_plan_appliance as string[]) ?? [],
    next_visit_notes: (row.next_visit_notes as string[]) ?? [],
    is_started: Boolean(row.is_started),
    is_finished: Boolean(row.is_finished),
    started_date: Number(row.started_date),
    finished_date: Number(row.finished_date),
    visits: (row.visits as OrthoVisit[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToTreatmentPlan(row: Record<string, unknown>): TreatmentPlan {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    title: row.title as string,
    items: (row.items as TreatmentPlanItem[]) ?? [],
    status: row.status as "draft" | "accepted" | "completed" | "cancelled",
    total_price: Number(row.total_price),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToInvestigation(row: Record<string, unknown>): Investigation {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    appointment_id: row.appointment_id as string | null,
    test_name: row.test_name as string,
    laboratory: row.laboratory as string,
    status: row.status as "pending" | "in_progress" | "completed",
    result: row.result as string,
    date: Number(row.date),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    stock: Number(row.stock),
    unit: row.unit as string,
    min_stock: Number(row.min_stock),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToReferralSource(row: Record<string, unknown>): ReferralSource {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    specialty: row.specialty as string,
    status: row.status as "active" | "inactive",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToDepartment(row: Record<string, unknown>): Department {
  return {
    id: row.id as string,
    name: row.name as string,
    head_staff_id: row.head_staff_id as string | null,
    rooms: Number(row.rooms),
    status: row.status as "active" | "inactive",
  };
}

// ─── PATIENT operations ───────────────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  const rows = await sql`
    SELECT * FROM patients
    ORDER BY name ASC
  `;
  return rows.map((r) => rowToPatient(r as Record<string, unknown>));
}

export async function getPatient(id: string): Promise<Patient | null> {
  const rows = await sql`
    SELECT * FROM patients
    WHERE id = ${id}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToPatient(rows[0] as Record<string, unknown>);
}

export async function createPatient(
  data: Omit<Patient, "id" | "created_at" | "updated_at">,
): Promise<Patient> {
  const rows = await sql`
    INSERT INTO patients (
      name, birth_year, gender, tags, address, email, phone,
      medical_history, gallery, galbum, teeth, labels, allergies, next_recall_date
    ) VALUES (
      ${data.name},
      ${data.birth_year},
      ${data.gender},
      ${data.tags},
      ${data.address},
      ${data.email},
      ${data.phone},
      ${data.medical_history},
      ${data.gallery},
      ${data.galbum},
      ${JSON.stringify(data.teeth)},
      ${JSON.stringify(data.labels)},
      ${data.allergies ?? []},
      ${data.next_recall_date ?? null}
    )
    RETURNING *
  `;
  return rowToPatient(rows[0] as Record<string, unknown>);
}

export async function updatePatient(
  id: string,
  data: Partial<Omit<Patient, "id" | "created_at" | "updated_at">>,
): Promise<Patient> {
  // Build SET clause dynamically for only the supplied fields
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name");
    values.push(data.name);
  }
  if (data.birth_year !== undefined) {
    fields.push("birth_year");
    values.push(data.birth_year);
  }
  if (data.gender !== undefined) {
    fields.push("gender");
    values.push(data.gender);
  }
  if (data.tags !== undefined) {
    fields.push("tags");
    values.push(data.tags);
  }
  if (data.notes !== undefined) {
    fields.push("notes");
    values.push(data.notes);
  }
  if (data.address !== undefined) {
    fields.push("address");
    values.push(data.address);
  }
  if (data.email !== undefined) {
    fields.push("email");
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push("phone");
    values.push(data.phone);
  }
  if (data.medical_history !== undefined) {
    fields.push("medical_history");
    values.push(data.medical_history);
  }
  if (data.gallery !== undefined) {
    fields.push("gallery");
    values.push(data.gallery);
  }
  if (data.galbum !== undefined) {
    fields.push("galbum");
    values.push(data.galbum);
  }
  if (data.teeth !== undefined) {
    fields.push("teeth");
    values.push(JSON.stringify(data.teeth));
  }
  if (data.labels !== undefined) {
    fields.push("labels");
    values.push(JSON.stringify(data.labels));
  }
  if (data.allergies !== undefined) {
    fields.push("allergies");
    values.push(data.allergies);
  }
  if (data.next_recall_date !== undefined) {
    fields.push("next_recall_date");
    values.push(data.next_recall_date);
  }

  if (fields.length === 0) {
    const existing = await getPatient(id);
    if (!existing) throw new Error(`Patient ${id} not found`);
    return existing;
  }

  // Build the parameterised query using neon's tagged-template approach.
  // We do this by assembling a plain SQL string + positional params array and
  // calling the underlying query function (neon supports this via sql.query).
  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `
    UPDATE patients
    SET ${setClauses}
    WHERE id = $${paramList.length}
    RETURNING *
  `;
  const rows = await sql(query, paramList);
  if (rows.length === 0) throw new Error(`Patient ${id} not found`);
  return rowToPatient(rows[0] as Record<string, unknown>);
}

export async function deletePatient(id: string): Promise<void> {
  await sql`DELETE FROM patients WHERE id = ${id}`;
}

// ─── DENTAL CHART LOG operations ─────────────────────────────────────────────

function rowToDentalChartLogEntry(
  row: Record<string, unknown>,
): DentalChartLogEntry {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    tooth_iso: Number(row.tooth_iso),
    old_condition: row.old_condition as string,
    new_condition: row.new_condition as string,
    changed_at: row.changed_at as string,
  };
}

/** Record a single tooth condition change. */
export async function logDentalChartChange(
  patient_id: string,
  tooth_iso: number,
  old_condition: string,
  new_condition: string,
): Promise<DentalChartLogEntry> {
  const rows = await sql`
    INSERT INTO dental_chart_log (patient_id, tooth_iso, old_condition, new_condition)
    VALUES (${patient_id}, ${tooth_iso}, ${old_condition}, ${new_condition})
    RETURNING *
  `;
  return rowToDentalChartLogEntry(rows[0] as Record<string, unknown>);
}

/** Fetch the full change history for a patient, newest first. */
export async function getDentalChartLog(
  patient_id: string,
): Promise<DentalChartLogEntry[]> {
  const rows = await sql`
    SELECT * FROM dental_chart_log
    WHERE patient_id = ${patient_id}
    ORDER BY changed_at DESC
  `;
  return rows.map((r) =>
    rowToDentalChartLogEntry(r as Record<string, unknown>),
  );
}

// ─── SUPPLIER operations ──────────────────────────────────────────────────────

function rowToSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    name: row.name as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getSuppliers(): Promise<Supplier[]> {
  const rows = await sql`SELECT * FROM suppliers ORDER BY name ASC`;
  return rows.map((r) => rowToSupplier(r as Record<string, unknown>));
}

export async function createSupplier(name: string): Promise<Supplier> {
  const rows =
    await sql`INSERT INTO suppliers (name) VALUES (${name}) RETURNING *`;
  return rowToSupplier(rows[0] as Record<string, unknown>);
}

export async function deleteSupplier(id: string): Promise<void> {
  await sql`DELETE FROM suppliers WHERE id = ${id}`;
}

// ─── EXPENSE operations ───────────────────────────────────────────────────────

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    title: row.title as string,
    amount: Number(row.amount),
    paid_amount: Number(row.paid_amount ?? 0),
    category: row.category as ExpenseCategory,
    date: Number(row.date),
    notes: (row.notes as string) ?? "",
    items: (row.items as string[]) ?? [],
    photos: (row.photos as string[]) ?? [],
    supplier_id: (row.supplier_id as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getExpenses(
  supplier_id?: string | null,
): Promise<Expense[]> {
  if (supplier_id !== undefined) {
    if (supplier_id === null) {
      const rows =
        await sql`SELECT * FROM expenses WHERE supplier_id IS NULL ORDER BY date DESC`;
      return rows.map((r) => rowToExpense(r as Record<string, unknown>));
    }
    const rows =
      await sql`SELECT * FROM expenses WHERE supplier_id = ${supplier_id} ORDER BY date DESC`;
    return rows.map((r) => rowToExpense(r as Record<string, unknown>));
  }
  const rows = await sql`SELECT * FROM expenses ORDER BY date DESC`;
  return rows.map((r) => rowToExpense(r as Record<string, unknown>));
}

export async function createExpense(
  data: Omit<Expense, "id" | "created_at" | "updated_at">,
): Promise<Expense> {
  const rows = await sql`
    INSERT INTO expenses (title, amount, paid_amount, category, date, notes, items, photos, supplier_id)
    VALUES (
      ${data.title}, ${data.amount}, ${data.paid_amount ?? 0},
      ${data.category}, ${data.date}, ${data.notes},
      ${JSON.stringify(data.items ?? [])}::jsonb,
      ${JSON.stringify(data.photos ?? [])}::jsonb,
      ${data.supplier_id ?? null}
    )
    RETURNING *
  `;
  return rowToExpense(rows[0] as Record<string, unknown>);
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "created_at" | "updated_at">>,
): Promise<Expense> {
  // Build dynamic SET clause; JSONB columns need an explicit cast in SQL
  const clauses: string[] = [];
  const values: unknown[] = [];
  const add = (col: string, val: unknown, cast = "") => {
    clauses.push(`${col} = $${values.length + 1}${cast}`);
    values.push(val);
  };
  if (data.title !== undefined) add("title", data.title);
  if (data.amount !== undefined) add("amount", data.amount);
  if (data.paid_amount !== undefined) add("paid_amount", data.paid_amount);
  if (data.category !== undefined) add("category", data.category);
  if (data.date !== undefined) add("date", data.date);
  if (data.notes !== undefined) add("notes", data.notes);
  if (data.items !== undefined)
    add("items", JSON.stringify(data.items), "::jsonb");
  if (data.photos !== undefined)
    add("photos", JSON.stringify(data.photos), "::jsonb");
  if (clauses.length === 0) {
    const e = await sql`SELECT * FROM expenses WHERE id = ${id}`;
    return rowToExpense(e[0] as Record<string, unknown>);
  }
  const query = `UPDATE expenses SET ${clauses.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`;
  const result = await sql(query, [...values, id]);
  if (result.length === 0) throw new Error(`Expense ${id} not found`);
  return rowToExpense(result[0] as Record<string, unknown>);
}

export async function deleteExpense(id: string): Promise<void> {
  await sql`DELETE FROM expenses WHERE id = ${id}`;
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const pattern = `%${query}%`;
  const rows = await sql`
    SELECT * FROM patients
    WHERE
      name            ILIKE ${pattern} OR
      phone           ILIKE ${pattern} OR
      email           ILIKE ${pattern} OR
      address         ILIKE ${pattern} OR
      tags            ILIKE ${pattern} OR
      CAST(birth_year AS TEXT) ILIKE ${pattern}
    ORDER BY name ASC
  `;
  return rows.map((r) => rowToPatient(r as Record<string, unknown>));
}

// ─── APPOINTMENT operations ───────────────────────────────────────────────────

export async function getAppointments(filters?: {
  patientId?: string;
  staffId?: string;
  date?: number;
}): Promise<Appointment[]> {
  if (filters?.patientId && filters?.staffId && filters?.date !== undefined) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE patient_id = ${filters.patientId}
        AND ${filters.staffId} = ANY(staff_ids)
        AND date = ${filters.date}
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.patientId && filters?.staffId) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE patient_id = ${filters.patientId}
        AND ${filters.staffId} = ANY(staff_ids)
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.patientId && filters?.date !== undefined) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE patient_id = ${filters.patientId}
        AND date = ${filters.date}
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.staffId && filters?.date !== undefined) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE ${filters.staffId} = ANY(staff_ids)
        AND date = ${filters.date}
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.patientId) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE patient_id = ${filters.patientId}
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.staffId) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE ${filters.staffId} = ANY(staff_ids)
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  if (filters?.date !== undefined) {
    const rows = await sql`
      SELECT * FROM appointments
      WHERE date = ${filters.date}
      ORDER BY date DESC
    `;
    return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
  }

  const rows = await sql`SELECT * FROM appointments ORDER BY date DESC`;
  return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
}

export async function getAppointmentsForDateRange(
  startEpochMs: number,
  endEpochMs: number,
): Promise<Appointment[]> {
  const rows = await sql`
    SELECT * FROM appointments
    WHERE date >= ${startEpochMs} AND date <= ${endEpochMs}
    ORDER BY date ASC
  `;
  return rows.map((r) => rowToAppointment(r as Record<string, unknown>));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const rows = await sql`
    SELECT * FROM appointments WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToAppointment(rows[0] as Record<string, unknown>);
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "created_at" | "updated_at">,
): Promise<Appointment> {
  const tIds =
    data.treatment_ids ?? (data.treatment_id ? [data.treatment_id] : []);
  const rows = await sql`
    INSERT INTO appointments (
      treatment_id, treatment_ids, patient_id, staff_ids, date, time,
      involved_teeth, paid_amount, final_price, units,
      is_done, complaint, diagnosis, notes, prescriptions
    ) VALUES (
      ${tIds[0] ?? null},
      ${tIds},
      ${data.patient_id},
      ${data.staff_ids},
      ${data.date},
      ${data.time},
      ${data.involved_teeth},
      ${data.paid_amount},
      ${data.final_price},
      ${data.units},
      ${data.is_done},
      ${data.complaint},
      ${data.diagnosis},
      ${data.notes},
      ${JSON.stringify(data.prescriptions)}
    )
    RETURNING *
  `;
  return rowToAppointment(rows[0] as Record<string, unknown>);
}

export async function updateAppointment(
  id: string,
  data: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>,
): Promise<Appointment> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.treatment_ids !== undefined) {
    const tIds = data.treatment_ids;
    fields.push("treatment_ids");
    values.push(tIds);
    fields.push("treatment_id");
    values.push(tIds[0] ?? null);
  } else if (data.treatment_id !== undefined) {
    fields.push("treatment_id");
    values.push(data.treatment_id);
  }
  if (data.patient_id !== undefined) {
    fields.push("patient_id");
    values.push(data.patient_id);
  }
  if (data.staff_ids !== undefined) {
    fields.push("staff_ids");
    values.push(data.staff_ids);
  }
  if (data.date !== undefined) {
    fields.push("date");
    values.push(data.date);
  }
  if (data.time !== undefined) {
    fields.push("time");
    values.push(data.time);
  }
  if (data.involved_teeth !== undefined) {
    fields.push("involved_teeth");
    values.push(data.involved_teeth);
  }
  if (data.paid_amount !== undefined) {
    fields.push("paid_amount");
    values.push(data.paid_amount);
  }
  if (data.final_price !== undefined) {
    fields.push("final_price");
    values.push(data.final_price);
  }
  if (data.units !== undefined) {
    fields.push("units");
    values.push(data.units);
  }
  if (data.is_done !== undefined) {
    fields.push("is_done");
    values.push(data.is_done);
  }
  if (data.complaint !== undefined) {
    fields.push("complaint");
    values.push(data.complaint);
  }
  if (data.diagnosis !== undefined) {
    fields.push("diagnosis");
    values.push(data.diagnosis);
  }
  if (data.notes !== undefined) {
    fields.push("notes");
    values.push(data.notes);
  }
  if (data.prescriptions !== undefined) {
    fields.push("prescriptions");
    values.push(JSON.stringify(data.prescriptions));
  }

  if (fields.length === 0) {
    const existing = await getAppointment(id);
    if (!existing) throw new Error(`Appointment ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `
    UPDATE appointments SET ${setClauses}
    WHERE id = $${paramList.length}
    RETURNING *
  `;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`Appointment ${id} not found`);
  return rowToAppointment(result[0] as Record<string, unknown>);
}

export async function runMigrations(): Promise<void> {
  await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS treatment_ids TEXT[] NOT NULL DEFAULT '{}'`;
}

export async function deleteAppointment(id: string): Promise<void> {
  await sql`DELETE FROM appointments WHERE id = ${id}`;
}

// ─── TREATMENT operations ─────────────────────────────────────────────────────

export async function getTreatments(): Promise<Treatment[]> {
  const rows = await sql`SELECT * FROM treatments ORDER BY type ASC`;
  return rows.map((r) => rowToTreatment(r as Record<string, unknown>));
}

export async function getTreatment(id: string): Promise<Treatment | null> {
  const rows = await sql`SELECT * FROM treatments WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToTreatment(rows[0] as Record<string, unknown>);
}

export async function createTreatment(
  data: Omit<Treatment, "id" | "created_at" | "updated_at">,
): Promise<Treatment> {
  const rows = await sql`
    INSERT INTO treatments (type, expenses, duration)
    VALUES (${data.type}, ${data.expenses}, ${data.duration ?? 45})
    RETURNING *
  `;
  return rowToTreatment(rows[0] as Record<string, unknown>);
}

export async function updateTreatment(
  id: string,
  data: Partial<Omit<Treatment, "id" | "created_at" | "updated_at">>,
): Promise<Treatment> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.type !== undefined) {
    fields.push("type");
    values.push(data.type);
  }
  if (data.expenses !== undefined) {
    fields.push("expenses");
    values.push(data.expenses);
  }
  if (data.duration !== undefined) {
    fields.push("duration");
    values.push(data.duration);
  }

  if (fields.length === 0) {
    const existing = await getTreatment(id);
    if (!existing) throw new Error(`Treatment ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE treatments SET ${setClauses} WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`Treatment ${id} not found`);
  return rowToTreatment(result[0] as Record<string, unknown>);
}

export async function deleteTreatment(id: string): Promise<void> {
  await sql`DELETE FROM treatments WHERE id = ${id}`;
}

// ─── STAFF operations ─────────────────────────────────────────────────────────

export async function getStaff(): Promise<StaffMember[]> {
  const rows = await sql`SELECT * FROM staff ORDER BY name ASC`;
  return rows.map((r) => rowToStaffMember(r as Record<string, unknown>));
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const rows = await sql`SELECT * FROM staff WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToStaffMember(rows[0] as Record<string, unknown>);
}

export async function createStaffMember(
  data: Omit<StaffMember, "id" | "created_at" | "updated_at">,
): Promise<StaffMember> {
  const rows = await sql`
    INSERT INTO staff (
      name, email, phone, pin, operates, on_duty_days,
      can_edit_staff, can_edit_patients, can_edit_ortho, can_edit_appointments,
      can_edit_treatments, can_edit_prescriptions, can_edit_settings, can_edit_labwork,
      can_view_staff, can_view_patients, can_view_ortho, can_view_appointments,
      can_view_treatments, can_view_prescriptions, can_view_settings,
      can_view_stats, can_view_labwork
    ) VALUES (
      ${data.name}, ${data.email}, ${data.phone}, ${data.pin ?? null},
      ${data.operates}, ${data.on_duty_days},
      ${data.can_edit_staff}, ${data.can_edit_patients}, ${data.can_edit_ortho},
      ${data.can_edit_appointments}, ${data.can_edit_treatments},
      ${data.can_edit_prescriptions}, ${data.can_edit_settings}, ${data.can_edit_labwork},
      ${data.can_view_staff}, ${data.can_view_patients}, ${data.can_view_ortho},
      ${data.can_view_appointments}, ${data.can_view_treatments},
      ${data.can_view_prescriptions}, ${data.can_view_settings},
      ${data.can_view_stats}, ${data.can_view_labwork}
    )
    RETURNING *
  `;
  return rowToStaffMember(rows[0] as Record<string, unknown>);
}

export async function updateStaffMember(
  id: string,
  data: Partial<Omit<StaffMember, "id" | "created_at" | "updated_at">>,
): Promise<StaffMember> {
  const fieldMap: [keyof typeof data, string][] = [
    ["name", "name"],
    ["email", "email"],
    ["phone", "phone"],
    ["pin", "pin"],
    ["operates", "operates"],
    ["on_duty_days", "on_duty_days"],
    ["can_edit_staff", "can_edit_staff"],
    ["can_edit_patients", "can_edit_patients"],
    ["can_edit_ortho", "can_edit_ortho"],
    ["can_edit_appointments", "can_edit_appointments"],
    ["can_edit_treatments", "can_edit_treatments"],
    ["can_edit_prescriptions", "can_edit_prescriptions"],
    ["can_edit_settings", "can_edit_settings"],
    ["can_edit_labwork", "can_edit_labwork"],
    ["can_view_staff", "can_view_staff"],
    ["can_view_patients", "can_view_patients"],
    ["can_view_ortho", "can_view_ortho"],
    ["can_view_appointments", "can_view_appointments"],
    ["can_view_treatments", "can_view_treatments"],
    ["can_view_prescriptions", "can_view_prescriptions"],
    ["can_view_settings", "can_view_settings"],
    ["can_view_stats", "can_view_stats"],
    ["can_view_labwork", "can_view_labwork"],
  ];

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of fieldMap) {
    if (data[key] !== undefined) {
      fields.push(col);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    const existing = await getStaffMember(id);
    if (!existing) throw new Error(`StaffMember ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE staff SET ${setClauses} WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`StaffMember ${id} not found`);
  return rowToStaffMember(result[0] as Record<string, unknown>);
}

export async function deleteStaffMember(id: string): Promise<void> {
  await sql`DELETE FROM staff WHERE id = ${id}`;
}

// ─── LABWORK operations ───────────────────────────────────────────────────────

export async function getLabWork(filters?: {
  patientId?: string;
  staffId?: string;
}): Promise<LabWork[]> {
  if (filters?.patientId && filters?.staffId) {
    const rows = await sql`
      SELECT * FROM labwork
      WHERE patient_id = ${filters.patientId}
        AND ${filters.staffId} = ANY(operating_staff_ids)
      ORDER BY sent_date DESC
    `;
    return rows.map((r) => rowToLabWork(r as Record<string, unknown>));
  }
  if (filters?.patientId) {
    const rows = await sql`
      SELECT * FROM labwork WHERE patient_id = ${filters.patientId} ORDER BY sent_date DESC
    `;
    return rows.map((r) => rowToLabWork(r as Record<string, unknown>));
  }
  if (filters?.staffId) {
    const rows = await sql`
      SELECT * FROM labwork WHERE ${filters.staffId} = ANY(operating_staff_ids) ORDER BY sent_date DESC
    `;
    return rows.map((r) => rowToLabWork(r as Record<string, unknown>));
  }
  const rows = await sql`SELECT * FROM labwork ORDER BY sent_date DESC`;
  return rows.map((r) => rowToLabWork(r as Record<string, unknown>));
}

export async function getLabWorkItem(id: string): Promise<LabWork | null> {
  const rows = await sql`SELECT * FROM labwork WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToLabWork(rows[0] as Record<string, unknown>);
}

export async function createLabWork(
  data: Omit<LabWork, "id" | "created_at" | "updated_at">,
): Promise<LabWork> {
  const rows = await sql`
    INSERT INTO labwork (
      case_title, case_details, patient_id, operating_staff_ids, involved_teeth,
      lab_name, lab_contact, price, is_paid, is_sent, sent_date, is_received, received_date
    ) VALUES (
      ${data.case_title}, ${data.case_details}, ${data.patient_id},
      ${data.operating_staff_ids}, ${data.involved_teeth},
      ${data.lab_name}, ${data.lab_contact}, ${data.price},
      ${data.is_paid}, ${data.is_sent}, ${data.sent_date},
      ${data.is_received}, ${data.received_date}
    )
    RETURNING *
  `;
  return rowToLabWork(rows[0] as Record<string, unknown>);
}

export async function updateLabWork(
  id: string,
  data: Partial<Omit<LabWork, "id" | "created_at" | "updated_at">>,
): Promise<LabWork> {
  const fieldMap: [keyof typeof data, string][] = [
    ["case_title", "case_title"],
    ["case_details", "case_details"],
    ["patient_id", "patient_id"],
    ["operating_staff_ids", "operating_staff_ids"],
    ["involved_teeth", "involved_teeth"],
    ["lab_name", "lab_name"],
    ["lab_contact", "lab_contact"],
    ["price", "price"],
    ["is_paid", "is_paid"],
    ["is_sent", "is_sent"],
    ["sent_date", "sent_date"],
    ["is_received", "is_received"],
    ["received_date", "received_date"],
  ];

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of fieldMap) {
    if (data[key] !== undefined) {
      fields.push(col);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    const existing = await getLabWorkItem(id);
    if (!existing) throw new Error(`LabWork ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE labwork SET ${setClauses} WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`LabWork ${id} not found`);
  return rowToLabWork(result[0] as Record<string, unknown>);
}

export async function deleteLabWork(id: string): Promise<void> {
  await sql`DELETE FROM labwork WHERE id = ${id}`;
}

// ─── PRESCRIPTION operations ──────────────────────────────────────────────────

export async function getPrescriptions(): Promise<Prescription[]> {
  const rows = await sql`SELECT * FROM prescriptions ORDER BY name ASC`;
  return rows.map((r) => rowToPrescription(r as Record<string, unknown>));
}

export async function getPrescription(
  id: string,
): Promise<Prescription | null> {
  const rows = await sql`SELECT * FROM prescriptions WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToPrescription(rows[0] as Record<string, unknown>);
}

export async function createPrescription(
  data: Omit<Prescription, "id" | "created_at" | "updated_at">,
): Promise<Prescription> {
  const rows = await sql`
    INSERT INTO prescriptions (name, dose_in_mg, times_per_day, units_per_time, form)
    VALUES (${data.name}, ${data.dose_in_mg}, ${data.times_per_day}, ${data.units_per_time}, ${data.form})
    RETURNING *
  `;
  return rowToPrescription(rows[0] as Record<string, unknown>);
}

export async function updatePrescription(
  id: string,
  data: Partial<Omit<Prescription, "id" | "created_at" | "updated_at">>,
): Promise<Prescription> {
  const fieldMap: [keyof typeof data, string][] = [
    ["name", "name"],
    ["dose_in_mg", "dose_in_mg"],
    ["times_per_day", "times_per_day"],
    ["units_per_time", "units_per_time"],
    ["form", "form"],
  ];

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of fieldMap) {
    if (data[key] !== undefined) {
      fields.push(col);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    const existing = await getPrescription(id);
    if (!existing) throw new Error(`Prescription ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE prescriptions SET ${setClauses} WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`Prescription ${id} not found`);
  return rowToPrescription(result[0] as Record<string, unknown>);
}

export async function deletePrescription(id: string): Promise<void> {
  await sql`DELETE FROM prescriptions WHERE id = ${id}`;
}

// ─── ORTHODONTIC CASE operations ──────────────────────────────────────────────

export async function getOrthoCases(filters?: {
  patientId?: string;
}): Promise<OrthoCase[]> {
  if (filters?.patientId) {
    const rows = await sql`
      SELECT * FROM orthodontic_cases WHERE patient_id = ${filters.patientId} ORDER BY created_at ASC
    `;
    return rows.map((r) => rowToOrthoCase(r as Record<string, unknown>));
  }
  const rows =
    await sql`SELECT * FROM orthodontic_cases ORDER BY created_at ASC`;
  return rows.map((r) => rowToOrthoCase(r as Record<string, unknown>));
}

export async function getOrthoCase(id: string): Promise<OrthoCase | null> {
  const rows =
    await sql`SELECT * FROM orthodontic_cases WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToOrthoCase(rows[0] as Record<string, unknown>);
}

export async function createOrthoCase(
  data: Omit<OrthoCase, "id" | "created_at" | "updated_at">,
): Promise<OrthoCase> {
  const rows = await sql`
    INSERT INTO orthodontic_cases (
      patient_id, lips, facial_profile, nasio_labial_angle, oral_hygiene,
      skeletal_relationship, molars_relationship, canine_relationship,
      over_jet, over_bite, cross_scissor_bite,
      u_space_available, u_space_needed,
      l_space_available, l_space_needed,
      problems_list, treatment_plan_appliance, next_visit_notes,
      is_started, is_finished, started_date, finished_date, visits
    ) VALUES (
      ${data.patient_id}, ${data.lips}, ${data.facial_profile}, ${data.nasio_labial_angle},
      ${data.oral_hygiene}, ${data.skeletal_relationship}, ${data.molars_relationship},
      ${data.canine_relationship}, ${data.over_jet}, ${data.over_bite},
      ${data.cross_scissor_bite},
      ${data.u_space_available}, ${data.u_space_needed},
      ${data.l_space_available}, ${data.l_space_needed},
      ${data.problems_list}, ${data.treatment_plan_appliance}, ${data.next_visit_notes},
      ${data.is_started}, ${data.is_finished}, ${data.started_date}, ${data.finished_date},
      ${JSON.stringify(data.visits)}
    )
    RETURNING *
  `;
  return rowToOrthoCase(rows[0] as Record<string, unknown>);
}

export async function updateOrthoCase(
  id: string,
  data: Partial<Omit<OrthoCase, "id" | "created_at" | "updated_at">>,
): Promise<OrthoCase> {
  const fieldMap: [keyof typeof data, string, boolean?][] = [
    ["patient_id", "patient_id"],
    ["lips", "lips"],
    ["facial_profile", "facial_profile"],
    ["nasio_labial_angle", "nasio_labial_angle"],
    ["oral_hygiene", "oral_hygiene"],
    ["skeletal_relationship", "skeletal_relationship"],
    ["molars_relationship", "molars_relationship"],
    ["canine_relationship", "canine_relationship"],
    ["over_jet", "over_jet"],
    ["over_bite", "over_bite"],
    ["cross_scissor_bite", "cross_scissor_bite"],
    ["u_space_available", "u_space_available"],
    ["u_space_needed", "u_space_needed"],
    ["l_space_available", "l_space_available"],
    ["l_space_needed", "l_space_needed"],
    ["problems_list", "problems_list"],
    ["treatment_plan_appliance", "treatment_plan_appliance"],
    ["next_visit_notes", "next_visit_notes"],
    ["is_started", "is_started"],
    ["is_finished", "is_finished"],
    ["started_date", "started_date"],
    ["finished_date", "finished_date"],
    ["visits", "visits", /* json */ true],
  ];

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, col, isJson] of fieldMap) {
    if (data[key] !== undefined) {
      fields.push(col);
      values.push(isJson ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (fields.length === 0) {
    const existing = await getOrthoCase(id);
    if (!existing) throw new Error(`OrthoCase ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE orthodontic_cases SET ${setClauses} WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`OrthoCase ${id} not found`);
  return rowToOrthoCase(result[0] as Record<string, unknown>);
}

export async function deleteOrthoCase(id: string): Promise<void> {
  await sql`DELETE FROM orthodontic_cases WHERE id = ${id}`;
}

// ─── SETTINGS operations ──────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<unknown> {
  const rows = await sql`
    SELECT value FROM settings WHERE key = ${key} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return (rows[0] as Record<string, unknown>).value;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await sql`SELECT key, value FROM settings`;
  return Object.fromEntries(
    rows.map((r) => {
      const row = r as Record<string, unknown>;
      return [row.key as string, row.value];
    }),
  );
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${JSON.stringify(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export async function deleteSetting(key: string): Promise<void> {
  await sql`DELETE FROM settings WHERE key = ${key}`;
}

// ─── STATISTICS queries ───────────────────────────────────────────────────────

export async function getStatistics(): Promise<Statistics> {
  // Run all aggregate queries in parallel
  const [
    patientCountRows,
    appointmentCountRows,
    revenueRows,
    appointmentsByMonthRows,
    revenueByMonthRows,
    treatmentFrequencyRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::INTEGER AS count FROM patients`,

    sql`SELECT COUNT(*)::INTEGER AS count FROM appointments`,

    sql`
      SELECT COALESCE(SUM(paid_amount), 0)::NUMERIC AS total
      FROM appointments
      WHERE is_done = TRUE
    `,

    sql`
      SELECT
        TO_CHAR(TO_TIMESTAMP(date / 1000), 'YYYY-MM') AS month,
        COUNT(*)::INTEGER AS count
      FROM appointments
      GROUP BY month
      ORDER BY month ASC
    `,

    sql`
      SELECT
        TO_CHAR(TO_TIMESTAMP(date / 1000), 'YYYY-MM') AS month,
        COALESCE(SUM(paid_amount), 0)::NUMERIC AS amount
      FROM appointments
      WHERE is_done = TRUE
      GROUP BY month
      ORDER BY month ASC
    `,

    sql`
      SELECT
        t.type AS treatment,
        COUNT(a.id)::INTEGER AS count
      FROM appointments a
      JOIN treatments t ON t.id = a.treatment_id
      GROUP BY t.type
      ORDER BY count DESC
      LIMIT 20
    `,
  ]);

  return {
    totalPatients: Number(
      (patientCountRows[0] as Record<string, unknown> | undefined)?.count ?? 0,
    ),
    totalAppointments: Number(
      (appointmentCountRows[0] as Record<string, unknown> | undefined)?.count ??
        0,
    ),
    revenue: Number(
      (revenueRows[0] as Record<string, unknown> | undefined)?.total ?? 0,
    ),
    appointmentsByMonth: (
      appointmentsByMonthRows as Record<string, unknown>[]
    ).map((r) => ({
      month: r.month as string,
      count: Number(r.count),
    })),
    revenueByMonth: (revenueByMonthRows as Record<string, unknown>[]).map(
      (r) => ({
        month: r.month as string,
        amount: Number(r.amount),
      }),
    ),
    treatmentFrequency: (
      treatmentFrequencyRows as Record<string, unknown>[]
    ).map((r) => ({
      treatment: r.treatment as string,
      count: Number(r.count),
    })),
  };
}

// ─── CONSENT FORM operations ──────────────────────────────────────────────────

function rowToConsentForm(row: Record<string, unknown>): ConsentForm {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    appointment_id: (row.appointment_id as string) ?? null,
    acknowledged: Boolean(row.acknowledged),
    signed_date: row.signed_date != null ? Number(row.signed_date) : null,
    notes: (row.notes as string) ?? "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getConsentForms(
  patientId: string,
): Promise<ConsentForm[]> {
  const rows = await sql`
    SELECT * FROM consent_forms WHERE patient_id = ${patientId} ORDER BY created_at DESC
  `;
  return rows.map((r) => rowToConsentForm(r as Record<string, unknown>));
}

export async function getConsentFormForAppointment(
  appointmentId: string,
): Promise<ConsentForm | null> {
  const rows = await sql`
    SELECT * FROM consent_forms WHERE appointment_id = ${appointmentId} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToConsentForm(rows[0] as Record<string, unknown>);
}

export async function upsertConsentForm(
  patientId: string,
  appointmentId: string,
  data: { acknowledged: boolean; signed_date?: number | null; notes?: string },
): Promise<ConsentForm> {
  const rows = await sql`
    INSERT INTO consent_forms (patient_id, appointment_id, acknowledged, signed_date, notes)
    VALUES (
      ${patientId}, ${appointmentId},
      ${data.acknowledged},
      ${data.signed_date ?? null},
      ${data.notes ?? ""}
    )
    ON CONFLICT (appointment_id)
    DO UPDATE SET
      acknowledged = EXCLUDED.acknowledged,
      signed_date  = EXCLUDED.signed_date,
      notes        = EXCLUDED.notes,
      updated_at   = NOW()
    RETURNING *
  `;
  return rowToConsentForm(rows[0] as Record<string, unknown>);
}

// ─── INVOICE operations ───────────────────────────────────────────────────────

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    appointment_id: (row.appointment_id as string) ?? null,
    amount: Number(row.amount),
    paid_amount: Number(row.paid_amount),
    notes: (row.notes as string) ?? "",
    issued_date: Number(row.issued_date),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getInvoices(patientId?: string): Promise<Invoice[]> {
  if (patientId) {
    const rows = await sql`
      SELECT * FROM invoices WHERE patient_id = ${patientId} ORDER BY issued_date DESC
    `;
    return rows.map((r) => rowToInvoice(r as Record<string, unknown>));
  }
  const rows = await sql`SELECT * FROM invoices ORDER BY issued_date DESC`;
  return rows.map((r) => rowToInvoice(r as Record<string, unknown>));
}

export async function createInvoice(
  data: Omit<Invoice, "id" | "created_at" | "updated_at">,
): Promise<Invoice> {
  const rows = await sql`
    INSERT INTO invoices (patient_id, appointment_id, amount, paid_amount, notes, issued_date)
    VALUES (
      ${data.patient_id}, ${data.appointment_id ?? null},
      ${data.amount}, ${data.paid_amount}, ${data.notes}, ${data.issued_date}
    )
    RETURNING *
  `;
  return rowToInvoice(rows[0] as Record<string, unknown>);
}

export async function updateInvoice(
  id: string,
  data: Partial<Omit<Invoice, "id" | "created_at" | "updated_at">>,
): Promise<Invoice> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.amount !== undefined) {
    fields.push("amount");
    values.push(data.amount);
  }
  if (data.paid_amount !== undefined) {
    fields.push("paid_amount");
    values.push(data.paid_amount);
  }
  if (data.notes !== undefined) {
    fields.push("notes");
    values.push(data.notes);
  }
  if (data.issued_date !== undefined) {
    fields.push("issued_date");
    values.push(data.issued_date);
  }
  if (fields.length === 0) {
    const rows = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    return rowToInvoice(rows[0] as Record<string, unknown>);
  }
  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const result = await sql(
    `UPDATE invoices SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return rowToInvoice(result[0] as Record<string, unknown>);
}

export async function deleteInvoice(id: string): Promise<void> {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
}

// ─── RECALL queries ───────────────────────────────────────────────────────────

export async function getPatientsOverdueForRecall(): Promise<Patient[]> {
  const now = Date.now();
  const rows = await sql`
    SELECT * FROM patients
    WHERE next_recall_date IS NOT NULL
      AND next_recall_date < ${now}
    ORDER BY next_recall_date ASC
    LIMIT 50
  `;
  return rows.map((r) => rowToPatient(r as Record<string, unknown>));
}

// ─── Convenience: get outstanding / overpaid summary per patient ──────────────

export async function getPatientFinancialSummary(patientId: string): Promise<{
  totalPaid: number;
  totalDue: number;
  outstanding: number;
  overpaid: number;
}> {
  const rows = await sql`
    SELECT
      COALESCE(SUM(paid_amount), 0)::NUMERIC                                          AS total_paid,
      COALESCE(SUM(CASE WHEN is_done THEN final_price ELSE 0 END), 0)::NUMERIC        AS total_due,
      COALESCE(SUM(
        CASE WHEN is_done THEN GREATEST(final_price - paid_amount, 0) ELSE 0 END
      ), 0)::NUMERIC                                                                  AS outstanding,
      COALESCE(SUM(GREATEST(paid_amount - final_price, 0)), 0)::NUMERIC               AS overpaid
    FROM appointments
    WHERE patient_id = ${patientId}
  `;
  const row = (rows[0] as Record<string, unknown> | undefined) ?? {};
  return {
    totalPaid: Number(row.total_paid ?? 0),
    totalDue: Number(row.total_due ?? 0),
    outstanding: Number(row.outstanding ?? 0),
    overpaid: Number(row.overpaid ?? 0),
  };
}

// ─── TREATMENT PLAN operations ───────────────────────────────────────────────

export async function getTreatmentPlans(
  patient_id?: string,
): Promise<TreatmentPlan[]> {
  if (patient_id) {
    const rows =
      await sql`SELECT * FROM treatment_plans WHERE patient_id = ${patient_id} ORDER BY created_at DESC`;
    return rows.map((r) => rowToTreatmentPlan(r as Record<string, unknown>));
  }
  const rows =
    await sql`SELECT * FROM treatment_plans ORDER BY created_at DESC`;
  return rows.map((r) => rowToTreatmentPlan(r as Record<string, unknown>));
}

export async function createTreatmentPlan(
  data: Omit<TreatmentPlan, "id" | "created_at" | "updated_at">,
): Promise<TreatmentPlan> {
  const rows = await sql`
    INSERT INTO treatment_plans (patient_id, title, items, status, total_price)
    VALUES (${data.patient_id}, ${data.title}, ${JSON.stringify(data.items)}::jsonb, ${data.status}, ${data.total_price})
    RETURNING *
  `;
  return rowToTreatmentPlan(rows[0] as Record<string, unknown>);
}

// ─── INVESTIGATION operations ────────────────────────────────────────────────

export async function getInvestigations(
  patient_id?: string,
): Promise<Investigation[]> {
  if (patient_id) {
    const rows =
      await sql`SELECT * FROM investigations WHERE patient_id = ${patient_id} ORDER BY date DESC`;
    return rows.map((r) => rowToInvestigation(r as Record<string, unknown>));
  }
  const rows = await sql`SELECT * FROM investigations ORDER BY date DESC`;
  return rows.map((r) => rowToInvestigation(r as Record<string, unknown>));
}

export async function createInvestigation(
  data: Omit<Investigation, "id" | "created_at" | "updated_at">,
): Promise<Investigation> {
  const rows = await sql`
    INSERT INTO investigations (patient_id, appointment_id, test_name, laboratory, status, result, date)
    VALUES (${data.patient_id}, ${data.appointment_id}, ${data.test_name}, ${data.laboratory}, ${data.status}, ${data.result}, ${data.date})
    RETURNING *
  `;
  return rowToInvestigation(rows[0] as Record<string, unknown>);
}

// ─── INVENTORY operations ────────────────────────────────────────────────────

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const rows = await sql`SELECT * FROM inventory_items ORDER BY name ASC`;
  return rows.map((r) => rowToInventoryItem(r as Record<string, unknown>));
}

export async function createInventoryItem(
  data: Omit<InventoryItem, "id" | "created_at" | "updated_at">,
): Promise<InventoryItem> {
  const rows = await sql`
    INSERT INTO inventory_items (name, category, stock, unit, min_stock)
    VALUES (${data.name}, ${data.category}, ${data.stock}, ${data.unit}, ${data.min_stock})
    RETURNING *
  `;
  return rowToInventoryItem(rows[0] as Record<string, unknown>);
}

export async function updateInventoryStock(
  id: string,
  newStock: number,
): Promise<InventoryItem> {
  const rows = await sql`
    UPDATE inventory_items SET stock = ${newStock}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return rowToInventoryItem(rows[0] as Record<string, unknown>);
}

// ─── DEPARTMENT operations ───────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const rows = await sql`SELECT * FROM departments ORDER BY name ASC`;
  return rows.map((r) => rowToDepartment(r as Record<string, unknown>));
}

export async function createDepartment(
  data: Omit<Department, "id">,
): Promise<Department> {
  const rows = await sql`
    INSERT INTO departments (name, head_staff_id, rooms, status)
    VALUES (${data.name}, ${data.head_staff_id}, ${data.rooms}, ${data.status})
    RETURNING *
  `;
  return rowToDepartment(rows[0] as Record<string, unknown>);
}

// ─── REFERRAL operations ──────────────────────────────────────────────────────

export async function getReferralSources(): Promise<ReferralSource[]> {
  const rows = await sql`SELECT * FROM referral_sources ORDER BY name ASC`;
  return rows.map((r) => rowToReferralSource(r as Record<string, unknown>));
}

export async function createReferralSource(
  data: Omit<ReferralSource, "id" | "created_at" | "updated_at">,
): Promise<ReferralSource> {
  const rows = await sql`
    INSERT INTO referral_sources (name, type, specialty, status)
    VALUES (${data.name}, ${data.type}, ${data.specialty}, ${data.status})
    RETURNING *
  `;
  return rowToReferralSource(rows[0] as Record<string, unknown>);
}

export interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "absent";
}

// ─── ATTENDANCE operations ────────────────────────────────────────────────────

export async function getAttendance(date: string): Promise<Attendance[]> {
  const rows = await sql`SELECT * FROM attendance WHERE date = ${date}`;
  return rows.map((r) => ({
    id: r.id as string,
    staff_id: r.staff_id as string,
    date: r.date as string,
    check_in: r.check_in as string | null,
    check_out: r.check_out as string | null,
    status: r.status as "present" | "late" | "absent",
  }));
}

export async function logAttendance(
  data: Omit<Attendance, "id">,
): Promise<Attendance> {
  const rows = await sql`
    INSERT INTO attendance (staff_id, date, check_in, check_out, status)
    VALUES (${data.staff_id}, ${data.date}, ${data.check_in}, ${data.check_out}, ${data.status})
    ON CONFLICT (staff_id, date) DO UPDATE SET
      check_in = EXCLUDED.check_in,
      check_out = EXCLUDED.check_out,
      status = EXCLUDED.status
    RETURNING *
  `;
  return {
    id: rows[0].id as string,
    staff_id: rows[0].staff_id as string,
    date: rows[0].date as string,
    check_in: rows[0].check_in as string | null,
    check_out: rows[0].check_out as string | null,
    status: rows[0].status as "present" | "late" | "absent",
  };
}

// ─── PATIENT PRESCRIPTION operations ──────────────────────────────────────────

function rowToPatientPrescription(row: Record<string, unknown>): PatientPrescription {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    doctor_id: row.doctor_id as string,
    medication: row.medication as string,
    dosage: (row.dosage as string) ?? "",
    frequency: (row.frequency as string) ?? "",
    duration: (row.duration as string) ?? "",
    notes: (row.notes as string) ?? "",
    issued_date: Number(row.issued_date),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPatientPrescriptions(
  patientId?: string,
): Promise<PatientPrescription[]> {
  if (patientId) {
    const rows = await sql`
      SELECT * FROM patient_prescriptions
      WHERE patient_id = ${patientId}
      ORDER BY issued_date DESC
    `;
    return rows.map((r) => rowToPatientPrescription(r as Record<string, unknown>));
  }
  const rows = await sql`
    SELECT * FROM patient_prescriptions
    ORDER BY issued_date DESC
  `;
  return rows.map((r) => rowToPatientPrescription(r as Record<string, unknown>));
}

export async function createPatientPrescription(
  data: Omit<PatientPrescription, "id" | "created_at" | "updated_at" | "issued_date"> & {
    issued_date?: number;
  },
): Promise<PatientPrescription> {
  const issuedDate = data.issued_date ?? Date.now();
  const rows = await sql`
    INSERT INTO patient_prescriptions (
      patient_id, doctor_id, medication, dosage, frequency, duration, notes, issued_date
    ) VALUES (
      ${data.patient_id}, ${data.doctor_id}, ${data.medication},
      ${data.dosage ?? null}, ${data.frequency ?? null}, ${data.duration ?? null},
      ${data.notes ?? null}, ${issuedDate}
    )
    RETURNING *
  `;
  return rowToPatientPrescription(rows[0] as Record<string, unknown>);
}

export async function updatePatientPrescription(
  id: string,
  data: Partial<Omit<PatientPrescription, "id" | "created_at" | "updated_at">>,
): Promise<PatientPrescription> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.patient_id !== undefined) {
    fields.push("patient_id");
    values.push(data.patient_id);
  }
  if (data.doctor_id !== undefined) {
    fields.push("doctor_id");
    values.push(data.doctor_id);
  }
  if (data.medication !== undefined) {
    fields.push("medication");
    values.push(data.medication);
  }
  if (data.dosage !== undefined) {
    fields.push("dosage");
    values.push(data.dosage);
  }
  if (data.frequency !== undefined) {
    fields.push("frequency");
    values.push(data.frequency);
  }
  if (data.duration !== undefined) {
    fields.push("duration");
    values.push(data.duration);
  }
  if (data.notes !== undefined) {
    fields.push("notes");
    values.push(data.notes);
  }
  if (data.issued_date !== undefined) {
    fields.push("issued_date");
    values.push(data.issued_date);
  }

  if (fields.length === 0) {
    const rows = await sql`SELECT * FROM patient_prescriptions WHERE id = ${id}`;
    if (rows.length === 0) throw new Error(`PatientPrescription ${id} not found`);
    return rowToPatientPrescription(rows[0] as Record<string, unknown>);
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const paramList = [...values, id];
  const query = `UPDATE patient_prescriptions SET ${setClauses}, updated_at = NOW() WHERE id = $${paramList.length} RETURNING *`;
  const result = await sql(query, paramList);
  if (result.length === 0) throw new Error(`PatientPrescription ${id} not found`);
  return rowToPatientPrescription(result[0] as Record<string, unknown>);
}

export async function deletePatientPrescription(id: string): Promise<void> {
  await sql`DELETE FROM patient_prescriptions WHERE id = ${id}`;
}
