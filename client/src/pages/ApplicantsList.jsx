import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from "../api";
import clsx from "clsx";

export default function ApplicantsList({ jobId }) {
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState("all");

  // fetch applicants
  useEffect(() => {
    async function loadApplicants() {
      setLoading(true);
      try {
        const res = await api.get(`/api/jobs/${jobId}/applicants`);
        setApplicants(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load applicants");
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadApplicants();
  }, [jobId]);

  // filter + sort
  const filtered = useMemo(() => {
    let list = applicants.slice();
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.skills || []).join(" ").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (sortBy === "latest") {
      list.sort(
        (a, b) =>
          new Date(b.appliedAt || b.createdAt) -
          new Date(a.appliedAt || a.createdAt)
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(a.appliedAt || a.createdAt) -
          new Date(b.appliedAt || b.createdAt)
      );
    }

    return list;
  }, [applicants, search, sortBy, statusFilter]);

  const loadingSkeleton = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse p-4 h-40 flex flex-col gap-3">
          <div className="h-5 bg-neutral-200 rounded w-2/3"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          <div className="h-3 bg-neutral-100 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/3 mt-auto"></div>
        </Card>
      ))}
    </div>
  );

  const handleStatusChange = (id, status) => {
    setApplicants((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status } : a))
    );
    toast.success(`Status changed to ${status}`);
  };

  return (
    <div className="app-container mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Applicants</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {applicants.length} total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="max-w-xs"
          />

          <select
            className="form-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="form-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        loadingSkeleton
      ) : filtered.length === 0 ? (
        <div className="text-center mt-16 text-muted-foreground">
          No applicants found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <motion.div key={a._id} whileHover={{ scale: 1.02 }}>
              <Card
                className={clsx(
                  "p-4 cursor-pointer transition-shadow hover:shadow-md",
                  {
                    "border-green-200": a.status === "shortlisted",
                    "border-yellow-200": a.status === "pending",
                    "border-red-200": a.status === "rejected",
                  }
                )}
                onClick={() => setSelected(a)}
              >
                <CardContent className="p-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold">
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold truncate">{a.name}</h3>
                        <p className="text-sm text-neutral-500 truncate">
                          {a.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {(a.skills || []).slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                      {a.skills?.length > 3 && (
                        <span className="text-xs text-neutral-400">
                          +{a.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-neutral-500">
                      {new Date(a.appliedAt || a.createdAt).toLocaleDateString()}
                    </span>
                    <Badge
                      variant={
                        a.status === "shortlisted"
                          ? "success"
                          : a.status === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {a.status || "pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Applicant modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Email:</strong> {selected.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selected.phone || "—"}
                </p>
                <p>
                  <strong>Cover Letter:</strong> {selected.coverLetter || "—"}
                </p>
                <div>
                  <strong>Skills:</strong>{" "}
                  {selected.skills?.length
                    ? selected.skills.join(", ")
                    : "—"}
                </div>
                {selected.resume && (
                  <a
                    href={selected.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Resume
                  </a>
                )}
              </div>
              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(selected._id, "rejected")}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusChange(selected._id, "reviewed")}
                >
                  Mark Reviewed
                </Button>
                <Button
                  onClick={() => handleStatusChange(selected._id, "shortlisted")}
                >
                  Shortlist
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
