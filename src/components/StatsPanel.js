import React from 'react';
import { FiShoppingBag, FiTruck, FiClock, FiDatabase, FiAlertCircle, FiCalendar, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';

const StatsPanel = ({ productionStats, colors }) => {
  return (
    <div className="stats-panel no-print">
      <div className="stats-grid">
        {[
          {
            title: "Total Orders",
            value: productionStats.totalOrders,
            icon: <FiShoppingBag size={16} />,
            color: colors.primary,
          },
          {
            title: "Total Units",
            value: productionStats.totalUnits,
            icon: <FiShoppingBag size={16} />,
            color: colors.primary,
          },
          {
            title: "Orders (Last 30d)",
            value: productionStats.deliveredLast30Days,
            icon: <FiTruck size={16} />,
            color: colors.success,
          },
          {
            title: "Units (Last 30d)",
            value: productionStats.deliveredUnitsLast30Days,
            icon: <FiShoppingBag size={16} />,
            color: colors.success,
          },
          {
            title: productionStats.lastQuarterLabel,
            value: productionStats.unitsDeliveredLastQuarter,
            icon: <FiTruck size={16} />,
            color: colors.success,
          },
          {
            title: "In Prod.",
            value: productionStats.inProduction,
            icon: <FiClock size={16} />,
            color: colors.accent,
          },
          {
            title: "Fabric Ord.",
            value: productionStats.fabricOrdered,
            icon: <FiDatabase size={16} />,
            color: colors.info,
          },
          {
            title: "Pend. Units",
            value: productionStats.pendingUnits,
            icon: <FiAlertCircle size={16} />,
            color: colors.warning,
          },
          {
            title: "Gold Seal Sent",
            value: productionStats.goldSealSent,
            icon: <FiCheckCircle size={16} />,
            color: colors.success,
          },
          {
            title: "Last Delivery",
            value: productionStats.lastDeliveryDateFormatted,
            icon: <FiCalendar size={16} />,
            color: colors.secondary,
          },
          {
            title: productionStats.lastYearOrdersLabel,
            value: productionStats.ordersLastYear,
            icon: <FiBarChart2 size={16} />,
            color: colors.secondary,
          },
          {
            title: productionStats.lastYearLabel,
            value: productionStats.unitsDeliveredLastYear,
            icon: <FiTruck size={16} />,
            color: colors.success,
          },
          {
            title: productionStats.currentYearLabel,
            value: productionStats.unitsDeliveredCurrentYear,
            icon: <FiTruck size={16} />,
            color: colors.success,
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