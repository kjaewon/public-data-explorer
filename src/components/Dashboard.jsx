import React from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
  '#003d9b', '#0052cc', '#b2c5ff', '#545f72', '#d5e0f7',
  '#004b58', '#006476', '#70e2ff', '#ba1a1a', '#ffdad6', '#e1e2e4',
];

const Dashboard = ({ stats }) => {
  if (!stats) return null;

  const { by_category, top_viewed } = stats;

  // Pie: 상위 10개 + 기타
  const topCats = by_category.slice(0, 10);
  const otherCount = by_category.slice(10).reduce((s, r) => s + r.cnt, 0);
  const pieRows = otherCount > 0 ? [...topCats, { 분류체계: '기타', cnt: otherCount }] : topCats;

  const pieData = {
    labels: pieRows.map(r => r.분류체계),
    datasets: [{
      data: pieRows.map(r => r.cnt),
      backgroundColor: COLORS,
      borderWidth: 1,
    }],
  };

  // Bar: Top 10 조회수
  const barData = {
    labels: top_viewed.map(r => (r.목록명 ?? '').substring(0, 15) + '...'),
    datasets: [{
      label: '조회수',
      data: top_viewed.map(r => r.조회수),
      backgroundColor: '#0052cc',
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="dashboard-container">
      <div className="chart-card">
        <h3>분류체계별 데이터 비중</h3>
        <div className="pie-chart-wrapper">
          <Pie data={pieData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
      <div className="chart-card">
        <h3>상위 조회수 데이터 Top 10</h3>
        <div className="bar-chart-wrapper">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
