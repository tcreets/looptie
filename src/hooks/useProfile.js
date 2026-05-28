import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useProfile(user, setDefaultFeed, setActiveFeed, setUploadSpace) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfileLoading(false);
        return;
      }

      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              user_id: user.id,
              display_name: "",
              default_space: null,
              has_completed_onboarding: false,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          alert("Profile creation failed: " + insertError.message);
          setProfileLoading(false);
          return;
        }

        setProfile(newProfile);
        setProfileLoading(false);
        return;
      }

      setProfile(data);

      if (data?.default_space) {
        setDefaultFeed(data.default_space);
        setActiveFeed(data.default_space);
        setUploadSpace(data.default_space);
      }

      setProfileLoading(false);
    }

    fetchProfile();
  }, [user, setDefaultFeed, setActiveFeed, setUploadSpace]);

  return {
    profile,
    setProfile,
    profileLoading,
  };
}