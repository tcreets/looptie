import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useSpaces(user) {
  const [spaces, setSpaces] = useState([]);
  const [defaultFeed, setDefaultFeed] = useState("");
  const [activeFeed, setActiveFeed] = useState("");
  const [uploadSpace, setUploadSpace] = useState("");

  useEffect(() => {
    async function fetchSpaces() {
      if (!user) return;

      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching spaces:", error);
        return;
      }

      const spaceNames = data.map((space) => space.name);
      setSpaces(spaceNames);

      if (spaceNames.length > 0 && !activeFeed) {
        setActiveFeed(spaceNames[0]);
        setUploadSpace(spaceNames[0]);
      }
    }

    fetchSpaces();
  }, [user]);

  const deleteSpace = async (spaceName, feedItems, setFeedItems, setSelectedSpace) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      `Delete "${spaceName}" and all items inside it?`
    );

    if (!confirmDelete) return;

    const { error: itemError } = await supabase
      .from("items")
      .delete()
      .eq("space", spaceName)
      .eq("user_id", user.id);

    if (itemError) {
      console.error("Error deleting space items:", itemError);
      return;
    }

    const { error: spaceError } = await supabase
      .from("spaces")
      .delete()
      .eq("name", spaceName)
      .eq("user_id", user.id);

    if (spaceError) {
      console.error("Error deleting space:", spaceError);
      return;
    }

    setFeedItems((prev) => prev.filter((item) => item.space !== spaceName));

    const remainingSpaces = spaces.filter((space) => space !== spaceName);
    setSpaces(remainingSpaces);

    if (remainingSpaces.length > 0) {
      setActiveFeed(remainingSpaces[0]);
      setDefaultFeed(remainingSpaces[0]);
      setUploadSpace(remainingSpaces[0]);
    } else {
      setActiveFeed("");
      setDefaultFeed("");
      setUploadSpace("");
    }

    setSelectedSpace(null);
  };

  return {
    spaces,
    setSpaces,
    defaultFeed,
    setDefaultFeed,
    activeFeed,
    setActiveFeed,
    uploadSpace,
    setUploadSpace,
    deleteSpace,
  };
}