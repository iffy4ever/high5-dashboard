// src/components/CustomerPage.js
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiAlertCircle, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { useData } from '../useData';
import { getGoogleDriveThumbnail, formatDate, getDateValue, formatCurrency } from '../utils/index';
import '../styles.css';

const CustomerPage = () => {
  const { data, loading, error } = useData();
  const [activeTab, setActiveTab] = useState("developments");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    TYPE: "",
    COLOUR: "",
    "LIVE STATUS": "",
    "FIT STATUS": "",
    "CUSTOMER NAME": "",
    "FIT SAMPLE": ""
  });
  const [previewImage, setPreviewImage] = useState({
    url: null,
    visible: false,
    position: { x: 0, y: 0 },
    direction: 'below'
  });
  const [darkMode, setDarkMode] = useState(false);

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
    textDark: "#1F2937",
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
    accentRgb: "245, 158, 11",
    successRgb: "16, 185, 129",
    warningRgb: "245, 158, 11",
    infoRgb: "59, 130, 246",
    activeTabRgb: "205, 94, 119"
  };

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    return data.insert_pattern
      .filter(row => {
        const customer = (row["CUSTOMER NAME"] || "").toLowerCase();
        return customer === "public desire" || customer === "kaiia";
      })
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const filteredOrders = useMemo(() => {
    if (!data.sales_po) return [];
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters.COLOUR || (row["COLOUR"] || "").toLowerCase() === filters.COLOUR.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const handleMouseEnter = (url, e) => {
    if (!url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearBottom = window.innerHeight - rect.bottom < 250;
    setPreviewImage({
      url: url,
      visible: true,
      position: { x: rect.left + rect.width / 2, y: rect.top + window.scrollY },
      direction: isNearBottom ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading PD & KAIIA Dashboard</h2>
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
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="app-content">
        <header className="app-header no-print">
          <div className="header-left">
            <h1 className="app-title">PD & KAIIA Dashboard</h1>
          </div>
          <div className="header-center">
            <div className="tab-container">
              <div className="tabs">
                {["developments", "orders"].map(tab => (
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
            <button onClick={() => setDarkMode(!darkMode)} className="action-button dark-mode-toggle">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        <div className="main-content">
          <div className="search-box-container">
            <div className="search-box">
              <FiSearch size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                aria-label="Search orders or developments"
              />
            </div>
          </div>

          <div className="filter-container no-print">
            {activeTab === "developments" && (
              <div className="filter-row">
                {[
                  { key: "TYPE", label: "Type", options: [...new Set(data.insert_pattern?.map(row => row["STYLE TYPE"]).filter(Boolean))] },
                  { key: "CUSTOMER NAME", label: "Customer Name", options: ["Public Desire", "Kaiia"] },
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
            {activeTab === "orders" && (
              <div className="filter-row">
                {[
                  { key: "TYPE", label: "Type", options: [...new Set(data.sales_po?.map(row => row["TYPE"]).filter(Boolean))] },
                  { key: "COLOUR", label: "Colour", options: [...new Set(data.sales_po?.map(row => row["COLOUR"]).filter(Boolean))] },
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
          </div>

          {activeTab === "developments" && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>H-NUMBER</th>
                    <th>CUSTOMER NAME</th>
                    <th>STYLE TYPE</th>
                    <th>CUSTOMER CODE</th>
                    <th>FRONT IMAGE</th>
                    <th>BACK IMAGE</th>
                    <th>SIDE IMAGE</th>
                    <th>FIT SAMPLE</th>
                    <th>TOTAL GARMENT PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevelopments.length === 0 ? (
                    <tr className="empty-state">
                      <td colSpan="10">
                        <div className="empty-content">
                          <FiAlertCircle size={28} />
                          <div>No Matching Developments Found</div>
                          <p>Try Adjusting Your Search Or Filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDevelopments.map((row, i) => (
                      <tr key={i}>
                        <td className="nowrap">{formatDate(row["Timestamp"])}</td>
                        <td className="highlight-cell">{row["H-NUMBER"]}</td>
                        <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                        <td>{row["STYLE TYPE"]}</td>
                        <td>{row["CUSTOMER CODE"] || "N/A"}</td>
                        <td className="image-cell">
                          {row["FRONT IMAGE"] ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row["FRONT IMAGE"], e)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View front image">
                                <img
                                  src={getGoogleDriveThumbnail(row["FRONT IMAGE"]) || "/fallback-image.png"}
                                  alt="Front"
                                  className="product-image"
                                  loading="eager"
                                  fetchPriority="high"
                                  onError={(e) => {
                                    console.error("CustomerPage front image failed to load:", {
                                      url: row["FRONT IMAGE"],
                                      message: e.message,
                                      rowData: row
                                    });
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
                              {console.warn("No FRONT IMAGE field in row:", row)}
                            </div>
                          )}
                        </td>
                        <td className="image-cell">
                          {row["BACK IMAGE"] ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row["BACK IMAGE"], e)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View back image">
                                <img
                                  src={getGoogleDriveThumbnail(row["BACK IMAGE"]) || "/fallback-image.png"}
                                  alt="Back"
                                  className="product-image"
                                  loading="eager"
                                  fetchPriority="high"
                                  onError={(e) => {
                                    console.error("CustomerPage back image failed to load:", {
                                      url: row["BACK IMAGE"],
                                      message: e.message,
                                      rowData: row
                                    });
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
                              {console.warn("No BACK IMAGE field in row:", row)}
                            </div>
                          )}
                        </td>
                        <td className="image-cell">
                          {row["SIDE IMAGE"] ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row["SIDE IMAGE"], e)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View side image">
                                <img
                                  src={getGoogleDriveThumbnail(row["SIDE IMAGE"]) || "/fallback-image.png"}
                                  alt="Side"
                                  className="product-image"
                                  loading="eager"
                                  fetchPriority="high"
                                  onError={(e) => {
                                    console.error("CustomerPage side image failed to load:", {
                                      url: row["SIDE IMAGE"],
                                      message: e.message,
                                      rowData: row
                                    });
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
                              {console.warn("No SIDE IMAGE field in row:", row)}
                            </div>
                          )}
                        </td>
                        <td>{row["FIT SAMPLE"] || "N/A"}</td>
                        <td className="price-cell nowrap">{formatCurrency(row["TOTAL GARMENT PRICE"])}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IMAGE</th>
                    <th>FIT STATUS</th>
                    <th>H-NUMBER</th>
                    <th>CUSTOMER NAME</th>
                    <th>PO NUMBER</th>
                    <th>STYLE NUMBER</th>
                    <th>DESCRIPTION</th>
                    <th>TOTAL UNITS</th>
                    <th>XFACT DD</th>
                    <th>REAL DD</th>
                    <th>LIVE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr className="empty-state">
                      <td colSpan="11">
                        <div className="empty-content">
                          <FiAlertCircle size={28} />
                          <div>No Matching Orders Found</div>
                          <p>Try Adjusting Your Search Or Filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((row, i) => (
                      <tr key={i}>
                        <td className="image-cell">
                          {row.IMAGE ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <a href={row.IMAGE} target="_blank" rel="noopener noreferrer" aria-label="View product image">
                                <img
                                  src={getGoogleDriveThumbnail(row.IMAGE) || "/fallback-image.png"}
                                  alt="Product"
                                  className="product-image"
                                  loading="eager"
                                  fetchPriority="high"
                                  onError={(e) => {
                                    console.error("CustomerPage order image failed to load:", {
                                      url: row.IMAGE,
                                      message: e.message,
                                      rowData: row
                                    });
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
                              {console.warn("No IMAGE field in order row:", row)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="status-text" data-status={row["FIT STATUS"]}>{row["FIT STATUS"]}</span>
                        </td>
                        <td className="highlight-cell">{row["H-NUMBER"]}</td>
                        <td>{row["CUSTOMER NAME"]}</td>
                        <td>{row["PO NUMBER"]}</td>
                        <td>{row["STYLE NUMBER"]}</td>
                        <td>{row["DESCRIPTION"]}</td>
                        <td className="bold-cell">{row["TOTAL UNITS"]}</td>
                        <td className="nowrap">{formatDate(row["XFACT DD"])}</td>
                        <td className="nowrap">{formatDate(row["REAL DD"])}</td>
                        <td>
                          <span className="status-text" data-status={row["LIVE STATUS"]}>{row["LIVE STATUS"]}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

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
              />
              <div className="preview-arrow"></div>
            </div>
          )}
        </div>

        <footer className="app-footer no-print">
          <div className="footer-content">
            <div>PD & KAIIA Dashboard © {new Date().getFullYear()}</div>
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
};

CustomerPage.propTypes = {
  data: PropTypes.shape({
    sales_po: PropTypes.arrayOf(PropTypes.object),
    insert_pattern: PropTypes.arrayOf(PropTypes.object)
  })
};

export default CustomerPage;