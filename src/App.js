import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  FiAlertCircle, FiDownload, FiSearch,
  FiFileText, FiLayers, FiShoppingBag, FiPrinter, FiUsers
} from 'react-icons/fi';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import StatsPanel from './components/StatsPanel';
import CustomerPage from './components/CustomerPage';
import { formatDate, getDateValue, formatCurrency, compactSizes, getGoogleDriveThumbnail, getGoogleDriveDownloadLink } from './utils/index';
import { useData } from './useData';
import './styles.css';

function App() {
  // For development/testing - set to false when Google Script is working
  const USE_MOCK_DATA = process.env.NODE_ENV === 'development';
  
  const { data: realData, loading, error } = useData();
  const data = USE_MOCK_DATA ? { sales_po: [], fabric: [], insert_pattern: [] } : realData;
  
  console.log("Full Data Object:", data);
  console.log("Fabric Data:", data?.fabric);

  useEffect(() => {
    if (data && !data.fabric) {
      console.error("Fabric data is undefined or not loaded:", data);
    }
  }, [data]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    TYPE: "",
    "LIVE STATUS": "",
    "FIT STATUS": "",
    "CUSTOMER NAME": ""
  });
  const [fabricFilters, setFabricFilters] = useState({
    TYPE: "",
    "CUSTOMER NAME": "",
    SUPPLIER: ""
  });
  const [activeTab, setActiveTab] = useState("sales");
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

  // PURE BLACK TEXT COLORS
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
    textDark: "#000000",
    textMedium: "#000000",
    textLight: "#FFFFFF",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#374151",
    headerText: "#000000",
    activeTab: "#CD5E77",
    inactiveTab: "#6B7280",
    actionButton: "#1B4D3E",
    statCardBg: "#1F2937",
    statCardBorder: "#374151",
    accentRgb: "245, 158, 11",
    successRgb: "16, 185, 129",
    warningRgb: "245, 158, 11",
    infoRgb: "59, 130, 246",
    activeTabRgb: "205, 94, 119"
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
    textDark: "#000000",
    textMedium: "#000000",
    textLight: "#FFFFFF",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#F3F4F6",
    headerText: "#000000",
    activeTab: "#CD5E77",
    inactiveTab: "#9CA3AF",
    actionButton: "#1B4D3E",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
    accentRgb: "245, 158, 11",
    successRgb: "16, 185, 129",
    warningRgb: "245, 158, 11",
    infoRgb: "59, 130, 246",
    activeTabRgb: "205, 94, 119"
  };

  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={16} />,
      color: colors.primary,
      external: true
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={16} />,
      color: colors.secondary,
      external: true
    },
    {
      label: "PD & KAIIA Dashboard",
      url: "/pd-kaiia",
      icon: <FiUsers size={16} />,
      color: colors.accent,
      external: false
    }
  ];

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
      lastDeliveryDateFormatted: "-",
      lastQuarterLabel: `Q${Math.floor((now.getMonth() + 3) / 3)} ${now.getFullYear() - 1}`,
      lastYearOrdersLabel: `Orders ${lastYearStart.getFullYear()}-${lastYearEnd.getFullYear()}`,
      lastYearLabel: `Units ${lastYearStart.getFullYear()}-${lastYearEnd.getFullYear()}`,
      currentYearLabel: `Units ${currentYearStart.getFullYear()}-${currentYearEnd.getFullYear()}`
    };

    if (data.sales_po) {
      stats.totalOrders = data.sales_po.length;
      stats.totalUnits = data.sales_po.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.deliveredLast30Days = data.sales_po.filter(row => {
        const deliveryDate = getDateValue(row["REAL DD"]);
        return row["LIVE STATUS"] === "DELIVERED" && deliveryDate >= oneMonthAgo;
      }).length;
      stats.deliveredUnitsLast30Days = data.sales_po
        .filter(row => {
          const deliveryDate = getDateValue(row["REAL DD"]);
          return row["LIVE STATUS"] === "DELIVERED" && deliveryDate >= oneMonthAgo;
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.unitsDeliveredLastQuarter = data.sales_po
        .filter(row => {
          const deliveryDate = getDateValue(row["REAL DD"]);
          return row["LIVE STATUS"] === "DELIVERED" && deliveryDate >= lastQuarterStart && deliveryDate <= lastQuarterEnd;
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.unitsDeliveredCurrentYear = data.sales_po
        .filter(row => {
          const deliveryDate = getDateValue(row["REAL DD"]);
          return row["LIVE STATUS"] === "DELIVERED" && deliveryDate >= currentYearStart && deliveryDate <= currentYearEnd;
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.unitsDeliveredLastYear = data.sales_po
        .filter(row => {
          const deliveryDate = getDateValue(row["REAL DD"]);
          return row["LIVE STATUS"] === "DELIVERED" && deliveryDate >= lastYearStart && deliveryDate <= lastYearEnd;
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.ordersLastYear = data.sales_po
        .filter(row => {
          const deliveryDate = getDateValue(row["REAL DD"]);
          return deliveryDate >= lastYearStart && deliveryDate <= lastYearEnd;
        }).length;
      stats.pendingUnits = data.sales_po
        .filter(row => row["LIVE STATUS"] !== "DELIVERED")
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.inProduction = data.sales_po
        .filter(row => row["LIVE STATUS"] === "IN PRODUCTION")
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.fabricOrdered = data.sales_po
        .filter(row => row["LIVE STATUS"] === "FABRIC ORDERED")
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      stats.notDelivered = data.sales_po
        .filter(row => row["LIVE STATUS"] !== "DELIVERED")
        .length;
      stats.goldSealSent = data.sales_po
        .filter(row => row["FIT STATUS"] === "GS SENT")
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
      const lastDelivery = data.sales_po
        .filter(row => row["LIVE STATUS"] === "DELIVERED")
        .reduce((latest, row) => {
          const date = getDateValue(row["REAL DD"]);
          return !latest || date > getDateValue(latest["REAL DD"]) ? row : latest;
        }, null);
      if (lastDelivery) {
        stats.lastDeliveryDate = getDateValue(lastDelivery["REAL DD"]);
        stats.lastDeliveryDateFormatted = formatDate(lastDelivery["REAL DD"]);
      }
    }

    return stats;
  }, [data.sales_po]);

  const filteredSales = useMemo(() => {
    if (!data.sales_po) return [];
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    console.log("Raw Fabric Data:", data.fabric);
    if (!data.fabric) {
      console.error("Fabric data is undefined or empty");
      return [];
    }
    return data.fabric
      .filter(row => true)
      .sort((a, b) => (b["NO."] || "").localeCompare(a["NO."] || ""));
  }, [data.fabric]);

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    return data.insert_pattern
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const getMatchingSalesImage = (fabricRow) => {
    if (!data.sales_po || !fabricRow["H-NUMBER"]) return null;
    const matchingSale = data.sales_po.find(sale => sale["H-NUMBER"] === fabricRow["H-NUMBER"]);
    return matchingSale ? matchingSale.IMAGE : null;
  };

  const handleMouseEnter = (url, e) => {
    if (!url) return;
    
    // Preload image for faster display
    const img = new Image();
    img.src = getGoogleDriveThumbnail(url);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearBottom = window.innerHeight - rect.bottom < 250;
    setPreviewImage({
      url: getGoogleDriveThumbnail(url),
      visible: true,
      position: { x: rect.left + rect.width / 2, y: rect.top + window.scrollY },
      direction: isNearBottom ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  const exportToExcel = () => {
    let exportData = [];
    let sheetName = '';
    if (activeTab === 'sales') {
      exportData = filteredSales;
      sheetName = 'Sales';
    } else if (activeTab === 'fabric') {
      exportData = filteredFabric;
      sheetName = 'Fabric';
    } else if (activeTab === 'developments') {
      exportData = filteredDevelopments;
      sheetName = 'Developments';
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_export.xlsx`);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading High5 Production Dashboard</h2>
        <p>Fetching the latest data...</p>
      </div>
    </div>
  );

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
    <Router>
      <Routes>
        <Route path="/" element={
          <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
            <div className="app-content">
              <header className="app-header no-print">
                <div className="header-left">
                  <h1 className="app-title">High5 Production Dashboard</h1>
                  <div className="form-links">
                    {formLinks.map((link, index) => (
                      link.external ? (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="form-link"
                          style={{ color: link.color }}
                          aria-label={link.label}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </a>
                      ) : (
                        <Link
                          key={index}
                          to={link.url}
                          className="form-link"
                          style={{ color: link.color }}
                          aria-label={link.label}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </Link>
                      )
                    ))}
                  </div>
                </div>
                <div className="header-center">
                  <div className="tab-container">
                    <div className="tabs">
                      {["sales", "fabric", "developments", "production"].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="header-right">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="action-button show-stats-button"
                  >
                    {showStats ? 'Hide Stats' : 'Show Stats'}
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="action-button dark-mode-toggle"
                  >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="action-button export-button"
                  >
                    <FiDownload size={14} /> Export
                  </button>
                </div>
              </header>

              {showStats && (
                <StatsPanel productionStats={productionStats} colors={colors} />
              )}

              <div className="main-content">
                <div className="search-box-container">
                  <div className="search-box">
                    <FiSearch size={16} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      aria-label="Search sales, fabric, or developments"
                    />
                  </div>
                </div>

                {activeTab !== "production" && (
                  <div className="filter-container no-print">
                    {activeTab === "sales" && (
                      <div className="filter-row">
                        {[
                          { key: "TYPE", label: "Type", options: [...new Set(data.sales_po?.map(row => row["TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.sales_po?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "LIVE STATUS", label: "Live Status", options: [...new Set(data.sales_po?.map(row => row["LIVE STATUS"]).filter(Boolean))] },
                          { key: "FIT STATUS", label: "Fit Status", options: [...new Set(data.sales_po?.map(row => row["FIT STATUS"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={filters[filter.key]}
                              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "fabric" && (
                      <div className="filter-row">
                        {[
                          { key: "TYPE", label: "Type", options: [...new Set(data.fabric?.map(row => row["TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.fabric?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "SUPPLIER", label: "Supplier", options: [...new Set(data.fabric?.map(row => row["SUPPLIER"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={fabricFilters[filter.key]}
                              onChange={(e) => setFabricFilters({ ...fabricFilters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "developments" && (
                      <div className="filter-row">
                        {[
                          { key: "STYLE TYPE", label: "Style Type", options: [...new Set(data.insert_pattern?.map(row => row["STYLE TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.insert_pattern?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "FIT SAMPLE", label: "Fit Sample", options: [...new Set(data.insert_pattern?.map(row => row["FIT SAMPLE"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={filters[filter.key]}
                              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sales" && (
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
                )}

                {activeTab === "fabric" && (
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
                )}

                {activeTab === "developments" && (
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
                )}

                {activeTab === "production" && (
                  <div className="no-print">
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
                          className="action-button generate-button"
                        >
                          Generate Sheets
                        </button>
                        <button onClick={() => window.print()} className="action-button print-button">
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

              {previewImage.visible && (
                <div 
                  className={`image-preview ${previewImage.direction} no-print`}
                  style={{
                    left: `${previewImage.position.x}px`,
                    top: previewImage.direction === 'below' ? 
                      `${previewImage.position.y + 20}px` : 
                      'auto',
                    bottom: previewImage.direction === 'above' ? 
                      `${window.innerHeight - previewImage.position.y + 20}px` : 
                      'auto'
                  }}
                >
                  <img 
                    src={previewImage.url} 
                    alt="Preview"
                    className="preview-image"
                  />
                  <div className="preview-arrow"></div>
                </div>
              )}

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
        } />
        <Route path="/pd-kaiia" element={<CustomerPage />} />
      </Routes>
    </Router>
  );
}

export default App;