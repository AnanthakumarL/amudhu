import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const ContactPage = () => {
  return (
    <div className="font-['Outfit'] min-h-screen bg-[#FCFBFA] text-[#1B4D3E] overflow-x-hidden">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
          Contact us
        </h1>
        <p className="mt-3 text-neutral-600" style={{ fontFamily: "Outfit" }}>
          This page is under construction.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
