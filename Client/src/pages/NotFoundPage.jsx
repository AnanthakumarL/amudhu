import React from "react";
import { NavLink } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
          Page not found
        </h1>
        <p className="mt-3 text-neutral-600" style={{ fontFamily: "Outfit" }}>
          The page you are looking for doesn’t exist.
        </p>
        <NavLink
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-2 text-white"
          style={{ fontFamily: "Outfit" }}
        >
          Go to Home
        </NavLink>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
