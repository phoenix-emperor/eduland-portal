import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const adminSupabase = createClient(url, serviceKey);

async function seedDemoAccounts() {
  console.log('=== STARTING SEED DEMO ACCOUNTS & HISTORICAL DATA SCRIPT ===\n');

  // 1. Fetch default school
  const { data: schools } = await adminSupabase.from('schools').select('id, name').limit(1);
  if (!schools || schools.length === 0) {
    console.error('No school record found.');
    return;
  }
  const school = schools[0];
  console.log(`School Target: ${school.name} (${school.id})`);

  // 2. Seed Classes Year 1-6
  const classNames = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
  const classMap = {};
  for (const cName of classNames) {
    let { data: cls } = await adminSupabase.from('classes').select('id, name').eq('school_id', school.id).eq('name', cName).maybeSingle();
    if (!cls) {
      const { data: newCls } = await adminSupabase.from('classes').insert({ school_id: school.id, name: cName, level: cName }).select().single();
      cls = newCls;
    }
    if (cls) classMap[cName] = cls.id;
  }

  // 3. Seed Terms (First, Second, Third Term 2024/2025)
  const termDefinitions = [
    { name: 'First Term', session: '2024/2025', next_term_begins: '2025-01-06' },
    { name: 'Second Term', session: '2024/2025', next_term_begins: '2025-04-28' },
    { name: 'Third Term', session: '2024/2025', next_term_begins: '2025-09-15' },
  ];

  const termsMap = [];
  for (const tDef of termDefinitions) {
    let { data: term } = await adminSupabase.from('terms').select('*').eq('school_id', school.id).eq('session', tDef.session).eq('name', tDef.name).maybeSingle();
    if (!term) {
      const { data: newTerm } = await adminSupabase.from('terms').insert({ school_id: school.id, ...tDef }).select().single();
      term = newTerm;
    }
    if (term) termsMap.push(term);
  }

  // 4. Seed Subjects
  const subjectNames = ['Numeracy', 'Literacy', 'Diction', 'Science', 'Literature', 'Computer'];
  const subjectMap = [];
  for (const sName of subjectNames) {
    let { data: sub } = await adminSupabase.from('subjects').select('id, name').eq('school_id', school.id).eq('name', sName).maybeSingle();
    if (!sub) {
      const { data: newSub } = await adminSupabase.from('subjects').insert({ school_id: school.id, name: sName }).select().single();
      sub = newSub;
    }
    if (sub) subjectMap.push(sub);
  }

  // 5. Seed Students (5 per class, 30 total)
  const studentList = [
    { class: 'Year 1', name: 'Aisha Bello', adm: 'ES/2025/001' },
    { class: 'Year 1', name: 'Oluwaseun Adekunle', adm: 'ES/2025/002' },
    { class: 'Year 1', name: 'Chiamaka Nwosu', adm: 'ES/2025/003' },
    { class: 'Year 2', name: 'Emeka Obi', adm: 'ES/2025/006' },
    { class: 'Year 2', name: 'Fatima Abdullahi', adm: 'ES/2025/007' },
    { class: 'Year 3', name: 'Chinedu Okoro', adm: 'ES/2025/011' },
    { class: 'Year 4', name: 'Tobiloba Ogunleye', adm: 'ES/2025/016' },
    { class: 'Year 5', name: 'Chukwuemeka Uzo', adm: 'ES/2025/021' },
    { class: 'Year 6', name: 'Oluwadamilare Bakare', adm: 'ES/2025/026' },
  ];

  const dbStudents = [];
  for (const sData of studentList) {
    const classId = classMap[sData.class] || Object.values(classMap)[0];
    let { data: st } = await adminSupabase.from('students').select('id, full_name, class_id').eq('school_id', school.id).eq('admission_number', sData.adm).maybeSingle();
    if (!st) {
      const { data: newSt } = await adminSupabase.from('students').insert({
        school_id: school.id,
        class_id: classId,
        full_name: sData.name,
        admission_number: sData.adm,
      }).select().single();
      st = newSt;
    }
    if (st) dbStudents.push(st);
  }

  // 6. Seed scores, attendance, and general comments across ALL 3 terms for all students
  console.log(`Seeding multi-term scores for ${dbStudents.length} students across ${termsMap.length} terms...`);

  const scorePayload = [];
  const attendancePayload = [];
  const commentPayload = [];

  const commentPool = [
    'A bright, attentive pupil who participates actively in class discussions.',
    'Shows steady improvement this term. Keep encouraging home practice.',
    'A hardworking pupil with a positive attitude towards learning.',
    'Has made good progress this term. Continue to build on this.',
  ];

  let commentIdx = 0;
  for (const st of dbStudents) {
    for (const term of termsMap) {
      // Scores
      for (const sub of subjectMap.slice(0, 4)) {
        scorePayload.push({
          school_id: school.id,
          student_id: st.id,
          subject_id: sub.id,
          term_id: term.id,
          hw: Math.floor(Math.random() * 5) + 15,
          cw: Math.floor(Math.random() * 5) + 15,
          test: Math.floor(Math.random() * 15) + 40,
        });
      }

      // Attendance
      attendancePayload.push({
        school_id: school.id,
        student_id: st.id,
        term_id: term.id,
        days_opened: 60,
        days_present: 60 - Math.floor(Math.random() * 4),
      });

      // Comment
      commentPayload.push({
        school_id: school.id,
        student_id: st.id,
        term_id: term.id,
        general_comment: commentPool[commentIdx % commentPool.length],
      });

      commentIdx++;
    }
  }

  await adminSupabase.from('scores').upsert(scorePayload, { onConflict: 'student_id,subject_id,term_id' });
  await adminSupabase.from('attendance').upsert(attendancePayload, { onConflict: 'student_id,term_id' });
  await adminSupabase.from('report_comments').upsert(commentPayload, { onConflict: 'student_id,term_id' });

  // 7. Seed sample historical enrollment record to test promotion class resolution
  const pastSession = '2024/2025';
  const targetStudentForPromotion = dbStudents[0]; // Aisha Bello
  const year1ClassId = classMap['Year 1'];
  if (targetStudentForPromotion && year1ClassId) {
    await adminSupabase.from('enrollments').upsert({
      school_id: school.id,
      student_id: targetStudentForPromotion.id,
      class_id: year1ClassId,
      session: pastSession,
    }, { onConflict: 'student_id,session' });
    console.log(`Seeded historical enrollment: ${targetStudentForPromotion.full_name} -> Year 1 for session ${pastSession}`);
  }

  console.log('\n✅ ALL DEMO ACCOUNTS, MULTI-TERM SCORES & ENROLLMENT DATA SEEDED SUCCESSFULLY!');
  console.log('=== SEED DEMO ACCOUNTS COMPLETE ===');
}

seedDemoAccounts();
