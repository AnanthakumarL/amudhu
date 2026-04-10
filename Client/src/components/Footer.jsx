import React from "react";
import { NavLink } from "react-router-dom";

const Footer = ({ variant = "default" }) => {
  const isGreen = variant !== "dark";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={`mt-10 rounded-t-[2rem] text-white ${
        isGreen ? "bg-[#114936]" : "bg-[rgba(49,49,49,1.00)]"
      }`}
    >
      <div className="relative mx-auto w-full max-w-6xl px-6 py-10 font-['Outfit']">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(58,186,114,1.00)] p-1">
                  <img
                    src="assets/images/img20260226wa0028_2.png"
                    alt="Amudhu"
                    className="h-full w-full rounded-lg object-cover"
                  />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Amudhu
                  <br />
                  Ice Creams
                </span>
              </div>
              <p className="mt-5 text-sm font-normal normal-case leading-6 text-white/80">
                From large-scale events to retail distribution, we deliver quality flavors in bulk—on
                time, every time.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide">
                Company
              </h3>
              <div className="mt-5 flex flex-col gap-3 text-xs font-semibold uppercase tracking-wide text-white/80">
                <NavLink to="/flavours" className="w-fit hover:text-white">
                  Flavours
                </NavLink>
                <NavLink to="/about" className="w-fit hover:text-white">
                  About us
                </NavLink>
                <NavLink to="/contact" className="w-fit hover:text-white">
                  Contact us
                </NavLink>
                <NavLink to="/careers" className="w-fit hover:text-white">
                  Careers
                </NavLink>
              </div>
            </div>

            <div className="max-w-md">
              <h3 className="text-xs font-semibold uppercase tracking-wide">
                Our Address
              </h3>

              <div className="mt-5 flex flex-col gap-4 text-sm font-normal normal-case text-white/80">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <img src="assets/images/vector_68.svg" alt="Location" className="h-4 w-4" />
                  </span>
                  <p className="leading-6">
                    No.5/8, Thiruvalluvar saval, Michael Garden, Ramapuram,
                    Chennai-600089
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <img src="assets/images/vector_70.svg" alt="Phone" className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <a href="tel:+919962715627" className="hover:text-white">
                      +91 99627 15627
                    </a>
                    <a href="tel:+919444232777" className="hover:text-white">
                      +91 94442 32777
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <img src="assets/images/vector_71.svg" alt="Email" className="h-4 w-4" />
                  </span>
                  <a href="mailto:amudhuicecreams@gmail.com" className="hover:text-white">
                    amudhuicecreams@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm font-normal normal-case text-white/70">
          © 2026 Amudhu Ice creams. All rights reserved
        </div>

        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(270.0deg,rgba(254,255,239,1.00)_0.0%,rgba(237,255,245,1.00)_100.0%)]"
            aria-label="Back to top"
          >
            <img src="assets/images/arrowup01_4.svg" alt="Up" className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Back to top
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
