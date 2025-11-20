import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateJob() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    isRemote: true,
    type: "full-time",
    salaryRange: { min: 0, max: 0 },
    description: "",
    tags: "",
    applyUrl: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags:
          typeof form.tags === "string"
            ? form.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : form.tags,
      };

      const res = await api.post("/api/jobs", payload);
      toast.success("Job created successfully");
      navigate(`/jobs/${res.data._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-container mt-6 max-w-3xl">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create a new job</CardTitle>
          <CardDescription>
            Posting as{" "}
            <span className="font-medium text-foreground">
              {user?.company || user?.name || "Your profile"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
                placeholder="e.g. Frontend Developer"
              />
            </div>

            {/* Company & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="e.g. Nairobi, Kenya"
                />
              </div>
            </div>

            {/* Type, Remote, Apply URL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="form-field w-full"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <div>
                <Label>Remote</Label>
                <select
                  value={String(form.isRemote)}
                  onChange={(e) => setField("isRemote", e.target.value === "true")}
                  className="form-field w-full"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <Label htmlFor="applyUrl">Apply URL</Label>
                <Input
                  id="applyUrl"
                  value={form.applyUrl}
                  onChange={(e) => setField("applyUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salaryMin">Salary (min)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={form.salaryRange.min}
                  onChange={(e) =>
                    setField("salaryRange", {
                      ...form.salaryRange,
                      min: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="salaryMax">Salary (max)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={form.salaryRange.max}
                  onChange={(e) =>
                    setField("salaryRange", {
                      ...form.salaryRange,
                      max: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setField("tags", e.target.value)}
                placeholder="comma-separated, e.g. react,frontend,ui"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={8}
                placeholder="Describe the role, requirements, and benefits..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
