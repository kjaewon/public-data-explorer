import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DataGrid from './components/DataGrid';
import Dashboard from './components/Dashboard';
import DetailPanel from './components/DetailPanel';
import './App.css';

const ITEMS_PER_PAGE = 20;

const EMPTY_FILTERS = { types: [], agencies: [], categories: [], formats: [] };

function App() {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsLoading, setRowsLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 앱 기동 시 1회: 필터 옵션 + 대시보드 통계
  useEffect(() => {
    Promise.all([
      supabase.rpc('get_filter_options'),
      supabase.rpc('dashboard_stats'),
    ]).then(([optRes, statsRes]) => {
      if (optRes.data) setFilterOptions(optRes.data);
      if (statsRes.data) setDashboardStats(statsRes.data);
    });
  }, []);

  // 서버사이드 필터링 + 페이지네이션
  const fetchRows = useCallback(async (page, search, filters) => {
    setRowsLoading(true);
    const effectiveSearch = search.length === 1 ? '' : search;
    const offset = (page - 1) * ITEMS_PER_PAGE;

    let q = supabase
      .from('datasets')
      .select('*', { count: 'exact' })
      .range(offset, offset + ITEMS_PER_PAGE - 1)
      .order('조회수', { ascending: false });

    if (effectiveSearch) {
      q = q.or(
        `목록명.ilike.%${effectiveSearch}%,키워드.ilike.%${effectiveSearch}%,설명.ilike.%${effectiveSearch}%`
      );
    }
    if (filters.types.length)      q = q.in('목록유형', filters.types);
    if (filters.agencies.length)   q = q.in('제공기관', filters.agencies);
    if (filters.categories.length) q = q.in('분류체계', filters.categories);
    if (filters.formats.length)    q = q.overlaps('포맷', filters.formats);

    const { data, count, error } = await q;
    if (!error) {
      setRows(data ?? []);
      setTotalCount(count ?? 0);
    }
    setRowsLoading(false);
  }, []);

  // 검색어는 300ms 디바운스, 필터/페이지는 즉시
  useEffect(() => {
    const delay = searchTerm.length > 0 ? 300 : 0;
    const timeout = setTimeout(() => {
      fetchRows(currentPage, searchTerm, selectedFilters);
    }, delay);
    return () => clearTimeout(timeout);
  }, [currentPage, searchTerm, selectedFilters, fetchRows]);

  // 검색/필터 변경 시 1페이지로 리셋 (핸들러에서 동기적으로 처리)
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (category, value) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleCategoryChange = (newCategories) => {
    setCurrentPage(1);
    setSelectedFilters(prev => ({ ...prev, categories: newCategories }));
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setSelectedFilters(EMPTY_FILTERS);
    setSearchTerm('');
  };

  const isInitialLoading = rowsLoading && rows.length === 0;

  return (
    <div className="app-container">
      <TopBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="main-content">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onCategoryChange={handleCategoryChange}
          onClearFilters={handleClearFilters}
        />

        <div className="content-area">
          {isInitialLoading ? (
            <div className="loading-state">
              <h2>데이터를 불러오는 중입니다...</h2>
            </div>
          ) : (
            <>
              <Dashboard stats={dashboardStats} />
              <DataGrid
                rows={rows}
                totalCount={totalCount}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onRowClick={setSelectedRow}
                loading={rowsLoading}
              />
            </>
          )}
        </div>
      </div>

      <DetailPanel
        data={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}

export default App;
