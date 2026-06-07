'use client';

import React, { useState, useRef } from 'react';
import { Player } from '../data/players';
import { useAuction } from '../context/AuctionContext';

interface CSVUploaderProps {
  onUploadSuccess?: (players: Player[]) => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadSuccess }) => {
  const { importCSVPlayers } = useAuction();
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to split CSV line, handling quotes
  const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const cleanFloat = (val: string): number | undefined => {
    if (!val) return undefined;
    const cleaned = val.replace(/[^\d\.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  };

  const cleanInt = (val: string): number | undefined => {
    if (!val) return undefined;
    const cleaned = val.replace(/[^\d]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  const cleanBasePrice = (val: string): number => {
    if (!val) return 1.0; // default 1 Cr
    const lower = val.toLowerCase().trim();
    const num = parseFloat(lower.replace(/[^\d\.]/g, ''));
    if (isNaN(num)) return 1.0;
    
    if (lower.includes('cr') || lower.includes('crore')) {
      return num;
    } else if (lower.includes('l') || lower.includes('lakh')) {
      return num / 100.0;
    }
    
    if (num > 10) {
      return num / 100.0;
    }
    return num;
  };

  const parseCSVText = (text: string): Player[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or lacks rows.');
    }

    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Check key fields
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'player');
    const roleIdx = headers.findIndex(h => h === 'role' || h === 'category');
    
    if (nameIdx === -1) {
      throw new Error('CSV must contain a "Name" column header.');
    }

    const countryIdx = headers.findIndex(h => h === 'country' || h === 'nationality');
    const matIdx = headers.findIndex(h => h === 'matches' || h === 'mat played' || h === 'matches played' || h === 'mat');
    const runsIdx = headers.findIndex(h => h === 'runs');
    const wicketsIdx = headers.findIndex(h => h === 'wickets');
    const econIdx = headers.findIndex(h => h === 'economy' || h === 'econ');
    const avgIdx = headers.findIndex(h => h === 'avg' || h === 'average' || h === 'batting average');
    const srIdx = headers.findIndex(h => h === 'strike rate' || h === 'strike_rate' || h === 'str rate');
    const priceIdx = headers.findIndex(h => h.includes('price') || h === 'base price');
    const wkIdx = headers.findIndex(h => h.includes('keeper') || h === 'wk');

    const parsedPlayers: Player[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = splitCSVLine(lines[i]);
      if (row.length < 2 || lines[i].replace(/,/g, '').trim().length === 0) continue;

      const name = row[nameIdx];
      if (!name) continue;

      const roleRaw = roleIdx !== -1 ? row[roleIdx].toLowerCase().trim() : 'all_rounder';
      
      // Standardize roles
      let role: Player['role'] = 'all_rounder';
      if (roleRaw.includes('opener')) role = 'opener';
      else if (roleRaw.includes('middle') || roleRaw.includes('order')) role = 'middle_order';
      else if (roleRaw.includes('finisher')) role = 'finisher';
      else if (roleRaw.includes('spinner')) role = 'spinner';
      else if (roleRaw.includes('death')) role = 'death_bowler';
      else if (roleRaw.includes('powerplay')) role = 'powerplay_bowler';

      const country = countryIdx !== -1 ? row[countryIdx].trim() : 'India';
      const overseas = country.toLowerCase() !== 'india';
      
      const matches = matIdx !== -1 ? (cleanInt(row[matIdx]) || 15) : 15;
      const runs = runsIdx !== -1 ? (cleanInt(row[runsIdx]) || 0) : 0;
      const wickets = wicketsIdx !== -1 ? (cleanInt(row[wicketsIdx]) || 0) : 0;
      const economy = econIdx !== -1 ? cleanFloat(row[econIdx]) : undefined;
      const batting_average = avgIdx !== -1 ? cleanFloat(row[avgIdx]) : undefined;
      const strike_rate = srIdx !== -1 ? cleanFloat(row[srIdx]) : undefined;
      
      const base_price = priceIdx !== -1 ? cleanBasePrice(row[priceIdx]) : 1.0;
      
      const wkStr = wkIdx !== -1 ? row[wkIdx].toLowerCase().trim() : '';
      const is_wicketkeeper = wkStr === 'yes' || wkStr === 'y' || wkStr === 'true' || wkStr === 'keeper' || roleRaw.includes('keeper');

      // Calculate rating
      let rating = 75;
      if (role === 'opener' || role === 'middle_order' || role === 'finisher') {
        const avg = batting_average || 25;
        const sr = strike_rate || 120;
        rating = 70 + (avg - 25) * 0.8 + (sr - 120) * 0.2 + (runs / 250);
      } else if (role === 'spinner' || role === 'death_bowler' || role === 'powerplay_bowler') {
        const wpm = wickets / matches;
        const econ = economy || 8.0;
        rating = 72 + wpm * 15 - (econ - 8.0) * 5 + (wickets / 15);
      } else {
        // Allrounder
        const avg = batting_average || 22;
        const sr = strike_rate || 125;
        const wpm = wickets / matches;
        const econ = economy || 8.2;
        
        const bat = 70 + (avg - 22) * 0.8 + (sr - 120) * 0.2 + (runs / 300);
        const bowl = 70 + wpm * 15 - (econ - 8.0) * 5 + (wickets / 20);
        rating = (bat + bowl) / 2;
      }

      rating = Math.min(99, Math.max(65, Math.round(rating)));

      parsedPlayers.push({
        id: `custom_player_${i}`,
        name,
        role,
        batting_style: role === 'spinner' || role === 'death_bowler' || role === 'powerplay_bowler' ? 'Right-hand bat' : 'Right-hand bat',
        bowling_style: role === 'spinner' ? 'Legbreak' : 'Right-arm medium/pace',
        nationality: country,
        overseas,
        base_price,
        rating,
        strike_rate,
        batting_average,
        wickets: wickets || undefined,
        economy,
        is_wicketkeeper,
        status: 'pool'
      });
    }

    if (parsedPlayers.length === 0) {
      throw new Error('No valid player rows found in the CSV.');
    }

    // Sort descending by rating
    return parsedPlayers.sort((a, b) => b.rating - a.rating);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Invalid file type. Please upload a .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const customPlayers = parseCSVText(text);
        importCSVPlayers(customPlayers);
        setError(null);
        if (onUploadSuccess) onUploadSuccess(customPlayers);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Download Sample Template CSV
  const downloadTemplate = () => {
    const templateContent = `Name,Role,Country,Matches,Runs,Wickets,Economy,Average,Strike Rate,Wicket Keeper,Base Price
Virat Kohli,opener,India,280,9203,4,8.8,40.19,134.39,no,2cr
MS Dhoni,finisher,India,278,5439,0,0,38.3,137.46,yes,2cr
Jasprit Bumrah,death_bowler,India,158,70,187,7.34,23.74,19.42,no,2cr
Rashid Khan,spinner,Afghanistan,150,620,174,7.21,14.09,157.36,no,2cr
Hardik Pandya,all_rounder,India,161,2921,82,9.36,27.82,145.69,no,2cr
Travis Head,opener,Australia,51,1513,4,9.2,32.89,169.81,no,2cr
`;
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ipl_player_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* File Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`glass border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
          dragActive
            ? 'border-[#C8A24D] bg-[#F5F0E8]/70 shadow-md'
            : 'border-[rgba(0,0,0,0.10)] hover:border-[rgba(0,0,0,0.18)] bg-white/20 hover:bg-white/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />
        
        <div className="w-12 h-12 rounded-full bg-white/60 border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-xl mb-3 shadow-sm">
          📁
        </div>
        
        <p className="text-sm font-bold text-[#1D1D1F]">
          Drag & drop your Player CSV file here
        </p>
        <p className="text-xs text-[#6E6E73] mt-1.5 font-medium">
          or click to browse local files
        </p>
        
        {error && (
          <div className="mt-4 text-xs font-semibold text-[#FF453A] bg-[#FF453A]/10 px-3 py-1.5 rounded-xl border border-[#FF453A]/20">
            {error}
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#6E6E73] font-semibold">Supports spinners, openers, finishers, all-rounders, etc.</span>
        <button
          onClick={downloadTemplate}
          className="text-[#C8A24D] hover:text-[#B59140] font-bold flex items-center space-x-1 transition cursor-pointer"
        >
          <span>📥 Download Template CSV</span>
        </button>
      </div>
    </div>
  );
};

export default CSVUploader;
