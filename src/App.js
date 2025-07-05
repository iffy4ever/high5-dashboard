import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from 'xlsx';
import { 
  FiHome, FiPackage, FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiX, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiTag, FiUsers, FiCheckCircle,
  FiTrendingUp, FiLayers, FiShoppingBag, FiGrid, FiPrinter, FiRefreshCw
} from 'react-icons/fi';

function App() {
  // State declarations
  const [data, setData] = useState({
    sales_po: [],
    fabric_po: [],
    insert_pattern: []
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Professional Color Scheme
  const colors = {
    primary: "#4F46E5",       // Indigo
    primaryLight: "#6366F1",
    primaryDark: "#4338CA",
    secondary: "#10B981",     // Emerald
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    accent: "#F97316",        // Orange
    accentLight: "#FB923C",
    accentDark: "#EA580C",
    danger: "#EF4444",        // Red
    dangerLight: "#F87171",
    dangerDark: "#DC2626",
    success: "#10B981",       // Emerald
    warning: "#F59E0B",       // Amber
    info: "#3B82F6",         // Blue
    textDark: "#1F2937",      // Gray-800
    textMedium: "#6B7280",    // Gray-500
    textLight: "#F9FAFB",     // Gray-50
    background: "#F9FAFB",    // Gray-50
    cardBg: "#FFFFFF",
    border: "#E5E7EB",       // Gray-200
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#111827",     // Gray-900
    headerText: "#F9FAFB",
    activeTab: "#4F46E5",
    inactiveTab: "#9CA3AF",  // Gray-400
    actionButton: "#10B981",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB"
  };

  // Form links with icons
  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={18} />
    },
    {
      label: "Fit Status Form",
      url: "https://forms.gle/5BxFQWWTubZTq21g9",
      icon: <FiCheckCircle size={18} />
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={18} />
    }
  ];

  // Calculate production statistics
  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let stats = {
      totalOrders: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
      inProduction: 0,
      fabricOrdered: 0,
      notDelivered: 0,
      gsSent: 0,
      lastDeliveryDate: null
    };

    data.sales_po.forEach(order => {
      const status = String(order["LIVE STATUS"] || "").toUpperCase().trim();
      const totalUnits = parseInt(order["TOTAL UNITS"] || 0);
      
      // Parse REAL DD date
      let deliveryDate = null;
      try {
        if (order["REAL DD"]) {
          if (typeof order["REAL DD"] === 'number') {
            // Convert Excel serial number to JS date
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

      // Count delivered orders and units in last 30 days
      if (status === "DELIVERED" && deliveryDate) {
        if (deliveryDate > oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += totalUnits;
        }
        
        // Track last delivery date
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      }

      // Count production status
      if (status === "IN PRODUCTION") {
        stats.inProduction++;
      } else if (status === "FABRIC ORDERED") {
        stats.fabricOrdered++;
      } else if (status !== "DELIVERED") {
        stats.notDelivered++;
      }

      // Count GS SENT status
      if (String(order["FIT STATUS"] || "").toUpperCase().trim() === "GS SENT") {
        stats.gsSent++;
      }
    });

    return {
      ...stats,
      lastDeliveryDateFormatted: stats.lastDeliveryDate 
        ? stats.lastDeliveryDate.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }) 
        : "No Deliveries Yet"
    };
  }, [data.sales_po]);

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "£0.00";
    const number = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const compactSizes = (row) => {
    const sizes = ["4", "6", "8", "10", "12", "14", "16", "18"];
    return sizes.map(s => row[s] ? `${s}-${row[s]}` : "").filter(Boolean).join(", ");
  };

  const getGoogleDriveThumbnail = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w200` : "";
  };

  const getGoogleDriveDownloadLink = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : "";
  };

  const handleMouseEnter = (imageUrl, e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const showAbove = mouseY > windowHeight * 0.7;
    
    setPreviewImage({
      url: getGoogleDriveThumbnail(imageUrl).replace("w200", "w800"),
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      direction: showAbove ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  const exportToExcel = () => {
    let dataToExport, columnOrder;
    
    if (activeTab === "dashboard") {
      dataToExport = filteredSales;
      columnOrder = [
        "IMAGE", "H-NUMBER", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
        "COLOUR", "PRICE", "TOTAL UNITS", "FIT STATUS", "CUSTOMER NAME",
        "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
        "PACKING LIST", "SIZES"
      ];
    } else {
      dataToExport = filteredFabric;
      columnOrder = [
        "NO.", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
        "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
      ];
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        const originalKey = key === "FABRIC/TRIM PRICE" ? "FABRIC/TRIM PRICE" : key;
        if (originalKey in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE"].includes(originalKey)) {
            newRow[key] = formatCurrency(row[originalKey]);
          } else if (["XFACT DD", "REAL DD", "DATE"].includes(originalKey)) {
            newRow[key] = formatDate(row[originalKey]);
          } else {
            newRow[key] = row[originalKey];
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ExportedData");
    
    const fileName = `High5_${activeTab}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Data Loading
  useEffect(() => {
    setLoading(true);
    setError(null);

    window.jsonpCallback = (fetched) => {
      try {
        setData({
          sales_po: fetched.sales_po || [],
          fabric_po: fetched.fabric_po || [],
          insert_pattern: fetched.insert_pattern || []
        });
      } catch (e) {
        setError("Error Parsing Data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbzLeG4jbwZ5AOCUGuEc-d4o0akKIfw0KOb8qDb8wF3Pp0WXhzkSbmOyTZblV_U5vUMLLw/exec?callback=jsonpCallback`;
    script.async = true;
    script.onerror = () => {
      setError("Failed To Load Data");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      delete window.jsonpCallback;
      document.body.removeChild(script);
    };
  }, []);

  // Filtered Data
  const filteredSales = useMemo(() => {
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    return data.fabric_po
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(fabricFilters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()));
  }, [data.fabric_po, search, fabricFilters]);

  // Loading State
  if (loading) return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-title">
          <FiRefreshCw className="spin" size={24} />
          Loading Production Data
        </div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: ${colors.background};
        }
        .loading-card {
          padding: 2.5rem;
          background: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          text-align: center;
          border: 1px solid ${colors.border};
          max-width: 400px;
          width: 100%;
        }
        .loading-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${colors.primary};
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .loading-bar {
          width: 100%;
          height: 0.375rem;
          background: ${colors.border};
          border-radius: 0.25rem;
          overflow: hidden;
        }
        .loading-progress {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, ${colors.primaryLight}, ${colors.primaryDark});
          animation: loading 1.5s infinite ease-in-out;
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );

  // Error State
  if (error) return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">
          <FiAlertCircle size={32} />
        </div>
        <div className="error-title">Error Loading Data</div>
        <div className="error-message">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="error-button"
        >
          <FiRefreshCw size={16} /> Try Again
        </button>
      </div>
      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: ${colors.background};
        }
        .error-card {
          padding: 2rem;
          text-align: center;
          background: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid ${colors.dangerLight};
          max-width: 400px;
          width: 100%;
        }
        .error-icon {
          color: ${colors.danger};
          margin-bottom: 1rem;
        }
        .error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${colors.danger};
          margin-bottom: 0.75rem;
        }
        .error-message {
          color: ${colors.textMedium};
          margin-bottom: 1.5rem;
        }
        .error-button {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .error-button:hover {
          background-color: ${colors.primaryDark};
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );

  // Main Render
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-icon">
              <FiHome size={24} />
            </div>
            <div>
              <h1>High5 Production Dashboard</h1>
              <p>Real-Time Production Tracking And Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Production Metrics Dashboard */}
        <div className="metrics-grid">
          {/* Metric Cards */}
          {[
            {
              title: "Total Orders",
              value: productionStats.totalOrders,
              subtitle: `${filteredSales.length} Matching Filters`,
              icon: <FiPackage size={20} />,
              color: colors.primary,
              trend: null
            },
            {
              title: "Delivered (30 Days)",
              value: productionStats.deliveredLast30Days,
              subtitle: `${productionStats.deliveredUnitsLast30Days} Units`,
              icon: <FiTruck size={20} />,
              color: colors.success,
              trend: "up"
            },
            {
              title: "Last Delivery Date",
              value: productionStats.lastDeliveryDateFormatted,
              subtitle: "Based On Real DD Date",
              icon: <FiCalendar size={20} />,
              color: colors.secondary,
              trend: null
            },
            {
              title: "In Production",
              value: productionStats.inProduction,
              subtitle: "Currently Being Manufactured",
              icon: <FiClock size={20} />,
              color: colors.accent,
              trend: "neutral"
            },
            {
              title: "Not Delivered",
              value: productionStats.notDelivered,
              subtitle: "Pending Completion",
              icon: <FiAlertCircle size={20} />,
              color: colors.warning,
              trend: "down"
            },
            {
              title: "Fabric Ordered",
              value: productionStats.fabricOrdered,
              subtitle: "Materials Ordered",
              icon: <FiDatabase size={20} />,
              color: colors.info,
              trend: "up"
            }
          ].map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <div>
                  <div className="metric-title">{metric.title}</div>
                  <div className="metric-value">{metric.value}</div>
                </div>
                <div className="metric-icon" style={{ color: metric.color, backgroundColor: `${metric.color}15` }}>
                  {metric.icon}
                </div>
              </div>
              <div className="metric-footer">
                {metric.subtitle}
                {metric.trend && (
                  <span className={`trend-indicator ${metric.trend}`}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form Buttons Row */}
        <div className="form-links-grid">
          {formLinks.map((form, index) => (
            <a
              key={index}
              href={form.url}
              target="_blank"
              rel="noopener noreferrer"
              className="form-link"
            >
              {form.icon}
              {form.label}
              <FiExternalLink size={16} />
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div className="tab-container">
          <div className="tabs">
            {[
              { id: "dashboard", label: "Sales Orders", icon: <FiShoppingBag size={18} /> },
              { id: "fabric", label: "Fabric Orders", icon: <FiGrid size={18} /> }
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
          <div className="tab-divider"></div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" size={18} />
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
                } else {
                  setFabricFilters({
                    TYPE: "",
                    COLOUR: "",
                    SUPPLIER: ""
                  });
                }
                setSearch("");
              }}
              className="secondary-button"
            >
              <FiFilter size={16} />
              Clear Filters
            </button>

            <button
              onClick={exportToExcel}
              className="primary-button"
            >
              <FiDownload size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Sales PO Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters */}
            <div className="filter-grid">
              {Object.keys(filters).map((key) => (
                <div key={key} className="filter-item">
                  <label className="filter-label">
                    {key}
                  </label>
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

            {/* Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { label: "IMAGE", icon: <FiImage size={16} /> },
                      { label: "H-NUMBER" },
                      { label: "PO NUMBER" },
                      { label: "STYLE NUMBER" },
                      { label: "DESCRIPTION" },
                      { label: "COLOUR" },
                      { label: "PRICE", icon: <FiDollarSign size={16} /> },
                      { label: "TOTAL UNITS" },
                      { label: "FIT STATUS" },
                      { label: "CUSTOMER NAME", icon: <FiUsers size={16} /> },
                      { label: "XFACT DD" },
                      { label: "REAL DD" },
                      { label: "LIVE STATUS" },
                      { label: "CMT PRICE", icon: <FiDollarSign size={16} /> },
                      { label: "ACTUAL CMT", icon: <FiDollarSign size={16} /> },
                      { label: "PACKING LIST", icon: <FiFileText size={16} /> },
                      { label: "SIZES" }
                    ].map((header, index) => (
                      <th key={index}>
                        <div className="header-content">
                          {header.icon && <span className="header-icon">{header.icon}</span>}
                          {header.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr className="empty-state">
                      <td colSpan="17">
                        <div className="empty-content">
                          <FiAlertCircle size={32} />
                          <div>No Matching Orders Found</div>
                          <p>Try Adjusting Your Search Or Filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((row, i) => (
                      <tr key={i}>
                        <td className="image-cell">
                          {row.IMAGE ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={getGoogleDriveThumbnail(row.IMAGE)}
                                  alt="Product"
                                  className="product-image"
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="highlight-cell">{row["H-NUMBER"]}</td>
                        <td>{row["PO NUMBER"]}</td>
                        <td>{row["STYLE NUMBER"]}</td>
                        <td>{row["DESCRIPTION"]}</td>
                        <td>
                          <div className="color-cell">
                            {row["COLOUR"] && (
                              <span 
                                className="color-dot" 
                                style={{
                                  backgroundColor: getColorCode(row["COLOUR"])
                                }}
                              ></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td className="highlight-cell">{formatCurrency(row["PRICE"])}</td>
                        <td className="bold-cell">{row["TOTAL UNITS"]}</td>
                        <td>
                          <span className={`status-badge ${row["FIT STATUS"] === "GS SENT" ? 'success' : 'warning'}`}>
                            {row["FIT STATUS"]}
                          </span>
                        </td>
                        <td>{row["CUSTOMER NAME"]}</td>
                        <td className="nowrap">{formatDate(row["XFACT DD"])}</td>
                        <td className="nowrap">{formatDate(row["REAL DD"])}</td>
                        <td>
                          <span className={`status-badge ${
                            row["LIVE STATUS"] === "DELIVERED" ? 'success' : 
                            row["LIVE STATUS"] === "FABRIC ORDERED" ? 'info' : 'warning'
                          }`}>
                            {row["LIVE STATUS"]}
                          </span>
                        </td>
                        <td className="nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                        <td className="nowrap bold-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                        <td>
                          {row["PACKING LIST"] ? (
                            <a
                              href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-button"
                            >
                              Download
                            </a>
                          ) : (
                            <span className="na-text">N/A</span>
                          )}
                        </td>
                        <td className="sizes-cell">{compactSizes(row)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Fabric PO Tab */}
        {activeTab === "fabric" && (
          <>
            {/* Filters */}
            <div className="filter-grid">
              {Object.keys(fabricFilters).map((key) => (
                <div key={key} className="filter-item">
                  <label className="filter-label">
                    {key}
                  </label>
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

            {/* Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { label: "NO." },
                      { label: "DATE" },
                      { label: "H-NUMBER" },
                      { label: "ORDER REF" },
                      { label: "TYPE" },
                      { label: "DESCRIPTION" },
                      { label: "COLOUR" },
                      { label: "TOTAL" },
                      { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={16} /> },
                      { label: "FABRIC PO LINKS" }
                    ].map((header, index) => (
                      <th key={index}>
                        <div className="header-content">
                          {header.icon && <span className="header-icon">{header.icon}</span>}
                          {header.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFabric.length === 0 ? (
                    <tr className="empty-state">
                      <td colSpan="10">
                        <div className="empty-content">
                          <FiAlertCircle size={32} />
                          <div>No Matching Fabric Orders Found</div>
                          <p>Try Adjusting Your Search Or Filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFabric.map((row, i) => (
                      <tr key={i}>
                        <td className="bold-cell">{row["NO."]}</td>
                        <td className="nowrap">{formatDate(row["DATE"])}</td>
                        <td className="highlight-cell">{row["H-NUMBER"]}</td>
                        <td>{row["ORDER REF"]}</td>
                        <td>
                          <span className="type-badge">
                            {row["TYPE"]}
                          </span>
                        </td>
                        <td>{row["DESCRIPTION"]}</td>
                        <td>
                          <div className="color-cell">
                            {row["COLOUR"] && (
                              <span 
                                className="color-dot" 
                                style={{
                                  backgroundColor: getColorCode(row["COLOUR"])
                                }}
                              ></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td className="bold-cell">{row["TOTAL"]}</td>
                        <td className="nowrap bold-cell">{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
                        <td>
                          {row["FABRIC PO LINKS"] ? (
                            <a
                              href={row["FABRIC PO LINKS"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-button"
                            >
                              View PO
                            </a>
                          ) : (
                            <span className="na-text">No Link</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Image Preview */}
      {previewImage.visible && (
        <div 
          className={`image-preview ${previewImage.direction}`}
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
          />
          <div className="preview-arrow"></div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
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

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: ${colors.background};
          color: ${colors.textDark};
          line-height: 1.5;
        }
        
        input, select, button {
          font-family: inherit;
          font-size: inherit;
        }
        
        a {
          text-decoration: none;
          color: inherit;
        }
        
        button {
          cursor: pointer;
        }
        
        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* Modern focus styles */
        *:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        
        /* Smooth transitions */
        a, button, input, select {
          transition: all 0.2s ease;
        }
      `}</style>

      {/* Component styles */}
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: ${colors.background};
          display: flex;
          flex-direction: column;
        }
        
        /* Header styles */
        .app-header {
          background: ${colors.headerBg};
          color: ${colors.headerText};
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .header-content {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .header-title h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .header-title p {
          font-size: 0.8125rem;
          opacity: 0.8;
          margin-top: 0.375rem;
          font-weight: 400;
        }
        
        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(5px);
        }
        
        /* Main content styles */
        .main-content {
          flex: 1;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 2rem 2.5rem;
        }
        
        /* Metrics grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .metric-card {
          background: ${colors.statCardBg};
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid ${colors.statCardBorder};
          transition: all 0.2s;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.08);
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        
        .metric-title {
          font-size: 0.8125rem;
          color: ${colors.textMedium};
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${colors.textDark};
          line-height: 1.2;
        }
        
        .metric-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
        }
        
        .metric-footer {
          font-size: 0.75rem;
          color: ${colors.textMedium};
          padding-top: 0.5rem;
          border-top: 1px solid ${colors.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .trend-indicator {
          font-weight: bold;
          margin-left: 0.5rem;
        }
        
        .trend-indicator.up {
          color: ${colors.success};
        }
        
        .trend-indicator.down {
          color: ${colors.danger};
        }
        
        .trend-indicator.neutral {
          color: ${colors.warning};
        }
        
        /* Form links grid */
        .form-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .form-link {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 1rem;
          border-radius: 0.625rem;
          text-decoration: none;
          font-weight: 600;
          text-align: center;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          box-shadow: 0 4px 12px ${colors.primary}20;
        }
        
        .form-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px ${colors.primary}30;
          background-color: ${colors.primaryDark};
        }
        
        /* Tab styles */
        .tab-container {
          margin-bottom: 1.5rem;
          position: relative;
          border-bottom: 1px solid ${colors.border};
        }
        
        .tabs {
          display: flex;
        }
        
        .tab-button {
          padding: 0.75rem 1.5rem;
          background-color: transparent;
          color: ${colors.inactiveTab};
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          position: relative;
          transition: all 0.2s;
          margin-right: 0.5rem;
          border-radius: 0.5rem 0.5rem 0 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .tab-button:hover {
          color: ${colors.primary};
          background: rgba(0,0,0,0.02);
        }
        
        .tab-button.active {
          color: ${colors.primary};
        }
        
        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: ${colors.primary};
          border-radius: 3px 3px 0 0;
        }
        
        .tab-divider {
          flex: 1;
          border-bottom: 1px solid ${colors.border};
          margin-bottom: -1px;
        }
        
        /* Search and filter styles */
        .search-filter-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .search-box {
          flex: 1;
          position: relative;
          min-width: 300px;
          max-width: 600px;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.textMedium};
        }
        
        .search-input {
          padding: 0.875rem 1.25rem 0.875rem 2.75rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.625rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: all 0.2s;
          background: ${colors.cardBg};
        }
        
        .search-input:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 2px 10px ${colors.primary}15;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }
        
        .primary-button {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 0.625rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px ${colors.primary}30;
        }
        
        .primary-button:hover {
          background-color: ${colors.primaryDark};
          transform: translateY(-1px);
        }
        
        .secondary-button {
          background-color: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 0.75rem 1.25rem;
          border: 1px solid ${colors.border};
          border-radius: 0.625rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .secondary-button:hover {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          border-color: ${colors.primary};
        }
        
        /* Filter grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: ${colors.cardBg};
          padding: 1.25rem;
          border-radius: 0.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid ${colors.border};
        }
        
        .filter-item {
          display: flex;
          flex-direction: column;
        }
        
        .filter-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.textDark};
          font-size: 0.8125rem;
        }
        
        .filter-select {
          padding: 0.75rem 2.5rem 0.75rem 0.875rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.5rem;
          background-color: ${colors.cardBg};
          font-size: 0.875rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          transition: all 0.2s;
        }
        
        .filter-select:hover {
          border-color: ${colors.primary};
        }
        
        .filter-select:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 2px ${colors.primary}15;
        }
        
        /* Table styles */
        .table-container {
          overflow-x: auto;
          border-radius: 0.75rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
          margin-bottom: 2.5rem;
        }
        
        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.875rem;
          min-width: 1200px;
        }
        
        .data-table thead tr {
          background-color: ${colors.headerBg};
          color: ${colors.headerText};
          position: sticky;
          top: 0;
        }
        
        .data-table th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 2px solid ${colors.primary};
          white-space: nowrap;
          position: relative;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .header-icon {
          display: flex;
          align-items: center;
        }
        
        .data-table th::after {
          content: '';
          position: absolute;
          bottom: 0.25rem;
          left: 1rem;
          right: 1rem;
          height: 1px;
          background-color: rgba(255,255,255,0.1);
        }
        
        .data-table tbody tr {
          background-color: ${colors.rowEven};
          transition: all 0.2s;
        }
        
        .data-table tbody tr:nth-child(odd) {
          background-color: ${colors.rowOdd};
        }
        
        .data-table tbody tr:hover {
          background-color: #f5f9ff;
        }
        
        .data-table td {
          padding: 0.75rem 1rem;
          vertical-align: middle;
        }
        
        /* Special cell styles */
        .image-cell {
          width: 120px;
          height: 80px;
          padding: 0.75rem !important;
        }
        
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid ${colors.border};
        }
        
        .product-image:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-style: italic;
          color: ${colors.textMedium};
          background-color: #f5f5f5;
          border-radius: 0.375rem;
          border: 1px dashed ${colors.border};
        }
        
        .highlight-cell {
          font-weight: 600;
          color: ${colors.primary};
        }
        
        .bold-cell {
          font-weight: 600;
        }
        
        .nowrap {
          white-space: nowrap;
        }
        
        .color-cell {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .color-dot {
          display: inline-block;
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
        }
        
        .status-badge {
          padding: 0.375rem 0.625rem;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 0.8125rem;
          display: inline-block;
        }
        
        .status-badge.success {
          background: #e3faf2;
          color: ${colors.success};
        }
        
        .status-badge.warning {
          background: #fff4e6;
          color: ${colors.warning};
        }
        
        .status-badge.info {
          background: #e6f3ff;
          color: ${colors.info};
        }
        
        .type-badge {
          padding: 0.375rem 0.625rem;
          border-radius: 0.375rem;
          background: ${colors.primary}10;
          color: ${colors.primary};
          font-weight: 600;
          font-size: 0.8125rem;
          display: inline-block;
        }
        
        .download-button, .view-button {
          background-color: ${colors.secondary};
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          text-decoration: none;
          display: inline-block;
          min-width: 100px;
          text-align: center;
          font-weight: 600;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }
        
        .download-button:hover, .view-button:hover {
          background-color: #26a899;
          transform: translateY(-1px);
        }
        
        .na-text {
          font-style: italic;
          color: ${colors.textMedium};
        }
        
        .sizes-cell {
          font-size: 0.8125rem;
          color: ${colors.textMedium};
        }
        
        /* Empty state */
        .empty-state td {
          padding: 2.5rem;
          text-align: center;
          color: ${colors.textMedium};
          font-style: italic;
          background-color: ${colors.cardBg};
        }
        
        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .empty-content svg {
          opacity: 0.5;
          margin-bottom: 0.5rem;
        }
        
        .empty-content p {
          font-size: 0.8125rem;
          margin-top: 0.5rem;
          color: ${colors.textMedium};
        }
        
        /* Image preview */
        .image-preview {
          position: fixed;
          z-index: 1000;
          width: 320px;
          height: auto;
          pointer-events: none;
          background-color: ${colors.cardBg};
          padding: 0.9375rem;
          border-radius: 0.75rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transform: translateX(-50%);
          transition: transform 0.1s ease-out;
          border: 1px solid ${colors.border};
        }
        
        .image-preview.below {
          top: 0;
        }
        
        .image-preview.above {
          bottom: 0;
          transform: translateX(-50%) translateY(-100%);
        }
        
        .preview-image {
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          border-radius: 0.375rem;
          border: 1px solid ${colors.border};
        }
        
        .preview-arrow {
          position: absolute;
          width: 1.25rem;
          height: 1.25rem;
          background-color: ${colors.cardBg};
          transform: rotate(45deg);
          border-right: 1px solid ${colors.border};
          z-index: -1;
        }
        
        .image-preview.below .preview-arrow {
          top: -0.625rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: 1px solid ${colors.border};
        }
        
        .image-preview.above .preview-arrow {
          bottom: -0.625rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: 1px solid ${colors.border};
        }
        
        /* Footer styles */
        .app-footer {
          background: ${colors.headerBg};
          color: ${colors.textLight};
          padding: 1rem 0;
          margin-top: auto;
          font-size: 0.8125rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .footer-content {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer-content div:first-child {
          opacity: 0.8;
        }
        
        .footer-content div:last-child {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );

  // Helper function to get color codes
  function getColorCode(color) {
    if (!color) return "#8B5CF6";
    const colorLower = color.toLowerCase();
    if (colorLower.includes("red")) return "#EF4444";
    if (colorLower.includes("blue")) return "#3B82F6";
    if (colorLower.includes("green")) return "#10B981";
    if (colorLower.includes("black")) return "#1F2937";
    if (colorLower.includes("white")) return "#E5E7EB";
    if (colorLower.includes("pink")) return "#EC4899";
    if (colorLower.includes("yellow")) return "#F59E0B";
    if (colorLower.includes("purple")) return "#8B5CF6";
    if (colorLower.includes("gray") || colorLower.includes("grey")) return "#6B7280";
    return "#8B5CF6";
  }
}

export default App;