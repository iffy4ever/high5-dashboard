import React from 'react';
import { FiAlertCircle, FiImage, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import { getColorCode } from '../utils/index';

const DevelopmentsTable = ({
  data,
  filters,
  setFilters,
  colors,
  handleMouseEnter,
  handleMouseLeave,
  getGoogleDriveThumbnail,
  formatCurrency,
  formatDate,
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <>
      <div className="filter-grid">
        {["STYLE TYPE", "CUSTOMER NAME", "FIT SAMPLE"].map((key) => (
          <div key={key} className="filter-item">
            <label className="filter-label">{key === "STYLE TYPE" ? "TYPE" : key}</label>
            <select
              value={filters[key] || ""}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="filter-select"
              aria-label={`Filter by ${key}`}
            >
              <option value="">All {key === "STYLE TYPE" ? "Types" : key}</option>
              {[...new Set(data.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                <option key={i} value={value}>{value}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="table-container">
        <table className="data-table developments-table">
          <thead>
            <tr>
              {[
                { label: "TIMESTAMP" },
                { label: "H-NUMBER" },
                { label: "CUSTOMER NAME" },
                { label: "TYPE" },
                { label: "CUSTOMER CODE" },
                { label: "FRONT IMAGE", icon: <FiImage size={14} /> },
                { label: "BACK IMAGE", icon: <FiImage size={14} /> },
                { label: "SIDE IMAGE", icon: <FiImage size={14} /> },
                { label: "PATTERN IMAGE", icon: <FiImage size={14} /> },
                { label: "FIT SAMPLE" },
                { label: "TOTAL COST", icon: <FiDollarSign size={14} /> },
                { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                { label: "COSTING LINK", icon: <FiExternalLink size={14} /> }
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
            {data.length === 0 ? (
              <tr className="empty-state">
                <td colSpan="13">
                  <div className="empty-content">
                    <FiAlertCircle size={28} />
                    <div>No Matching Patterns Found</div>
                    <p>Try Adjusting Your Search Or Filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
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
                            src={getGoogleDriveThumbnail(row["FRONT IMAGE"])}
                            alt="Front"
                            className="product-image"
                            loading="lazy"
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
                        <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View back image">
                          <img
                            src={getGoogleDriveThumbnail(row["BACK IMAGE"])}
                            alt="Back"
                            className="product-image"
                            loading="lazy"
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
                        <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View side image">
                          <img
                            src={getGoogleDriveThumbnail(row["SIDE IMAGE"])}
                            alt="Side"
                            className="product-image"
                            loading="lazy"
                            onError={(e) => { e.target.src = "/fallback-image.png"; }}
                          />
                        </a>
                      </div>
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td className="image-cell">
                    {row["PATTERN IMAGE"] ? (
                      <div 
                        onMouseEnter={(e) => handleMouseEnter(row["PATTERN IMAGE"], e)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <a href={row["PATTERN IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View pattern image">
                          <img
                            src={getGoogleDriveThumbnail(row["PATTERN IMAGE"])}
                            alt="Pattern"
                            className="product-image"
                            loading="lazy"
                            onError={(e) => { e.target.src = "/fallback-image.png"; }}
                          />
                        </a>
                      </div>
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{row["FIT SAMPLE"] || "N/A"}</td>
                  <td className="price-cell nowrap bold-cell">{formatCurrency(row["TOTAL GARMENT PRICE"])}</td>
                  <td className="price-cell nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                  <td>
                    {row["COSTING LINK"] ? (
                      <a
                        href={row["COSTING LINK"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-button"
                        aria-label="View costing link"
                      >
                        View
                      </a>
                    ) : (
                      <span className="na-text">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span aria-live="polite">{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default DevelopmentsTable;