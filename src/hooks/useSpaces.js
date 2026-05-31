import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useSpaces(user) {
  const [spaces, setSpaces] = useState([]);
  const [defaultFeed, setDefaultFeed] = useState("");
  const [activeFeed, setActiveFeed] = useState("");
  const [uploadSpace, setUploadSpace] = useState("");
  const [spacesLoading, setSpacesLoading] = useState(false);

  useEffect(() => {
    async function fetchSpaces() {
      setSpacesLoading(true);
      if (!user) {
        setSpaces([]);
        setDefaultFeed("");
        setActiveFeed("");
        setUploadSpace("");
        return;
      }

      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching spaces:", error);
        setSpacesLoading(false);
        return;
      }

      setSpaces(data || []);

      const defaultSpace =
        data?.find((space) => space.is_default) || data?.[0];

      if (defaultSpace) {
       setDefaultFeed(defaultSpace.name);
       setActiveFeed((prev) => prev || defaultSpace.name);
       setUploadSpace((prev) => prev || defaultSpace.name);
      }
      setSpacesLoading(false);
    }

    fetchSpaces();
  }, [user]);

  const saveDefaultFeed = async (spaceName) => {
    if (!user || !spaceName) return;

    const { error: resetError } = await supabase
      .from("spaces")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (resetError) {
      console.error("Error resetting default spaces:", resetError);
      return;
    }

    const { error: defaultError } = await supabase
      .from("spaces")
      .update({ is_default: true })
      .eq("user_id", user.id)
      .eq("name", spaceName);

    if (defaultError) {
      console.error("Error setting default space:", defaultError);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ default_space: spaceName })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Error updating profile default space:", profileError);
      return;
    }

    setSpaces((prev) =>
      prev.map((space) => ({
        ...space,
        is_default: space.name === spaceName,
      }))
    );

    setDefaultFeed(spaceName);
    setActiveFeed(spaceName);
    setUploadSpace(spaceName);
  };

  const deleteSpace = async (
    spaceName,
    feedItems,
    setFeedItems,
    setSelectedSpace
  ) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      `Delete "${spaceName}" and all items inside it?`
    );

    if (!confirmDelete) return;

    const itemsInSpace = feedItems.filter((item) => item.space === spaceName);

    const filePaths = itemsInSpace
      .map((item) => item.storage_path || item.storagePath)
      .filter(Boolean);

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("looptie-uploads")
        .remove(filePaths);

      if (storageError) {
        console.error("Error deleting storage files:", storageError);
        alert(storageError.message);
        return;
      }
    }

    const { error: itemError } = await supabase
      .from("items")
      .delete()
      .eq("space", spaceName)
      .eq("user_id", user.id);

    if (itemError) {
      console.error("Error deleting space items:", itemError);
      alert(itemError.message);
      return;
    }

    const { error: spaceError } = await supabase
      .from("spaces")
      .delete()
      .eq("name", spaceName)
      .eq("user_id", user.id);

    if (spaceError) {
      console.error("Error deleting space:", spaceError);
      alert(spaceError.message);
      return;
    }

    setFeedItems((prev) => prev.filter((item) => item.space !== spaceName));

    const remainingSpaces = spaces.filter((space) => space.name !== spaceName);

    setSpaces(remainingSpaces);

    if (remainingSpaces.length > 0) {
      const fallbackSpace =
        remainingSpaces.find((space) => space.is_default) || remainingSpaces[0];

      setActiveFeed(fallbackSpace.name);
      setDefaultFeed(fallbackSpace.name);
      setUploadSpace(fallbackSpace.name);
    } else {
      setActiveFeed("");
      setDefaultFeed("");
      setUploadSpace("");
    }

    setSelectedSpace(null);
  };

  const renameSpace = async ({
  spaceId,
  oldName,
  newName,
  feedItems,
  setFeedItems,
  setSelectedSpace,
}) => {
  if (!user || !spaceId) return false;

  const cleanName = newName.trim();

  if (!cleanName) {
    alert("Space name cannot be blank.");
    return false;
  }

  const duplicateSpace = spaces.some(
    (space) =>
      space.id !== spaceId &&
      space.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (duplicateSpace) {
    alert("You already have a space with that name.");
    return false;
  }

  const { data: updatedSpace, error: spaceError } = await supabase
    .from("spaces")
    .update({ name: cleanName })
    .eq("id", spaceId)
    .select()
    .single();

  if (spaceError) {
    console.error("Error renaming space:", spaceError);
    alert("Rename failed: " + spaceError.message);
    return false;
  }

  if (!updatedSpace) {
    alert("Rename failed. No space was updated.");
    return false;
  }

  const { error: itemsError } = await supabase
    .from("items")
    .update({ space: cleanName })
    .eq("space", oldName)
    .eq("user_id", user.id);

  if (itemsError) {
    console.error("Error updating renamed space items:", itemsError);
    alert("Items were not updated: " + itemsError.message);
    return false;
  }

  setSpaces((prev) =>
    prev.map((space) =>
      space.id === spaceId ? updatedSpace : space
    )
  );

  setFeedItems((prev) =>
    prev.map((item) =>
      item.space === oldName ? { ...item, space: cleanName } : item
    )
  );

  if (defaultFeed === oldName) {
    setDefaultFeed(cleanName);

    await supabase
      .from("profiles")
      .update({ default_space: cleanName })
      .eq("user_id", user.id);
  }

  if (activeFeed === oldName) {
    setActiveFeed(cleanName);
  }

  if (uploadSpace === oldName) {
    setUploadSpace(cleanName);
  }

  setSelectedSpace(null);

  return true;
};

  return {
    spaces,
    setSpaces,
    spacesLoading,
    defaultFeed,
    setDefaultFeed,
    saveDefaultFeed,
    activeFeed,
    setActiveFeed,
    uploadSpace,
    setUploadSpace,
    deleteSpace,
    renameSpace,
  };
}