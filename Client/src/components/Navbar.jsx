import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/images/img20260226wa0028_2.png";

const Navbar = () => {
  return (
    <header className="bg-white shadow-[0rem_0.25rem_0.9312499761581421rem_0rem_rgba(0,0,0,0.06)]">
      <div className="bg-[#114936] text-white text-xs py-2 px-4 flex justify-between items-center whitespace-nowrap overflow-hidden">
        <span className="flex items-center gap-2"><span className="text-xl">⛟</span> FREE DELIVERY ON ORDERS OVER ₹50</span>
        <span className="flex items-center gap-2 hidden md:flex"><span className="text-xl">⛟</span> FREE DELIVERY ON ORDERS OVER ₹50</span>
        <span className="flex items-center gap-2"><span className="text-xl">⛟</span> FREE DELIVERY ON ORDERS OVER ₹50</span>
      </div>

      <nav className="relative flex justify-between items-center px-6 md:px-16 py-6 bg-[#FCFBFA]">
        <div className="flex gap-8 text-sm font-semibold uppercase tracking-wide cursor-pointer hidden md:flex">
          <NavLink to="/" className="hover:text-[#33D3DB]" end>
            Home
          </NavLink>
          <NavLink to="/products" className="hover:text-[#33D3DB]">
            Product
          </NavLink>
          <NavLink to="/about" className="hover:text-[#33D3DB]">
            About us
          </NavLink>
          <NavLink to="/careers" className="hover:text-[#33D3DB]">
            Careers
          </NavLink>
          <NavLink to="/contact" className="hover:text-[#33D3DB]">
            Contact us
          </NavLink>
        </div>

        <NavLink
          to="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer"
        >
          <img src={logo} alt="Amudhu Logo" className="h-12 w-12 object-contain" />
          <span className="text-4xl font-extrabold italic text-[#134E39]" style={{ fontFamily: "cursive" }}>
            Amudhu
          </span>
        </NavLink>

        <div className="flex gap-8 items-center cursor-pointer hidden md:flex">
          <NavLink
            to="/cart"
            aria-label="Cart"
            className="flex h-10 w-10 items-center justify-center text-[#0A4D3C] transition hover:text-[#33D3DB]"
          >
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
            >
              <path
                d="M13.3333 26.6667L27.8668 25.4555C32.4143 25.0767 33.4352 24.0833 33.9392 19.5482L35 10"
                stroke="currentColor"
                strokeWidth="2.34375"
                strokeLinecap="round"
              />
              <path
                d="M10 10H36.6667"
                stroke="currentColor"
                strokeWidth="2.34375"
                strokeLinecap="round"
              />
              <path
                d="M10 36.6667C11.8409 36.6667 13.3333 35.1743 13.3333 33.3333C13.3333 31.4924 11.8409 30 10 30C8.15905 30 6.66666 31.4924 6.66666 33.3333C6.66666 35.1743 8.15905 36.6667 10 36.6667Z"
                stroke="currentColor"
                strokeWidth="2.34375"
              />
              <path
                d="M28.3333 36.6667C30.1743 36.6667 31.6667 35.1743 31.6667 33.3333C31.6667 31.4924 30.1743 30 28.3333 30C26.4924 30 25 31.4924 25 33.3333C25 35.1743 26.4924 36.6667 28.3333 36.6667Z"
                stroke="currentColor"
                strokeWidth="2.34375"
              />
              <path
                d="M13.3333 33.3333H25"
                stroke="currentColor"
                strokeWidth="2.34375"
                strokeLinecap="round"
              />
              <path
                d="M3.33334 3.33333H4.94334C6.5178 3.33333 7.89024 4.37432 8.2721 5.85822L13.2309 25.1275C13.4815 26.1013 13.267 27.1328 12.6471 27.936L11.0536 30"
                stroke="currentColor"
                strokeWidth="2.34375"
                strokeLinecap="round"
              />
            </svg>
          </NavLink>

          <button className="bg-[#0A4D3C] text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-wider hover:bg-[#134E39] transition">
            Shop Now
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
