import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { toast } from "sonner";

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // client-side filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Load jobs
  useEffect(() => {
    let mounted = true;
    async function loadJobs() {
      setLoading(true);
      try {
        const res = await api.get("/api/jobs?limit=500");
        let items = (res.data?.data || res.data) || [];

        // Only jobs posted by the current user
        const mine = items.filter((j) => {
          if (!user) return false;
          if (!j.postedBy) return false;
          const postedById =
            typeof j.postedBy === "string" ? j.postedBy : j.postedBy._id;
          return postedById === user._id;
        });

        if (mounted) setJobs(mine);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Failed to load your jobs.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (user) loadJobs();
    return () => (mounted = false);
  }, [user]);

  // Filtering & sorting
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...jobs];

    if (q) {
      list = list.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "with-applicants") {
      list = list.filter((j) => (j.applicantsCount || j._applicants || 0) > 0);
    }

    if (sortBy === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.postedAt || b.createdAt) -
          new Date(a.postedAt || a.createdAt)
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(a.postedAt || a.createdAt) -
          new Date(b.postedAt || b.createdAt)
      );
    } else if (sortBy === "mostApplicants") {
      list.sort((a, b) => (b.applicantsCount || 0) - (a.applicantsCount || 0));
    }

    return list;
  }, [jobs, search, statusFilter, sortBy]);

  // Copy job link
  function copyShareLink(job) {
    const url = `${window.location.origin}/jobs/${job._id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Job link copied"))
      .catch(() => toast.error("Failed to copy link"));
  }

  // Delete job
  async function deleteJob(id) {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/api/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success("Job deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job.");
    }
  }

  if (!user) {
    return (
      <div className="app-container mt-6 text-center">
        <p className="text-neutral-600">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="app-container mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-semibold">Your Posted Jobs</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {jobs.length} total • {filtered.length} shown
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your jobs..."
            className="max-w-sm"
          />
          <select
            className="form-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="with-applicants">With applicants</option>
          </select>
          <select
            className="form-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="mostApplicants">Most applicants</option>
          </select>

          <Link to="/create" className="btn btn-primary">
            Post a Job
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <JobSkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-neutral-600 mb-3">
            You haven’t posted any jobs yet or none match your filters.
          </p>
          <Link to="/create" className="btn btn-primary">
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => {
            const applicantsCount = j.applicantsCount ?? j._applicants ?? 0;
            return (
              <Card
                key={j._id}
                className="card-hover flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center bg-neutral-100 text-sm font-semibold">
                      {j.logo ? (
                        <img
                          src={j.logo}
                          alt={`${j.company} logo`}
                          className="w-full h-full object-contain rounded-md"
                        />
                      ) : (
                        (j.company || "").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold truncate">
                        {j.title}
                      </div>
                      <div className="text-sm text-neutral-500 mt-1 truncate">
                        {j.company} • {j.location || "—"}
                      </div>
                      <div className="mt-2 text-sm text-neutral-600 line-clamp-3">
                        {j.description || ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <div className="tag">Applicants: {applicantsCount}</div>
                    {j.isRemote && <div className="tag">Remote</div>}
                    {j.type && <div className="tag">{j.type}</div>}
                    <div className="muted text-xs ml-auto">
                      {new Date(j.postedAt || j.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/jobs/${j._id}/applicants`}
                    className="btn btn-outline text-sm"
                  >
                    Applicants
                  </Link>
                  <Link to={`/jobs/${j._id}`} className="btn btn-ghost text-sm">
                    View
                  </Link>
                  <Link
                    to={`/jobs/${j._id}/edit`}
                    className="btn btn-primary text-sm"
                  >
                    Edit
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyShareLink(j)}
                  >
                    Share
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteJob(j._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Extracted skeleton grid for cleaner readability */
function JobSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-neutral-200 rounded mb-2 w-1/2" />
          <div className="h-3 bg-neutral-200 rounded mb-3 w-1/3" />
          <div className="h-10 bg-neutral-100 rounded mb-3" />
          <div className="flex items-center justify-between">
            <div className="h-8 bg-neutral-200 rounded w-24" />
            <div className="h-8 bg-neutral-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
