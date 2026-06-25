import React from 'react';
import './DataGrid.css';

const DataGrid = ({ rows, totalCount, hasMore, onRowClick }) => {
  return (
    <div className="data-grid-container">
      <div className="grid-header">
        <span className="total-count">
          총 <strong>{totalCount.toLocaleString()}</strong>건
        </span>
      </div>
      <div className="table-wrapper">
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
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-state">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="load-more-indicator">
          <span>스크롤하여 더 보기</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(DataGrid);
