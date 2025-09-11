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
            icon: <FiShoppingBag size={16} />,
            color: colors.primary,
          },
          {
            title: "Total Units",
            value: formatNumber(productionStats.totalUnits),
            icon: <FiShoppingBag size={16} />,
            color: colors.primary,
          },
          {
            title: "Orders (Last 30d)",
            value: formatNumber(productionStats.deliveredLast30Days),
            icon: <FiTruck size={16} />,
            color: productionStats.deliveredLast30Days > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "Units (Last 30d)",
            value: formatNumber(productionStats.deliveredUnitsLast30Days),
            icon: <FiShoppingBag size={16} />,
            color: productionStats.deliveredUnitsLast30Days > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "In Production",
            value: formatNumber(productionStats.inProduction),
            icon: <FiClock size={16} />,
            color: productionStats.inProduction > 0 ? colors.accent : colors.textMedium,
          },
          {
            title: "Fabric Ordered",
            value: formatNumber(productionStats.fabricOrdered),
            icon: <FiDatabase size={16} />,
            color: productionStats.fabricOrdered > 0 ? colors.info : colors.textMedium,
          },
          {
            title: "Pending Units",
            value: formatNumber(productionStats.pendingUnits),
            icon: <FiAlertCircle size={16} />,
            color: productionStats.pendingUnits > 0 ? colors.warning : colors.textMedium,
          },
          {
            title: "Gold Seal Sent",
            value: formatNumber(productionStats.goldSealSent),
            icon: <FiCheckCircle size={16} />,
            color: productionStats.goldSealSent > 0 ? "#10B981" : colors.textMedium,
          },
          {
            title: "Last Delivery",
            value: productionStats.lastDeliveryDateFormatted,
            icon: <FiCalendar size={16} />,
            color: productionStats.lastDeliveryDateFormatted !== "-" ? colors.secondary : colors.textMedium,
          },
        ].map((metric, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${metric.color}20`, color: metric.color }}>
              {metric.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{metric.value}</div>
              <div className="stat-title">{metric.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;