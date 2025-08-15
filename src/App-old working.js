import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
  FiPackage, FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiUsers, FiCheckCircle,
  FiLayers, FiShoppingBag, FiGrid, FiRefreshCw, FiBell
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';
import './App.css';

function App() {
  const [data, setData] = useState({ sales_po: [], fabric_po: [], insert_pattern: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ TYPE: "", COLOUR: "", "LIVE STATUS": "", "FIT STATUS": "" });
  const [fabricFilters, setFabricFilters] = useState({ TYPE: "", COLOUR: "", SUPPLIER: "" });
  const [insertPatternFilters, setInsertPatternFilters] = useState({ TYPE: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewImage, setPreviewImage] = useState({ url: null, visible: false, position: { x: 0, y: 0 }, direction: 'below' });
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const colors = darkMode ? {
    primary: "#4F46E5", primaryDark: "#3730A3", secondary: "#EC4899", secondaryDark: "#DB2777",
    accent: "#F59E0B", danger: "#EF4444", success: "#10B981", warning: "#F59E0B", info: "#3B82F6",
    textDark: "#F3F4F6", textMedium: "#D1D5DB", textLight: "#1F2937",
    background: "#111827", cardBg: "#1F2A44", border: "#374151",
    rowEven: "#1F2A44", rowOdd: "#374151", headerBg: "linear-gradient(90deg, #4F46E5, #7C3AED)",
    headerText: "#F3F4F6", activeTab: "#EC4899", inactiveTab: "#6B7280",
    statCardBg: "#374151", statCardBorder: "#4B5563"
  } : {
    primary: "#4F46E5", primaryDark: "#3730A3", secondary: "#EC4899", secondaryDark: "#DB2777",
    accent: "#F59E0B", danger: "#EF4444", success: "#10B981", warning: "#F59E0B", info: "#3B82F6",
    textDark: "#1F2937", textMedium: "#6B7280", textLight: "#FFFFFF",
    background: "#F9FAFB", cardBg: "#FFFFFF", border: "#E5E7EB",
    rowEven: "#FFFFFF", rowOdd: "#F9FAFB", headerBg: "linear-gradient(90deg, #4F46E5, #7C3AED)",
    headerText: "#FFFFFF", activeTab: "#EC4899", inactiveTab: "#9CA3AF",
    statCardBg: "#F9FAFB", statCardBorder: "#E5E7EB"
  };

  const formLinks = [
    { label: "Development Form", url: "https://forms.gle/hq1pgP4rz1BSjiCc6", icon: <FiFileText size={16} />, color: colors.primary },
    { label: "Fit Status Form", url: "https://forms.gle/5BxFQWWTubZTq21g9", icon: <FiCheckCircle size={16} />, color: colors.secondary },
    { label: "Insert Pattern Form", url: "https://forms.gle/LBQwrpMjJuFzLTsC8", icon: <FiLayers size={16} />, color: colors.accent }
  ];

  const getColorCode = (color) => {
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
    if (colorLower.includes("navy")) return "#1E40AF";
    if (colorLower.includes("teal")) return "#0D9488";
    if (colorLower.includes("orange")) return "#F97316";
    return "#8B5CF6";
  };

  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
    let stats = {
      totalOrders: 0, deliveredLast30Days: 0, deliveredUnitsLast30Days: 0, inProduction: 0,
      fabricOrdered: 0, notDelivered: 0, gsSent: 0, lastDeliveryDate: null
    };

    data.sales_po.forEach(order => {
      const status = String(order["LIVE STATUS"] || "").toUpperCase().trim();
      const totalUnits = parseInt(order["TOTAL UNITS"] || 0);
      
      let deliveryDate = null;
      try {
        if (order["REAL DD"]) {
          deliveryDate = typeof order["REAL DD"] === 'number' 
            ? new Date((order["REAL DD"] - 25569) * 86400 * 1000) 
            : new Date(order["REAL DD"]);
          if (isNaN(deliveryDate.getTime())) deliveryDate = null;
        }
      } catch (e) { deliveryDate = null; }

      stats.totalOrders++;
      if (status === "DELIVERED" && deliveryDate) {
        if (deliveryDate > oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += totalUnits;
        }
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      }
      if (status === "IN PRODUCTION") stats.inProduction++;
      else if (status === "FABRIC ORDERED") stats.fabricOrdered++;
      else if (status !== "DELIVERED") stats.notDelivered++;
      if (String(order["FIT STATUS"] || "").toUpperCase().trim() === "GS SENT") stats.gsSent++;
    });

    return {
      ...stats,
      lastDeliveryDateFormatted: stats.lastDeliveryDate 
        ? stats.lastDeliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : "No Deliveries Yet"
    };
  }, [data.sales_po]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      let date = typeof value === 'number' 
        ? new Date((value - 25569) * 86400 * 1000) 
        : new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(value);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "£0.00";
    const number = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
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

  const handleMouseLeave = () => setPreviewImage(prev => ({ ...prev, visible: false }));

  const exportToExcel = () => {
    let dataToExport, columnOrder, sheetName;
    if (activeTab === "dashboard") {
      dataToExport = filteredSales;
      columnOrder = ["IMAGE", "H-NUMBER", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", "COLOUR", "PRICE", "TOTAL UNITS", "FIT STATUS", "CUSTOMER NAME", "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT", "PACKING LIST", "SIZES"];
      sheetName = "Sales_PO";
    } else if (activeTab === "fabric") {
      dataToExport = filteredFabric;
      columnOrder = ["NO.", "DATE", "H-NUMBER", "ORDER REF", "TYPE", "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"];
      sheetName = "Fabric_PO";
    } else if (activeTab === "insert_pattern") {
      dataToExport = filteredInsertPattern;
      columnOrder = ["H-NUMBER", "TYPE", "CMT PRICE", "PATTERN IMAGE", "FRONT IMAGE", "BACK IMAGE", "SIDE IMAGE", "TOTAL GARMENT PRICE", "COSTING LINK"];
      sheetName = "Insert_Pattern";
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        if (key in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE", "TOTAL GARMENT PRICE"].includes(key)) {
            newRow[key] = formatCurrency(row[key]);
          } else if (["XFACT DD", "REAL DD", "DATE"].includes(key)) {
            newRow[key] = formatDate(row[key]);
          } else if (key === "SIZES") {
            newRow[key] = compactSizes(row);
          } else {
            newRow[key] = row[key];
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `High5_${activeTab}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const generateNotifications = useCallback(() => {
    const statuses = ["DELAYED", "URGENT", "NEW ORDER", "FABRIC RECEIVED"];
    const customers = ["Customer A", "Customer B", "Customer C", "Customer D"];
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      type: statuses[i % statuses.length],
      message: `Order #${1000 + i} from ${customers[i % customers.length]} is ${statuses[i % statuses.length]}`,
      time: new Date(now.getTime() - (i * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.jsonpCallback = (fetched) => {
      try {
        console.log("Fetched data:", fetched);
        setData({
          sales_po: fetched.sales_po || [],
          fabric_po: fetched.fabric_po || [],
          insert_pattern: fetched.insert_pattern || []
        });
        setNotifications(generateNotifications());
      } catch (e) {
        setError("Error Parsing Data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
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
  }, [generateNotifications]);

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

  const filteredInsertPattern = useMemo(() => {
    return data.insert_pattern
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(insertPatternFilters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()));
  }, [data.insert_pattern, search, insertPatternFilters]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"><FiRefreshCw size={32} /></div>
        <h2>Loading Production Dashboard</h2>
        <p>Fetching the latest data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon"><FiAlertCircle size={48} /></div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button" aria-label="Retry loading data">
          <FiRefreshCw size={16} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="main-content">
        <header className="top-nav">
          <div className="nav-left">
            <h1>High5 Production Dashboard</h1>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <span className="toggle-icon">{darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
          <div className="nav-stats">
            {[
              { title: "Total Orders", value: productionStats.totalOrders, icon: <FiShoppingBag size={14} />, color: colors.primary },
              { title: "Delivered (30d)", value: productionStats.deliveredLast30Days, icon: <FiTruck size={14} />, color: colors.success },
              { title: "Units Delivered (30d)", value: productionStats.deliveredUnitsLast30Days, icon: <FiPackage size={14} />, color: colors.success },
              { title: "Last Delivery", value: productionStats.lastDeliveryDateFormatted, icon: <FiCalendar size={14} />, color: colors.secondary },
              { title: "In Production", value: productionStats.inProduction, icon: <FiClock size={14} />, color: colors.accent },
              { title: "Fabric Ordered", value: productionStats.fabricOrdered, icon: <FiDatabase size={14} />, color: colors.info },
              { title: "Not Delivered", value: productionStats.notDelivered, icon: <FiAlertCircle size={14} />, color: colors.warning },
              { title: "GS Sent", value: productionStats.gsSent, icon: <FiCheckCircle size={14} />, color: colors.success }
            ].map((metric, index) => (
              <div key={index} className="nav-stat-item">
                <div className="nav-stat-icon" style={{ backgroundColor: `${metric.color}20`, color: metric.color }}>{metric.icon}</div>
                <div className="nav-stat-content">
                  <div className="nav-stat-value">{metric.value}</div>
                  <div className="nav-stat-title">{metric.title}</div>
                </div>
                {index < 7 && <div className="nav-stat-divider"></div>}
              </div>
            ))}
          </div>
          <div className="nav-right">
            <button className="notification-button" onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              aria-label="View notifications">
              <FiBell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
              )}
            </button>
            <div className="user-menu">
              <div className="user-avatar" aria-label="User profile">A</div>
            </div>
          </div>
        </header>

        {notifications.filter(n => !n.read).length > 0 && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button className="mark-all-read" onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                aria-label="Mark all notifications as read">Mark all as read</button>
            </div>
            <div className="notification-list">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                  <div className="notification-icon"><FaCircle size={8} /></div>
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="notification-footer">
              <a href="/" onClick={(e) => e.preventDefault()}>View all notifications</a>
            </div>
          </div>
        )}

        <div className="content-wrapper">
          <div className="form-links-grid">
            {formLinks.map((form, index) => (
              <a key={index} href={form.url} target="_blank" rel="noopener noreferrer" className="form-link"
                style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}CC)` }}>
                <div className="form-icon">{form.icon}</div>
                <div className="form-content">
                  <div className="form-label">{form.label}</div>
                  <div className="form-subtext">Submit Now</div>
                </div>
                <FiExternalLink size={14} />
              </a>
            ))}
          </div>

          <div className="tab-container">
            <div className="tabs">
              {[
                { id: "dashboard", label: "Sales Orders", icon: <FiShoppingBag size={16} /> },
                { id: "fabric", label: "Fabric Orders", icon: <FiGrid size={16} /> },
                { id: "insert_pattern", label: "Insert Pattern", icon: <FiLayers size={16} /> }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  aria-label={`Switch to ${tab.label} tab`}>{tab.icon} {tab.label}</button>
              ))}
            </div>
          </div>

          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={16} />
              <input placeholder="Search Orders, Styles, Colors..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="search-input" aria-label="Search orders" />
            </div>
            <div className="action-buttons">
              <button onClick={() => {
                if (activeTab === "dashboard") setFilters({ TYPE: "", COLOUR: "", "LIVE STATUS": "", "FIT STATUS": "" });
                else if (activeTab === "fabric") setFabricFilters({ TYPE: "", COLOUR: "", SUPPLIER: "" });
                else if (activeTab === "insert_pattern") setInsertPatternFilters({ TYPE: "" });
                setSearch("");
              }} className="secondary-button" aria-label="Clear filters and search">
                <FiFilter size={14} /> Clear Filters
              </button>
              <button onClick={exportToExcel} className="primary-button" aria-label="Export to Excel">
                <FiDownload size={14} /> Export Excel
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div className="tab-content">
              <div className="filter-grid">
                {Object.keys(filters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="filter-select" aria-label={`Filter by ${key}`}>
                      <option value="">All {key}</option>
                      {[...new Set(data.sales_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "IMAGE", icon: <FiImage size={14} /> }, { label: "H-NUMBER" }, { label: "PO NUMBER" },
                        { label: "STYLE NUMBER" }, { label: "DESCRIPTION" }, { label: "COLOUR" },
                        { label: "PRICE", icon: <FiDollarSign size={14} /> }, { label: "TOTAL UNITS" }, { label: "FIT STATUS" },
                        { label: "CUSTOMER NAME", icon: <FiUsers size={14} /> }, { label: "XFACT DD" }, { label: "REAL DD" },
                        { label: "LIVE STATUS" }, { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "ACTUAL CMT", icon: <FiDollarSign size={14} /> }, { label: "PACKING LIST", icon: <FiFileText size={14} /> },
                        { label: "SIZES" }
                      ].map((header, index) => (
                        <th key={index}><div className="header-content">{header.icon && <span className="header-icon">{header.icon}</span>}{header.label}</div></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="17">
                          <div className="empty-content"><FiAlertCircle size={24} /><div>No Matching Orders Found</div><p>Try Adjusting Your Search Or Filters</p></div>
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((row, i) => (
                        <tr key={i}>
                          <td className="image-cell">
                            {row.IMAGE ? (
                              <div onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)} onMouseLeave={handleMouseLeave}>
                                <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                                  <img src={getGoogleDriveThumbnail(row.IMAGE)} alt="Product" className="product-image" />
                                </a>
                              </div>
                            ) : <div className="no-image">No Image</div>}
                          </td>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td>{row["PO NUMBER"]}</td>
                          <td>{row["STYLE NUMBER"]}</td>
                          <td>{row["DESCRIPTION"]}</td>
                          <td><div className="color-cell">{row["COLOUR"] && <span className="color-dot" style={{ backgroundColor: getColorCode(row["COLOUR"]) }}></span>}{row["COLOUR"]}</div></td>
                          <td className="highlight-cell">{formatCurrency(row["PRICE"])}</td>
                          <td className="bold-cell">{row["TOTAL UNITS"]}</td>
                          <td><span className={`status-badge ${row["FIT STATUS"] === "GS SENT" ? 'success' : 'warning'}`}>{row["FIT STATUS"]}</span></td>
                          <td>{row["CUSTOMER NAME"]}</td>
                          <td className="nowrap">{formatDate(row["XFACT DD"])}</td>
                          <td className="nowrap">{formatDate(row["REAL DD"])}</td>
                          <td><span className={`status-badge ${row["LIVE STATUS"] === "DELIVERED" ? 'success' : row["LIVE STATUS"] === "FABRIC ORDERED" ? 'info' : 'warning'}`}>{row["LIVE STATUS"]}</span></td>
                          <td className="nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td className="nowrap bold-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                          <td>{row["PACKING LIST"] ? <a href={getGoogleDriveDownloadLink(row["PACKING LIST"])} target="_blank" rel="noopener noreferrer" className="download-button">Download</a> : <span className="na-text">N/A</span>}</td>
                          <td className="sizes-cell">{compactSizes(row)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "fabric" && (
            <div className="tab-content">
              <div className="filter-grid">
                {Object.keys(fabricFilters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select value={fabricFilters[key] || ""} onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                      className="filter-select" aria-label={`Filter by ${key}`}>
                      <option value="">All {key}</option>
                      {[...new Set(data.fabric_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "NO." }, { label: "DATE" }, { label: "H-NUMBER" }, { label: "ORDER REF" }, { label: "TYPE" },
                        { label: "DESCRIPTION" }, { label: "COLOUR" }, { label: "TOTAL" }, { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "FABRIC PO LINKS" }
                      ].map((header, index) => (
                        <th key={index}><div className="header-content">{header.icon && <span className="header-icon">{header.icon}</span>}{header.label}</div></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFabric.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="10">
                          <div className="empty-content"><FiAlertCircle size={24} /><div>No Matching Fabric Orders Found</div><p>Try Adjusting Your Search Or Filters</p></div>
                        </td>
                      </tr>
                    ) : (
                      filteredFabric.map((row, i) => (
                        <tr key={i}>
                          <td className="bold-cell">{row["NO."]}</td>
                          <td className="nowrap">{formatDate(row["DATE"])}</td>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td>{row["ORDER REF"]}</td>
                          <td><span className="type-badge">{row["TYPE"]}</span></td>
                          <td>{row["DESCRIPTION"]}</td>
                          <td><div className="color-cell">{row["COLOUR"] && <span className="color-dot" style={{ backgroundColor: getColorCode(row["COLOUR"]) }}></span>}{row["COLOUR"]}</div></td>
                          <td className="bold-cell">{row["TOTAL"]}</td>
                          <td className="nowrap bold-cell">{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
                          <td>{row["FABRIC PO LINKS"] ? <a href={row["FABRIC PO LINKS"]} target="_blank" rel="noopener noreferrer" className="view-button">View PO</a> : <span className="na-text">No Link</span>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "insert_pattern" && (
            <div className="tab-content">
              <div className="filter-grid">
                {Object.keys(insertPatternFilters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key}</label>
                    <select value={insertPatternFilters[key] || ""} onChange={(e) => setInsertPatternFilters({ ...insertPatternFilters, [key]: e.target.value })}
                      className="filter-select" aria-label={`Filter by ${key}`}>
                      <option value="">All {key}</option>
                      {[...new Set(data.insert_pattern.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "H-NUMBER" }, { label: "TYPE" }, { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "PATTERN IMAGE", icon: <FiImage size={14} /> }, { label: "FRONT IMAGE", icon: <FiImage size={14} /> },
                        { label: "BACK IMAGE", icon: <FiImage size={14} /> }, { label: "SIDE IMAGE", icon: <FiImage size={14} /> },
                        { label: "TOTAL GARMENT PRICE", icon: <FiDollarSign size={14} /> }, { label: "COSTING LINK", icon: <FiFileText size={14} /> }
                      ].map((header, index) => (
                        <th key={index}><div className="header-content">{header.icon && <span className="header-icon">{header.icon}</span>}{header.label}</div></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInsertPattern.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="9">
                          <div className="empty-content"><FiAlertCircle size={24} /><div>No Matching Patterns Found</div><p>Try Adjusting Your Search Or Filters</p></div>
                        </td>
                      </tr>
                    ) : (
                      filteredInsertPattern.map((row, i) => (
                        <tr key={i}>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td><span className="type-badge">{row["TYPE"]}</span></td>
                          <td className="bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td>{row["PATTERN IMAGE"] ? (
                            <div onMouseEnter={(e) => handleMouseEnter(row["PATTERN IMAGE"], e)} onMouseLeave={handleMouseLeave}>
                              <a href={row["PATTERN IMAGE"]} target="_blank" rel="noopener noreferrer">
                                <img src={getGoogleDriveThumbnail(row["PATTERN IMAGE"])} alt="Pattern" className="product-image" />
                              </a>
                            </div>
                          ) : <div className="no-image">No Image</div>}</td>
                          <td>{row["FRONT IMAGE"] ? (
                            <div onMouseEnter={(e) => handleMouseEnter(row["FRONT IMAGE"], e)} onMouseLeave={handleMouseLeave}>
                              <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer">
                                <img src={getGoogleDriveThumbnail(row["FRONT IMAGE"])} alt="Front" className="product-image" />
                              </a>
                            </div>
                          ) : <div className="no-image">No Image</div>}</td>
                          <td>{row["BACK IMAGE"] ? (
                            <div onMouseEnter={(e) => handleMouseEnter(row["BACK IMAGE"], e)} onMouseLeave={handleMouseLeave}>
                              <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer">
                                <img src={getGoogleDriveThumbnail(row["BACK IMAGE"])} alt="Back" className="product-image" />
                              </a>
                            </div>
                          ) : <div className="no-image">No Image</div>}</td>
                          <td>{row["SIDE IMAGE"] ? (
                            <div onMouseEnter={(e) => handleMouseEnter(row["SIDE IMAGE"], e)} onMouseLeave={handleMouseLeave}>
                              <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer">
                                <img src={getGoogleDriveThumbnail(row["SIDE IMAGE"])} alt="Side" className="product-image" />
                              </a>
                            </div>
                          ) : <div className="no-image">No Image</div>}</td>
                          <td className="bold-cell">{formatCurrency(row["TOTAL GARMENT PRICE"])}</td>
                          <td>{row["COSTING LINK"] ? <a href={row["COSTING LINK"]} target="_blank" rel="noopener noreferrer" className="view-button">View Costing</a> : <span className="na-text">No Link</span>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {previewImage.visible && (
            <div className={`image-preview ${previewImage.direction}`}
              style={{ left: `${previewImage.position.x}px`, [previewImage.direction === 'below' ? 'top' : 'bottom']: `${previewImage.direction === 'below' ? previewImage.position.y + 20 : window.innerHeight - previewImage.position.y + 20}px` }}>
              <img src={previewImage.url} alt="Preview" className="preview-image" />
              <div className="preview-arrow"></div>
            </div>
          )}

          <footer className="app-footer">
            <div className="footer-content">
              <div>High5 Production Dashboard © {new Date().getFullYear()}</div>
              <div>Last Updated: {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;