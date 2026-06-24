import React from 'react';
import { Search, Database, Menu, RefreshCw } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ searchTerm, onSearchChange, onMenuClick, onRefresh }) => {
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
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="데이터 목록 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
};

export default TopBar;
