'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Ride, PaginatedResult } from '@/types';
import { Navbar } from '@/components/Navbar';
import { RideCard } from '@/components/RideCard';
import { RideFilters, FilterParams } from '@/components/RideFilters';
import { Pagination } from '@/components/Pagination';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Car, Search } from 'lucide-react';

export default function SearchRidesPage() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResult<Ride>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async (currentFilters: FilterParams, currentPage: number) => {
    setLoading(true);
    try {
      const res = await api.rides.search({
        ...currentFilters,
        page: currentPage,
      });
      setData(res as PaginatedResult<Ride>);
    } catch {
      setData({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides(filters, page);
  }, [fetchRides, page, filters]);

  const handleSearch = () => {
    setPage(1);
    fetchRides(filters, 1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
    fetchRides({}, 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Search Campus Rides</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse carpools heading to or leaving from college campuses.
          </p>
        </div>

        {/* Filter component */}
        <div className="mb-8">
          <RideFilters
            filters={filters}
            onChange={setFilters}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Available Rides ({data.total})
            </h2>
          </div>

          {loading ? (
            <LoadingState message="Searching available carpools..." />
          ) : data.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.items.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Car className="w-10 h-10" />}
              title="No rides found matching your search"
              description="Try adjusting your route, date, or filters to find other peers commuting your way."
              actionLabel="Reset Filters"
              onAction={handleReset}
            />
          )}

          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </main>
    </div>
  );
}
