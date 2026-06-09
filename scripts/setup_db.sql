-- ============================================================
-- 1. 테이블 생성
-- ============================================================
CREATE TABLE datasets (
  id           SERIAL PRIMARY KEY,
  목록명        TEXT,
  파일데이터명   TEXT,
  키워드        TEXT,
  제공기관      TEXT,
  분류체계      TEXT,
  분류체계_대   TEXT GENERATED ALWAYS AS (split_part(분류체계, ' - ', 1)) STORED,
  분류체계_소   TEXT GENERATED ALWAYS AS (split_part(분류체계, ' - ', 2)) STORED,
  목록유형      TEXT,
  포맷          TEXT[],   -- 확장자 배열 (예: '{csv,json}')
  포맷_원본     TEXT,     -- 원본 콤마 구분 문자열
  설명          TEXT,
  수정일        TEXT,
  조회수        INTEGER,
  다운로드수     INTEGER,
  비용유무      TEXT,
  목록_url      TEXT
);

-- ============================================================
-- 2. 인덱스
-- ============================================================
CREATE INDEX idx_datasets_기관  ON datasets (제공기관);
CREATE INDEX idx_datasets_분류  ON datasets (분류체계);
CREATE INDEX idx_datasets_유형  ON datasets (목록유형);
CREATE INDEX idx_datasets_포맷  ON datasets USING GIN (포맷);
CREATE INDEX idx_datasets_조회수 ON datasets (조회수 DESC);

-- ============================================================
-- 3. 필터 옵션 RPC
--    앱 기동 시 1회 호출 → 사이드바 필터 목록 구성
-- ============================================================
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS json LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'types',
    (SELECT array_agg(val ORDER BY val)
     FROM (SELECT DISTINCT 목록유형 AS val FROM datasets WHERE 목록유형 IS NOT NULL) t),

    'agencies',
    (SELECT array_agg(val ORDER BY val)
     FROM (SELECT DISTINCT 제공기관 AS val FROM datasets WHERE 제공기관 IS NOT NULL) t),

    'categories',
    (SELECT array_agg(val ORDER BY val)
     FROM (SELECT DISTINCT 분류체계 AS val FROM datasets WHERE 분류체계 IS NOT NULL) t),

    'formats',
    (SELECT array_agg(DISTINCT f ORDER BY f)
     FROM datasets, unnest(포맷) AS f)
  );
$$;

-- ============================================================
-- 4. 대시보드 통계 RPC
--    차트용 집계 데이터 반환
-- ============================================================
CREATE OR REPLACE FUNCTION dashboard_stats()
RETURNS json LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'by_category',
    (SELECT json_agg(r)
     FROM (
       SELECT 분류체계, count(*) AS cnt
       FROM datasets
       GROUP BY 분류체계
       ORDER BY cnt DESC
       LIMIT 11
     ) r),

    'top_viewed',
    (SELECT json_agg(r)
     FROM (
       SELECT 목록명, 조회수
       FROM datasets
       ORDER BY 조회수 DESC
       LIMIT 10
     ) r)
  );
$$;

-- ============================================================
-- 5. RLS (Row Level Security) - 읽기 전용 공개 접근
-- ============================================================
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON datasets FOR SELECT USING (true);
