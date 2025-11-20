import React, { useEffect, useState } from "react";
import api from "../api";
import ResumeUploader from "../components/ResumeUploader";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Save } from "lucide-react";
import clsx from "clsx";

export default function ProfileEditor() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    headline: "",
    location: "",
    skills: [],
    resumeUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/api/profile");
        if (mounted && res.data) {
          const d = res.data;
          setForm({
            name: d.name || "",
            headline: d.headline || "",
            location: d.location || "",
            skills: Array.isArray(d.skills)
              ? d.skills
              : d.skills
              ? d.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            resumeUrl: d.resumeUrl || "",
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function addSkillFromInput() {
    const s = (skillInput || "").trim();
    if (!s) return;
    if (form.skills.includes(s)) {
      setSkillInput("");
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput("");
  }

  function removeSkill(skill) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        headline: form.headline || "",
        location: form.location || "",
        skills: form.skills,
        resumeUrl: form.resumeUrl || "",
      };
      const res = await api.put("/api/profile", payload);
      toast.success("Profile saved");

      const updatedUser = res.data?.user || res.data;
      if (updatedUser && setUser) setUser(updatedUser);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="app-container mt-8 max-w-3xl space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );

  return (
    <div className="app-container mt-8 max-w-3xl">
      <div className="card p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <h2 className="text-xl text-neutral-500 font-semibold mb-1">Edit profile</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Keep your profile up to date so recruiters can find you easily.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Full name */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name" className="text-sm text-neutral-700 dark:text-neutral-200">
              Full name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <Label htmlFor="headline" className="text-sm text-neutral-700 dark:text-neutral-200">
              Headline
            </Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
              placeholder="e.g. Backend Engineer"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm text-neutral-700 dark:text-neutral-200">
              Location
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="City, Country or Remote"
            />
          </div>

          {/* Skills */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm text-neutral-700 dark:text-neutral-200">Skills</Label>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-2 cursor-pointer hover:bg-primary-50 hover:text-primary-700"
                  onClick={() => removeSkill(skill)}
                  title="Click to remove"
                >
                  {skill} ✕
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkillFromInput();
                  }
                }}
                placeholder="Add a skill and press Enter"
              />
              <Button variant="outline" onClick={addSkillFromInput}>
                Add
              </Button>
            </div>
          </div>

          {/* Resume */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm text-neutral-700 dark:text-neutral-200">Resume</Label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <ResumeUploader onUploaded={(url) => setField("resumeUrl", url)} />
              <div className="mt-2 sm:mt-0 text-sm">
                {form.resumeUrl ? (
                  <a
                    href={
                      form.resumeUrl.startsWith("http")
                        ? form.resumeUrl
                        : `${window.location.origin}${form.resumeUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    View current resume
                  </a>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    No resume uploaded
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tip: Upload a PDF for best compatibility.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              api
                .get("/api/profile")
                .then((r) => {
                  const d = r.data || {};
                  setForm({
                    name: d.name || "",
                    headline: d.headline || "",
                    location: d.location || "",
                    skills: Array.isArray(d.skills)
                      ? d.skills
                      : d.skills
                      ? d.skills.split(",").map((s) => s.trim()).filter(Boolean)
                      : [],
                    resumeUrl: d.resumeUrl || "",
                  });
                  toast.success("Changes reverted");
                })
                .catch(() => toast.error("Failed to reload profile"))
                .finally(() => setLoading(false));
            }}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Revert
          </Button>

          <Button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
