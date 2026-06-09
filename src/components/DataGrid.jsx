import React from 'react';
import './DataGrid.css';

const ITEMS_PER_PAGE = 20;

const DataGrid = ({ rows, totalCount, currentPage, onPageChange, onRowClick, loading }) => {
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="data-grid-container">
      <div className="grid-header">
        <span className="total-count">
          총 <strong>{totalCount.toLocaleString()}</strong>건
        </span>
        {loading && <span className="grid-loading-indicator">불러오는 중...</span>}
      </div>
      <div className={`table-wrapper${loading ? ' table-loading' : ''}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>목록명</th>
              <th>제공기관</th>
              <th>분류체계</th>
              <th>확장자</th>
              <th>조회수</th>
              <th>수정일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} onClick={() => onRowClick(row)}>
                <td className="col-title" data-label="목록명">{row.목록명}</td>
                <td data-label="제공기관">{row.제공기관}</td>
                <td data-label="분류체계">{row.분류체계}</td>
                <td data-label="확장자">
                  <span className="format-badge">{row.포맷?.[0] ?? '-'}</span>
                </td>
                <td className="col-num" data-label="조회수">
                  {(row.조회수 ?? 0).toLocaleString()}
                </td>
                <td data-label="수정일">{row.수정일}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="empty-state">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            처음
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            이전
          </button>
          <span>{currentPage} / {totalPages}</span>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            다음
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
            맨뒤
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(DataGrid);
