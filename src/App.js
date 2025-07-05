import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from 'xlsx';

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

  // Modern Color Scheme
  const colors = {
    primary: "#3a7bd5",
    primaryLight: "#4d8ae8",
    primaryDark: "#2a5fb0",
    secondary: "#00d2ff",
    secondaryLight: "#33dbff",
    secondaryDark: "#00b8e0",
    accent: "#ff7b00",
    accentLight: "#ff9233",
    accentDark: "#e06d00",
    danger: "#ff4757",
    dangerLight: "#ff6b7a",
    dangerDark: "#e03e4d",
    success: "#2ecc71",
    warning: "#f39c12",
    info: "#3498db",
    textDark: "#2c3e50",
    textMedium: "#7f8c8d",
    textLight: "#ecf0f1",
    background: "#f5f7fa",
    cardBg: "#ffffff",
    border: "#dfe6e9",
    rowEven: "#ffffff",
    rowOdd: "#f8fafc",
    headerBg: "#2c3e50",
    headerText: "#ffffff",
    activeTab: "#3a7bd5",
    inactiveTab: "#95a5a6",
    actionButton: "#00b894",
    statCardBg: "#ffffff",
    statCardBorder: "#dfe6e9"
  };

  // Form links
  const formLinks = {
    development: "https://forms.gle/hq1pgP4rz1BSjiCc6",
    fitStatus: "https://forms.gle/5BxFQWWTubZTq21g9",
    insertPattern: "https://forms.gle/LBQwrpMjJuFzLTsC8"
  };

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
        : "No deliveries yet"
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
        setError("Error parsing data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbzLeG4jbwZ5AOCUGuEc-d4o0akKIfw0KOb8qDb8wF3Pp0WXhzkSbmOyTZblV_U5vUMLLw/exec?callback=jsonpCallback`;
    script.async = true;
    script.onerror = () => {
      setError("Failed to load data");
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
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: colors.background
    }}>
      <div style={{
        padding: "40px",
        background: colors.cardBg,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center",
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          fontSize: "24px",
          fontWeight: "600",
          color: colors.primary,
          marginBottom: "20px"
        }}>Loading Production Data</div>
        <div style={{
          width: "200px",
          height: "6px",
          background: colors.border,
          borderRadius: "3px",
          overflow: "hidden",
          margin: "0 auto"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(90deg, ${colors.primaryLight}, ${colors.primaryDark})`,
            animation: "loading 1.5s infinite ease-in-out"
          }}></div>
        </div>
      </div>
    </div>
  );

  // Error State
  if (error) return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: colors.background
    }}>
      <div style={{
        padding: "30px 40px",
        textAlign: "center",
        background: colors.cardBg,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: `1px solid ${colors.dangerLight}`,
        maxWidth: "500px"
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "600",
          color: colors.danger,
          marginBottom: "15px"
        }}>
          Error Loading Data
        </div>
        <div style={{
          color: colors.textMedium,
          marginBottom: "20px"
        }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: colors.primary,
            color: colors.textLight,
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.2s",
            ":hover": {
              backgroundColor: colors.primaryDark,
              transform: "translateY(-1px)"
            }
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Main Render
  return (
    <div style={{ 
      minHeight: "100vh",
      background: colors.background,
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <header style={{
        background: colors.headerBg,
        color: colors.headerText,
        padding: "16px 0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid rgba(255,255,255,0.1)`
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1800px",
          margin: "0 auto",
          padding: "0 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(5px)"
              }}>
                📊
              </span>
              HIGH5 Production Dashboard
            </h1>
            <div style={{
              fontSize: "13px",
              opacity: 0.8,
              marginTop: "6px",
              fontWeight: "400"
            }}>
              Real-time production tracking and management
            </div>
          </div>
          <div style={{
            display: "flex",
            gap: "12px"
          }}>
            <button
              onClick={exportToExcel}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                backdropFilter: "blur(5px)",
                ":hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  transform: "translateY(-1px)"
                }
              }}
            >
              <span>Export to Excel</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "1800px",
        margin: "0 auto",
        padding: "30px 40px"
      }}>
        {/* Production Metrics Dashboard */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "30px"
        }}>
          {/* Metric Cards */}
          {[
            {
              title: "Total Orders",
              value: productionStats.totalOrders,
              subtitle: `${filteredSales.length} matching filters`,
              icon: "📦",
              color: colors.primary
            },
            {
              title: "Delivered (30 Days)",
              value: productionStats.deliveredLast30Days,
              subtitle: `${productionStats.deliveredUnitsLast30Days} units`,
              icon: "🚚",
              color: colors.success
            },
            {
              title: "Last Delivery Date",
              value: productionStats.lastDeliveryDateFormatted,
              subtitle: "Based on REAL DD date",
              icon: "📅",
              color: colors.secondary
            },
            {
              title: "In Production",
              value: productionStats.inProduction,
              subtitle: "Currently being manufactured",
              icon: "🏭",
              color: colors.accent
            },
            {
              title: "Not Delivered",
              value: productionStats.notDelivered,
              subtitle: "Pending completion",
              icon: "⏳",
              color: colors.warning
            },
            {
              title: "Fabric Ordered",
              value: productionStats.fabricOrdered,
              subtitle: "Materials ordered",
              icon: "🧵",
              color: colors.info
            }
          ].map((metric, index) => (
            <div key={index} style={{
              background: colors.statCardBg,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: `1px solid ${colors.statCardBorder}`,
              transition: "all 0.2s",
              ":hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 12px rgba(0,0,0,0.08)"
              }
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", color: colors.textMedium, fontWeight: "500", marginBottom: "8px" }}>
                    {metric.title}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: colors.textDark, lineHeight: "1.2" }}>
                    {metric.value}
                  </div>
                </div>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: `${metric.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: metric.color,
                  fontSize: "18px"
                }}>
                  {metric.icon}
                </div>
              </div>
              <div style={{ 
                fontSize: "12px", 
                color: colors.textMedium, 
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: `1px solid ${colors.border}`
              }}>
                {metric.subtitle}
              </div>
            </div>
          ))}
        </div>

        {/* Form Buttons Row */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "30px"
        }}>
          {Object.entries(formLinks).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: colors.primary,
                color: colors.textLight,
                padding: "16px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                textAlign: "center",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: `0 4px 12px ${colors.primary}20`,
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 16px ${colors.primary}30`,
                  backgroundColor: colors.primaryDark
                }
              }}
            >
              {key.split(/(?=[A-Z])/).join(" ")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          marginBottom: "25px",
          position: "relative",
          borderBottom: `1px solid ${colors.border}`
        }}>
          {["dashboard", "fabric"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 24px",
                backgroundColor: "transparent",
                color: activeTab === tab ? colors.primary : colors.textMedium,
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                position: "relative",
                transition: "all 0.2s",
                marginRight: "8px",
                borderRadius: "8px 8px 0 0",
                ":hover": {
                  color: colors.primary,
                  background: "rgba(0,0,0,0.02)"
                }
              }}
            >
              {tab === "dashboard" ? "Sales Orders" : "Fabric Orders"}
              {activeTab === tab && (
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: colors.primary,
                  borderRadius: "3px 3px 0 0"
                }}></div>
              )}
            </button>
          ))}
          <div style={{ 
            flex: 1, 
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: "-1px"
          }}></div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: "25px",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div style={{
            flex: 1,
            position: "relative",
            minWidth: "300px",
            maxWidth: "600px"
          }}>
            <input
              placeholder="Search orders, styles, colors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 20px 14px 44px",
                width: "100%",
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                fontSize: "14px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
                background: colors.cardBg,
                ":focus": {
                  outline: "none",
                  borderColor: colors.primary,
                  boxShadow: `0 2px 10px ${colors.primary}15`
                }
              }}
            />
            <svg
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.textMedium,
                width: "18px",
                height: "18px"
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
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
            style={{
              backgroundColor: colors.cardBg,
              color: colors.textMedium,
              padding: "12px 20px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              ":hover": {
                backgroundColor: colors.primary,
                color: colors.textLight,
                borderColor: colors.primary
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6l3 6h12l3-6"></path>
              <path d="M3 6h18"></path>
              <path d="M7 12h10"></path>
            </svg>
            Clear Filters
          </button>
        </div>

        {/* Sales PO Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
              background: colors.cardBg,
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: `1px solid ${colors.border}`
            }}>
              {Object.keys(filters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "13px"
                  }}>
                    {key}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                    style={{
                      padding: "12px 40px 12px 14px",
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      backgroundColor: colors.cardBg,
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                      transition: "all 0.2s",
                      ":hover": {
                        borderColor: colors.primary
                      },
                      ":focus": {
                        outline: "none",
                        borderColor: colors.primary,
                        boxShadow: `0 0 0 2px ${colors.primary}15`
                      }
                    }}
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
            <div style={{ 
              overflowX: "auto",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              marginBottom: "40px"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px",
                minWidth: "1200px"
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: colors.headerBg,
                    color: colors.headerText,
                    position: "sticky",
                    top: 0
                  }}>
                    {[
                      "IMAGE", "H-NUMBER", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
                      "COLOUR", "PRICE", "TOTAL UNITS", "FIT STATUS", "CUSTOMER NAME",
                      "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
                      "PACKING LIST", "SIZES"
                    ].map(header => (
                      <th key={header} style={{ 
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        borderBottom: `2px solid ${colors.primary}`,
                        whiteSpace: "nowrap",
                        position: "relative"
                      }}>
                        {header}
                        {header !== "IMAGE" && header !== "PACKING LIST" && (
                          <div style={{
                            position: "absolute",
                            bottom: "4px",
                            left: "16px",
                            right: "16px",
                            height: "1px",
                            backgroundColor: "rgba(255,255,255,0.1)"
                          }}></div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="17" style={{ 
                        padding: "40px", 
                        textAlign: "center",
                        color: colors.textMedium,
                        fontStyle: "italic",
                        backgroundColor: colors.cardBg
                      }}>
                        <div style={{ 
                          marginBottom: "15px",
                          fontSize: "24px",
                          opacity: 0.5
                        }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </div>
                        No matching orders found
                        <div style={{ 
                          fontSize: "13px",
                          marginTop: "10px",
                          color: colors.textMedium
                        }}>
                          Try adjusting your search or filters
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((row, i) => (
                      <tr 
                        key={i} 
                        style={{ 
                          backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd,
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "#f5f9ff"
                          }
                        }}
                      >
                        <td style={{ padding: "12px", width: "120px", height: "80px" }}>
                          {row.IMAGE ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)}
                              onMouseLeave={handleMouseLeave}
                              style={{ width: "100%", height: "100%" }}
                            >
                              <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={getGoogleDriveThumbnail(row.IMAGE)}
                                  alt="Product"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    border: `1px solid ${colors.border}`,
                                    ":hover": {
                                      transform: "scale(1.03)",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontStyle: "italic",
                              color: colors.textMedium,
                              backgroundColor: "#f5f5f5",
                              borderRadius: "6px",
                              border: `1px dashed ${colors.border}`
                            }}>
                              No Image
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {row["H-NUMBER"]}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>{row["PO NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["STYLE NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            {row["COLOUR"] && (
                              <span style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: row["COLOUR"].toLowerCase() === "red" ? "#EF4444" :
                                              row["COLOUR"].toLowerCase() === "blue" ? "#3B82F6" :
                                              row["COLOUR"].toLowerCase() === "green" ? "#10B981" :
                                              row["COLOUR"].toLowerCase() === "black" ? "#1F2937" :
                                              row["COLOUR"].toLowerCase() === "white" ? "#E5E7EB" : "#8B5CF6"
                              }}></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {formatCurrency(row["PRICE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["TOTAL UNITS"]}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: row["FIT STATUS"] === "GS SENT" ? "#e3faf2" : "#fff4e6",
                            color: row["FIT STATUS"] === "GS SENT" ? colors.success : colors.warning,
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["FIT STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{row["CUSTOMER NAME"]}</td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["XFACT DD"])}
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["REAL DD"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: row["LIVE STATUS"] === "DELIVERED" ? "#e3faf2" : 
                                      row["LIVE STATUS"] === "FABRIC ORDERED" ? "#e6f3ff" : "#fff4e6",
                            color: row["LIVE STATUS"] === "DELIVERED" ? colors.success : 
                                 row["LIVE STATUS"] === "FABRIC ORDERED" ? colors.info : colors.warning,
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["LIVE STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["CMT PRICE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["ACTUAL CMT"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["PACKING LIST"] ? (
                            <a
                              href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.secondary,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                display: "inline-block",
                                minWidth: "100px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "13px",
                                transition: "all 0.2s",
                                ":hover": {
                                  backgroundColor: "#26a899",
                                  transform: "translateY(-1px)"
                                }
                              }}
                            >
                              Download
                            </a>
                          ) : (
                            <span style={{ fontStyle: "italic", color: colors.textMedium }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: colors.textMedium }}>
                          {compactSizes(row)}
                        </td>
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
              background: colors.cardBg,
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: `1px solid ${colors.border}`
            }}>
              {Object.keys(fabricFilters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "13px"
                  }}>
                    {key}
                  </label>
                  <select
                    value={fabricFilters[key] || ""}
                    onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                    style={{
                      padding: "12px 40px 12px 14px",
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      backgroundColor: colors.cardBg,
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                      transition: "all 0.2s",
                      ":hover": {
                        borderColor: colors.primary
                      },
                      ":focus": {
                        outline: "none",
                        borderColor: colors.primary,
                        boxShadow: `0 0 0 2px ${colors.primary}15`
                      }
                    }}
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
            <div style={{ 
              overflowX: "auto",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              marginBottom: "40px"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px",
                minWidth: "1000px"
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: colors.headerBg,
                    color: colors.headerText,
                    position: "sticky",
                    top: 0
                  }}>
                    {[
                      "NO.", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
                      "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
                    ].map(header => (
                      <th key={header} style={{ 
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "13px",
                        borderBottom: `2px solid ${colors.primary}`,
                        whiteSpace: "nowrap",
                        position: "relative"
                      }}>
                        {header}
                        <div style={{
                          position: "absolute",
                          bottom: "4px",
                          left: "16px",
                          right: "16px",
                          height: "1px",
                          backgroundColor: "rgba(255,255,255,0.1)"
                        }}></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFabric.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ 
                        padding: "40px", 
                        textAlign: "center",
                        color: colors.textMedium,
                        fontStyle: "italic",
                        backgroundColor: colors.cardBg
                      }}>
                        <div style={{ 
                          marginBottom: "15px",
                          fontSize: "24px",
                          opacity: 0.5
                        }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </div>
                        No matching fabric orders found
                        <div style={{ 
                          fontSize: "13px",
                          marginTop: "10px",
                          color: colors.textMedium
                        }}>
                          Try adjusting your search or filters
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFabric.map((row, i) => (
                      <tr 
                        key={i} 
                        style={{ 
                          backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd,
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "#f5f9ff"
                          }
                        }}
                      >
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["NO."]}</td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["DATE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {row["H-NUMBER"]}
                        </td>
                        <td style={{ padding: "12px" }}>{row["ORDER REF"]}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: `${colors.primary}10`,
                            color: colors.primary,
                            fontWeight: "600",
                            fontSize: "13px",
                            display: "inline-block"
                          }}>
                            {row["TYPE"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            {row["COLOUR"] && (
                              <span style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: row["COLOUR"].toLowerCase() === "red" ? "#EF4444" :
                                              row["COLOUR"].toLowerCase() === "blue" ? "#3B82F6" :
                                              row["COLOUR"].toLowerCase() === "green" ? "#10B981" :
                                              row["COLOUR"].toLowerCase() === "black" ? "#1F2937" :
                                              row["COLOUR"].toLowerCase() === "white" ? "#E5E7EB" : "#8B5CF6"
                              }}></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["TOTAL"]}</td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["FABRIC/TRIM PRICE"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["FABRIC PO LINKS"] ? (
                            <a
                              href={row["FABRIC PO LINKS"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.secondary,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                display: "inline-block",
                                minWidth: "100px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "13px",
                                transition: "all 0.2s",
                                ":hover": {
                                  backgroundColor: "#26a899",
                                  transform: "translateY(-1px)"
                                }
                              }}
                            >
                              View PO
                            </a>
                          ) : (
                            <span style={{ fontStyle: "italic", color: colors.textMedium }}>No Link</span>
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
          style={{
            position: "fixed",
            left: `${previewImage.position.x}px`,
            top: previewImage.direction === 'below' 
              ? `${previewImage.position.y + 20}px` 
              : 'auto',
            bottom: previewImage.direction === 'above' 
              ? `${window.innerHeight - previewImage.position.y + 20}px` 
              : 'auto',
            zIndex: 1000,
            width: "320px",
            height: "auto",
            pointerEvents: "none",
            backgroundColor: colors.cardBg,
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transform: previewImage.direction === 'above' 
              ? 'translateY(-100%)' 
              : 'none',
            transition: "transform 0.1s ease-out",
            border: `1px solid ${colors.border}`
          }}
        >
          <img 
            src={previewImage.url} 
            alt="Preview" 
            style={{ 
              width: "100%",
              height: "auto",
              maxHeight: "400px",
              objectFit: "contain",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`
            }}
          />
          <div style={{
            position: "absolute",
            top: previewImage.direction === 'above' ? "100%" : "-10px",
            left: "20px",
            width: "20px",
            height: "20px",
            backgroundColor: colors.cardBg,
            transform: previewImage.direction === 'above' 
              ? "rotate(-45deg)" 
              : "rotate(45deg)",
            borderRight: `1px solid ${colors.border}`,
            borderBottom: previewImage.direction === 'above' 
              ? `1px solid ${colors.border}` 
              : 'none',
            borderTop: previewImage.direction === 'above' 
              ? 'none' 
              : `1px solid ${colors.border}`,
            borderLeft: previewImage.direction === 'above' 
              ? 'none' 
              : `1px solid ${colors.border}`,
            zIndex: -1
          }}></div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: colors.headerBg,
        color: colors.textLight,
        padding: "16px 0",
        marginTop: "auto",
        fontSize: "13px",
        borderTop: `1px solid rgba(255,255,255,0.1)`
      }}>
        <div style={{ 
          width: "100%",
          maxWidth: "1800px",
          margin: "0 auto",
          padding: "0 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ opacity: 0.8 }}>
            HIGH5 Production Dashboard © {new Date().getFullYear()}
          </div>
          <div style={{ opacity: 0.6 }}>
            Last updated: {new Date().toLocaleString('en-GB', {
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
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: ${colors.background};
        }
        
        input, select, button {
          font-family: inherit;
        }
        
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
    </div>
  );
}

export default App;