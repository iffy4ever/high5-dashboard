import React from 'react';
import { FiAlertCircle, FiImage, FiUsers, FiDollarSign, FiFileText, FiExternalLink } from 'react-icons/fi';
import { getColorCode } from '../utils';

const SalesTable = ({
  data,
  colors,
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

  return (
    <>
      <div className="table-container">
        <table className="data-table">
          <colgroup>
            <col /> {/* IMAGE - Auto width */}
            <col /> {/* FIT STATUS - Auto width */}
            <col /> {/* H-NUMBER - Auto width */}
            <col /> {/* CUSTOMER NAME - Auto width */}
            <col /> {/* PO NUMBER - Auto width */}
            <col /> {/* STYLE NUMBER - Auto width */}
            <col /> {/* DESCRIPTION - Auto width */}
            <col /> {/* COLOUR - Auto width */}
            <col /> {/* PRICE - Auto width */}
            <col /> {/* TOTAL UNITS - Auto width */}
            <col /> {/* XFACT DD - Auto width */}
            <col /> {/* REAL DD - Auto width */}
            <col /> {/* LIVE STATUS - Auto width */}
            <col /> {/* CMT PRICE - Auto width */}
            <col /> {/* ACTUAL CMT - Auto width */}
            <col /> {/* PACKING LIST - Auto width */}
            <col style={{ width: '150px' }} /> {/* SIZES - Fixed width */}
          </colgroup>
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
            {data.length === 0 ? (
              <tr className="empty-state">
                <td colSpan="17">
                  <div className="empty-content">
                    <FiAlertCircle size={28} />
                    <div>No Matching Sales Found</div>
                    <p>Try Adjusting Your Search Or Filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  <td className="image-cell">
                    {row.IMAGE ? (
                      <a href={getGoogleDriveDownloadLink(row.IMAGE)} target="_blank" rel="noopener noreferrer" aria-label="View image">
                        <img
                          src={getGoogleDriveThumbnail(row.IMAGE)}
                          alt={row["DESCRIPTION"]}
                          className="product-image"
                          loading="eager"
                          onError={(e) => {
                            console.error("SalesTable image failed to load:", {
                              url: row.IMAGE,
                              message: e.message,
                              rowData: row
                            });
                            e.target.src = "/fallback-image.png";
                          }}
                        />
                      </a>
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td><span className="status-text" data-status={row["FIT STATUS"]}>{row["FIT STATUS"] || "N/A"}</span></td>
                  <td className="highlight-cell">{row["H-NUMBER"] || "N/A"}</td>
                  <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                  <td>{row["PO NUMBER"] || "N/A"}</td>
                  <td>{row["STYLE NUMBER"] || "N/A"}</td>
                  <td>{row["DESCRIPTION"] || "N/A"}</td>
                  <td className="color-cell">
                    <span className="color-dot" style={{ backgroundColor: getColorCode(row["COLOUR"]) }}></span>
                    {row["COLOUR"] || "N/A"}
                  </td>
                  <td className="price-cell">{formatCurrency(row["PRICE"])}</td>
                  <td className="bold-cell">{row["TOTAL UNITS"] || "N/A"}</td>
                  <td className="nowrap">{formatDate(row["XFACT DD"])}</td>
                  <td className="nowrap">{formatDate(row["REAL DD"])}</td>
                  <td><span className="status-text" data-status={row["LIVE STATUS"]}>{row["LIVE STATUS"] || "N/A"}</span></td>
                  <td className="price-cell">{formatCurrency(row["CMT PRICE"])}</td>
                  <td className="price-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                  <td>
                    {row["PACKING LIST"] ? (
                      <a
                        href={row["PACKING LIST"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-button"
                        aria-label="View packing list"
                      >
                        <FiExternalLink size={12} /> View
                      </a>
                    ) : (
                      <span className="na-text">N/A</span>
                    )}
                  </td>
                  <td className="sizes-cell">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        4 - {row["4"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        12 - {row["12"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        6 - {row["6"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        14 - {row["14"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        8 - {row["8"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        16 - {row["16"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        10 - {row["10"] || "0"}
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px', border: '1px solid #ddd', borderRadius: '3px' }}>
                        18 - {row["18"] || "0"}
                      </div>
                    </div>
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

export default SalesTable;