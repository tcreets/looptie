import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useItems(user) {
  const [feedItems, setFeedItems] = useState([]);

  useEffect(() => {
    async function fetchItems() {
      if (!user) {
        setFeedItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching items:", error);
        return;
      }

      const formattedItems = data.map((item) => ({
        id: item.id,
        space: item.space,
        image: item.image_url,
        storage_path: item.storage_path,
        note: item.note,
        favorite: item.favorite,
        tags: item.tags,
        caption: item.caption,
        media_type: item.media_type,
      }));

      setFeedItems(formattedItems);
    }

    fetchItems();
  }, [user]);

  const saveItemMemo = async ({
    selectedItem,
    itemNoteDraft,
    itemFavoriteDraft,
    closeItemModal,
  }) => {
    if (!selectedItem || !user) return;

    const { error } = await supabase
      .from("items")
      .update({
        note: itemNoteDraft,
        favorite: itemFavoriteDraft,
      })
      .eq("id", selectedItem.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving item:", error);
      return;
    }

    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, note: itemNoteDraft, favorite: itemFavoriteDraft }
          : item
      )
    );

    closeItemModal();
  };

  const deleteItem = async ({ selectedItem, closeItemModal }) => {
    if (!selectedItem || !user) return;

    const confirmDelete = window.confirm("Delete this item from Looptie?");
    if (!confirmDelete) return;

    const storagePath = selectedItem.storage_path || selectedItem.storagePath;

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("looptie-uploads")
        .remove([storagePath]);

      if (storageError) {
        console.error("Error deleting storage file:", storageError);
        return;
      }
    }

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", selectedItem.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting item:", error);
      return;
    }

    const deletedId = selectedItem.id;

    closeItemModal();

    setFeedItems((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const deleteAllUserItemsAndStorage = async () => {
    if (!user) return { error: "No user found." };
  
    const { data: items, error: fetchError } = await supabase
      .from("items")
      .select("id, storage_path")
      .eq("user_id", user.id);
  
    if (fetchError) {
      console.error("Error fetching user items:", fetchError);
      return { error: fetchError.message };
    }
  
    const storagePaths = items
      .map((item) => item.storage_path)
      .filter(Boolean);
  
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("looptie-uploads")
        .remove(storagePaths);
  
      if (storageError) {
        console.error("Error deleting user storage:", storageError);
        return { error: storageError.message };
      }
    }
  
    const { error: itemsError } = await supabase
      .from("items")
      .delete()
      .eq("user_id", user.id);
  
    if (itemsError) {
      console.error("Error deleting user items:", itemsError);
      return { error: itemsError.message };
    }
  
    setFeedItems([]);
  
    return { error: null };
  };

  const toggleFavorite = async (selectedItem, nextFavorite) => {
  if (!selectedItem || !user) return;

  const { error } = await supabase
    .from("items")
    .update({ favorite: nextFavorite })
    .eq("id", selectedItem.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating favorite:", error);
    alert(error.message);
    return;
  }

  setFeedItems((prev) =>
    prev.map((item) =>
      item.id === selectedItem.id
        ? { ...item, favorite: nextFavorite }
        : item
    )
  );
};

  return {
    feedItems,
    setFeedItems,
    saveItemMemo,
    toggleFavorite,
    deleteItem,
    deleteAllUserItemsAndStorage,
  };
}