import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import FlightSearchPage from './pages/FlightSearchPage.jsx';
import FlightDetailPage from './pages/FlightDetailPage.jsx';
import HotelSearchPage from './pages/HotelSearchPage.jsx';
import HotelDetailPage from './pages/HotelDetailPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import BookingDetailPage from './pages/BookingDetailPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flights" element={<FlightSearchPage />} />
          <Route path="/flights/:id" element={<FlightDetailPage />} />
          <Route path="/hotels" element={<HotelSearchPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
