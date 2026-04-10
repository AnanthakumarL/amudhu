import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import FloversPage from "./pages/FloversPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import ProductsPage from "./pages/Products.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import CareersPage from "./pages/CareersPage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OTPVerification from "./pages/OTPVerification.jsx";
import AddaddressifNewuser from "./pages/AddaddressifNewuser.jsx";
import Frame1180 from "./pages/Frame1180.jsx";

const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const GuestOnly = ({ children }) => {
  return getAuthUser() ? <Navigate to="/profile" replace /> : children;
};

const RequireAuth = ({ children }) => {
  return getAuthUser() ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flavours" element={<FloversPage />} />
        <Route path="/products" element={<ProductsPage />} />

        {/* Backward compatibility (old misspelling) */}
        <Route path="/flovers" element={<Navigate to="/flavours" replace />} />

        {/* Backward compatibility */}
        <Route path="/FlavoursPage" element={<Navigate to="/flavours" replace />} />

        <Route path="/product/:productId" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:jobId" element={<JobDetailsPage />} />

        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />

        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />

        {/* Login flow (ported from /login project) */}
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/add-address" element={<AddaddressifNewuser />} />
        <Route path="/frame1180" element={<Frame1180 />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
