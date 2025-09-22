import React from 'react';

const StatsPanel = ({ productionStats, colors }) => {
  // Format large numbers with commas
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-GB');
  };

  // Determine if Q3 2025 (Jul-Sep 2025) is the current quarter
  const today = new Date();
  const isCurrentQuarterQ32025 = today >= new Date(2025, 6, 1) && today <= new Date(2025, 8, 30);

  return (
    <div className="stats-panel no-print">
      <div className="stats-grid">
        {[
          {
            title: "Total Orders",
            value: formatNumber(productionStats.totalOrders),
            color: colors.primary,
          },
          {
            title: "Total Units",
            value: formatNumber(productionStats.totalUnits),
            color: colors.primary,
          },
          {
            title: "Orders (Last 30d)",
            value: formatNumber(productionStats.deliveredLast30Days),
            color: productionStats.deliveredLast30Days > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "Units (Last 30d)",
            value: formatNumber(productionStats.deliveredUnitsLast30Days),
            color: productionStats.deliveredUnitsLast30Days > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "Q4 2024 Units (Oct-Dec)",
            value: formatNumber(productionStats.Q42024Units),
            color: productionStats.Q42024Units > 0 ? "#3B82F6" : colors.textMedium,
          },
          {
            title: "Q1 2025 Units (Jan-Mar)",
            value: formatNumber(productionStats.Q12025Units),
            color: productionStats.Q12025Units > 0 ? "#3B82F6" : colors.textMedium,
          },
          {
            title: "Q2 2025 Units (Apr-Jun)",
            value: formatNumber(productionStats.Q22025Units),
            color: productionStats.Q22025Units > 0 ? "#3B82F6" : colors.textMedium,
          },
          {
            title: isCurrentQuarterQ32025 ? "Current Quarter Units" : "Q3 2025 Units (Jul-Sep)",
            value: formatNumber(productionStats.Q32025Units),
            color: productionStats.Q32025Units > 0 ? "#3B82F6" : colors.textMedium,
          },
          {
            title: "Current Year Units (Jul 25 - Now)",
            value: formatNumber(productionStats.currentYearUnits),
            color: productionStats.currentYearUnits > 0 ? "#6366F1" : colors.textMedium,
          },
          {
            title: "Last Year Units (Jul 24 - Jun 25)",
            value: formatNumber(productionStats.lastYearUnits),
            color: productionStats.lastYearUnits > 0 ? "#6366F1" : colors.textMedium,
          },
          {
            title: "2 Years Ago Units (Jul 23 - Jun 24)",
            value: formatNumber(productionStats.twoYearsAgoUnits),
            color: productionStats.twoYearsAgoUnits > 0 ? "#6366F1" : colors.textMedium,
          },
          {
            title: "In Production",
            value: formatNumber(productionStats.inProduction),
            color: productionStats.inProduction > 0 ? colors.accent : colors.textMedium,
          },
          {
            title: "Fabric Ordered",
            value: formatNumber(productionStats.fabricOrdered),
            color: productionStats.fabricOrdered > 0 ? colors.info : colors.textMedium,
          },
          {
            title: "Pending Units",
            value: formatNumber(productionStats.pendingUnits),
            color: productionStats.pendingUnits > 0 ? colors.warning : colors.textMedium,
          },
          {
            title: "Pending Orders",
            value: formatNumber(productionStats.pendingOrders),
            color: productionStats.pendingOrders > 0 ? colors.warning : colors.textMedium,
          },
          {
            title: "GS To Send",
            value: formatNumber(productionStats.gsToSend),
            color: productionStats.gsToSend > 0 ? "#F59E0B" : colors.textMedium,
          },
          {
            title: "Gold Seal Sent",
            value: formatNumber(productionStats.goldSealSent),
            color: productionStats.goldSealSent > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "Last Delivery",
            value: productionStats.lastDeliveryDateFormatted,
            color: productionStats.lastDeliveryDateFormatted !== "-" ? colors.secondary : colors.textMedium,
          },
        ].map((metric, index) => (
          <div key={index} className="stat-card" style={{ borderColor: metric.color }}>
            <div className="stat-content">
              <div className="stat-value" style={{ color: metric.color }}>{metric.value}</div>
              <div className="stat-title">{metric.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;