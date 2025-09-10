import React from 'react';
import { FiAlertCircle, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import { getColorCode } from '../utils';

const FabricTable = ({
  data,
  fabricFilters,
  setFabricFilters,
  colors,
  handleMouseEnter,
  handleMouseLeave,
  getGoogleDriveThumbnail,
  getMatchingSalesImage,
  formatCurrency,
  formatDate,
  onSort,
  sort,
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
                { label: "SUPPLIER" },
                { label: "ORDER UNITS FABRIC/TRIM COST" },
                { label: "TOTAL", icon: <FiDollarSign size={14} /> },
                { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={14} /> },
                { label: "NOTES" },
                { label: "STATUS" },
                { label: "DELIVERY NOTE NO." },
                { label: "INVOICE NO." },
                { label: "TOTAL ARRIVED" },
                { label: "TOLLERANCE" },
                { label: "FABRIC PO LINKS", icon: <FiExternalLink size={14} />, noSort: true }
              ].map((header, index) => (
                <th 
                  key={index} 
                  onClick={() => !header.noSort && onSort(header.label)}
                  style={{ cursor: header.noSort ? 'default' : 'pointer' }}
                >
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
                <td colSpan="18">
                  <div className="empty-content">
                    <FiAlertCircle size={28} />
                    <div>No Matching Fabric Orders Found</div>
                    <p>Try Adjusting Your Search Or Filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  <td>{row["NO."] || "N/A"}</td>
                  <td className="nowrap">{formatDate(row["DATE"])}</td>
                  <td className="highlight-cell">{row["H-NUMBER"] || "N/A"}</td>
                  <td>{row["ORDER REF"] || "N/A"}</td>
                  <td><span className="type-text">{row["TYPE"] || "N/A"}</span></td>
                  <td>{row["DESCRIPTION"] || "N/A"}</td>
                  <td>
                    <div className="color-cell">
                      {row["COLOUR"] && (
                        <span 
                          className="color-dot" 
                          style={{ backgroundColor: getColorCode(row["COLOUR"]) }}
                        ></span>
                      )}
                      {row["COLOUR"] || "N/A"}
                    </div>
                  </td>
                  <td>{row["SUPPLIER"] || "N/A"}</td>
                  <td>{row["ORDER UNITS FABRIC/TRIM COST"] || "N/A"}</td>
                  <td className="price-cell">{formatCurrency(row["TOTAL"])}</td>
                  <td className="price-cell">{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
                  <td>{row["NOTES"] || "N/A"}</td>
                  <td><span className="status-text" data-status={row["STATUS"]}>{row["STATUS"] || "N/A"}</span></td>
                  <td>{row["DELIVERY NOTE NO."] || "N/A"}</td>
                  <td>{row["INVOICE NO."] || "N/A"}</td>
                  <td>{row["TOTAL ARRIVED"] || "N/A"}</td>
                  <td>{row["TOLLERANCE"] || "N/A"}</td>
                  <td>
                    {row["FABRIC PO LINKS"] ? (
                      <a
                        href={row["FABRIC PO LINKS"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-button"
                        aria-label="View PO"
                      >
                        View PO
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

export default FabricTable;