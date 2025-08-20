import React from 'react';
import { FiAlertCircle, FiImage, FiUsers, FiDollarSign, FiFileText } from 'react-icons/fi';
import { getColorCode } from '../utils';

const SalesTable = ({
  data,
  colors,
  handleMouseEnter,
  handleMouseLeave,
  getGoogleDriveThumbnail,
  getGoogleDriveDownloadLink,
  formatCurrency,
  formatDate,
  compactSizes,
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {[
              { label: "IMAGE", icon: <FiImage size={14} /> },
              { label: "FIT STATUS" },
              { label: "H-NUMBER" },
              { label: "CUSTOMER NAME", icon: <FiUsers size={14} /> },
              { label: "PO NUMBER" },
              { label: "STYLE NUMBER" },
              { label: "DESCRIPTION" },
              { label: "COLOUR" },
              { label: "PRICE", icon: <FiDollarSign size={14} /> },
              { label: "TOTAL UNITS" },
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
          {(!paginatedData || paginatedData.length === 0) ? (
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
            paginatedData.map((row, i) => (
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Image failed to load:", row.IMAGE); }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${row["FIT STATUS"] === "GS SENT" ? 'success' : 'warning'}`}>
                    {row["FIT STATUS"]}
                  </span>
                </td>
                <td className="highlight-cell">{row["H-NUMBER"]}</td>
                <td>{row["CUSTOMER NAME"]}</td>
                <td>{row["PO NUMBER"]}</td>
                <td>{row["STYLE NUMBER"]}</td>
                <td>{row["DESCRIPTION"]}</td>
                <td>
                  <div className="color-cell">
                    {row["COLOUR"] && (
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: getColorCode(row["COLOUR"]) }}
                      ></span>
                    )}
                    {row["COLOUR"]}
                  </div>
                </td>
                <td className="price-cell">{formatCurrency(row["PRICE"])}</td>
                <td className="bold-cell">{row["TOTAL UNITS"]}</td>
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
                <td className="price-cell nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                <td className="price-cell nowrap bold-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                <td>
                  {row["PACKING LIST"] ? (
                    <a
                      href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-button"
                    >
                      View PL
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

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span>{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesTable;