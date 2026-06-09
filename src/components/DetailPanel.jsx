import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import './DetailPanel.css';

const DetailPanel = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="panel-header">
          <h2>데이터 상세 정보</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="panel-content">
          <h3 className="data-title">{data.목록명}</h3>

          <div className="info-group">
            <span className="info-label">제공기관</span>
            <span className="info-value">{data.제공기관}</span>
          </div>

          <div className="info-group">
            <span className="info-label">분류체계</span>
            <span className="info-value">{data.분류체계}</span>
          </div>

          <div className="info-group">
            <span className="info-label">목록유형</span>
            <span className="info-value">{data.목록유형}</span>
          </div>

          <div className="info-group">
            <span className="info-label">확장자 (데이터포맷)</span>
            <span className="info-value">
              {data.포맷?.map(f => (
                <span key={f} className="format-badge">{f}</span>
              ))}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">설명</span>
            <p className="info-desc">{data.설명 || '설명 없음'}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">수정일</span>
              <span className="info-value">{data.수정일}</span>
            </div>
            <div className="info-item">
              <span className="info-label">조회수</span>
              <span className="info-value">{(data.조회수 ?? 0).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">다운로드 수</span>
              <span className="info-value">{(data.다운로드수 ?? 0).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">비용유무</span>
              <span className="info-value">{data.비용유무}</span>
            </div>
          </div>

          {data.목록_url && (
            <a
              href={data.목록_url}
              target="_blank"
              rel="noopener noreferrer"
              className="external-link-btn"
            >
              <ExternalLink size={18} />
              공공데이터포털에서 보기
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default DetailPanel;
