import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import './Sidebar.css';

const FilterGroup = ({ title, options, selected, onChange, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState('');

  const displayOptions = searchable && query.trim()
    ? options.filter(opt => opt.includes(query.trim()))
    : options;

  return (
    <div className="filter-group">
      <div className="filter-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="filter-title">{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && (
        <div className="filter-options">
          {searchable && (
            <div className="filter-search">
              <Search size={12} />
              <input
                type="text"
                placeholder="기관명 검색..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="filter-search-input"
              />
            </div>
          )}
          {displayOptions.length === 0 && (
            <span className="filter-empty">일치하는 기관이 없습니다.</span>
          )}
          {displayOptions.map(opt => (
            <label key={opt} className="filter-label">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onChange(opt)}
                className="filter-checkbox"
              />
              <span className="filter-text">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const IndeterminateCheckbox = ({ checked, indeterminate, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="filter-checkbox"
    />
  );
};

const CategoryFilterGroup = ({ title, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedParents, setExpandedParents] = useState({});

  const grouped = useMemo(() => {
    const map = {};
    options.forEach(opt => {
      const idx = opt.indexOf(' - ');
      const parent = idx !== -1 ? opt.slice(0, idx) : opt;
      const child = idx !== -1 ? opt.slice(idx + 3) : opt;
      if (!map[parent]) map[parent] = [];
      map[parent].push({ full: opt, child });
    });
    return map;
  }, [options]);

  const parents = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const getParentState = (parent) => {
    const children = grouped[parent].map(i => i.full);
    const count = children.filter(c => selected.includes(c)).length;
    if (count === 0) return 'none';
    if (count === children.length) return 'all';
    return 'partial';
  };

  const handleParentChange = (parent) => {
    const children = grouped[parent].map(i => i.full);
    const state = getParentState(parent);
    const newSelected = state === 'all'
      ? selected.filter(s => !children.includes(s))
      : [...selected, ...children.filter(c => !selected.includes(c))];
    onChange(newSelected);
  };

  const handleChildChange = (full) => {
    const newSelected = selected.includes(full)
      ? selected.filter(s => s !== full)
      : [...selected, full];
    onChange(newSelected);
  };

  const toggleParent = (parent, e) => {
    e.stopPropagation();
    setExpandedParents(prev => ({ ...prev, [parent]: !prev[parent] }));
  };

  return (
    <div className="filter-group">
      <div className="filter-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="filter-title">{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && (
        <div className="filter-options category-options">
          {parents.map(parent => {
            const state = getParentState(parent);
            const isExpanded = !!expandedParents[parent];
            return (
              <div key={parent} className="category-parent">
                <div className="category-parent-row">
                  <label className="filter-label" style={{ flex: 1, marginBottom: 0 }}>
                    <IndeterminateCheckbox
                      checked={state === 'all'}
                      indeterminate={state === 'partial'}
                      onChange={() => handleParentChange(parent)}
                    />
                    <span className="filter-text">{parent}</span>
                  </label>
                  <button
                    className="category-expand-btn"
                    onClick={(e) => toggleParent(parent, e)}
                    title={isExpanded ? '접기' : '펼치기'}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="category-children">
                    {grouped[parent].map(({ full, child }) => (
                      <label key={full} className="filter-label child-label">
                        <input
                          type="checkbox"
                          checked={selected.includes(full)}
                          onChange={() => handleChildChange(full)}
                          className="filter-checkbox"
                        />
                        <span className="filter-text">{child}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, filters, selectedFilters, onFilterChange, onCategoryChange, onClearFilters }) => {
  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Filter size={18} />
          <h2>필터</h2>
        </div>
        <div className="sidebar-header-actions">
          <button className="clear-btn" onClick={onClearFilters}>초기화</button>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="sidebar-content">
        <FilterGroup
          title="목록유형"
          options={filters.types}
          selected={selectedFilters.types}
          onChange={(val) => onFilterChange('types', val)}
        />
        <FilterGroup
          title="제공기관"
          options={filters.agencies}
          selected={selectedFilters.agencies}
          onChange={(val) => onFilterChange('agencies', val)}
          searchable
        />
        <CategoryFilterGroup
          title="분류체계"
          options={filters.categories}
          selected={selectedFilters.categories}
          onChange={onCategoryChange}
        />
        <FilterGroup
          title="데이터 포맷"
          options={filters.formats}
          selected={selectedFilters.formats}
          onChange={(val) => onFilterChange('formats', val)}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
