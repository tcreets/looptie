import { useState } from "react";

export function useItemModal() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemFavoriteDraft, setItemFavoriteDraft] = useState(false);
  const [itemTagsDraft, setItemTagsDraft] = useState([]);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setItemFavoriteDraft(!!item.favorite);
    setItemTagsDraft(Array.isArray(item.tags) ? item.tags : []);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setItemFavoriteDraft(false);
    setItemTagsDraft([]);
  };

  return {
    selectedItem,
    setSelectedItem,
    itemFavoriteDraft,
    setItemFavoriteDraft,
    itemTagsDraft,
    setItemTagsDraft,
    openItemModal,
    closeItemModal,
  };
}