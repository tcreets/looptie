import { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useActivity(user) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) {
      setActivities([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_activity");
    if (error) console.error("Error loading activity:", error);
    else setActivities(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`activity:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => loadActivity()
      )
      .subscribe();

    const refreshOnFocus = () => loadActivity();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadActivity]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("activity")
      .update({ read_at: now })
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (!error) {
      setActivities((prev) =>
        prev.map((activity) =>
          activity.read_at ? activity : { ...activity, read_at: now }
        )
      );
    }
  }, [user?.id]);

  return {
    activities,
    activityLoading: loading,
    hasUnreadActivity: activities.some((activity) => !activity.read_at),
    markAllRead,
    refreshActivity: loadActivity,
  };
}
