import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiTwitter, FiGithub, FiLinkedin } from "react-icons/fi";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubscribe(e) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !/^\S+@\S+\.\S+$/.test(addr)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Replace with API endpoint later
      setEmail("");
      toast.success("Subscribed — check your inbox for confirmation.");
    } catch (err) {
      console.error(err);
      toast.error("Subscription failed. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="border-t bg-background mt-16">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        {/* Brand */}
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold">
              JM
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">JobMug</div>
              <p className="text-xs text-muted-foreground">
                Find better matches
              </p>
            </div>
          </Link>

          <p className="text-sm text-muted-foreground mt-4 max-w-sm">
            JobMug helps talented people and great companies find each other.
            Build a better hiring experience with clearer listings and smarter
            matches.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FiTwitter size={18} />
            </a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FiGithub size={18} />
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FiLinkedin size={18} />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:underline">Jobs</Link></li>
              <li><Link to="/create" className="hover:underline">Post a job</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">About</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Privacy</a></li>
              <li><a href="#" className="hover:underline">Terms</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </div>
        </nav>

        {/* Newsletter */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-3">Stay updated</h4>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Subscribe"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <Separator />

      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} JobMug — Built with care.</div>
        <div className="mt-3 sm:mt-0 space-x-4">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Contact</a>
        </div>
      </div>
    </footer>
  );
}
