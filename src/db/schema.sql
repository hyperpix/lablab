-- ============================================================
-- Apexo Dental Clinic — PostgreSQL Schema (Neon DB)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TREATMENTS
-- Referenced by appointments, so create first
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type            TEXT        NOT NULL DEFAULT '',
    expenses        NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name                    TEXT        NOT NULL DEFAULT '',
    email                   TEXT        NOT NULL DEFAULT '',
    phone                   TEXT        NOT NULL DEFAULT '',
    pin                     TEXT,
    operates                BOOLEAN     NOT NULL DEFAULT TRUE,
    on_duty_days            TEXT[]      NOT NULL DEFAULT '{}',

    -- Permissions
    can_edit_staff          BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_patients       BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_ortho          BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_appointments   BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_treatments     BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_prescriptions  BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_settings       BOOLEAN     NOT NULL DEFAULT TRUE,
    can_edit_labwork        BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_staff          BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_patients       BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_ortho          BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_appointments   BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_treatments     BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_prescriptions  BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_settings       BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_stats          BOOLEAN     NOT NULL DEFAULT TRUE,
    can_view_labwork        BOOLEAN     NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name            TEXT        NOT NULL DEFAULT '',
    birth_year      INTEGER     NOT NULL DEFAULT 0,
    gender          TEXT        NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
    tags            TEXT        NOT NULL DEFAULT '',
    notes           TEXT        NOT NULL DEFAULT '',
    address         TEXT        NOT NULL DEFAULT '',
    email           TEXT        NOT NULL DEFAULT '',
    phone           TEXT        NOT NULL DEFAULT '',
    medical_history TEXT[]      NOT NULL DEFAULT '{}',
    gallery         TEXT[]      NOT NULL DEFAULT '{}',
    galbum          TEXT        NOT NULL DEFAULT '',
    -- Sparse array of tooth objects keyed by ISO number stored as JSONB
    -- Each entry: { ISO: number, condition: string, notes: string[] }
    teeth           JSONB       NOT NULL DEFAULT '[]',
    -- Array of { text: string, type: string } label objects
    labels          JSONB       NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name   ON patients USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_patients_phone  ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_email  ON patients (email);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    treatment_id    TEXT        REFERENCES treatments(id) ON DELETE SET NULL,
    patient_id      TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    -- staff_ids is a denormalised array of staff IDs involved in this appointment
    staff_ids       TEXT[]      NOT NULL DEFAULT '{}',
    -- date stored as epoch milliseconds (matching the original model)
    date            BIGINT      NOT NULL DEFAULT 0,
    -- duration timer in milliseconds
    time            BIGINT      NOT NULL DEFAULT 0,
    involved_teeth  INTEGER[]   NOT NULL DEFAULT '{}',
    paid_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
    final_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
    units           INTEGER     NOT NULL DEFAULT 1,
    is_done         BOOLEAN     NOT NULL DEFAULT FALSE,
    complaint       TEXT        NOT NULL DEFAULT '',
    diagnosis       TEXT        NOT NULL DEFAULT '',
    notes           TEXT        NOT NULL DEFAULT '',
    -- Array of { prescription: string, id: string }
    prescriptions   JSONB       NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id   ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_treatment_id ON appointments (treatment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments (date);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_ids    ON appointments USING GIN (staff_ids);

-- ============================================================
-- LABWORK
-- ============================================================
CREATE TABLE IF NOT EXISTS labwork (
    id                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    case_title          TEXT        NOT NULL DEFAULT '',
    case_details        TEXT        NOT NULL DEFAULT '',
    patient_id          TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    operating_staff_ids TEXT[]      NOT NULL DEFAULT '{}',
    involved_teeth      INTEGER[]   NOT NULL DEFAULT '{}',
    lab_name            TEXT        NOT NULL DEFAULT '',
    lab_contact         TEXT        NOT NULL DEFAULT '',
    price               NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_paid             BOOLEAN     NOT NULL DEFAULT FALSE,
    is_sent             BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_date           BIGINT      NOT NULL DEFAULT 0,
    is_received         BOOLEAN     NOT NULL DEFAULT FALSE,
    received_date       BIGINT      NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labwork_patient_id ON labwork (patient_id);

-- ============================================================
-- PRESCRIPTIONS  (each row = one prescription item / drug)
-- The original model stores prescription items as standalone
-- documents; appointments reference them by ID array.
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name            TEXT        NOT NULL DEFAULT '',
    dose_in_mg      NUMERIC(10,2) NOT NULL DEFAULT 500,
    times_per_day   INTEGER     NOT NULL DEFAULT 3,
    units_per_time  INTEGER     NOT NULL DEFAULT 1,
    -- form: capsule | tablet | syrup | injection | drops | suppository
    form            TEXT        NOT NULL DEFAULT 'capsule',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PATIENT PRESCRIPTIONS (historical/saved patient Rx records)
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_prescriptions (
    id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    patient_id      TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       TEXT        NOT NULL,
    medication      TEXT        NOT NULL,
    dosage          TEXT,
    frequency       TEXT,
    duration        TEXT,
    notes           TEXT,
    issued_date     BIGINT      NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_patient_id ON patient_prescriptions (patient_id);

-- ============================================================
-- ORTHODONTIC CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS orthodontic_cases (
    id                          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    patient_id                  TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Extra-oral observations
    lips                        TEXT        NOT NULL DEFAULT 'competent',
    facial_profile              TEXT        NOT NULL DEFAULT 'mesocephalic',
    nasio_labial_angle          NUMERIC(5,2) NOT NULL DEFAULT 90,
    oral_hygiene                TEXT        NOT NULL DEFAULT 'moderate',

    -- Jaw-to-jaw relationship
    skeletal_relationship       INTEGER     NOT NULL DEFAULT 1,
    molars_relationship         INTEGER     NOT NULL DEFAULT 1,
    canine_relationship         INTEGER     NOT NULL DEFAULT 1,

    -- Anterior teeth
    over_jet                    NUMERIC(5,2) NOT NULL DEFAULT 2,
    over_bite                   NUMERIC(5,2) NOT NULL DEFAULT 3,
    cross_scissor_bite          INTEGER[]   NOT NULL DEFAULT '{}',

    -- Space analysis: upper arch
    u_space_available           NUMERIC(5,2) NOT NULL DEFAULT 0,
    u_space_needed              NUMERIC(5,2) NOT NULL DEFAULT 0,

    -- Space analysis: lower arch
    l_space_available           NUMERIC(5,2) NOT NULL DEFAULT 0,
    l_space_needed              NUMERIC(5,2) NOT NULL DEFAULT 0,

    -- Conclusions
    problems_list               TEXT[]      NOT NULL DEFAULT '{}',
    treatment_plan_appliance    TEXT[]      NOT NULL DEFAULT '{}',
    next_visit_notes            TEXT[]      NOT NULL DEFAULT '{}',

    -- Status
    is_started                  BOOLEAN     NOT NULL DEFAULT FALSE,
    is_finished                 BOOLEAN     NOT NULL DEFAULT FALSE,
    started_date                BIGINT      NOT NULL DEFAULT 0,
    finished_date               BIGINT      NOT NULL DEFAULT 0,

    -- Visits: Array of { id, visitNumber, date, appliance, target, photos: [{id, photoID, comment}] }
    visits                      JSONB       NOT NULL DEFAULT '[]',

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ortho_patient_id ON orthodontic_cases (patient_id);

-- ============================================================
-- SETTINGS  (key/value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    key         TEXT        UNIQUE NOT NULL,
    value       JSONB       NOT NULL DEFAULT 'null',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed default settings that the original app relies on
INSERT INTO settings (key, value) VALUES
    ('hourlyRate',          '0')
  , ('currencySymbol',      '"$"')
  , ('module_prescriptions','true')
  , ('module_orthodontics', 'true')
  , ('module_statistics',   'true')
  , ('module_labwork',      'true')
  , ('time_tracking',       'false')
  , ('lang',                '"en"')
  , ('date_format',         '"DD/MM/YYYY"')
  , ('weekend_num',         '1')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Helper: auto-update updated_at on every row change
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Attach the trigger to every table that has an updated_at column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'treatments','staff','patients','appointments',
        'labwork','prescriptions','orthodontic_cases','settings',
        'patient_prescriptions'
    ]
    LOOP
        EXECUTE format(
            'CREATE OR REPLACE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
            tbl
        );
    END LOOP;
END;
$$;
