import { useState } from "react";

export function useSearch(feedItems) {
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = feedItems.filter((item) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return false;

    const tagsText = Array.isArray(item.tags)
      ? item.tags.join(" ").toLowerCase()
      : "";

    const createdDate = item.created_at ? new Date(item.created_at) : null;

    const monthName = createdDate
      ? createdDate.toLocaleString("en-US", { month: "long" }).toLowerCase()
      : "";

    const shortMonthName = createdDate
      ? createdDate.toLocaleString("en-US", { month: "short" }).toLowerCase()
      : "";

    const year = createdDate ? createdDate.getFullYear().toString() : "";

    const dateString = createdDate
      ? createdDate
          .toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toLowerCase()
      : "";

    const now = new Date();

    const isToday =
      createdDate &&
      createdDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      createdDate &&
      createdDate.toDateString() === yesterday.toDateString();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const isThisWeek =
      createdDate &&
      createdDate >= startOfWeek &&
      createdDate <= now;

    const isThisMonth =
      createdDate &&
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear();

    const matchesDate =
      monthName.includes(query) ||
      shortMonthName.includes(query) ||
      year.includes(query) ||
      dateString.includes(query) ||
      (query === "today" && isToday) ||
      (query === "yesterday" && isYesterday) ||
      (query === "this week" && isThisWeek) ||
      (query === "this month" && isThisMonth) ||
      (query === "recent" && isThisWeek);

    const searchableText = `
      ${item.space || ""}
      ${item.caption || ""}
      ${item.note || ""}
      ${tagsText}
    `
      .toLowerCase()
      .replace(/\s+/g, " ");

    return searchableText.includes(query) || matchesDate;
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
  };
}