'use client';

import React, { useState, useMemo } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { PlayerCard } from '../../components/PlayerCard';
import { GlassSelect } from '../../components/GlassSelect';
import { Player } from '../../data/players';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'opener', label: 'Openers' },
  { value: 'middle_order', label: 'Middle Order' },
  { value: 'finisher', label: 'Finishers' },
  { value: 'all_rounder', label: 'All Rounders' },
  { value: 'spinner', label: 'Spinners' },
  { value: 'powerplay_bowler', label: 'Powerplay Bowlers' },
  { value: 'death_bowler', label: 'Death Bowlers' },
];

const nationalityOptions = [
  { value: 'all', label: 'All Players' },
  { value: 'domestic', label: 'Indian (Domestic)' },
  { value: 'overseas', label: 'Overseas (Star)' },
];

const statusOptions = [
  { value: 'all', label: 'All States' },
  { value: 'pool', label: 'Available in Pool' },
  { value: 'sold', label: 'Sold' },
  { value: 'unsold', label: 'Unsold' },
];

const sortOptions = [
  { value: 'rating-desc', label: 'Rating: High to Low' },
  { value: 'rating-asc', label: 'Rating: Low to High' },
  { value: 'price-desc', label: 'Base Price: High to Low' },
  { value: 'price-asc', label: 'Base Price: Low to High' },
  { value: 'name-asc', label: 'Alphabetical: A to Z' },
];

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
      </div>

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
            className="glass-input w-full text-xs px-3.5 py-2.5"
            style={{ borderRadius: '12px' }}
          />
        </div>

        {/* Filter Role */}
        <GlassSelect
          label="Specialist Role"
          value={selectedRole}
          onChange={(val) => {
            setSelectedRole(val);
            setCurrentPage(1);
          }}
          options={roleOptions}
          className="md:col-span-2"
        />

        {/* Filter Nationality */}
        <GlassSelect
          label="Nationality"
          value={selectedNationality}
          onChange={(val) => {
            setSelectedNationality(val);
            setCurrentPage(1);
          }}
          options={nationalityOptions}
          className="md:col-span-2"
        />

        {/* Filter Status */}
        <GlassSelect
          label="Draft Status"
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          options={statusOptions}
          className="md:col-span-2"
        />

        {/* Sort By */}
        <GlassSelect
          label="Sort Order"
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          options={sortOptions}
          className="md:col-span-2"
        />

        {/* View Switcher */}
        <div className="md:col-span-1 flex justify-end self-end">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-150 cursor-pointer border-none ${
                viewMode === 'grid'
                  ? 'shadow-sm'
                  : 'opacity-40 hover:opacity-70'
              }`}
              style={viewMode === 'grid' ? { background: 'rgba(255,255,255,0.14)' } : { background: 'transparent' }}
              title="Grid Card View"
            >
              {/* 2×2 grid squares icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-150 cursor-pointer border-none ${
                viewMode === 'table'
                  ? 'shadow-sm'
                  : 'opacity-40 hover:opacity-70'
              }`}
              style={viewMode === 'table' ? { background: 'rgba(255,255,255,0.14)' } : { background: 'transparent' }}
              title="Stats Sheet Table"
            >
              {/* Horizontal list lines icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
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
                            <span className="text-[8px] bg-[rgba(36,138,61,0.08)] border border-[rgba(36,138,61,0.20)] text-[var(--success)] font-extrabold px-1 rounded">
                              WK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-white/60">{mappedRole}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-[#9F8469]">
                          {player.rating}
                        </td>
                        <td className="px-4 py-3.5 text-center text-white/60">
                          <span className="flex items-center justify-center gap-1.5">
                            <span>{player.nationality}</span>
                            {player.overseas && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Overseas Player" />
                            )}
                          </span>
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
                        <td className="px-4 py-3.5 text-center text-[var(--success)] font-semibold">
                          {player.wickets !== undefined ? player.wickets : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-[var(--danger)] font-semibold">
                          {player.economy !== undefined ? player.economy : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold">
                          {player.status === 'sold' ? (
                            <span className="font-bold text-[#9F8469]">
                              SOLD ({player.sold_price?.toFixed(2)} Cr)
                            </span>
                          ) : player.status === 'unsold' ? (
                            <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                              Unsold
                            </span>
                          ) : (
                            <span className="text-[var(--success)] font-bold uppercase tracking-wider text-[10px] animate-pulse">
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
