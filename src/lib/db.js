import Dexie from 'dexie';
import { supabase } from './supabase';

export const ITEMS_PER_PAGE = 20;
const BATCH_SIZE = 1000;

const db = new Dexie('PublicDataExplorer');
db.version(1).stores({
  datasets: 'id, 목록유형, 제공기관, 분류체계',
  meta: 'key',
});

export async function hasData() {
  return (await db.datasets.count()) > 0;
}

export async function syncFromSupabase(onProgress) {
  const { count } = await supabase
    .from('datasets')
    .select('*', { count: 'exact', head: true });

  if (!count) return;

  await db.datasets.clear();

  let offset = 0;
  while (offset < count) {
    const { data, error } = await supabase
      .from('datasets')
      .select('id, 목록명, 제공기관, 분류체계, 목록유형, 포맷, 조회수, 수정일, 설명, 키워드, 다운로드수, 비용유무, 목록_url')
      .range(offset, offset + BATCH_SIZE - 1)
      .order('id');

    if (error) throw error;
    if (!data?.length) break;

    await db.datasets.bulkPut(data);

    offset += data.length;
    onProgress?.(offset, count);
    if (data.length < BATCH_SIZE) break;
  }

  await db.meta.put({ key: 'last_sync', value: new Date().toISOString() });
}

export async function loadAllDatasets() {
  return db.datasets.orderBy('조회수').reverse().toArray();
}

export function filterDatasets(allRows, { search = '', filters = {}, page = 1 }) {
  const term = search.length <= 1 ? '' : search.trim().toLowerCase();

  let result = allRows;

  if (term) {
    result = result.filter(r =>
      r.목록명?.toLowerCase().includes(term) ||
      r.키워드?.toLowerCase().includes(term) ||
      r.설명?.toLowerCase().includes(term)
    );
  }
  if (filters.types?.length) {
    result = result.filter(r => filters.types.includes(r.목록유형));
  }
  if (filters.agencies?.length) {
    result = result.filter(r => filters.agencies.includes(r.제공기관));
  }
  if (filters.categories?.length) {
    result = result.filter(r => filters.categories.includes(r.분류체계));
  }
  if (filters.formats?.length) {
    result = result.filter(r =>
      Array.isArray(r.포맷) && r.포맷.some(f => filters.formats.includes(f))
    );
  }

  const totalCount = result.length;
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const rows = result.slice(offset, offset + ITEMS_PER_PAGE);

  return { rows, totalCount };
}

export function computeFilterOptions(allRows) {
  const types = [...new Set(allRows.map(r => r.목록유형).filter(Boolean))].sort();
  const agencies = [...new Set(allRows.map(r => r.제공기관).filter(Boolean))].sort();
  const categories = [...new Set(allRows.map(r => r.분류체계).filter(Boolean))].sort();
  const formatSet = new Set();
  allRows.forEach(r => {
    if (Array.isArray(r.포맷)) r.포맷.forEach(f => f && formatSet.add(f));
  });

  return {
    types,
    agencies,
    categories,
    formats: [...formatSet].sort(),
  };
}

export function computeDashboardStats(allRows) {
  const catMap = {};
  allRows.forEach(r => {
    if (r.분류체계) catMap[r.분류체계] = (catMap[r.분류체계] || 0) + 1;
  });
  const by_category = Object.entries(catMap)
    .map(([분류체계, cnt]) => ({ 분류체계, cnt }))
    .sort((a, b) => b.cnt - a.cnt)
    .slice(0, 20);

  const top_viewed = allRows
    .slice(0, 10)
    .map(r => ({ 목록명: r.목록명, 조회수: r.조회수 }));

  return { by_category, top_viewed };
}
