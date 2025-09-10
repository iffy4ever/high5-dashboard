import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiAlertCircle, FiShoppingBag } from 'react-icons/fi';
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
      <div className="app-content">
        <header className="app-header no-print">
          <div className="header-content">
            <h1>PD & KAIIA Dashboard</h1>
            <div className="header-actions">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="action-button"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </header>

        <div className="tabs no-print">
          <button
            className={`tab-button ${activeTab === "developments" ? "active" : ""}`}
            onClick={() => setActiveTab("developments")}
            style={{ backgroundColor: activeTab === "developments" ? colors.activeTab : colors.inactiveTab }}
            aria-label="View developments"
          >
            Developments
          </button>
          <button
            className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
            style={{ backgroundColor: activeTab === "orders" ? colors.activeTab : colors.inactiveTab }}
            aria-label="View orders"
          >
            Orders
          </button>
        </div>

        <div className="filter-container no-print">
          <div className="search-bar">
            <FiSearch size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="search-input"
              aria-label="Search developments or orders"
            />
          </div>
          {activeTab === "developments" && (
            <div className="filters">
              {[
                { 
                  key: "TYPE", 
                  label: "Type", 
                  options: [...new Set((data.insert_pattern ?? []).map(row => row["STYLE TYPE"]).filter(Boolean))] 
                },
                { 
                  key: "CUSTOMER NAME", 
                  label: "Customer", 
                  options: [...new Set((data.insert_pattern ?? []).map(row => row["CUSTOMER NAME"]).filter(Boolean))] 
                },
                { 
                  key: "FIT SAMPLE", 
                  label: "Fit Sample", 
                  options: [...new Set((data.insert_pattern ?? []).map(row => row["FIT SAMPLE"]).filter(Boolean))] 
                }
              ].map(filter => (
                <div key={filter.key} className="filter-item">
                  <select
                    value={filters[filter.key]}
                    onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                    className="filter-select"
                    aria-label={`Filter by ${filter.label}`}
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          {activeTab === "orders" && (
            <div className="filters">
              {[
                { 
                  key: "TYPE", 
                  label: "Type", 
                  options: [...new Set((data.sales_po ?? []).map(row => row.TYPE).filter(Boolean))] 
                },
                { 
                  key: "COLOUR", 
                  label: "Colour", 
                  options: [...new Set((data.sales_po ?? []).map(row => row.COLOUR).filter(Boolean))] 
                },
                { 
                  key: "LIVE STATUS", 
                  label: "Live Status", 
                  options: [...new Set((data.sales_po ?? []).map(row => row["LIVE STATUS"]).filter(Boolean))] 
                },
                { 
                  key: "FIT STATUS", 
                  label: "Fit Status", 
                  options: [...new Set((data.sales_po ?? []).map(row => row["FIT STATUS"]).filter(Boolean))] 
                }
              ].map(filter => (
                <div key={filter.key} className="filter-item">
                  <select
                    value={filters[filter.key]}
                    onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                    className="filter-select"
                    aria-label={`Filter by ${filter.label}`}
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="content">
          {activeTab === "developments" && (
            <div className="table-container">
              <DevelopmentsTable
                data={filteredDevelopments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
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
          {activeTab === "orders" && (
            <div className="table-container">
              <SalesTable
                data={filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
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
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
              />
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