import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
<<<<<<< HEAD
import { FiSearch, FiAlertCircle, FiShoppingBag, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
=======
import { FiSearch, FiAlertCircle, FiShoppingBag } from 'react-icons/fi';
>>>>>>> 7320c5fb90426341fcc7c87942543f8b88645f75
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

  const filteredDevelopments = useMemo(() => {
    if (!data || !data.insert_pattern) return [];
    return data.insert_pattern
      .filter(row => {
        const customer = (row["CUSTOMER NAME"] || "").toLowerCase();
        return customer === "public desire" || customer === "kaiia";
      })
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .sort((a, b) => {
        const dateA = getDateValue(a["Timestamp"]);
        const dateB = getDateValue(b["Timestamp"]);
        return dateB - dateA; // Sort descending by default
      });
  }, [data, search, filters]);

  const filteredOrders = useMemo(() => {
    if (!data || !data.sales_po) return [];
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters.COLOUR || (row["COLOUR"] || "").toLowerCase() === filters.COLOUR.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .sort((a, b) => {
        const dateA = getDateValue(a["XFACT DD"]);
        const dateB = getDateValue(b["XFACT DD"]);
        return dateB - dateA; // Sort descending by default
      });
  }, [data, search, filters]);

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
      <header className="app-header no-print">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              <FiShoppingBag size={20} />
              PD & KAIIA Dashboard
            </h1>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="theme-toggle"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="search-bar">
            <FiSearch className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by PO, Style, Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
            />
          </div>
          <div className="header-right">
            {/* No stats button as per initial design */}
          </div>
<<<<<<< HEAD
=======

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
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
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
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
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
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
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
                                    e.target.src = "/fallback-image.png";
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="no-image">
                              No Image
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
>>>>>>> 7320c5fb90426341fcc7c87942543f8b88645f75
        </div>
      </header>

      <div className="tabs-container no-print">
        {[
          { id: "developments", label: "Developments", icon: <FiBarChart2 size={16} /> },
          { id: "orders", label: "Orders", icon: <FiShoppingBag size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filters-container no-print">
        <div className="filter-item">
          <label className="filter-label">Customer</label>
          <select
            value={filters["CUSTOMER NAME"]}
            onChange={(e) => setFilters({ ...filters, "CUSTOMER NAME": e.target.value })}
            className="filter-select"
          >
            <option value="">All Customers</option>
            {["Public Desire", "Kaiia"].map(customer => <option key={customer} value={customer.toLowerCase()}>{customer}</option>)}
          </select>
        </div>
        {activeTab === "developments" && (
          <>
            <div className="filter-item">
              <label className="filter-label">Style Type</label>
              <select
                value={filters.TYPE}
                onChange={(e) => setFilters({ ...filters, TYPE: e.target.value })}
                className="filter-select"
              >
                <option value="">All Types</option>
                {data && data.insert_pattern
                  ? [...new Set(data.insert_pattern.map(row => row["STYLE TYPE"]).filter(Boolean))].map(type => <option key={type} value={type}>{type}</option>)
                  : null}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Fit Sample</label>
              <select
                value={filters["FIT SAMPLE"]}
                onChange={(e) => setFilters({ ...filters, "FIT SAMPLE": e.target.value })}
                className="filter-select"
              >
                <option value="">All</option>
                {data && data.insert_pattern
                  ? [...new Set(data.insert_pattern.map(row => row["FIT SAMPLE"]).filter(Boolean))].map(sample => <option key={sample} value={sample}>{sample}</option>)
                  : null}
              </select>
            </div>
          </>
        )}
        {activeTab === "orders" && (
          <>
            <div className="filter-item">
              <label className="filter-label">Type</label>
              <select
                value={filters.TYPE}
                onChange={(e) => setFilters({ ...filters, TYPE: e.target.value })}
                className="filter-select"
              >
                <option value="">All Types</option>
                {data && data.sales_po
                  ? [...new Set(data.sales_po.map(row => row.TYPE).filter(Boolean))].map(type => <option key={type} value={type}>{type}</option>)
                  : null}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Colour</label>
              <select
                value={filters.COLOUR}
                onChange={(e) => setFilters({ ...filters, COLOUR: e.target.value })}
                className="filter-select"
              >
                <option value="">All Colours</option>
                {data && data.sales_po
                  ? [...new Set(data.sales_po.map(row => row.COLOUR).filter(Boolean))].map(colour => <option key={colour} value={colour}>{colour}</option>)
                  : null}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Live Status</label>
              <select
                value={filters["LIVE STATUS"]}
                onChange={(e) => setFilters({ ...filters, "LIVE STATUS": e.target.value })}
                className="filter-select"
              >
                <option value="">All Status</option>
                {data && data.sales_po
                  ? [...new Set(data.sales_po.map(row => row["LIVE STATUS"]).filter(Boolean))].map(status => <option key={status} value={status}>{status}</option>)
                  : null}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Fit Status</label>
              <select
                value={filters["FIT STATUS"]}
                onChange={(e) => setFilters({ ...filters, "FIT STATUS": e.target.value })}
                className="filter-select"
              >
                <option value="">All Status</option>
                {data && data.sales_po
                  ? [...new Set(data.sales_po.map(row => row["FIT STATUS"]).filter(Boolean))].map(status => <option key={status} value={status}>{status}</option>)
                  : null}
              </select>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                  <th>CMT PRICE <FiDollarSign size={14} /></th>
                  <th>TOTAL GARMENT PRICE <FiDollarSign size={14} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopments.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="11">
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
                      <td>{row["Timestamp"] ? formatDate(row["Timestamp"]) : "N/A"}</td>
                      <td>{row["H-NUMBER"] || "N/A"}</td>
                      <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                      <td>{row["STYLE TYPE"] || "N/A"}</td>
                      <td>{row["CUSTOMER CODE"] || "N/A"}</td>
                      <td className="image-cell">
                        {row["FRONT IMAGE"] ? (
                          <div 
                            onMouseEnter={(e) => handleMouseEnter(row["FRONT IMAGE"], e)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getGoogleDriveThumbnail(row["FRONT IMAGE"]) || "/fallback-image.png"}
                                alt="Front"
                                className="product-image"
                                loading="eager"
                                fetchPriority="high"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td className="image-cell">
                        {row["BACK IMAGE"] ? (
                          <div 
                            onMouseEnter={(e) => handleMouseEnter(row["BACK IMAGE"], e)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getGoogleDriveThumbnail(row["BACK IMAGE"]) || "/fallback-image.png"}
                                alt="Back"
                                className="product-image"
                                loading="eager"
                                fetchPriority="high"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td className="image-cell">
                        {row["SIDE IMAGE"] ? (
                          <div 
                            onMouseEnter={(e) => handleMouseEnter(row["SIDE IMAGE"], e)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getGoogleDriveThumbnail(row["SIDE IMAGE"]) || "/fallback-image.png"}
                                alt="Side"
                                className="product-image"
                                loading="eager"
                                fetchPriority="high"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td>{row["FIT SAMPLE"] || "N/A"}</td>
                      <td className="price-cell">{row["CMT PRICE"] ? formatCurrency(row["CMT PRICE"]) : "N/A"}</td>
                      <td className="price-cell">{row["TOTAL GARMENT PRICE"] ? formatCurrency(row["TOTAL GARMENT PRICE"]) : "N/A"}</td>
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
                            <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getGoogleDriveThumbnail(row.IMAGE) || "/fallback-image.png"}
                                alt="Product"
                                className="product-image"
                                loading="eager"
                                fetchPriority="high"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td>{row["FIT STATUS"] || "N/A"}</td>
                      <td>{row["H-NUMBER"] || "N/A"}</td>
                      <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                      <td>{row["PO NUMBER"] || "N/A"}</td>
                      <td>{row["STYLE NUMBER"] || "N/A"}</td>
                      <td>{row["DESCRIPTION"] || "N/A"}</td>
                      <td>{row["TOTAL UNITS"] || "N/A"}</td>
                      <td>{row["XFACT DD"] ? formatDate(row["XFACT DD"]) : "N/A"}</td>
                      <td>{row["REAL DD"] ? formatDate(row["REAL DD"]) : "N/A"}</td>
                      <td>{row["LIVE STATUS"] || "N/A"}</td>
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
  );
};

CustomerPage.propTypes = {
  data: PropTypes.shape({
    sales_po: PropTypes.arrayOf(PropTypes.object),
    insert_pattern: PropTypes.arrayOf(PropTypes.object)
  })
};

export default CustomerPage;