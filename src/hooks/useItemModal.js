import { useState } from "react";

export function useItemModal() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemNoteDraft, setItemNoteDraft] = useState("");
  const [itemFavoriteDraft, setItemFavoriteDraft] = useState(false);
  const [itemTagsDraft, setItemTagsDraft] = useState([]);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setItemNoteDraft(item.note || "");
    setItemFavoriteDraft(!!item.favorite);
    setItemTagsDraft(Array.isArray(item.tags) ? item.tags : []);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setItemNoteDraft("");
    setItemFavoriteDraft(false);
    setItemTagsDraft([]);
  };

  return {
    selectedItem,
    setSelectedItem,
    itemNoteDraft,
    setItemNoteDraft,
    itemFavoriteDraft,
    setItemFavoriteDraft,
    itemTagsDraft,
    setItemTagsDraft,
    openItemModal,
    closeItemModal,
  };
}