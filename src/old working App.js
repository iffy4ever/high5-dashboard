import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
  FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiUsers, FiCheckCircle,
  FiLayers, FiShoppingBag, FiPrinter
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';

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
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Premium Color Scheme with dark mode support
  const colors = darkMode ? {
    primary: "#60A5FA",
    primaryLight: "#DBEAFE",
    primaryDark: "#2563EB",
    secondary: "#A78BFA",
    secondaryLight: "#EDE9FE",
    secondaryDark: "#7C3AED",
    accent: "#F472B6",
    accentLight: "#FBCFE8",
    accentDark: "#DB2777",
    danger: "#FCA5A5",
    success: "#4ADE80",
    warning: "#FBBF24",
    info: "#38BDF8",
    textDark: "#F3F4F6",
    textMedium: "#9CA3AF",
    textLight: "#111827",
    background: "#1F2937",
    cardBg: "#374151",
    border: "#4B5563",
    rowEven: "#374151",
    rowOdd: "#2D3748",
    headerBg: "linear-gradient(90deg, #2563EB, #7C3AED)",
    headerText: "#F3F4F6",
    activeTab: "#A78BFA",
    inactiveTab: "#6B7280",
    actionButton: "#4ADE80",
    statCardBg: "#374151",
    statCardBorder: "#4B5563",
  } : {
    primary: "#2563EB",
    primaryLight: "#60A5FA",
    primaryDark: "#1E40AF",
    secondary: "#7C3AED",
    secondaryLight: "#A78BFA",
    secondaryDark: "#5B21B6",
    accent: "#DB2777",
    accentLight: "#F472B6",
    accentDark: "#BE185D",
    danger: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#0EA5E9",
    textDark: "#111827",
    textMedium: "#6B7280",
    textLight: "#FFFFFF",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "linear-gradient(90deg, #2563EB, #7C3AED)",
    headerText: "#FFFFFF",
    activeTab: "#7C3AED",
    inactiveTab: "#9CA3AF",
    actionButton: "#22C55E",
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
      label: "Fit Status Form",
      url: "https://forms.gle/5BxFQWWTubZTq21g9",
      icon: <FiCheckCircle size={16} />,
      color: colors.secondary
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={16} />,
      color: colors.accent
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
        
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      }

      if (status === "IN PRODUCTION") {
        stats.inProduction++;
      } else if (status === "FABRIC ORDERED") {
        stats.fabricOrdered++;
      } else if (status !== "DELIVERED") {
        stats.notDelivered++;
      }

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
        : "No Deliveries Yet",
      topCustomers: Object.entries(stats.customerDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }, [data.sales_po]);

  // Utility Functions
  const formatDate = (value) => {
    if (!value) return "";
    try {
      let date;
      if (typeof value === 'number') {
        date = new Date((value - 25569) * 86400 * 1000);
      } else {
        date = new Date(value);
      }

      if (isNaN(date.getTime())) return String(value);

      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(value);
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

  // Generate sample notifications
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
        <header className="top-nav">
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
          <div className="nav-stats">
            {[
              {
                title: "Total Orders",
                value: productionStats.totalOrders,
                icon: <FiShoppingBag size={16} />,
                color: colors.primary,
              },
              {
                title: "Delivered (30d)",
                value: productionStats.deliveredLast30Days,
                icon: <FiTruck size={16} />,
                color: colors.success,
              },
              {
                title: "Units Delivered (30d)",
                value: productionStats.deliveredUnitsLast30Days,
                icon: <FiShoppingBag size={16} />,
                color: colors.success,
              },
              {
                title: "Last Delivery",
                value: productionStats.lastDeliveryDateFormatted,
                icon: <FiCalendar size={16} />,
                color: colors.secondary,
              },
              {
                title: "In Production",
                value: productionStats.inProduction,
                icon: <FiClock size={16} />,
                color: colors.accent,
              },
              {
                title: "Fabric Ordered",
                value: productionStats.fabricOrdered,
                icon: <FiDatabase size={16} />,
                color: colors.info,
              },
              {
                title: "Not Delivered",
                value: productionStats.notDelivered,
                icon: <FiAlertCircle size={16} />,
                color: colors.warning,
              },
              {
                title: "GS Sent",
                value: productionStats.gsSent,
                icon: <FiCheckCircle size={16} />,
                color: colors.success,
              }
            ].map((metric, index) => (
              <div key={index} className="nav-stat-item">
                <div className="nav-stat-icon" style={{ color: metric.color }}>
                  {metric.icon}
                </div>
                <div className="nav-stat-content">
                  <div className="nav-stat-value">{metric.value}</div>
                  <div className="nav-stat-title">{metric.title}</div>
                </div>
                {index < 7 && <div className="nav-stat-divider"></div>}
              </div>
            ))}
          </div>
          <div className="nav-right">
            <button 
              className="notification-button"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              <FiShoppingBag size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <div className="user-menu">
              <div className="user-avatar">A</div>
            </div>
          </div>
        </header>

        {/* Notification Dropdown */}
        {notifications.filter(n => !n.read).length > 0 && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button 
                className="mark-all-read"
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              >
                Mark all as read
              </button>
            </div>
            <div className="notification-list">
              {notifications.slice(0, 3).map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    <FaCircle size={8} />
                  </div>
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

        {/* Dashboard Content */}
        <div className="content-wrapper">
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
                  <div className="form-subtext">Submit</div>
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
                { id: "fabric", label: "Fabric Orders", icon: <FiLayers size={16} /> }
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
                <FiFilter size={14} />
                Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                className="primary-button"
              >
                <FiDownload size={14} />
                Export
              </button>

              <button
                onClick={() => window.print()}
                className="secondary-button"
              >
                <FiPrinter size={14} />
                Print
              </button>
            </div>
          </div>

          {/* Sales PO Tab */}
          {activeTab === "dashboard" && (
            <>
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

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "IMAGE", icon: <FiImage size={14} /> },
                        { label: "H-NUMBER" },
                        { label: "PO NUMBER" },
                        { label: "STYLE NUMBER" },
                        { label: "DESCRIPTION" },
                        { label: "COLOUR" },
                        { label: "PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "TOTAL UNITS" },
                        { label: "FIT STATUS" },
                        { label: "CUSTOMER NAME", icon: <FiUsers size={14} /> },
                        { label: "XFACT DD" },
                        { label: "REAL DD" },
                        { label: "LIVE STATUS" },
                        { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "ACTUAL CMT", icon: <FiDollarSign size={14} /> },
                        { label: "PACKING LIST", icon: <FiFileText size={14} /> },
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
                            <FiAlertCircle size={28} />
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
                        { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={14} /> },
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
                            <FiAlertCircle size={28} />
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
        </div>

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
      </div>

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
          line-height: 1.6;
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
          background: none;
          border: none;
        }
        
        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#2D3748' : '#F3F4F6'};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#6B7280' : '#D1D5DB'};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#9CA3AF' : '#9CA3AF'};
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

        /* Animation */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>

      {/* Component styles */}
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background-color: ${colors.background};
          color: ${colors.textDark};
          display: flex;
          flex-direction: column;
        }

        .app-container.light {
          --shadow-color: rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .app-container.dark {
          --shadow-color: rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        /* Loading Screen */
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: ${colors.background};
        }

        .loading-content {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .spinner {
          margin-bottom: 1rem;
          color: ${colors.primary};
        }

        .loading-content h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .loading-content p {
          color: ${colors.textMedium};
          font-size: 0.875rem;
        }

        /* Error Screen */
        .error-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: ${colors.background};
        }

        .error-content {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .error-icon {
          color: ${colors.danger};
          margin-bottom: 1rem;
        }

        .error-content h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .error-content p {
          color: ${colors.textMedium};
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .retry-button {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background-color: ${colors.primaryDark};
          transform: translateY(-1px);
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Top Navigation */
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: ${colors.headerBg};
          color: ${colors.headerText};
          box-shadow: 0 2px 8px var(--shadow-color);
          position: sticky;
          top: 0;
          z-index: 100;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .top-nav h1 {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${colors.headerText};
          font-size: 0.875rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .toggle-icon {
          font-size: 1rem;
        }

        .nav-stats {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
        }

        .nav-stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .nav-stat-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .nav-stat-icon {
          display: flex;
          align-items: center;
        }

        .nav-stat-content {
          display: flex;
          flex-direction: column;
        }

        .nav-stat-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .nav-stat-title {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .nav-stat-divider {
          width: 1px;
          height: 20px;
          background-color: rgba(255, 255, 255, 0.2);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .notification-button {
          position: relative;
          color: ${colors.headerText};
          transition: all 0.2s;
        }

        .notification-button:hover {
          color: ${colors.primaryLight};
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background-color: ${colors.danger};
          color: white;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 600;
        }

        .user-menu {
          display: flex;
          align-items: center;
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: ${colors.primary};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }

        /* Notification Dropdown */
        .notification-dropdown {
          position: absolute;
          top: 60px;
          right: 2rem;
          width: 280px;
          background-color: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 8px 20px var(--shadow-color);
          z-index: 110;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          border: 1px solid ${colors.border};
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid ${colors.border};
        }

        .notification-header h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .mark-all-read {
          font-size: 0.75rem;
          color: ${colors.primary};
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mark-all-read:hover {
          color: ${colors.primaryDark};
        }

        .notification-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          padding: 0.75rem;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .notification-item.unread {
          background-color: ${colors.primary}05;
        }

        .notification-item:hover {
          background-color: ${colors.primary}10;
        }

        .notification-icon {
          display: flex;
          align-items: flex-start;
          padding-top: 0.25rem;
        }

        .notification-icon svg {
          color: ${colors.primary};
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          font-size: 0.8125rem;
          color: ${colors.textDark};
          margin-bottom: 0.25rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        .notification-footer {
          padding: 0.5rem 0.75rem;
          text-align: center;
          border-top: 1px solid ${colors.border};
        }

        .notification-footer a {
          font-size: 0.75rem;
          color: ${colors.primary};
          transition: all 0.2s;
        }

        .notification-footer a:hover {
          color: ${colors.primaryDark};
        }

        /* Content Wrapper */
        .content-wrapper {
          flex: 1;
          padding: 1.5rem;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          background: ${colors.cardBg};
          border-radius: 1rem;
          box-shadow: 0 4px 16px var(--shadow-color);
          margin-top: 1rem;
          transition: all 0.3s ease;
        }

        /* Form Links Grid */
        .form-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px var(--shadow-color);
        }

        .form-link:hover {
          transform: translateY(-2px);
          box-shadow: var(--hover-shadow);
        }

        .form-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .form-content {
          flex: 1;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .form-subtext {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        /* Tab Container */
        .tab-container {
          margin-bottom: 1.5rem;
          border-bottom: 2px solid ${colors.border};
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
        }

        .tab-button {
          padding: 0.75rem 1.25rem;
          background-color: transparent;
          color: ${colors.inactiveTab};
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          border-radius: 0.5rem 0.5rem 0 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-button:hover {
          color: ${colors.primary};
          background: ${colors.primary}05;
        }

        .tab-button.active {
          color: ${colors.activeTab};
          background: ${colors.activeTab}10;
          border-bottom: 2px solid ${colors.activeTab};
        }

        /* Search and Filter Container */
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
          min-width: 280px;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.textMedium};
        }

        .search-input {
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          background: ${colors.cardBg};
          color: ${colors.textDark};
        }

        .search-input:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .primary-button {
          background-color: ${colors.actionButton};
          color: ${colors.textLight};
          padding: 0.5rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 6px ${colors.actionButton}30;
        }

        .primary-button:hover {
          background-color: ${colors.success};
          transform: translateY(-1px);
        }

        .secondary-button {
          background-color: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 0.5rem 1.25rem;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary-button:hover {
          background-color: ${colors.primary}05;
          color: ${colors.primary};
          border-color: ${colors.primary};
        }

        /* Filter Grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          border: 1px solid ${colors.border};
        }

        .filter-item {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.textDark};
          font-size: 0.8125rem;
        }

        .filter-select {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          border: 1px solid ${colors.border};
          border-radius: 0.5rem;
          background-color: ${colors.cardBg};
          font-size: 0.875rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 0.875rem;
          color: ${colors.textDark};
        }

        .filter-select:hover {
          border-color: ${colors.primary};
        }

        .filter-select:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }

        /* Table Container */
        .table-container {
          overflow-x: auto;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px var(--shadow-color);
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
        }

        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.875rem;
          min-width: 1000px;
        }

        .data-table thead tr {
          background: ${colors.headerBg};
          color: ${colors.headerText};
          position: sticky;
          top: 0;
        }

        .data-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 2px solid ${colors.primary};
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .data-table tbody tr {
          background-color: ${colors.rowEven};
          transition: all 0.2s;
        }

        .data-table tbody tr:nth-child(odd) {
          background-color: ${colors.rowOdd};
        }

        .data-table tbody tr:hover {
          background-color: ${darkMode ? '#2D3748' : '#F0F7FF'};
          transform: translateY(-1px);
        }

        .data-table td {
          padding: 0.75rem 1rem;
          vertical-align: middle;
        }

        /* Special cell styles */
        .image-cell {
          width: 100px;
          height: 60px;
          padding: 0.5rem !important;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid ${colors.border};
        }

        .product-image:hover {
          transform: scale(1.05);
        }

        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-style: italic;
          color: ${colors.textMedium};
          background-color: ${darkMode ? '#374151' : '#F3F4F6'};
          border-radius: 0.5rem;
          border: 1px dashed ${colors.border};
          font-size: 0.75rem;
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
          gap: 0.5rem;
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          display: inline-block;
        }

        .status-badge.success {
          background: ${colors.success}15;
          color: ${colors.success};
        }

        .status-badge.warning {
          background: ${colors.warning}15;
          color: ${colors.warning};
        }

        .status-badge.info {
          background: ${colors.info}15;
          color: ${colors.info};
        }

        .type-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          background: ${colors.primary}15;
          color: ${colors.primary};
          font-weight: 600;
          font-size: 0.75rem;
        }

        .download-button, .view-button {
          background-color: ${colors.secondary};
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          transition: all 0.2s;
        }

        .download-button:hover, .view-button:hover {
          background-color: ${colors.secondaryDark};
          transform: translateY(-1px);
        }

        .na-text {
          font-style: italic;
          color: ${colors.textMedium};
        }

        .sizes-cell {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        /* Empty state */
        .empty-state td {
          padding: 2rem;
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

        .empty-content div {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .empty-content p {
          font-size: 0.875rem;
          color: ${colors.textMedium};
        }

        /* Image preview */
        .image-preview {
          position: fixed;
          z-index: 1000;
          width: 300px;
          background-color: ${colors.cardBg};
          padding: 0.75rem;
          border-radius: 0.75rem;
          box-shadow: 0 8px 20px var(--shadow-color);
          transform: translateX(-50%);
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
          max-height: 360px;
          object-fit: contain;
          border-radius: 0.5rem;
          border: 1px solid ${colors.border};
        }

        .preview-arrow {
          position: absolute;
          width: 1rem;
          height: 1rem;
          background-color: ${colors.cardBg};
          transform: rotate(45deg);
          border-right: 1px solid ${colors.border};
          z-index: -1;
        }

        .image-preview.below .preview-arrow {
          top: -0.5rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: 1px solid ${colors.border};
        }

        .image-preview.above .preview-arrow {
          bottom: -0.5rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: 1px solid ${colors.border};
        }

        /* Footer */
        .app-footer {
          background: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 1rem 1.5rem;
          border-top: 1px solid ${colors.border};
          margin-top: auto;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Responsive adjustments */
        @media (max-width: 1280px) {
          .nav-stats {
            gap: 1rem;
          }
          
          .nav-stat-item {
            flex: 1 1 auto;
          }
        }

        @media (max-width: 1024px) {
          .content-wrapper {
            padding: 1rem;
          }
          
          .form-links-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
          
          .top-nav {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .nav-stats {
            justify-content: flex-start;
            margin: 0.5rem 0;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .nav-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .nav-stat-divider {
            display: none;
          }
          
          .content-wrapper {
            padding: 0.75rem;
          }
          
          .search-filter-container {
            flex-direction: column;
          }
          
          .search-box {
            min-width: 100%;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: flex-end;
          }
        }

        @media (max-width: 480px) {
          .form-link {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
            padding: 0.5rem;
          }
          
          .form-icon {
            margin: 0 auto;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .primary-button, .secondary-button {
            width: 100%;
            justify-content: center;
          }
          
          .nav-stat-item {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </div>
  );

  // Helper function to get color codes
  function getColorCode(color) {
    if (!color) return "#7C3AED";
    const colorLower = color.toLowerCase();
    if (colorLower.includes("red")) return "#EF4444";
    if (colorLower.includes("blue")) return "#3B82F6";
    if (colorLower.includes("green")) return "#22C55E";
    if (colorLower.includes("black")) return "#111827";
    if (colorLower.includes("white")) return "#E5E7EB";
    if (colorLower.includes("pink")) return "#EC4899";
    if (colorLower.includes("yellow")) return "#F59E0B";
    if (colorLower.includes("purple")) return "#7C3AED";
    if (colorLower.includes("gray") || colorLower.includes("grey")) return "#6B7280";
    if (colorLower.includes("navy")) return "#1E40AF";
    if (colorLower.includes("teal")) return "#0D9488";
    if (colorLower.includes("orange")) return "#F97316";
    return "#7C3AED";
  }
}

export default App;