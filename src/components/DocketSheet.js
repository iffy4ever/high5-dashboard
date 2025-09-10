import React from 'react';
import { formatDate, getGoogleDriveThumbnail } from '../utils';

const DocketSheet = ({ selectedData }) => {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = selectedData.slice(0, numPOs);

  return (
    <div className="printable-sheet">
      <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#28a745', backgroundColor: '#e0f7fa', padding: '2mm', borderRadius: '4px', marginBottom: '3mm', border: '0.5pt solid #000000' }}>DOCKET SHEET</div>
      <table className="table">
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="red-text">{row["H-NUMBER"] || ""}</td>
              <td colSpan={7}>{row["DESCRIPTION"] || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="delivery-info" style={{ color: '#FF0000' }}>
        Delivery Date: {formatDate(selectedData[0]?.["XFACT DD"] || "")}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', overflow: 'hidden', border: '1px solid #000000' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40mm' }}>
            {i < numPOs && paddedData[i].IMAGE ? <img src={getGoogleDriveThumbnail(paddedData[i].IMAGE)} alt={paddedData[i]["DESCRIPTION"]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '15%' }}>PO Number</th>
            <th style={{ width: '25%' }}>Style #</th>
            <th style={{ width: '20%' }}>Colour</th>
            <th style={{ width: '10%' }}>Department</th>
            <th style={{ width: '10%' }}>Units</th>
            <th style={{ width: '10%' }}>H Number</th>
            <th style={{ width: '10%' }}>Type</th>
            <th style={{ width: '10%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text">{row["PO NUMBER"] || ""}</td>
              <td>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              <td>{row["DEPARTMENT"] || "-"}</td>
              <td>{row["TOTAL UNITS"] || ""}</td>
              <td className="red-text">{row["H-NUMBER"] || ""}</td>
              <td>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={numPOs} className="merged-total" style={{ backgroundColor: '#ffff00', textAlign: 'center', verticalAlign: 'middle' }}>
                  {totalUnits}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table">
        <colgroup>
          <col style={{ width: '10%' }} />
          {paddedData.map((_, i) => (
            <col key={i} style={{ width: `${90 / numPOs}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>SIZES</th>
            {paddedData.map((row, i) => (
              <th key={i}>{row["TYPE"] || ""} {row["PO NUMBER"] || ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["4", "6", "8", "10", "12", "14", "16", "18"].map(size => (
            <tr key={size}>
              <td>UK {size}</td>
              {paddedData.map((row, j) => (
                <td key={j}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <td>TOTAL : -</td>
            {paddedData.map((row, i) => (
              <td key={i}>{row["TOTAL UNITS"] || ""}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="notes-section">
        <tbody>
          <tr>
            <td>NOTES : -</td>
          </tr>
          {Array.from({ length: 1 }).map((_, i) => (
            <tr key={i}>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocketSheet;