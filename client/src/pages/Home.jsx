import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import Card from "../components/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import clsx from "clsx";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Home() {
  const navigate = useNavigate();
  const qParam = useQuery().get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [locationFilter, setLocationFilter] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/api/jobs?q=${encodeURIComponent(qParam)}&limit=60`);
        const items = (res.data && (res.data.data || res.data)) || [];
        if (mounted) setJobs(items);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [qParam]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (remoteOnly && !j.isRemote) return false;
      if (locationFilter.trim()) {
        const loc = (j.location || "").toLowerCase();
        if (!loc.includes(locationFilter.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [jobs, locationFilter, remoteOnly]);

  function submitSearch(e) {
    e.preventDefault();
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/", { replace: false });
  }

  return (
    <div className="app-container mt-6">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Discover opportunities tailored to you
            </h1>
            <p className="text-muted-foreground mt-2">
              Search by title, company, or skills — refine results with location or remote-only filter.
            </p>

            <form onSubmit={submitSearch} className="mt-5 flex gap-2 items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, companies, or skills..."
                className="flex-1"
              />
              <Button type="submit" className="whitespace-nowrap">
                Search
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/create">
              <Button variant="outline" className="hidden sm:inline-flex">
                Post a job
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" className="hidden md:inline-flex">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by location"
            className="w-[220px]"
          />

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={remoteOnly} onCheckedChange={setRemoteOnly} />
            Remote only
          </label>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span> results
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-xl p-4 bg-background animate-pulse"
            >
              <div className="h-5 w-1/2 bg-muted rounded mb-3" />
              <div className="h-4 w-1/3 bg-muted rounded mb-2" />
              <div className="h-20 bg-muted/50 rounded mb-3" />
              <div className="flex justify-between">
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="text-center text-muted-foreground mt-10">
          No jobs found. Try adjusting your search or filters.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <li key={j._id}>
              <Card className="rounded-xl border border-border hover:shadow-md transition">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-md flex items-center justify-center bg-muted text-sm font-semibold",
                          !j.logo && "bg-muted"
                        )}
                      >
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
                      <div className="flex-1">
                        <Link
                          to={`/jobs/${j._id}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {j.title}
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">
                          {j.company} • {j.location} {j.isRemote && "• Remote"}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                      {j.description || ""}
                    </p>

                    {j.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {j.tags.slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {new Date(j.postedAt || j.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/jobs/${j._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link to={`/jobs/${j._id}`}>
                        <Button size="sm">Apply</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
