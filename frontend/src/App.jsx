import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Skeleton from './components/Skeleton.jsx';
import HomePage from './pages/HomePage.jsx';
import FlightSearchPage from './pages/FlightSearchPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

// Lazy-load heavier routes for optimal initial bundle performance
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const FlightDetailPage = lazy(() => import('./pages/FlightDetailPage.jsx'));
const HotelSearchPage = lazy(() => import('./pages/HotelSearchPage.jsx'));
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const PriceAlertsPage = lazy(() => import('./pages/PriceAlertsPage.jsx'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

function PageLoader() {
  return (
    <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton height="36px" width="40%" />
      <Skeleton height="18px" width="70%" />
      <Skeleton height="260px" variant="rectangular" style={{ borderRadius: '12px', marginTop: '1rem' }} />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
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
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/price-alerts"
            element={
              <ProtectedRoute>
                <PriceAlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                <LoyaltyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Suspense>
      </main>
      <Footer />
    </div>
  );
}
