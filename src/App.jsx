import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  hasData, syncFromSupabase, loadAllDatasets,
  filterDatasets, computeFilterOptions, computeDashboardStats,
} from './lib/db';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DataGrid from './components/DataGrid';
import Dashboard from './components/Dashboard';
import DetailPanel from './components/DetailPanel';
import './App.css';

const EMPTY_FILTERS = { types: [], agencies: [], categories: [], formats: [] };

function App() {
  const [appState, setAppState] = useState('init'); // 'init' | 'syncing' | 'ready' | 'error'
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [initError, setInitError] = useState(null);

  const allRowsRef = useRef([]);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applyFilter = useCallback((search, filters, page) => {
    const { rows: r, totalCount: c } = filterDatasets(allRowsRef.current, { search, filters, page });
    setRows(r);
    setTotalCount(c);
  }, []);

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
    await syncFromSupabase((current, total) => {
      setSyncProgress({ current, total });
    });
    await initFromDB();
  }, [initFromDB]);

  useEffect(() => {
    (async () => {
      try {
        const dataExists = await hasData();
        if (!dataExists) {
          await runSync();
        } else {
          await initFromDB();
        }
      } catch (e) {
        setInitError(e.message);
        setAppState('error');
      }
    })();
  }, []);

  useEffect(() => {
    if (appState !== 'ready') return;
    const delay = searchTerm.length > 0 ? 150 : 0;
    const timer = setTimeout(() => {
      applyFilter(searchTerm, selectedFilters, currentPage);
    }, delay);
    return () => clearTimeout(timer);
  }, [appState, searchTerm, selectedFilters, currentPage, applyFilter]);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (category, value) => {
    setCurrentPage(1);
    setSelectedFilters(prev => {
      const cur = prev[category];
      const updated = cur.includes(value)
        ? cur.filter(v => v !== value)
        : [...cur, value];
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
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
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

        <div className="content-area">
          <Dashboard stats={dashboardStats} />
          <DataGrid
            rows={rows}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onRowClick={setSelectedRow}
            loading={false}
          />
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
