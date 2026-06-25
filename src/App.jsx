import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  hasData, syncFromSupabase, loadAllDatasets,
  filterDatasets, computeFilterOptions, computeDashboardStats,
  ITEMS_PER_PAGE,
} from './lib/db';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DataGrid from './components/DataGrid';
import Dashboard from './components/Dashboard';
import DetailPanel from './components/DetailPanel';
import './App.css';

const EMPTY_FILTERS = { types: [], agencies: [], categories: [], formats: [] };

function App() {
  const [appState, setAppState] = useState('init');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [initError, setInitError] = useState(null);

  const allRowsRef = useRef([]);
  const contentAreaRef = useRef(null);

  // Separate input value from submitted search
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All matching rows (recomputed when search/filter changes)
  const filteredRows = useMemo(() => {
    if (appState !== 'ready') return [];
    return filterDatasets(allRowsRef.current, { search: activeSearch, filters: selectedFilters });
  }, [appState, activeSearch, selectedFilters]);

  const displayedRows = useMemo(
    () => filteredRows.slice(0, displayLimit),
    [filteredRows, displayLimit]
  );

  const hasMore = displayLimit < filteredRows.length;

  const loadMore = useCallback(() => {
    setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
  }, []);

  // Reset display window when query changes
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [activeSearch, selectedFilters]);

  // Infinite scroll via scroll event
  useEffect(() => {
    const el = contentAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && hasMore) {
        loadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loadMore]);

  const initFromDB = useCallback(async () => {
    const all = await loadAllDatasets();
    allRowsRef.current = all;
    setFilterOptions(computeFilterOptions(all));
    setDashboardStats(computeDashboardStats(all));
    setAppState('ready');
  }, []);

  const runSync = useCallback(async () => {
    setAppState('syncing');
    setSyncProgress({ current: 0, total: 0 });
    await syncFromSupabase((current, total) => setSyncProgress({ current, total }));
    await initFromDB();
  }, [initFromDB]);

  useEffect(() => {
    (async () => {
      try {
        const dataExists = await hasData();
        if (!dataExists) await runSync();
        else await initFromDB();
      } catch (e) {
        setInitError(e.message);
        setAppState('error');
      }
    })();
  }, []);

  // Submit search explicitly
  const handleSearchSubmit = useCallback(() => {
    setActiveSearch(searchInput);
  }, [searchInput]);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    if (!value) setActiveSearch(''); // Clear immediately when emptied
  }, []);

  const handleFilterChange = (category, value) => {
    setSelectedFilters(prev => {
      const cur = prev[category];
      const updated = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleCategoryChange = (newCategories) => {
    setSelectedFilters(prev => ({ ...prev, categories: newCategories }));
  };

  const handleClearFilters = () => {
    setSelectedFilters(EMPTY_FILTERS);
    setSearchInput('');
    setActiveSearch('');
  };

  if (appState === 'init' || appState === 'syncing') {
    const { current, total } = syncProgress;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
      <div className="sync-screen">
        <div className="sync-box">
          <div className="sync-spinner" />
          <h2 className="sync-title">
            {appState === 'init' ? '초기화 중...' : '데이터 동기화 중...'}
          </h2>
          {total > 0 && (
            <>
              <p className="sync-count">{current.toLocaleString()} / {total.toLocaleString()}건</p>
              <div className="sync-progress-bar">
                <div className="sync-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="sync-pct">{pct}%</p>
            </>
          )}
          <p className="sync-note">최초 방문 시 한 번만 다운로드됩니다.</p>
        </div>
      </div>
    );
  }

  if (appState === 'error') {
    return (
      <div className="sync-screen">
        <div className="sync-box">
          <h2 className="sync-title">초기화 실패</h2>
          <p className="sync-note">{initError}</p>
          <button className="sync-retry-btn" onClick={runSync}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TopBar
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onMenuClick={() => setSidebarOpen(true)}
        onRefresh={runSync}
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

        <div className="content-area" ref={contentAreaRef}>
          <Dashboard stats={dashboardStats} />
          <DataGrid
            rows={displayedRows}
            totalCount={filteredRows.length}
            hasMore={hasMore}
            onRowClick={setSelectedRow}
          />
        </div>
      </div>

      <DetailPanel data={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}

export default App;
