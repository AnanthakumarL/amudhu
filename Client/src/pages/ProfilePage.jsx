import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const ProfilePage = () => {
  const [authUser, setAuthUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      setAuthUser(raw ? JSON.parse(raw) : null);
    } catch {
      setAuthUser(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
          Profile
        </h1>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0rem_0.25rem_0.9312499761581421rem_0rem_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(58,186,114,1.00)] p-1">
              <img
                src="assets/images/img20260226wa0028_2.png"
                alt="Profile"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                {authUser?.name || "User"}
              </span>
              <span className="text-sm text-neutral-500" style={{ fontFamily: "Outfit" }}>
                {authUser?.identifier || ""}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-sm text-neutral-500" style={{ fontFamily: "Outfit" }}>
                Account status
              </span>
              <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                {authUser?.is_active === false ? "Disabled" : "Active"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-sm text-neutral-500" style={{ fontFamily: "Outfit" }}>
                Member since
              </span>
              <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                {authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : ""}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="mt-2 w-full rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-3 text-sm font-medium text-white transition-opacity duration-150 ease-out hover:opacity-[0.96] active:opacity-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
              style={{ fontFamily: "Outfit" }}
            >
              View Orders
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
