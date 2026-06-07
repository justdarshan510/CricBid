'use client';

import React, { useState, useMemo } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { PlayerCard } from '../../components/PlayerCard';
import { CSVUploader } from '../../components/CSVUploader';
import { Player } from '../../data/players';

export default function PlayerAnalyticsPage() {
  const localAuction = useAuction();
  const multiplayer = useMultiplayer();

  const isMultiplayerActive = !!multiplayer.roomCode;
  const { players, teams } = isMultiplayerActive ? multiplayer : localAuction;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedNationality, setSelectedNationality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploader, setShowUploader] = useState(false);
  const [csvUploadedMsg, setCsvUploadedMsg] = useState<string | null>(null);

  const itemsPerPage = 12;

  // Filtered and sorted players
  const processedPlayers = useMemo(() => {
    let result = [...players];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Filter by Role
    if (selectedRole !== 'all') {
      result = result.filter((p) => p.role === selectedRole);
    }

    // Filter by Nationality
    if (selectedNationality !== 'all') {
      const isOverseas = selectedNationality === 'overseas';
      result = result.filter((p) => p.overseas === isOverseas);
    }

    // Filter by Status
    if (selectedStatus !== 'all') {
      result = result.filter((p) => p.status === selectedStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'rating-asc') return a.rating - b.rating;
      if (sortBy === 'price-desc') return b.base_price - a.base_price;
      if (sortBy === 'price-asc') return a.base_price - b.base_price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [players, searchQuery, selectedRole, selectedNationality, selectedStatus, sortBy]);

  // Paginated players for grid view
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPlayers.slice(start, start + itemsPerPage);
  }, [processedPlayers, currentPage]);

  const totalPages = Math.ceil(processedPlayers.length / itemsPerPage);

  const handleCSVSuccess = () => {
    setCsvUploadedMsg('New roster imported and draft pool updated successfully!');
    setShowUploader(false);
    setCurrentPage(1);
    setTimeout(() => setCsvUploadedMsg(null), 5000);
  };

  const roleLabels: Record<string, string> = {
    opener: 'Opener',
    middle_order: 'Middle Order',
    finisher: 'Finisher',
    all_rounder: 'All Rounder',
    spinner: 'Spinner',
    death_bowler: 'Death Bowler',
    powerplay_bowler: 'Powerplay Bowler',
  };

  return (
    <div className="py-6 space-y-6 text-white">
      {/* Header Desk */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Draft Analytics
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Search, filter, and inspect the performance metrics of all {players.length} players in the pool.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-2 text-xs font-bold uppercase rounded-full bg-white text-black hover:bg-white/85 shadow-sm transition cursor-pointer border-none"
          >
            {showUploader ? 'Close Uploader' : '📂 Seed Custom CSV'}
          </button>
        </div>
      </div>

      {/* CSV Uploader panel */}
      {showUploader && (
        <div className="glass p-6 max-w-xl mx-auto shadow-md animate-fade-in text-white">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            Import Roster Sheet
          </h3>
          <p className="text-xs text-white/60 mb-4">
            Uploading a custom CSV sheet here will override the active player pool and reset any ongoing simulations.
          </p>
          <CSVUploader onUploadSuccess={handleCSVSuccess} />
        </div>
      )}

      {csvUploadedMsg && (
        <div className="max-w-xl mx-auto text-xs font-semibold text-[#30D158] bg-[#30D158]/10 border border-[#30D158]/20 p-2.5 rounded-xl text-center">
          {csvUploadedMsg}
        </div>
      )}

      {/* Controls: Search and Filters */}
      <div className="glass p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        
        {/* Search */}
        <div className="md:col-span-3">
          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Player Name Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search e.g. Kohli, Bumrah..."
            className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C8A24D]/55 focus:bg-white/15"
          />
        </div>

        {/* Filter Role */}
        <div className="md:col-span-2">
          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Specialist Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-[#C8A24D]/55 focus:bg-white/15"
            style={{ color: '#FFFFFF', backgroundColor: '#1A1A1E' }}
          >
            <option value="all">All Roles</option>
            <option value="opener">Openers</option>
            <option value="middle_order">Middle Order</option>
            <option value="finisher">Finishers</option>
            <option value="all_rounder">All Rounders</option>
            <option value="spinner">Spinners</option>
            <option value="powerplay_bowler">Powerplay Bowlers</option>
            <option value="death_bowler">Death Bowlers</option>
          </select>
        </div>

        {/* Filter Nationality */}
        <div className="md:col-span-2">
          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Nationality
          </label>
          <select
            value={selectedNationality}
            onChange={(e) => {
              setSelectedNationality(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-[#C8A24D]/55 focus:bg-white/15"
            style={{ color: '#FFFFFF', backgroundColor: '#1A1A1E' }}
          >
            <option value="all">All Players</option>
            <option value="domestic">Indian (Domestic)</option>
            <option value="overseas">Overseas (Star)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-2">
          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Draft Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-[#C8A24D]/55 focus:bg-white/15"
            style={{ color: '#FFFFFF', backgroundColor: '#1A1A1E' }}
          >
            <option value="all">All States</option>
            <option value="pool">Available in Pool</option>
            <option value="sold">Sold</option>
            <option value="unsold">Unsold</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="md:col-span-2">
          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-[#C8A24D]/55 focus:bg-white/15"
            style={{ color: '#FFFFFF', backgroundColor: '#1A1A1E' }}
          >
            <option value="rating-desc">Rating: High to Low</option>
            <option value="rating-asc">Rating: Low to High</option>
            <option value="price-desc">Base Price: High to Low</option>
            <option value="price-asc">Base Price: Low to High</option>
            <option value="name-asc">Alphabetical: A to Z</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="md:col-span-1 flex justify-end space-x-1.5 self-end">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs transition cursor-pointer border-none ${
              viewMode === 'grid'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
            title="Grid Card View"
          >
            🎴
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs transition cursor-pointer border-none ${
              viewMode === 'table'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
            title="Stats Sheet Table"
          >
            📊
          </button>
        </div>
      </div>

      {/* Main Results Listing */}
      <div className="space-y-4">
        {processedPlayers.length === 0 ? (
          <div className="glass p-12 text-center text-white">
            <h3 className="text-lg font-bold">No Match Found</h3>
            <p className="text-xs text-white/60 mt-1">
              Adjust your filter criteria or search queries to find player matches.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {/* Grid of Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {paginatedPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-sm">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white disabled:text-white/20 disabled:bg-transparent disabled:border-transparent transition cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="text-white/60">
                  Page <span className="font-bold text-white">{currentPage}</span> of {totalPages} ({processedPlayers.length} matches)
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white disabled:text-white/20 disabled:bg-transparent disabled:border-transparent transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          /* Table Stats View */
          <div className="glass overflow-hidden shadow-sm border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-white/60">
                <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase tracking-widest text-[9px] font-bold">
                  <tr>
                    <th scope="col" className="px-4 py-3">Player</th>
                    <th scope="col" className="px-4 py-3">Role</th>
                    <th scope="col" className="px-4 py-3 text-center">Rating</th>
                    <th scope="col" className="px-4 py-3 text-center">Country</th>
                    <th scope="col" className="px-4 py-3 text-right">Base Price</th>
                    <th scope="col" className="px-4 py-3 text-center">SR</th>
                    <th scope="col" className="px-4 py-3 text-center">Bat Avg</th>
                    <th scope="col" className="px-4 py-3 text-center">Wkts</th>
                    <th scope="col" className="px-4 py-3 text-center">Econ</th>
                    <th scope="col" className="px-4 py-3 text-right">Draft Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-white/5">
                  {processedPlayers.map((player) => {
                    const mappedRole = roleLabels[player.role] || player.role;
                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-bold text-white flex items-center space-x-1.5">
                          <span>{player.name}</span>
                          {player.is_wicketkeeper && (
                            <span className="text-[8px] bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158] font-extrabold px-1 rounded">
                              WK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-white/60">{mappedRole}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-[#C8A24D]">
                          {player.rating}
                        </td>
                        <td className="px-4 py-3.5 text-center text-white/60">
                          {player.nationality} {player.overseas && '✈'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          {player.base_price.toFixed(2)} Cr
                        </td>
                        <td className="px-4 py-3.5 text-center text-white font-medium">
                          {player.strike_rate !== undefined ? player.strike_rate : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-white">
                          {player.batting_average !== undefined ? player.batting_average : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-[#30D158] font-semibold">
                          {player.wickets !== undefined ? player.wickets : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-[#FF453A] font-semibold">
                          {player.economy !== undefined ? player.economy : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold">
                          {player.status === 'sold' ? (
                            <span className="font-bold text-[#C8A24D]">
                              SOLD ({player.sold_price?.toFixed(2)} Cr)
                            </span>
                          ) : player.status === 'unsold' ? (
                            <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                              Unsold
                            </span>
                          ) : (
                            <span className="text-[#30D158] font-bold uppercase tracking-wider text-[10px] animate-pulse">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )/* End table stats view */}
      </div>
    </div>
  );
}
