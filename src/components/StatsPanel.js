// src/components/StatsPanel.js
import React from 'react';
import { FiShoppingBag, FiTruck, FiClock, FiDatabase, FiAlertCircle, FiCalendar, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';

const StatsPanel = ({ productionStats, colors }) => {
  // Format large numbers with commas
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-GB');
  };

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
            title: "Last 3 Quarters Units",
            value: formatNumber(productionStats.last3QuartersUnits),
            color: productionStats.last3QuartersUnits > 0 ? "#3B82F6" : colors.textMedium,
          },
          {
            title: "3 Year Total Units",
            value: formatNumber(productionStats.threeYearUnits),
            color: productionStats.threeYearUnits > 0 ? "#6366F1" : colors.textMedium,
          },
          {
            title: "3 Year Total Orders",
            value: formatNumber(productionStats.threeYearOrders),
            color: productionStats.threeYearOrders > 0 ? "#6366F1" : colors.textMedium,
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