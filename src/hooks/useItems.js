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
        creator: item.creator,
        image: item.image_url,
        note: item.note,
        favorite: item.favorite,
        tags: item.tags,
        caption: item.caption,
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
    if (!selectedItem) return;

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
    if (!selectedItem) return;

    const confirmDelete = window.confirm("Delete this item from Looptie?");
    if (!confirmDelete) return;

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

  return {
    feedItems,
    setFeedItems,
    saveItemMemo,
    deleteItem,
  };
}