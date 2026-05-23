import { useState } from "react";

export function useItemModal() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemNoteDraft, setItemNoteDraft] = useState("");
  const [itemFavoriteDraft, setItemFavoriteDraft] = useState(false);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setItemNoteDraft(item.note || "");
    setItemFavoriteDraft(!!item.favorite);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setItemNoteDraft("");
    setItemFavoriteDraft(false);
  };

  return {
    selectedItem,
    setSelectedItem,
    itemNoteDraft,
    setItemNoteDraft,
    itemFavoriteDraft,
    setItemFavoriteDraft,
    openItemModal,
    closeItemModal,
  };
}