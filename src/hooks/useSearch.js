import { useState } from "react";

export function useSearch(feedItems) {
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = feedItems.filter((item) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return false;

    const tagsText = Array.isArray(item.tags)
      ? item.tags.join(" ").toLowerCase()
      : "";

    const searchableText = `
      ${item.space || ""}
      ${item.creator || ""}
      ${item.caption || ""}
      ${item.note || ""}
      ${tagsText}
    `
      .toLowerCase()
      .replace(/\s+/g, " ");

    return searchableText.includes(query);
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
  };
}