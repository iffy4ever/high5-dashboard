import React, { useState, useMemo } from "react";
import * as XLSX from 'xlsx';
import {
  FiTruck, FiCalendar, FiClock, FiAlertCircle,
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiFileText, FiLayers, FiShoppingBag, FiPrinter, FiBarChart2, FiCheckCircle, FiUsers
} from 'react-icons/fi';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import { formatDate, getDateValue, formatCurrency, compactSizes } from './utils';
import { useData } from './useData';
import './styles.css';

function App() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    TYPE: "",
    COLOUR: "",
    "LIVE STATUS": "",
    "FIT STATUS": ""
  });
  const [fabricFilters, setFabricFilters] = useState({
    TYPE: "",
    COLOUR: "",
    SUPPLIER: ""
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewImage, setPreviewImage] = useState({
    url: null,
    visible: false,
    position: { x: 0, y: 0 },
    direction: 'below'
  });
  const [poInput, setPoInput] = useState("");
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modern Color Scheme with dark mode support
  const colors = darkMode ? {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    secondaryDark: "#DB2777",
    accent: "#F59E0B",
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#F3F4F6",
    textMedium: "#9CA3AF",
    textLight: "#1F2937",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#1F2937",
    headerText: "#F3F4F6",
    activeTab: "#6366F1",
    inactiveTab: "#6B7280",
    actionButton: "#10B981",
    statCardBg: "#1F2937",
    statCardBorder: "#374151",
  } : {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    secondaryDark: "#DB2777",
    accent: "#F59E0B",
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#1F2937",
    textMedium: "#6B7280",
    textLight: "#F9FAFB",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#FFFFFF",
    headerText: "#1F2937",
    activeTab: "#6366F1",
    inactiveTab: "#9CA3AF",
    actionButton: "#10B981",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
  };

  // Form links with icons
  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={16} />,
      color: colors.primary
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={16} />,
      color: colors.secondary
    },
    {
      label: "PD & KAIIA Dashboard",
      url: "/pd-kaiia",
      icon: <FiUsers size={16} />,
      color: colors.accent
    }
  ];

  // Calculate production statistics
  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastQuarterEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentFiscalYear = now.getFullYear() - (now.getMonth() < 6 ? 1 : 0);
    const currentYearStart = new Date(currentFiscalYear, 6, 1);
    const currentYearEnd = new Date(currentFiscalYear + 1, 5, 30);
    const lastYearStart = new Date(currentFiscalYear - 1, 6, 1);
    const lastYearEnd = new Date(currentFiscalYear, 5, 30);

    let stats = {
      totalOrders: 0,
      totalUnits: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
      unitsDeliveredLastQuarter: 0,
      unitsDeliveredCurrentYear: 0,
      unitsDeliveredLastYear: 0,
      ordersLastYear: 0,
      pendingUnits: 0,
      inProduction: 0,
      fabricOrdered: 0,
      notDelivered: 0,
      goldSealSent: 0,
      lastDeliveryDate: null,
      statusDistribution: {},
      colorDistribution: {},
      customerDistribution: {}
    };

    data.sales_po.forEach(order => {
      const status = String(order["LIVE STATUS"] || "").toUpperCase().trim();
      const totalUnits = parseInt(order["TOTAL UNITS"] || 0);
      const color = order["COLOUR"] || "Unknown";
      const customer = order["CUSTOMER NAME"] || "Unknown";
      
      stats.totalUnits += totalUnits;
      stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
      stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1;
      stats.customerDistribution[customer] = (stats.customerDistribution[customer] || 0) + 1;

      let deliveryDate = null;
      try {
        if (order["REAL DD"]) {
          if (typeof order["REAL DD"] === 'number') {
            deliveryDate = new Date((order["REAL DD"] - 25569) * 86400 * 1000);
          } else {
            deliveryDate = new Date(order["REAL DD"]);
          }
          if (isNaN(deliveryDate.getTime())) deliveryDate = null;
        }
      } catch (e) {
        deliveryDate = null;
      }

      stats.totalOrders++;

      if (status === "DELIVERED" && deliveryDate) {
        if (deliveryDate > oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += totalUnits;
        }

        if (deliveryDate >= lastQuarterStart && deliveryDate <= lastQuarterEnd) {
          stats.unitsDeliveredLastQuarter += totalUnits;
        }

        if (deliveryDate >= currentYearStart && deliveryDate <= currentYearEnd) {
          stats.unitsDeliveredCurrentYear += totalUnits;
        }

        if (deliveryDate >= lastYearStart && deliveryDate <= lastYearEnd) {
          stats.unitsDeliveredLastYear += totalUnits;
          stats.ordersLastYear++;
        }
        
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      } else {
        stats.pendingUnits += totalUnits;
      }

      if (status === "IN PRODUCTION") {
        stats.inProduction++;
      } else if (status === "FABRIC ORDERED") {
        stats.fabricOrdered++;
      } else if (status !== "DELIVERED") {
        stats.notDelivered++;
      }

      if (String(order["FIT STATUS"] || "").toUpperCase().trim() === "GS SENT") {
        stats.goldSealSent++;
      }
    });

    const lastQuarterMonth = lastQuarterStart.toLocaleString('en-GB', { month: 'short' });
    const lastQuarterEndMonth = lastQuarterEnd.toLocaleString('en-GB', { month: 'short' });
    const lastQuarterYear = lastQuarterStart.getFullYear();
    const lastQuarterLabel = `Units (${lastQuarterMonth}-${lastQuarterEndMonth} ${lastQuarterYear})`;

    const currentYearLabel = `Units (FY${currentFiscalYear})`;

    const lastYearLabel = `Units (FY${currentFiscalYear-1})`;

    const lastYearOrdersLabel = `Orders (FY${currentFiscalYear-1})`;

    return {
      ...stats,
      lastDeliveryDateFormatted: stats.lastDeliveryDate 
        ? stats.lastDeliveryDate.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }) 
        : "No Deliveries Yet",
      topCustomers: Object.entries(stats.customerDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      lastQuarterLabel,
      currentYearLabel,
      lastYearLabel,
      lastYearOrdersLabel
    };
  }, [data.sales_po]);

  // Utility Functions
  const getGoogleDriveDownloadLink = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/file/d/${fileId}/view` : "";
  };

  const getGoogleDriveThumbnail = (url) => {
    if (!url) return "";
    try {
      const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
      if (!fileId) {
        console.warn("No valid file ID found in URL:", url);
        return "/fallback-image.png";
      }
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    } catch (e) {
      console.error("Error generating thumbnail URL:", e);
      return "/fallback-image.png";
    }
  };

  const handleMouseEnter = (imageUrl, e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const showAbove = mouseY > windowHeight * 0.7;
    setPreviewImage({
      url: imageUrl ? getGoogleDriveThumbnail(imageUrl) : "/fallback-image.png",
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      direction: showAbove ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  const getMatchingSalesImage = (orderRef) => {
    const matchingSales = data.sales_po.find(sales => sales["PO NUMBER"] === orderRef);
    return matchingSales ? matchingSales.IMAGE : null;
  };

  const exportToExcel = () => {
    let dataToExport, columnOrder;
    if (activeTab === "dashboard") {
      dataToExport = filteredSales;
      columnOrder = [
        "IMAGE", "FIT STATUS", "H-NUMBER", "CUSTOMER NAME", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
        "COLOUR", "PRICE", "TOTAL UNITS", "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
        "PACKING LIST", "SIZES"
      ];
    } else if (activeTab === "fabric") {
      dataToExport = filteredFabric.map(row => ({
        ...row,
        IMAGE: getMatchingSalesImage(row["ORDER REF"]) || "N/A"
      }));
      columnOrder = [
        "NO.", "IMAGE", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
        "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
      ];
    } else if (activeTab === "developments") {
      dataToExport = filteredDevelopments;
      columnOrder = [
        "TIMESTAMP", "H-NUMBER", "CUSTOMER NAME", "TYPE", "CUSTOMER CODE", "FRONT IMAGE", "BACK IMAGE",
        "SIDE IMAGE", "FIT SAMPLE", "TOTAL COST", "CMT PRICE", "COSTING LINK"
      ];
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        const originalKey = key === "FABRIC/TRIM PRICE" ? "FABRIC/TRIM PRICE" : 
                          key === "FIT SAMPLE" ? "FIT SAMPLE" : 
                          key === "TIMESTAMP" ? "Timestamp" : key;
        if (originalKey in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE", "TOTAL COST"].includes(originalKey)) {
            newRow[key] = formatCurrency(row[originalKey]);
          } else if (["XFACT DD", "REAL DD", "DATE", "TIMESTAMP"].includes(originalKey)) {
            newRow[key] = formatDate(row[originalKey]);
          } else if (key === "SIZES") {
            newRow[key] = compactSizes(row);
          } else {
            newRow[key] = row[originalKey];
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Data`);

    const fileName = `High5_${activeTab}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Filtered Data
  const filteredSales = useMemo(() => {
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    return data.fabric_po
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(fabricFilters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["DATE"]) - getDateValue(a["DATE"]));
  }, [data.fabric_po, search, fabricFilters]);

  const filteredDevelopments = useMemo(() => {
    return data.insert_pattern
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  // Loading State
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading Production Dashboard</h2>
        <p>Fetching the latest data...</p>
      </div>
    </div>
  );

  // Error State
  if (error) return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon">
          <FiAlertCircle size={48} />
        </div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          <FiShoppingBag size={16} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav no-print">
          <div className="nav-left">
            <h1>High5 Production Dashboard</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="toggle-icon">
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </div>
          <div className="nav-right">
            <button 
              className="stats-toggle"
              onClick={() => setShowStats(!showStats)}
              style={{ color: colors.primary }}
            >
              <FiBarChart2 size={18} />
            </button>
          </div>
        </header>

        {/* Stats Panel */}
        {showStats && (
          <div className="stats-panel no-print active">
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
        )}

        {/* Dashboard Content */}
        <div className="content-wrapper no-print">
          {/* Form Buttons Row */}
          <div className="form-links-grid">
            {formLinks.map((form, index) => (
              <a
                key={index}
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="form-link"
                style={{ backgroundColor: form.color }}
              >
                <div className="form-icon">{form.icon}</div>
                <div className="form-content">
                  <div className="form-label">{form.label}</div>
                  <div className="form-subtext">Open</div>
                </div>
                <FiExternalLink size={14} />
              </a>
            ))}
          </div>

          {/* Tabs */}
          <div className="tab-container">
            <div className="tabs">
              {[
                { id: "dashboard", label: "Sales Orders", icon: <FiShoppingBag size={16} /> },
                { id: "fabric", label: "Fabric Orders", icon: <FiLayers size={16} /> },
                { id: "developments", label: "Developments", icon: <FiLayers size={16} /> },
                { id: "production", label: "Production Sheets", icon: <FiPrinter size={16} /> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={16} />
              <input
                placeholder="Search Orders, Styles, Colors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="action-buttons">
              <button
                onClick={() => {
                  if (activeTab === "dashboard") {
                    setFilters({
                      TYPE: "",
                      COLOUR: "",
                      "LIVE STATUS": "",
                      "FIT STATUS": ""
                    });
                  } else if (activeTab === "fabric") {
                    setFabricFilters({
                      TYPE: "",
                      COLOUR: "",
                      SUPPLIER: ""
                    });
                  } else if (activeTab === "developments") {
                    setFilters({
                      TYPE: "",
                      COLOUR: "",
                      "FIT SAMPLE": ""
                    });
                  }
                  setSearch("");
                }}
                className="secondary-button"
              >
                <FiFilter size={14} /> Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                className="primary-button"
              >
                <FiDownload size={14} /> Export
              </button>

              <button
                onClick={() => window.print()}
                className="secondary-button"
              >
                <FiPrinter size={14} /> Print
              </button>
            </div>
          </div>

          {/* Sales PO Tab */}
          {activeTab === "dashboard" && (
            <div className="tab-content">
              <div className="filter-grid">
                {Object.keys(filters).filter(key => key !== "STYLE TYPE" && key !== "CUSTOMER NAME" && key !== "FIT SAMPLE").map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key}</option>
                      {[...new Set(data.sales_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <SalesTable
                  data={filteredSales}
                  filters={filters}
                  setFilters={setFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  getGoogleDriveDownloadLink={getGoogleDriveDownloadLink}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  compactSizes={compactSizes}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredSales.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          )}

          {/* Fabric PO Tab */}
          {activeTab === "fabric" && (
            <div className="tab-content">
              <div className="filter-grid">
                {Object.keys(fabricFilters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select
                      value={fabricFilters[key] || ""}
                      onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key}</option>
                      {[...new Set(data.fabric_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <FabricTable
                  data={filteredFabric}
                  fabricFilters={fabricFilters}
                  setFabricFilters={setFabricFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  getMatchingSalesImage={getMatchingSalesImage}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredFabric.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          )}

          {/* Developments Tab */}
          {activeTab === "developments" && (
            <div className="tab-content">
              <div className="filter-grid">
                {["TYPE", "COLOUR", "FIT SAMPLE"].map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select
                      value={filters[key] || ""}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key}</option>
                      {[...new Set(data.insert_pattern.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <DevelopmentsTable
                  data={filteredDevelopments}
                  filters={filters}
                  setFilters={setFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredDevelopments.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          )}

          {/* Production Sheets Tab */}
          {activeTab === "production" && (
            <div className="tab-content no-print">
              <div className="po-input-container">
                <div className="filter-item" style={{ flex: 1 }}>
                  <textarea
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                    placeholder="Enter PO Numbers e.g., PO0004 PO0001,PO0002"
                    rows={1}
                    className="filter-select"
                    style={{ width: '100%', height: '40px', overflow: 'hidden' }}
                  />
                </div>
                <div className="po-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                      setSelectedPOs(pos);
                    }}
                    className="primary-button"
                  >
                    Generate Sheets
                  </button>
                  <button onClick={() => window.print()} className="primary-button">
                    <FiPrinter size={14} /> Print Sheets
                  </button>
                </div>
              </div>

              {selectedPOs.length > 0 && (
                <div className="sheets-container" style={{ marginTop: '20px' }}>
                  <DocketSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                  <CuttingSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Preview */}
        {previewImage.visible && (
          <div 
            className={`image-preview ${previewImage.direction} no-print`}
            style={{
              left: `${previewImage.position.x}px`,
              [previewImage.direction === 'below' ? 'top' : 'bottom']: 
                `${previewImage.direction === 'below' ? previewImage.position.y + 20 : window.innerHeight - previewImage.position.y + 20}px`
            }}
          >
            <img 
              src={previewImage.url} 
              alt="Preview"
              className="preview-image"
              onError={(e) => { e.target.src = "/fallback-image.png"; }}
            />
            <div className="preview-arrow"></div>
          </div>
        )}

        {/* Footer */}
        <footer className="app-footer no-print">
          <div className="footer-content">
            <div>High5 Production Dashboard © {new Date().getFullYear()}</div>
            <div>
              Last Updated: {new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;