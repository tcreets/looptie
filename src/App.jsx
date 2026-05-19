import React, { useRef, useState, useEffect } from "react";
import "./App.css";

import Profile from "./components/Profile";
import SearchScreen from "./components/Search";
import Spaces from "./components/Spaces";
import HomeFeed from "./components/HomeFeed";
import ItemDetailModal from "./components/ItemDetailModal";
import BottomNav from "./components/BottomNav";
import CreateSpaceModal from "./components/CreateSpaceModal";
import AddContentScreen from "./components/AddContentScreen";

export default function App() {
  const [tab, setTab] = useState("home");

  const savedSpaces = JSON.parse(localStorage.getItem("cacheSpaces"));
  const savedDefaultFeed = localStorage.getItem("cacheDefaultFeed");

  const [spaces, setSpaces] = useState(
    savedSpaces || ["Motivation", "Gym", "Faith", "Calm", "Business", "Books"]
  );

  const [defaultFeed, setDefaultFeed] = useState(
    savedDefaultFeed || "Motivation"
  );

  const [activeFeed, setActiveFeed] = useState(
    savedDefaultFeed || "Motivation"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showNewSpaceForm, setShowNewSpaceForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadSpace, setUploadSpace] = useState(defaultFeed);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [itemNoteDraft, setItemNoteDraft] = useState("");
  const [itemFavoriteDraft, setItemFavoriteDraft] = useState(false);

  const feedRef = useRef(null);

  const defaultFeedItems = [
    {
      id: 1,
      space: "Motivation",
      creator: "mindset.archive",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      space: "Gym",
      creator: "gym.archive",
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      space: "Faith",
      creator: "daily.light",
      image:
        "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      space: "Calm",
      creator: "calm.archive",
      image:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      space: "Business",
      creator: "builder.archive",
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 6,
      space: "Gym",
      creator: "gym.archive",
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 7,
      space: "Gym",
      creator: "lift.notes",
      image:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 8,
      space: "Motivation",
      creator: "mindset.archive",
      image:
        "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 9,
      space: "Faith",
      creator: "daily.light",
      image:
        "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 10,
      space: "Calm",
      creator: "calm.archive",
      image:
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 11,
      space: "Books",
      creator: "reader.archive",
      image:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const savedFeedItems = JSON.parse(localStorage.getItem("cacheFeedItems"));

  const [feedItems, setFeedItems] = useState(
    savedFeedItems || defaultFeedItems
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        "cacheFeedItems",
        JSON.stringify(feedItems)
      );
    } catch (error) {
      console.error("Storage full:", error);
    }
  }, [feedItems]);

  useEffect(() => {
    localStorage.setItem("cacheSpaces", JSON.stringify(spaces));
  }, [spaces]);

  useEffect(() => {
    localStorage.setItem("cacheDefaultFeed", defaultFeed);
  }, [defaultFeed]);

  const filteredFeedItems = feedItems.filter(
    (item) => item.space === activeFeed
  );

  const toggleFavorite = (id) => {
    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, favorite: !item.favorite }
          : item
      )
    );
  
    setSelectedItem((prev) =>
      prev && prev.id === id
        ? { ...prev, favorite: !prev.favorite }
        : prev
    );
  };

  const searchResults = feedItems.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
  
    if (!query) return false;
  
    const tagsText = Array.isArray(item.tags)
      ? item.tags.join(" ")
      : "";
  
    const searchableText = `
      ${item.space || ""}
      ${item.creator || ""}
      ${item.caption || ""}
      ${item.note || ""}
      ${tagsText}
    `.toLowerCase();

    return searchableText.includes(query);
  });

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

  const saveItemMemo = () => {
    if (!selectedItem) return;
  
    const updatedItems = feedItems.map((item) =>
      item.id === selectedItem.id
        ? { ...item, note: itemNoteDraft, favorite: itemFavoriteDraft }
        : item
    );
  
    setFeedItems(updatedItems);
    closeItemModal();
  };

  return (
    <div style={appStyle}>
      <div style={contentStyle}>
        {tab === "home" && (
          <HomeFeed
            spaces={spaces}
            activeFeed={activeFeed}
            setActiveFeed={setActiveFeed}
            feedRef={feedRef}
            filteredFeedItems={filteredFeedItems}
            setSelectedItem={openItemModal}
          />
        )}

        {tab === "spaces" && (
          <Spaces
          spaces={spaces}
          defaultFeed={defaultFeed}
          setDefaultFeed={setDefaultFeed}
          selectedSpace={selectedSpace}
          setSelectedSpace={setSelectedSpace}
          feedItems={feedItems}
          setSelectedItem={openItemModal}
          setShowNewSpaceForm={setShowNewSpaceForm}
          setUploadSpace={setUploadSpace}
          setTab={setTab}
        />
        )}

        {tab === "search" && (
          <SearchScreen
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            setSelectedItem={openItemModal}
          />
        )}

        {tab === "add" && (
          <AddContentScreen
            spaces={spaces}
            defaultFeed={defaultFeed}
            uploadSpace={uploadSpace}
            setUploadSpace={setUploadSpace}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            feedItems={feedItems}
            setFeedItems={setFeedItems}
            setActiveFeed={setActiveFeed}
            setTab={setTab}
          />
        )}

        {tab === "profile" && (
          <Profile items={feedItems} spaces={spaces} />
        )}

        {showNewSpaceForm && (
          <CreateSpaceModal
            newSpaceName={newSpaceName}
            setNewSpaceName={setNewSpaceName}
            spaces={spaces}
            setSpaces={setSpaces}
            setSelectedSpace={setSelectedSpace}
            setShowNewSpaceForm={setShowNewSpaceForm}
            setTab={setTab}
          />
        )}

        <ItemDetailModal
          selectedItem={selectedItem}
          itemNoteDraft={itemNoteDraft}
          setItemNoteDraft={setItemNoteDraft}
          itemFavoriteDraft={itemFavoriteDraft}
          setItemFavoriteDraft={setItemFavoriteDraft}
          onClose={closeItemModal}
          onSave={saveItemMemo}
        />
      </div>

      <BottomNav
        defaultFeed={defaultFeed}
        setActiveFeed={setActiveFeed}
        setTab={setTab}
        setSelectedSpace={setSelectedSpace}
      />
    </div>
  );
}

const appStyle = {
  background: "#050505",
  color: "white",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, sans-serif",
};

const contentStyle = {
  flex: 1,
  overflow: "hidden",
  padding: "20px",
  paddingBottom: "88px",
};