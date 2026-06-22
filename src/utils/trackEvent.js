import { supabase } from "./supabaseClient";

export async function trackEvent(eventName, metadata = {}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      event_name: eventName,
      metadata,
    });

    if (error) {
      console.error("Event tracking error:", error.message);
    }
  } catch (err) {
    console.error("Track event failed:", err);
  }
}