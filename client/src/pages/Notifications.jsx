import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "sonner";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CheckCircle, Bell } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications");
      const list = res.data || [];
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, read: true } : it)));
    try {
      await api.post(`/api/notifications/${id}/read`);
      toast.success("Marked read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark read");
      load();
    }
  }

  async function markAllRead() {
    const unread = items.filter((i) => !i.read);
    if (!unread.length) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    try {
      await Promise.all(unread.map((i) => api.post(`/api/notifications/${i._id}/read`)));
      toast.success("All notifications marked read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all read; reloading");
      load();
    } finally {
      setMarkingAll(false);
    }
  }

  function openLink(link) {
    if (!link) return;
    if (link.startsWith("/")) navigate(link);
    else window.open(link, "_blank", "noopener,noreferrer");
  }

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className="app-container mt-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          <h2 className="text-2xl font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={markAllRead}
            disabled={!unreadCount || markingAll}
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          You’re all caught up — no notifications yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n._id}>
              <div
                className={clsx(
                  "p-4 rounded-xl border bg-white transition hover:bg-neutral-50 cursor-pointer",
                  !n.read && "border-primary-100"
                )}
                onClick={() => openLink(n.link)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">{n.title}</span>
                      {n.type && <Badge variant="outline">{n.type}</Badge>}
                      {!n.read && <Badge variant="default">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n._id);
                        }}
                        className="text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark read
                      </Button>
                    )}
                    {n.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLink(n.link);
                        }}
                        className="text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
