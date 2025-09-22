import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import * as XLSX from 'xlsx';
import { Routes, Route } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { FiDownload, FiSearch, FiPrinter, FiFileText, FiLayers, FiUsers, FiArrowUp } from 'react-icons/fi';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import StatsPanel from './components/StatsPanel';
import CustomerPage from './components/CustomerPage';
import { formatDate, getDateValue, formatCurrency, compactSizes, getGoogleDriveThumbnail, getGoogleDriveDownloadLink, preloadImages } from './utils/index';
import { useData } from './useData';
import './styles.css';

// Debounce function to reduce re-renders
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function App() {
  const { data } = useData();
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
  const [poInput, setPoInput] = useState("");
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // Set to 100 items per page
  const [isVisible, setIsVisible] = useState(false); // State for scroll button visibility

  // Debounced search handler
  const debouncedSetSearch = useRef(debounce((value) => setSearch(value), 300)).current;

  const colors = useMemo(() => darkMode ? {
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
    textDark: "#FFFFFF",
    textMedium: "#9CA3AF",
    textLight: "#FFFFFF",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#374151",
    headerText: "#FFFFFF",
    activeTab: "#CD5E77",
    inactiveTab: "#6B7280",
    actionButton: "#1B4D3E",
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
    textDark: "#000000",
    textMedium: "#6B7280",
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
  }, [darkMode]);

  // productionStats calculation
  const productionStats = useMemo(() => {
    const today = new Date(); // Use dynamic date in production
    const fiscalYearStart = new Date(today.getFullYear(), 6, 1); // July 1, 2025
    const lastFiscalYearStart = new Date(today.getFullYear() - 1, 6, 1); // July 1, 2024
    const lastFiscalYearEnd = new Date(today.getFullYear(), 5, 30); // June 30, 2025
    const twoYearsAgoStart = new Date(today.getFullYear() - 2, 6, 1); // July 1, 2023
    const twoYearsAgoEnd = new Date(today.getFullYear() - 1, 5, 30); // June 30, 2024
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Quarterly ranges for last 4 quarters
    const quarterlyRanges = [
      { quarter: 'Q4 2024', start: new Date(2024, 9, 1), end: new Date(2024, 11, 31) }, // Oct-Dec 2024
      { quarter: 'Q1 2025', start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) }, // Jan-Mar 2025
      { quarter: 'Q2 2025', start: new Date(2025, 3, 1), end: new Date(2025, 5, 30) }, // Apr-Jun 2025
      { quarter: 'Q3 2025', start: new Date(2025, 6, 1), end: new Date(2025, 8, 30) }, // Jul-Sep 2025
    ];

    const stats = {
      totalOrders: data.sales_po.length,
      totalUnits: data.sales_po.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      deliveredLast30Days: data.sales_po.filter(row => {
        const date = getDateValue(row["REAL DD"]);
        return row["LIVE STATUS"] === "DELIVERED" && date >= oneMonthAgo.getTime();
      }).length,
      deliveredUnitsLast30Days: data.sales_po
        .filter(row => {
          const date = getDateValue(row["REAL DD"]);
          return row["LIVE STATUS"] === "DELIVERED" && date >= oneMonthAgo.getTime();
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      // Quarterly units
      ...quarterlyRanges.reduce((acc, range) => {
        acc[`${range.quarter.replace(' ', '')}Units`] = data.sales_po
          .filter(row => {
            const date = getDateValue(row["XFACT DD"]);
            return date >= range.start.getTime() && date <= range.end.getTime();
          })
          .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0);
        return acc;
      }, {}),
      currentYearUnits: data.sales_po
        .filter(row => {
          const date = getDateValue(row["XFACT DD"]);
          return date >= fiscalYearStart.getTime() && date <= today.getTime();
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      lastYearUnits: data.sales_po
        .filter(row => {
          const date = getDateValue(row["XFACT DD"]);
          return date >= lastFiscalYearStart.getTime() && date <= lastFiscalYearEnd.getTime();
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      twoYearsAgoUnits: data.sales_po
        .filter(row => {
          const date = getDateValue(row["XFACT DD"]);
          return date >= twoYearsAgoStart.getTime() && date <= twoYearsAgoEnd.getTime();
        })
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      inProduction: data.sales_po.filter(row => row["LIVE STATUS"]?.toLowerCase() === "in production").length,
      fabricOrdered: data.fabric.filter(row => row["STATUS"]?.toLowerCase() === "fabric ordered").length,
      pendingUnits: data.sales_po
        .filter(row => row["LIVE STATUS"]?.toLowerCase() !== "delivered")
        .reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0, 10), 0),
      pendingOrders: data.sales_po.filter(row => row["LIVE STATUS"]?.toLowerCase() !== "delivered").length,
      goldSealSent: data.sales_po.filter(row => row["FIT STATUS"]?.toLowerCase() === "gold seal sent").length,
      lastDeliveryDateFormatted: data.sales_po.length > 0
        ? (() => {
            const dates = data.sales_po
              .map(row => {
                const dateValue = getDateValue(row["XFACT DD"]);
                if (isNaN(dateValue)) {
                  console.warn("Invalid XFACT DD value:", row["XFACT DD"]);
                  return null;
                }
                return dateValue;
              })
              .filter(date => date !== null && !isNaN(date));
            return dates.length > 0 ? formatDate(new Date(Math.max(...dates))) : "-";
          })()
        : "-"
    };

    return stats;
  }, [data.sales_po, data.fabric]);

  // Preload images when data changes
  useEffect(() => {
    if (data.sales_po) {
      const salesImages = data.sales_po.map(row => row.IMAGE).filter(Boolean);
      preloadImages(salesImages);
    }
    
    if (data.insert_pattern) {
      const devImages = data.insert_pattern.flatMap(row => [
        row["FRONT IMAGE"],
        row["BACK IMAGE"],
        row["SIDE IMAGE"]
      ]).filter(Boolean);
      preloadImages(devImages);
    }
  }, [data]);

  // Handle scroll to show/hide button
  useEffect(() => {
    const handleScroll = () => {
      console.log("Scroll Y:", window.scrollY); // Debug scroll position
      setIsVisible(window.scrollY > 50); // Lower threshold to 50px
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formLinks = useMemo(() => [
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
      external: true
    }
  ], [colors]);

  const filteredSales = useMemo(() => {
    if (!data.sales_po) return [];
    
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    if (!data.fabric) return [];
    
    return data.fabric
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !fabricFilters.TYPE || (row["TYPE"] || "").toLowerCase() === fabricFilters.TYPE.toLowerCase())
      .filter(row => !fabricFilters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === fabricFilters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !fabricFilters.SUPPLIER || (row["SUPPLIER"] || "").toLowerCase() === fabricFilters.SUPPLIER.toLowerCase())
      .sort((a, b) => (b["NO."] || "").localeCompare(a["NO."] || ""));
  }, [data.fabric, search, fabricFilters]);

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    
    return data.insert_pattern
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const exportToExcel = useCallback(() => {
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

    if (exportData.length === 0) {
      alert('No data to export!');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${sheetName}_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  }, [activeTab, filteredSales, filteredFabric, filteredDevelopments]);

  const handlePrint = useCallback(() => {
    if (selectedPOs.length === 0) return;

    const selectedData = data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]));
    const docketSheet = ReactDOMServer.renderToString(
      <DocketSheet 
        selectedData={selectedData} 
        imageOnError={(e) => { e.target.src = 'https://via.placeholder.com/160'; e.target.onerror = null; }} 
      />
    );
    const cuttingSheet = ReactDOMServer.renderToString(
      <CuttingSheet 
        selectedData={selectedData} 
        imageOnError={(e) => { e.target.src = 'https://via.placeholder.com/160'; e.target.onerror = null; }} 
      />
    );

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Sheets</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; font-family: 'Roboto', sans-serif; }
            .printable-sheet {
              width: 210mm;
              height: 297mm;
              padding: 5mm;
              box-sizing: border-box;
              font-size: 10pt;
              page-break-after: always;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color: var(--text-dark);
            }
            .printable-sheet:last-child { page-break-after: avoid; }
            .printable-sheet table { margin-bottom: 3mm; width: 100%; border-collapse: collapse; table-layout: fixed; border-width: 0.25pt; }
            .printable-sheet .table th, .printable-sheet .table td { border: 0.25pt solid #000000; padding: 1mm; vertical-align: top; text-align: left; font-size: 10pt; font-weight: normal; color: var(--text-dark); background-color: var(--card-bg); }
            .printable-sheet .table th { background-color: #f0f0f0; }
            .printable-sheet .merged-total { background-color: #ffff00; text-align: center; vertical-align: middle; font-size: 56pt; font-weight: bold; line-height: 1; color: #000000; }
            .printable-sheet .notes-section, .printable-sheet .ratio-section { border: none; width: 100%; }
            .printable-sheet .notes-section td, .printable-sheet .ratio-section td { border: none; height: 5mm; color: var(--text-dark); }
            .printable-sheet .main-data { font-weight: normal; color: var(--text-dark); }
            .printable-sheet .delivery-info { margin: 2mm 0; font-size: 20pt; color: #FF0000; }
            .printable-sheet .total-row { color: var(--text-dark); font-size: 12pt; font-weight: normal; }
            .printable-sheet .red-text { color: #FF0000; }
            .printable-sheet img { width: 100%; height: 100%; object-fit: contain; }
            @media print {
              .printable-sheet {
                color: #000000;
              }
              .printable-sheet .table {
                border-width: 0.25pt;
              }
              .printable-sheet .table th {
                background-color: #f0f0f0;
              }
              .printable-sheet .table th,
              .printable-sheet .table td,
              .printable-sheet .main-data,
              .printable-sheet .total-row,
              .printable-sheet .notes-section td,
              .printable-sheet .sizes-table td,
              .printable-sheet .merged-total {
                color: #000000;
                border: 0.25pt solid #000000;
              }
              .printable-sheet .merged-total {
                color: #000000;
              }
            }
          </style>
        </head>
        <body>
          <div class="printable-sheet">${docketSheet}</div>
          <div class="printable-sheet">${cuttingSheet}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [selectedPOs, data.sales_po]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`} style={{ minHeight: '100vh', flex: 1 }}>
      <Routes>
        <Route path="/" element={
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header className="app-header">
              <div className="header-left">
                <h1 className="app-title">High5 Dashboard</h1>
                <div className="form-links">
                  {formLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="form-link"
                      style={{ color: link.color }}
                    >
                      {link.icon} {link.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="header-center">
                <div className="tab-container">
                  <div className="tabs">
                    {[
                      { key: "sales", label: "Sales PO" },
                      { key: "fabric", label: "Fabric" },
                      { key: "developments", label: "Developments" },
                      { key: "production", label: "Production" }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setCurrentPage(1);
                        }}
                      >
                        {tab.label}
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
                  disabled={!filteredSales.length && !filteredFabric.length && !filteredDevelopments.length}
                >
                  <FiDownload size={14} /> Export
                </button>
              </div>
            </header>

            {showStats && (
              <StatsPanel productionStats={productionStats} colors={colors} />
            )}

            <div className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="search-box-container">
                <div className="search-box">
                  <FiSearch size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => debouncedSetSearch(e.target.value)}
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
                            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                            onChange={(e) => setFabricFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                <SalesTable
                  data={filteredSales}
                  colors={colors}
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
              )}

              {activeTab === "fabric" && (
                <FabricTable
                  data={filteredFabric}
                  colors={colors}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredFabric.length}
                  itemsPerPage={itemsPerPage}
                />
              )}

              {activeTab === "developments" && (
                <DevelopmentsTable
                  data={filteredDevelopments}
                  colors={colors}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredDevelopments.length}
                  itemsPerPage={itemsPerPage}
                />
              )}

              {activeTab === "production" && (
                <div>
                  <div className="no-print">
                    <div className="po-input-container">
                      <div className="filter-item" style={{ flex: 1 }}>
                        <textarea
                          value={poInput}
                          onChange={(e) => setPoInput(e.target.value)}
                          placeholder="Enter PO Numbers e.g., PO0004 PO0001,PO0002"
                          rows={1}
                          className="filter-select"
                          style={{ width: '100', height: '40px', overflow: 'hidden' }}
                        />
                      </div>
                      <div className="po-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => {
                            const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                            setSelectedPOs(pos);
                          }}
                          className="action-button generate-button"
                          disabled={!poInput.trim()}
                        >
                          Generate Sheets
                        </button>
                        <button 
                          onClick={handlePrint} 
                          className="action-button print-button"
                          disabled={selectedPOs.length === 0}
                        >
                          <FiPrinter size={14} /> Print Sheets
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedPOs.length > 0 && (
                    <div className="sheets-container">
                      <DocketSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                      <CuttingSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {/* Scroll to Top Button */}
            <button 
              className="scroll-to-top"
              onClick={scrollToTop}
              style={{ 
                position: 'fixed', 
                bottom: '20px', 
                right: '20px', 
                display: isVisible ? 'block' : 'none',
                backgroundColor: colors.actionButton,
                color: colors.textLight,
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px var(--shadow-color)',
                transition: 'opacity 0.2s ease'
              }}
            >
              <FiArrowUp size={20} />
            </button>
          </div>
        } />
        <Route path="/pd-kaiia" element={<CustomerPage />} />
      </Routes>
    </div>
  );
}

export default App;