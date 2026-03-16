import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  PlaneTakeoff, 
  Ticket, 
  Hash, 
  Copy, 
  QrCode,
  AlertCircle
} from 'lucide-react';

declare global {
  interface Window {
    Module: any;
  }
}

const BoardingBarcodeApp: React.FC = () => {
  // Booking Reference (PNR) and Boarding Index are initialized with values
  // Others are empty with placeholders
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [operator, setOperator] = useState('');
  const [flightNum, setFlightNum] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookingRef, setBookingRef] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
  const [seat, setSeat] = useState('');
  const [boardingIndex, setBoardingIndex] = useState(Math.floor(Math.random() * 200 + 1).toString());
  const [cabinClass, setCabinClass] = useState('Y');
  const [codeType, setCodeType] = useState('0'); // 0: Aztec, 1: PDF417
  const [rawData, setRawData] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<any>(null);

  // Helper functions
  const upPadRight = (s: string, n: number) => {
    s = s.toUpperCase();
    while (s.length < n) s += ' ';
    return s.substring(0, n);
  };

  const padLeft = (s: string, n: number) => {
    s = s.toUpperCase();
    while (s.length < n) s = '0' + s;
    return s.substring(0, n);
  };

  const getDayOfYear = (dateStr: string) => {
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay) + 1;
  };

  const updateBarcode = useCallback((text: string) => {
    if (!window.Module || !window.Module.cwrap || !canvasRef.current) return;

    if (!runRef.current) {
      runRef.current = window.Module.cwrap('run', null, ['number', 'string', 'number', 'number']);
    }

    const ecc = 0;
    const ssize = codeType === '0' ? 11 : 6;
    
    runRef.current(parseInt(codeType), text, ecc, ssize);

    const svgContent = (window as any).textOut;
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, [codeType]);

  useEffect(() => {
    setError('');
    
    if (firstName.length + lastName.length > 19) {
      setError('Name is too long (combined max 19 chars)');
    }

    const nameField = upPadRight(`${lastName}/${firstName}`, 20);
    const refField = upPadRight(bookingRef, 7);
    const fromField = upPadRight(from, 3);
    const toField = upPadRight(to, 3);
    const opField = upPadRight(operator, 3);
    const fnField = upPadRight(flightNum, 5);
    const dateField = padLeft(getDayOfYear(date).toString(), 3);
    const seatField = padLeft(seat, 4);
    const seqField = upPadRight(padLeft(boardingIndex, 4), 5);

    const formatted = `M1${nameField}E${refField}${fromField}${toField}${opField}${fnField}${dateField}${cabinClass}${seatField}${seqField}100`;
    
    setRawData(formatted);
    updateBarcode(formatted);
  }, [
    firstName, lastName, from, to, operator, flightNum, 
    date, bookingRef, seat, boardingIndex, cabinClass, 
    updateBarcode
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawData);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus('Copy'), 2000);
  };

  return (
    <div>
      <h1>BoardingBarcode</h1>

      {error && (
        <div className="error-msg">
          <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {error}
        </div>
      )}

      <div className="card">
        <h2><User size={20} /> Passenger</h2>
        <div className="input-grid-2">
          <div className="input-field">
            <label>First Name</label>
            <input type="text" value={firstName} placeholder="JOHN" onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
          </div>
          <div className="input-field">
            <label>Last Name</label>
            <input type="text" value={lastName} placeholder="DOE" onChange={(e) => setLastName(e.target.value.toUpperCase())} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2><PlaneTakeoff size={20} /> Route & Flight</h2>
        <div className="input-grid-2">
          <div className="input-field">
            <label>From</label>
            <input type="text" value={from} placeholder="ZRH" onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="input-field">
            <label>To</label>
            <input type="text" value={to} placeholder="SFO" onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3} />
          </div>
        </div>
        <div className="input-grid-2" style={{ marginTop: '1.25rem' }}>
          <div className="input-field">
            <label>Operator</label>
            <input type="text" value={operator} placeholder="BA" onChange={(e) => setOperator(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="input-field">
            <label>Flight No.</label>
            <input type="text" value={flightNum} placeholder="1234" onChange={(e) => setFlightNum(e.target.value)} maxLength={5} />
          </div>
        </div>
        <div className="input-field" style={{ marginTop: '1.25rem' }}>
          <label>Departure Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h2><Ticket size={20} /> Cabin & Seat</h2>
        <div className="input-grid-2">
          <div className="input-field">
            <label>Class</label>
            <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
              <option value="Y">Economy (Y)</option>
              <option value="C">Business (C)</option>
              <option value="F">First (F)</option>
            </select>
          </div>
          <div className="input-field">
            <label>Seat</label>
            <input type="text" value={seat} placeholder="35A" onChange={(e) => setSeat(e.target.value.toUpperCase())} maxLength={4} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2><Hash size={20} /> Reference & Index</h2>
        <div className="input-grid-2">
          <div className="input-field">
            <label>PNR</label>
            <input type="text" value={bookingRef} onChange={(e) => setBookingRef(e.target.value.toUpperCase())} maxLength={7} />
          </div>
          <div className="input-field">
            <label>Boarding Index</label>
            <input type="text" value={boardingIndex} onChange={(e) => setBoardingIndex(e.target.value)} maxLength={4} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2><QrCode size={20} /> Output</h2>
        <div className="input-field">
          <label>Barcode Type</label>
          <select value={codeType} onChange={(e) => setCodeType(e.target.value)}>
            <option value="0">Aztec (Standard)</option>
            <option value="1">PDF417</option>
          </select>
        </div>
        
        <div className="barcode-result" style={{ marginTop: '1.5rem' }}>
          <canvas ref={canvasRef} />
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Generated Barcode ({codeType === '0' ? 'Aztec' : 'PDF417'})
          </div>
        </div>

        <div className="input-field" style={{ marginTop: '1.5rem' }}>
          <label>Raw IATA String</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={rawData} readOnly style={{ flex: 1, backgroundColor: '#f1f5f9' }} />
            <button className="button" onClick={handleCopy}>
              <Copy size={18} /> {copyStatus}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardingBarcodeApp;
