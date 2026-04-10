import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const normalizeStatus = (value) => {
  if (!value) return "open";
  return String(value).toLowerCase().replace(/\s+/g, "_");
};

const isCareerJob = (job) => {
  const type = String(job?.attributes?.type || "").toLowerCase();
  return type === "career";
};

const CareersPage = () => {
  const navigate = useNavigate();
  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const pageSize = 100;
        const firstUrl = new URL(`${apiBase}/jobs`);
        firstUrl.searchParams.set("page", "1");
        firstUrl.searchParams.set("page_size", String(pageSize));

        const firstRes = await fetch(firstUrl.toString());
        if (!firstRes.ok) {
          throw new Error(`Failed to load jobs (${firstRes.status})`);
        }

        const firstJson = await firstRes.json();
        const firstPageJobs = Array.isArray(firstJson?.data) ? firstJson.data : [];
        const totalPages = Number(firstJson?.total_pages || 1) || 1;

        const allJobs = [...firstPageJobs];
        for (let page = 2; page <= totalPages; page += 1) {
          const url = new URL(`${apiBase}/jobs`);
          url.searchParams.set("page", String(page));
          url.searchParams.set("page_size", String(pageSize));

          const res = await fetch(url.toString());
          if (!res.ok) {
            throw new Error(`Failed to load jobs (${res.status})`);
          }
          const json = await res.json();
          const pageJobs = Array.isArray(json?.data) ? json.data : [];
          allJobs.push(...pageJobs);
        }

        if (!cancelled) setJobs(allJobs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const careerJobs = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    return list.filter(isCareerJob);
  }, [jobs]);

  const openJobs = useMemo(() => {
    return careerJobs.filter((job) => normalizeStatus(job?.status) !== "closed");
  }, [careerJobs]);

  const openJobDetails = (jobId) => {
    if (!jobId) return;
    navigate(`/careers/${encodeURIComponent(String(jobId))}`);
  };

  return (
    <div className="font-['Outfit'] min-h-screen bg-[#FCFBFA] text-[#1B4D3E] overflow-x-hidden">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
          Careers
        </h1>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0rem_0.25rem_0.9312499761581421rem_0rem_rgba(0,0,0,0.06)]">
          <p className="text-sm leading-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
            We’re always looking for passionate people to join Amudhu Ice Creams.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                How to apply
              </p>
              <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                Send your resume to amudhuicecreams@gmail.com with the subject “Careers”.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                Location
              </p>
              <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                Chennai, Tamil Nadu
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Current openings
            </h2>

            <div className="mt-4">
              {loading ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                  Loading jobs...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" style={{ fontFamily: "Outfit" }}>
                  {error}
                </div>
              ) : openJobs.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                  No openings right now.
                </div>
              ) : (
                <div className="grid gap-3">
                  {openJobs.map((job) => {
                    const pay = job?.attributes?.pay_rupees;
                    const location = job?.attributes?.location;
                    const description = job?.notes;

                    return (
                      <div key={job.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                              {job.title || "Job"}
                            </p>
                            {description ? (
                              <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                                {description}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                              style={{ fontFamily: "Outfit" }}
                            >
                              Open
                            </span>

                            <button
                              type="button"
                              onClick={() => openJobDetails(job.id)}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                              style={{ fontFamily: "Outfit" }}
                            >
                              View
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs text-neutral-700" style={{ fontFamily: "Outfit" }}>
                            Pay: {pay ? `₹${pay}` : "-"}
                          </div>
                          <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs text-neutral-700" style={{ fontFamily: "Outfit" }}>
                            Location: {location || "-"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CareersPage;
