// src/components/CuttingSheet.js
import React from 'react';
import { formatDate, getGoogleDriveThumbnail } from '../utils';

const CuttingSheet = ({ selectedData }) => {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = selectedData.slice(0, numPOs);
  const sizes = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26"];
  const totalBySize = sizes.reduce((acc, size) => {
    acc[size] = selectedData.reduce((sum, row) => sum + parseInt(row[size] || 0), 0);
    return acc;
  }, {});

  return (
    <div className="printable-sheet">
      <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#dc3545', backgroundColor: '#ffebee', padding: '2mm', borderRadius: '4px', marginBottom: '3mm' }}>CUTTING SHEET</div>

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
        <tbody>
          <tr>
            <th>Fabric Name 1:</th>
            <th>Fabric Name 2:</th>
            <th>Fabric Name 3:</th>
            <th>Binding details</th>
          </tr>
          <tr>
            <td style={{ height: '20mm' }}></td>
            <td style={{ height: '20mm' }}></td>
            <td style={{ height: '20mm' }}></td>
            <td style={{ height: '20mm' }}></td>
          </tr>
          <tr>
            <td>Width:</td>
            <td>Width:</td>
            <td>Width:</td>
            <td></td>
          </tr>
        </tbody>
      </table>

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
          <col style={{ width: '15%' }} />
          {sizes.map((_, i) => (
            <col key={i} style={{ width: '5%' }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Colour</th>
            {sizes.map(size => <th key={size} style={{ textAlign: 'center' }}>{size}</th>)}
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text" style={{ fontSize: '10pt', textAlign: 'left' }}>{row["PO NUMBER"] || ""}</td>
              <td className="main-data" style={{ fontSize: '10pt', textAlign: 'left' }}>{row["COLOUR"] || ""}</td>
              {sizes.map(size => (
                <td key={size} style={{ fontSize: '10pt', textAlign: 'center', verticalAlign: 'middle' }}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={2} style={{ fontSize: '10pt', textAlign: 'center', verticalAlign: 'middle' }}>Total:</td>
            {sizes.map(size => (
              <td key={size} style={{ fontSize: '10pt', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>{totalBySize[size]}</td>
            ))}
          </tr>
        </tbody>
      </table>
      
      <table className="table">
        <tbody>
          <tr>
            <td style={{ fontSize: '10pt', textAlign: 'center', verticalAlign: 'middle', height: '10mm' }}>RATIO:</td>
          </tr>
          <tr>
            <td style={{ height: '10mm' }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CuttingSheet;