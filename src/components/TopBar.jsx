import React from 'react';
import { Search, Database, Menu, RefreshCw } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ searchInput, onSearchChange, onSearchSubmit, onMenuClick, onRefresh }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button className="menu-btn" onClick={onMenuClick} aria-label="필터 열기">
          <Menu size={22} />
        </button>
        <div className="logo-container">
          <Database className="logo-icon" size={24} />
          <h1 className="logo-text">Public Data Explorer</h1>
        </div>
        <button className="refresh-btn" onClick={onRefresh} aria-label="데이터 새로고침" title="데이터 새로고침">
          <RefreshCw size={16} />
        </button>
      </div>
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="데이터 목록 검색..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button type="submit" className="search-submit-btn" aria-label="검색">
            <Search size={18} />
          </button>
        </div>
      </form>
    </header>
  );
};

export default TopBar;
