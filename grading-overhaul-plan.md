# Grading Structure Overhaul — Full Plan

Reference document for everything needed to match the real Eduland
report card format. Execute in order, as separate scoped prompts —
each builds on the previous and should be tested before the next.

---

## ✅ Already done
- [x] Migration 020: `scores.ca` (0–40) + `scores.exam` (0–60) →
      generated `total` (0–100). Old hw/cw/test dropped.
- [x] `grading_keys` updated to 100-point scale (90–100=A ... 0–19=Very
      Weak) — **flagged assumption**: the real template's printed
      scale has an apparent overlap at the bottom (30–39 AND "Below
      40" both listed); used a clean proportional split instead.
      Confirm with the school if this ever matters in practice.
- [x] `schools.head_of_school_name` column added (blank — needs a
      value set, see Step 1)

## Open question, needs your input before Step 2
**Subject naming by age group** — assumed Year 1–3 use the simple
names (Numeracy, Literacy, Literature, Science) and Year 4–6 use the
formal names (Mathematics, English Language, Literature in English,
Basic Science). Confirm or correct this cutoff before Step 2 runs,
since it determines which subjects get created/assigned to which
classes.

---

## Step 1 — Data fixes (SQL, no code)
- Set `schools.head_of_school_name` to the real value (e.g. "Josiah
  C.E Mrs" per the sample, or whatever the actual current Head of
  School's name is)
- Add the 4 missing formal-name subjects (Mathematics, English
  Language, Literature in English, Basic Science)
- Update `teacher_assignments` for Year 4–6 demo classes: swap the
  simple-name subjects for the formal-name ones (or add both if a
  class should show both sets — needs the naming-cutoff answer above
  first)
- Regenerate demo `scores` for the new `ca`/`exam` structure (old
  scores were wiped by migration 020) — reuse the same demo students/
  teachers/terms already seeded, just new score shape

## Step 2 — Gradebook Entry UI (teacher dashboard)
- Change from H/W + C/W + Test inputs to a single **C.A. (0–40)** +
  **Exam (0–60)** input pair
- Update any labels/validation ranges accordingly
- Test: enter scores, confirm Total computes correctly (ca+exam),
  confirm upsert-not-duplicate still works on re-entry

## Step 3 — Report Layout (ReportSheetCard — affects parent + admin
viewers, since both reuse this component)
- Replace H/W/C/W/Test columns with C.A./Exam columns in the subject
  table
- Add **Population** (count of students in that class, at query time
  — no new column)
- Add **Average Age** (computed from `date_of_birth` across the
  class's students)
- Add **Age** (computed from the individual student's `date_of_birth`)
- Add **Head of School** as a second signature/name block alongside
  the existing Class Teacher signature
- Test: confirm print + PDF export (already built) still work
  correctly with the new layout — this is the one place a layout
  change could silently break something already proven to work

## Step 4 — Third Term Cumulative Report (separate report variant)
- Third Term's format includes Brought Forward / Cumulative columns
  showing performance across the whole session (First + Second +
  Third combined), not stored data — computed at query/render time
  by pulling all 3 terms' scores for that student+session
- This is a DIFFERENT report layout, not a modification of the
  existing one — First/Second Term reports should NOT show cumulative
  columns, only Third Term should
- Needs its own scoped prompt once Steps 1–3 are confirmed working,
  since it depends on the corrected score structure being solid first

---

## Not touched by this plan (explicitly descoped/deferred)
- Eduland → generic rebrand — skipped per decision; only a few
  front-facing details will be changed directly, not a full pass
- Parent contact fields, allergies, WhatsApp notifications, AI
  comments — still in the general deferred list, unrelated to this
  grading overhaul
