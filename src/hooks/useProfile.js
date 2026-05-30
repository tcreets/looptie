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
        alert("Profile fetch failed: " + error.message);
        setProfileLoading(false);
        return;
      }

      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              email: user.email,
              display_name: "",
              default_space: null,
              has_completed_onboarding: false,
            },
            { onConflict: "user_id" }
          )
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

      if (data && !data.email && user.email) {
        const { data: updatedProfile, error: emailUpdateError } = await supabase
          .from("profiles")
          .update({ email: user.email })
          .eq("user_id", user.id)
          .select()
          .single();

        if (emailUpdateError) {
          console.error("Error updating profile email:", emailUpdateError);
          alert("Email update failed: " + emailUpdateError.message);
        } else {
          setProfile(updatedProfile);

          if (updatedProfile?.default_space) {
            setDefaultFeed(updatedProfile.default_space);
            setActiveFeed(updatedProfile.default_space);
            setUploadSpace(updatedProfile.default_space);
          }

          setProfileLoading(false);
          return;
        }
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