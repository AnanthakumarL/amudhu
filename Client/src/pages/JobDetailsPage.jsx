import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";
const APPLY_EMAIL = "amudhuicecreams@gmail.com";

const normalizeStatus = (value) => {
  if (!value) return "open";
  return String(value).toLowerCase().replace(/\s+/g, "_");
};

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!jobId) {
        setError("Missing job id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${apiBase}/jobs/${encodeURIComponent(jobId)}`);
        if (!res.ok) {
          throw new Error(`Failed to load job (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load job");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, jobId]);

  const status = normalizeStatus(job?.status);
  const isClosed = status === "closed";

  const title = job?.title || "Job";
  const description = job?.notes || "";
  const pay = job?.attributes?.pay_rupees;
  const location = job?.attributes?.location;

  const buildApplyLink = () => {
    const subject = `Job Application: ${title}`;
    const bodyLines = [
      `Hello,`,
      ``,
      `I would like to apply for the position: ${title}.`,
      location ? `Location: ${location}` : null,
      pay ? `Pay: ₹${pay}` : null,
      ``,
      `Please find my resume attached.`,
      ``,
      `Thanks,`,
    ].filter(Boolean);

    const params = new URLSearchParams({
      subject,
      body: bodyLines.join("\n"),
    });

    return `mailto:${APPLY_EMAIL}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Job Details
            </h1>
            <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
              View job information and apply.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/careers"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700"
              style={{ fontFamily: "Outfit" }}
            >
              Back to Careers
            </NavLink>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-2 text-sm text-white"
              style={{ fontFamily: "Outfit" }}
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
              Loading job...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700" style={{ fontFamily: "Outfit" }}>
              {error}
            </div>
          ) : !job ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
              Job not found.
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0rem_0.25rem_0.9312499761581421rem_0rem_rgba(0,0,0,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                    {title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs text-neutral-700" style={{ fontFamily: "Outfit" }}>
                      Pay: {pay ? `₹${pay}` : "-"}
                    </div>
                    <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs text-neutral-700" style={{ fontFamily: "Outfit" }}>
                      Location: {location || "-"}
                    </div>
                    <div
                      className={
                        isClosed
                          ? "rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
                          : "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                      }
                      style={{ fontFamily: "Outfit" }}
                    >
                      {isClosed ? "Closed" : "Open"}
                    </div>
                  </div>
                </div>

                <a
                  href={buildApplyLink()}
                  className={
                    isClosed
                      ? "pointer-events-none rounded-xl bg-neutral-200 px-5 py-3 text-sm font-medium text-neutral-600"
                      : "rounded-xl bg-[rgba(58,186,114,1.00)] px-5 py-3 text-sm font-medium text-white"
                  }
                  style={{ fontFamily: "Outfit" }}
                >
                  Apply
                </a>
              </div>

              {description ? (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                    Description
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
                    {description}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobDetailsPage;
