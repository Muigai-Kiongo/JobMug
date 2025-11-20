import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import ResumeUploader from "../components/ResumeUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import clsx from "clsx";

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [profileSkills, setProfileSkills] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/jobs/${id}`);
        if (mounted) setJob(res.data);
      } catch {
        toast.error("Failed to load job details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // Prefill resume + skills
  useEffect(() => {
    if (!user || user.role !== "seeker") return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/profile");
        const data = res.data || {};
        if (mounted) {
          if (data.resumeUrl) setResumeUrl(data.resumeUrl);
          if (Array.isArray(data.skills)) setProfileSkills(data.skills);
        }
      } catch {}
    })();
    return () => (mounted = false);
  }, [user]);

  async function handleApply() {
    if (!user) return toast.error("Please sign in to apply");
    if (user.role !== "seeker")
      return toast.error("Only seekers can apply to jobs");
    if (!resumeUrl) return toast.error("Upload or select a resume first");

    setApplying(true);
    try {
      const res = await api.post(`/api/jobs/${id}/apply`, {
        coverLetter,
        resumeUrl,
        skills: profileSkills,
      });
      toast.success("Application submitted successfully");

      const ms =
        res.data?.matchScore ||
        res.data?.application?.matchScore ||
        null;
      if (ms !== null) setMatchScore(ms);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  if (loading)
    return (
      <div className="app-container py-20 text-center text-neutral-500">
        Loading job details...
      </div>
    );

  if (!job)
    return (
      <div className="app-container py-20 text-center text-neutral-600">
        Job not found.
      </div>
    );

  return (
    <div className="app-container mt-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT - Job details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-neutral-200">
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {job.title}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="font-medium text-neutral-800">
                    {job.company}
                  </span>
                  {job.companyWebsite && (
                    <>
                      {" • "}
                      <a
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit website
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right text-sm text-neutral-500">
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs">Posted date</p>
              </div>
            </header>

            <div className="flex flex-wrap gap-2 mt-4">
              {job.location && (
                <span className="tag">{job.location}</span>
              )}
              {job.isRemote && <span className="tag">Remote</span>}
              {job.type && <span className="tag">{job.type}</span>}
              {job.salaryRange?.min && (
                <span className="tag">
                  {job.salaryRange.currency || "USD"}{" "}
                  {job.salaryRange.min.toLocaleString()} -{" "}
                  {job.salaryRange.max?.toLocaleString() || "—"}
                </span>
              )}
            </div>

            <hr className="my-4 border-neutral-200" />

            <div className="prose prose-neutral max-w-none text-sm leading-relaxed">
              {job.description || "No description provided."}
            </div>

            {job.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-neutral-100 text-neutral-700 px-3 py-1 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {job.howToApply && (
            <Card className="p-6 border border-neutral-200">
              <h3 className="font-semibold text-lg mb-2">How to Apply</h3>
              <p className="text-sm text-neutral-700">{job.howToApply}</p>
            </Card>
          )}

          {job.benefits?.length > 0 && (
            <Card className="p-6 border border-neutral-200">
              <h3 className="font-semibold text-lg mb-2">Benefits</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
                {job.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* RIGHT - Apply Section */}
        <aside className="lg:col-span-1">
          <Card className="p-5 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium">Apply Now</h4>
                <p className="text-sm text-neutral-500">
                  Submit your application
                </p>
              </div>
              <div className="avatar bg-neutral-100 text-neutral-800 font-semibold">
                {(job.company || "C").slice(0, 1).toUpperCase()}
              </div>
            </div>

            {user && user.role === "seeker" ? (
              <>
                <div className="mt-4">
                  <p className="text-sm text-neutral-600 mb-2">Resume</p>
                  <ResumeUploader
                    onUploaded={(url) => {
                      setResumeUrl(url);
                      toast.success("Resume uploaded");
                    }}
                  />
                  {resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View uploaded resume
                    </a>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1">
                      No resume selected
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm text-neutral-600 mb-2">
                    Cover Letter (optional)
                  </p>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Briefly introduce yourself..."
                    className="h-28"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-sm text-neutral-600 mb-2">Your Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profileSkills.length > 0 ? (
                      profileSkills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-neutral-100 px-2 py-1 text-xs rounded-md"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500">
                        No skills found in profile
                      </p>
                    )}
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="primary"
                      className="w-full mt-6"
                      disabled={applying}
                    >
                      {applying ? "Applying..." : "Submit Application"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Application</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to apply for{" "}
                        <strong>{job.title}</strong> at{" "}
                        <strong>{job.company}</strong>?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handleApply} disabled={applying}>
                        {applying ? "Submitting..." : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {matchScore !== null && (
                  <div className="mt-4 text-center">
                    <p
                      className={clsx(
                        "text-sm font-semibold",
                        matchScore >= 75
                          ? "text-green-600"
                          : matchScore >= 40
                          ? "text-yellow-600"
                          : "text-red-600"
                      )}
                    >
                      Match score: {matchScore}%
                    </p>
                    <p className="text-xs text-neutral-500">
                      Higher score = stronger skill match.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500 mt-3">
                Please{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  sign in
                </a>{" "}
                as a job seeker to apply.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
