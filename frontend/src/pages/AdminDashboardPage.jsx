import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.js';
import { catalogApi } from '../api/catalog.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  PackageCheck,
  Ban,
  Plane,
  Hotel,
  Plus,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, flights, hotels, bookings
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  // Flights state
  const [flights, setFlights] = useState([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [flightForm, setFlightForm] = useState({
    flight_number: '',
    airline: '',
    origin: '',
    destination: '',
    departs_at: '',
    arrives_at: '',
    price: '',
    seats_total: 100,
  });
  const [showFlightModal, setShowFlightModal] = useState(false);

  // Hotels state
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    city: '',
    address: '',
    rating: 4.5,
    image_url: '',
  });
  const [showHotelModal, setShowHotelModal] = useState(false);

  // Rooms state
  const [selectedHotelForRoom, setSelectedHotelForRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    type: 'Deluxe King',
    price_per_night: 150,
    rooms_total: 10,
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'flights') loadFlights();
    if (activeTab === 'hotels') loadHotels();
    if (activeTab === 'bookings') loadBookings();
  }, [activeTab, bookingStatusFilter]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadFlights = async () => {
    try {
      setFlightsLoading(true);
      const res = await catalogApi.searchFlights({ limit: 50 });
      setFlights(res.data?.flights || []);
    } catch (err) {
      console.error('Failed to load flights:', err);
    } finally {
      setFlightsLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      setHotelsLoading(true);
      const res = await catalogApi.searchHotels({ limit: 50 });
      setHotels(res.data?.hotels || []);
    } catch (err) {
      console.error('Failed to load hotels:', err);
    } finally {
      setHotelsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const params = {};
      if (bookingStatusFilter) params.status = bookingStatusFilter;
      const res = await adminApi.getAllBookings(params);
      setBookings(res.data?.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await adminApi.createFlight({
        ...flightForm,
        price: parseFloat(flightForm.price),
        seats_total: parseInt(flightForm.seats_total, 10),
      });
      setMessage('Flight created successfully!');
      setShowFlightModal(false);
      setFlightForm({
        flight_number: '',
        airline: '',
        origin: '',
        destination: '',
        departs_at: '',
        arrives_at: '',
        price: '',
        seats_total: 100,
      });
      loadFlights();
      loadStats();
    } catch (err) {
      setError(err.message || 'Failed to create flight');
    }
  };

  const handleDeleteFlight = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await adminApi.deleteFlight(id);
      setMessage('Flight deleted.');
      loadFlights();
    } catch (err) {
      setError(err.message || 'Failed to delete flight');
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await adminApi.createHotel({
        ...hotelForm,
        rating: parseFloat(hotelForm.rating),
      });
      setMessage('Hotel created successfully!');
      setShowHotelModal(false);
      setHotelForm({
        name: '',
        city: '',
        address: '',
        rating: 4.5,
        image_url: '',
      });
      loadHotels();
    } catch (err) {
      setError(err.message || 'Failed to create hotel');
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    try {
      await adminApi.deleteHotel(id);
      setMessage('Hotel deleted.');
      loadHotels();
    } catch (err) {
      setError(err.message || 'Failed to delete hotel');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!selectedHotelForRoom) return;
    try {
      setError(null);
      await adminApi.createRoom(selectedHotelForRoom.id, {
        type: roomForm.type,
        price_per_night: parseFloat(roomForm.price_per_night),
        rooms_total: parseInt(roomForm.rooms_total, 10),
      });
      setMessage(`Room added to ${selectedHotelForRoom.name}`);
      setSelectedHotelForRoom(null);
      loadHotels();
    } catch (err) {
      setError(err.message || 'Failed to add room');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage catalog inventory, monitor system analytics, and view bookings.
        </p>
      </div>

      {message && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{message}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color, #e5e7eb)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            color: activeTab === 'overview' ? 'var(--primary-color, #2563eb)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('flights')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'flights' ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
            fontWeight: activeTab === 'flights' ? 700 : 500,
            color: activeTab === 'flights' ? 'var(--primary-color, #2563eb)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Flights Inventory
        </button>
        <button
          onClick={() => setActiveTab('hotels')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'hotels' ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
            fontWeight: activeTab === 'hotels' ? 700 : 500,
            color: activeTab === 'hotels' ? 'var(--primary-color, #2563eb)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Hotels & Rooms
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bookings' ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
            fontWeight: activeTab === 'bookings' ? 700 : 500,
            color: activeTab === 'bookings' ? 'var(--primary-color, #2563eb)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          All Bookings
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {statsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading statistics...</div>
          ) : stats ? (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Bookings</span>
                    <TrendingUp size={20} color="#2563eb" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                    {stats.totalBookings}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Revenue</span>
                    <DollarSign size={20} color="#16a34a" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#16a34a' }}>
                    ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Confirmed Trips</span>
                    <PackageCheck size={20} color="#0d9488" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                    {stats.confirmedBookings}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Cancelled Bookings</span>
                    <Ban size={20} color="#dc2626" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
                    {stats.cancelledBookings}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Revenue Timeline */}
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                    Revenue & Bookings Over Time
                  </h3>
                  {stats.timeline && stats.timeline.length > 0 ? (
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <LineChart data={stats.timeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue ($)" strokeWidth={2} />
                          <Line yAxisId="right" type="monotone" dataKey="count" stroke="#2563eb" name="Bookings" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No timeline data available yet</div>
                  )}
                </div>

                {/* Status Breakdown */}
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                    Bookings by Status
                  </h3>
                  {stats.bookingsByStatus && stats.bookingsByStatus.length > 0 ? (
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={stats.bookingsByStatus}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Total Count" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No status distribution data</div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Tab Content: FLIGHTS */}
      {activeTab === 'flights' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Flight Inventory</h2>
            <button
              onClick={() => setShowFlightModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Add Flight
            </button>
          </div>

          {/* Modal / Form for Flight */}
          {showFlightModal && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>New Flight Details</h3>
              <form onSubmit={handleCreateFlight} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Flight Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TG-101"
                    value={flightForm.flight_number}
                    onChange={(e) => setFlightForm({ ...flightForm, flight_number: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Airline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Airways"
                    value={flightForm.airline}
                    onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Origin</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JFK"
                    value={flightForm.origin}
                    onChange={(e) => setFlightForm({ ...flightForm, origin: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LHR"
                    value={flightForm.destination}
                    onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Departs At</label>
                  <input
                    type="datetime-local"
                    required
                    value={flightForm.departs_at}
                    onChange={(e) => setFlightForm({ ...flightForm, departs_at: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Arrives At</label>
                  <input
                    type="datetime-local"
                    required
                    value={flightForm.arrives_at}
                    onChange={(e) => setFlightForm({ ...flightForm, arrives_at: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.00"
                    value={flightForm.price}
                    onChange={(e) => setFlightForm({ ...flightForm, price: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Seats Total</label>
                  <input
                    type="number"
                    required
                    value={flightForm.seats_total}
                    onChange={(e) => setFlightForm({ ...flightForm, seats_total: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowFlightModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Flight
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Flights Table */}
          {flightsLoading ? (
            <div>Loading flights...</div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Flight #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Airline</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Route</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Departure</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Seats Avail</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((f) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{f.flight_number}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{f.airline}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{f.origin} → {f.destination}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{new Date(f.departs_at).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#16a34a' }}>${parseFloat(f.price).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{f.seats_available ?? f.seats_total} / {f.seats_total}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => handleDeleteFlight(f.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          title="Delete flight"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {flights.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        No flights found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: HOTELS */}
      {activeTab === 'hotels' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hotels & Rooms Inventory</h2>
            <button
              onClick={() => setShowHotelModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Add Hotel
            </button>
          </div>

          {/* Add Hotel Modal */}
          {showHotelModal && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>New Hotel Details</h3>
              <form onSubmit={handleCreateHotel} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Hotel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Grand Palace"
                    value={hotelForm.name}
                    onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paris"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Address</label>
                  <input
                    type="text"
                    placeholder="123 Avenue des Champs-Elysees"
                    value={hotelForm.address}
                    onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={hotelForm.rating}
                    onChange={(e) => setHotelForm({ ...hotelForm, rating: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowHotelModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Hotel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Room to Hotel Modal */}
          {selectedHotelForRoom && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
                Add Room to: {selectedHotelForRoom.name}
              </h3>
              <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Room Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suite Executive"
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price per Night ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={roomForm.price_per_night}
                    onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total Rooms</label>
                  <input
                    type="number"
                    required
                    value={roomForm.rooms_total}
                    onChange={(e) => setRoomForm({ ...roomForm, rooms_total: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setSelectedHotelForRoom(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Room
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Hotels Table */}
          {hotelsLoading ? (
            <div>Loading hotels...</div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Hotel Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>City</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rating</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Starting Price</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Room Types</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{h.name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{h.city}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>★ {h.rating}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#16a34a' }}>
                        {h.starting_price ? `$${parseFloat(h.starting_price).toFixed(2)}` : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{h.room_types_count || 0} types</td>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => setSelectedHotelForRoom(h)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          + Add Room
                        </button>
                        <button
                          onClick={() => handleDeleteHotel(h.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          title="Delete hotel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hotels.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        No hotels found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>All Customer Bookings</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Status:</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {bookingsLoading ? (
            <div>Loading bookings...</div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Booking ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Items</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Total Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {b.id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b7280' }}>
                        {b.user_id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {b.items?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem' }}>
                            • {item.item_type}: {item.quantity}x (${parseFloat(item.unit_price).toFixed(2)})
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16a34a' }}>
                        ${parseFloat(b.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        No bookings found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
