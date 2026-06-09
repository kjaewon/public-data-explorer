/**
 * Supabase 데이터 임포트 스크립트
 *
 * 실행 전 .env.local 에 아래 두 값을 설정하거나 환경변수로 주입하세요:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...  (Service Role 키, anon 키 아님)
 *
 * 실행:
 *   node scripts/import_to_supabase.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파일에서 환경변수 로드 (dotenv 없이)
try {
  const envPath = resolve(__dirname, '../.env.local');
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
} catch {
  // .env.local 없으면 환경변수에서 직접 읽음
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL 과 SUPABASE_SERVICE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BATCH_SIZE = 1000;

function parseFormats(raw) {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

async function run() {
  const dataPath = resolve(__dirname, '../public/data_full.json');
  console.log('data_full.json 로딩 중...');
  const raw = JSON.parse(readFileSync(dataPath, 'utf8'));
  console.log(`총 ${raw.length.toLocaleString()}건 로드 완료`);

  const records = raw.map(row => ({
    목록명:     row['목록명'] ?? null,
    파일데이터명: row['파일데이터명'] ?? null,
    키워드:     row['키워드'] ?? null,
    제공기관:    row['제공기관'] ?? null,
    분류체계:    row['분류체계'] ?? null,
    목록유형:    row['목록유형'] ?? null,
    포맷:       parseFormats(row['확장자(데이터포맷)']),
    포맷_원본:   row['확장자(데이터포맷)'] ?? null,
    설명:       row['설명'] ?? null,
    수정일:     row['수정일'] ?? null,
    조회수:     parseInt(row['조회수'] ?? '0') || 0,
    다운로드수:   parseInt(row['다운로드수'] ?? '0') || 0,
    비용유무:    row['비용유무'] ?? null,
    목록_url:   row['목록 URL'] ?? null,
  }));

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('datasets').insert(batch);
    if (error) {
      console.error(`배치 ${i}~${i + batch.length} 오류:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r진행: ${inserted.toLocaleString()} / ${records.length.toLocaleString()}`);
  }

  console.log('\n임포트 완료!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
