#!/usr/bin/env node
/**
 * Chạy lõi thuật toán trực tiếp từ dòng lệnh, KHÔNG cần khởi động server.
 *
 * Đây cũng là bằng chứng cho quyết định kiến trúc: tầng domain hoàn toàn
 * độc lập với HTTP, nên kiểm thử được mà không dựng máy chủ.
 *
 * Chạy:  node scripts/try-solver.js            (cả 3 kịch bản)
 *        node scripts/try-solver.js kho        (một kịch bản)
 */

import { candidates } from '../source/data/candidates.js';
import { scenarios, findScenario } from '../source/data/scenarios.js';
import { solve } from '../source/domain/solver.js';

const line = (ch = '─', n = 72) => ch.repeat(n);

function printPlan(plan) {
  console.log(`\n  ── Phương án #${plan.rank} · ${plan.score} điểm · ${plan.members.length} người · ${plan.totalHours}h`);
  for (const m of plan.members) {
    const roles = m.assignedSkills.length > 0 ? m.assignedSkills.join(', ') : '(dự phòng)';
    console.log(`     ${m.id}  ${m.name.padEnd(20)} ${String(m.hoursPerWeek).padStart(2)}h  → ${roles}`);
  }
  console.log('     Phủ năng lực:');
  for (const a of plan.assignments) {
    const backups = a.backups.length > 0 ? `dự phòng: ${a.backups.map((b) => b.name).join(', ')}` : 'KHÔNG có dự phòng';
    const pref = a.primary.matchesPreferredRole ? ' ★' : '';
    console.log(`       ${a.skill} (cần ≥${a.minLevel}) → ${a.primary.name} mức ${a.primary.level}${pref}   [${backups}]`);
  }
  console.log('     Điểm thành phần: ' + plan.breakdown.map((c) => `${c.label} ${c.points}/${c.weight}`).join(' · '));
}

function run(scenario) {
  console.log(`\n${line('═')}`);
  console.log(`  KỊCH BẢN: ${scenario.label}`);
  console.log(`  ${scenario.project.name}`);
  console.log(line('═'));

  const p = scenario.project;
  console.log(`  Yêu cầu : ${p.requiredSkills.map((r) => `${r.skill}≥${r.minLevel}`).join(', ')}`);
  console.log(`  Quân số : ${p.teamSize.min}–${p.teamSize.max} người`);
  console.log(`  Ràng buộc: ≥${p.constraints.minTotalHours}h, ≥${p.constraints.minPresenters} người trình bày`);

  const result = solve(p, candidates);
  const m = result.meta;

  console.log(
    `\n  Pool ${m.poolSize}/${m.availableCandidates} người · duyệt ${m.combinationsChecked.toLocaleString('vi-VN')} tổ hợp · ` +
      `${m.validPlans} phương án hợp lệ · ${m.elapsedMs}ms${m.truncated ? ' · ĐÃ CẮT SỚM' : ''}`
  );

  for (const w of result.warnings) console.log(`  ⚠ ${w}`);

  if (result.ok) {
    for (const plan of result.plans) printPlan(plan);
    if (result.comparisons.length > 0) {
      console.log('\n  Vì sao phương án #1 tối ưu:');
      for (const c of result.comparisons) console.log(`     • ${c.text}`);
    }
  } else {
    const d = result.diagnosis;
    console.log(`\n  ✗ VÔ NGHIỆM — ${d.summary}`);
    if (d.uncoveredSkills.length > 0) {
      console.log('    Năng lực không đáp ứng được:');
      for (const u of d.uncoveredSkills) console.log(`      • ${u.message}`);
    }
    if (d.constraintIssues.length > 0) {
      console.log('    Ràng buộc không thỏa mãn:');
      for (const i of d.constraintIssues) console.log(`      • ${i.message}`);
    }
    if (d.nearMiss) {
      console.log(`    Tổ hợp gần nhất (${d.nearMiss.members.map((x) => x.name).join(', ')}, ${d.nearMiss.totalHours}h) còn thiếu:`);
      for (const u of d.nearMiss.unmet) console.log(`      • ${u}`);
    }
  }

  return result;
}

const arg = process.argv[2];
const list = arg ? [findScenario(arg)].filter(Boolean) : scenarios;

if (list.length === 0) {
  console.error(`Không có kịch bản "${arg}". Chọn một trong: ${scenarios.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

for (const s of list) run(s);

// ---- Vài ca biên, chạy luôn để tự kiểm ------------------------------------
if (!arg) {
  console.log(`\n${line('═')}`);
  console.log('  CA BIÊN');
  console.log(line('═'));

  const base = scenarios[0].project;

  const cases = [
    {
      name: 'Không ai khả dụng',
      project: base,
      people: candidates.map((c) => ({ ...c, available: false })),
    },
    {
      name: 'Quân số min > max (phải tự kẹp, không được treo)',
      project: { ...base, teamSize: { min: 9, max: 2 } },
      people: candidates,
    },
    {
      name: 'Quân số max vượt giới hạn an toàn (20)',
      project: { ...base, teamSize: { min: 3, max: 20 } },
      people: candidates,
    },
    {
      name: 'Không khai báo năng lực nào',
      project: { ...base, requiredSkills: [] },
      people: candidates,
    },
    {
      name: 'mustInclude một người không tồn tại',
      project: { ...base, constraints: { ...base.constraints, mustInclude: ['c99'] } },
      people: candidates,
    },
    {
      name: 'mustInclude và mustExclude cùng một người',
      project: { ...base, constraints: { ...base.constraints, mustInclude: ['c01'], mustExclude: ['c01'] } },
      people: candidates,
    },
    {
      name: 'Yêu cầu giờ cam kết cực lớn',
      project: { ...base, constraints: { ...base.constraints, minTotalHours: 5000 } },
      people: candidates,
    },
    {
      name: 'Kho rỗng',
      project: base,
      people: [],
    },
  ];

  let bad = 0;
  for (const c of cases) {
    let out;
    try {
      out = solve(c.project, c.people);
    } catch (err) {
      console.log(`  ✗ ${c.name}: NÉM LỖI — ${err.message}`);
      bad++;
      continue;
    }
    const hasUndefined = JSON.stringify(out) === undefined || /:(null)?undefined/.test(JSON.stringify(out) ?? '');
    const verdict = out.ok ? `ok, ${out.plans.length} phương án` : 'vô nghiệm, có chẩn đoán';
    console.log(`  ✓ ${c.name.padEnd(52)} → ${verdict}, ${out.meta.elapsedMs}ms`);
    if (!out.ok && !out.diagnosis) { console.log('      ✗ thiếu diagnosis'); bad++; }
    if (hasUndefined) { console.log('      ✗ có undefined trong kết quả'); bad++; }
  }

  console.log(bad === 0 ? '\n  Tất cả ca biên PASS.\n' : `\n  ${bad} ca biên có vấn đề.\n`);
  process.exit(bad === 0 ? 0 : 1);
}
