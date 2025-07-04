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
  const [loading, setLoading] = useState(false);
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
    primary: "#2b2d42",
    secondary: "#8d99ae",
    accent: "#ef233c",
    accentLight: "#edf2f4",
    accentDark: "#d90429",
    success: "#2ec4b6",
    warning: "#ff9f1c",
    textDark: "#2b2d42",
    textLight: "#edf2f4",
    rowEven: "#ffffff",
    rowOdd: "#f8f9fa",
    headerBg: "#2b2d42",
    headerText: "#ffffff",
    activeTab: "#ef233c",
    inactiveTab: "#8d99ae",
    actionButton: "#2ec4b6"
  };

  // Form links
  const formLinks = {
    development: "https://forms.gle/hq1pgP4rz1BSjiCc6",
    fitStatus: "https://forms.gle/5BxFQWWTubZTq21g9",
    insertPattern: "https://forms.gle/LBQwrpMjJuFzLTsC8"
  };

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString();
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

  const handleMouseMove = (e) => {
    if (previewImage.visible) {
      setPreviewImage(prev => ({
        ...prev,
        position: { x: e.clientX + 20, y: e.clientY + 20 }
      }));
    }
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
      setData({
        sales_po: fetched.sales_po || [],
        fabric_po: fetched.fabric_po || [],
        insert_pattern: fetched.insert_pattern || []
      });
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
      background: colors.accentLight
    }}>
      <div style={{
        padding: "40px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: colors.primary,
          marginBottom: "20px"
        }}>Loading Data</div>
        <div style={{
          width: "100%",
          height: "4px",
          background: "#eee",
          borderRadius: "2px",
          overflow: "hidden"
        }}>
          <div style={{
            width: "70%",
            height: "100%",
            background: colors.accent,
            animation: "loading 1.5s infinite ease-in-out"
          }}></div>
        </div>
      </div>
    </div>
  );

  // Error State
  if (error) return (
    <div style={{
      padding: "40px",
      textAlign: "center",
      background: colors.accentLight,
      color: colors.accentDark,
      fontWeight: "bold",
      fontSize: "18px"
    }}>
      Error: {error}
    </div>
  );

  // Main Render
  return (
    <div style={{ 
      minHeight: "100vh",
      background: colors.accentLight,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.headerBg} 100%)`,
        color: colors.textLight,
        padding: "20px 0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h1 style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "600",
            letterSpacing: "0.5px"
          }}>
            HIGH5 Production Dashboard
          </h1>
          <div style={{
            display: "flex",
            gap: "15px"
          }}>
            <button
              onClick={exportToExcel}
              style={{
                backgroundColor: colors.actionButton,
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 8px rgba(0,0,0,0.1)`
                }
              }}
            >
              <span>Export to Excel</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px 40px"
      }}>
        {/* Form Buttons Row */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {Object.entries(formLinks).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: colors.secondary,
                color: colors.textLight,
                padding: "15px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                textAlign: "center",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                ":hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  backgroundColor: colors.accent
                }
              }}
            >
              {key.split(/(?=[A-Z])/).join(" ")}
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          marginBottom: "25px",
          borderBottom: `1px solid ${colors.secondary}`,
          position: "relative"
        }}>
          {["dashboard", "fabric"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 25px",
                backgroundColor: "transparent",
                color: activeTab === tab ? colors.accent : colors.textDark,
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                position: "relative",
                transition: "all 0.2s",
                ":hover": {
                  color: colors.accent
                }
              }}
            >
              {tab === "dashboard" ? "Sales PO" : "Fabric PO"}
              {activeTab === tab && (
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: colors.accent,
                  borderRadius: "3px 3px 0 0"
                }}></div>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: "25px",
          gap: "20px"
        }}>
          <div style={{
            flex: 1,
            position: "relative",
            maxWidth: "600px"
          }}>
            <input
              placeholder="Search anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 20px 14px 45px",
                width: "100%",
                border: `1px solid ${colors.secondary}`,
                borderRadius: "8px",
                fontSize: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
                ":focus": {
                  outline: "none",
                  borderColor: colors.accent,
                  boxShadow: `0 2px 12px rgba(239, 35, 60, 0.2)`
                }
              }}
            />
            <span style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.secondary
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {/* Sales PO Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}>
              {Object.keys(filters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "14px"
                  }}>{key}</label>
                  <select
                    value={filters[key]}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                    style={{
                      padding: "12px 15px",
                      width: "100%",
                      border: `1px solid ${colors.secondary}`,
                      borderRadius: "6px",
                      backgroundColor: "white",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">All {key}</option>
                    {[...new Set(data.sales_po.map(item => item[key]).filter(Boolean))].map((value, i) => (
                      <option key={i} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ 
              overflowX: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: "white"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px"
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
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: "600",
                        borderBottom: `2px solid ${colors.accent}`
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="17" style={{ 
                        padding: "30px", 
                        textAlign: "center",
                        color: colors.textDark,
                        fontStyle: "italic"
                      }}>
                        No matching records found
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
                            backgroundColor: "#f0f4f8"
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
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    ":hover": {
                                      transform: "scale(1.05)"
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
                              color: colors.secondary,
                              backgroundColor: "#f5f5f5",
                              borderRadius: "4px"
                            }}>
                              No Image
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>{row["H-NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["PO NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["STYLE NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>{row["COLOUR"]}</td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {formatCurrency(row["PRICE"])}
                        </td>
                        <td style={{ padding: "12px" }}>{row["TOTAL UNITS"]}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background: row["FIT STATUS"] === "GS SENT" ? "#e3faf2" : "#fff4e6",
                            color: row["FIT STATUS"] === "GS SENT" ? "#2ec4b6" : "#ff9f1c",
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["FIT STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{row["CUSTOMER NAME"]}</td>
                        <td style={{ padding: "12px" }}>{formatDate(row["XFACT DD"])}</td>
                        <td style={{ padding: "12px" }}>{formatDate(row["REAL DD"])}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background: row["LIVE STATUS"] === "DELIVERED" ? "#e3faf2" : 
                                      row["LIVE STATUS"] === "FABRIC ORDERED" ? "#e6f3ff" : "#fff4e6",
                            color: row["LIVE STATUS"] === "DELIVERED" ? "#2ec4b6" : 
                                 row["LIVE STATUS"] === "FABRIC ORDERED" ? "#3498db" : "#ff9f1c",
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["LIVE STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>
                          {formatCurrency(row["CMT PRICE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>
                          {formatCurrency(row["ACTUAL CMT"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["PACKING LIST"] ? (
                            <a
                              href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.actionButton,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "4px",
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
                            <span style={{ fontStyle: "italic", color: colors.secondary }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px" }}>{compactSizes(row)}</td>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}>
              {Object.keys(fabricFilters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "14px"
                  }}>{key}</label>
                  <select
                    value={fabricFilters[key] || ""}
                    onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                    style={{
                      padding: "12px 15px",
                      width: "100%",
                      border: `1px solid ${colors.secondary}`,
                      borderRadius: "6px",
                      backgroundColor: "white",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">All {key}</option>
                    {[...new Set(data.fabric_po.map(item => item[key]).filter(Boolean))].map((value, i) => (
                      <option key={i} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ 
              overflowX: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: "white"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px"
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
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: "600",
                        borderBottom: `2px solid ${colors.accent}`
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFabric.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ 
                        padding: "30px", 
                        textAlign: "center",
                        color: colors.textDark,
                        fontStyle: "italic"
                      }}>
                        No matching records found
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
                            backgroundColor: "#f0f4f8"
                          }
                        }}
                      >
                        <td style={{ padding: "12px" }}>{row["NO."]}</td>
                        <td style={{ padding: "12px" }}>{formatDate(row["DATE"])}</td>
                        <td style={{ padding: "12px" }}>{row["H-NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["ORDER REF"]}</td>
                        <td style={{ padding: "12px" }}>{row["TYPE"]}</td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>{row["COLOUR"]}</td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["TOTAL"]}</td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>
                          {formatCurrency(row["FABRIC/TRIM PRICE"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["FABRIC PO LINKS"] ? (
                            <a
                              href={row["FABRIC PO LINKS"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.actionButton,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "4px",
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
                            <span style={{ fontStyle: "italic", color: colors.secondary }}>No Link</span>
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
            width: "300px",
            height: "auto",
            pointerEvents: "none",
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transform: previewImage.direction === 'above' 
              ? 'translateY(-100%)' 
              : 'none',
            transition: "transform 0.1s ease-out",
            border: `1px solid ${colors.secondary}`
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
              borderRadius: "6px"
            }}
          />
          <div style={{
            position: "absolute",
            top: "-10px",
            left: "20px",
            width: "20px",
            height: "20px",
            backgroundColor: "white",
            transform: "rotate(45deg)",
            borderTop: `1px solid ${colors.secondary}`,
            borderLeft: `1px solid ${colors.secondary}`,
            zIndex: -1
          }}></div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        background: colors.primary,
        color: colors.textLight,
        padding: "20px 0",
        marginTop: "50px",
        textAlign: "center",
        fontSize: "14px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          HIGH5 Production Dashboard © {new Date().getFullYear()}
        </div>
      </div>

      {/* Add some global styles */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default App;
