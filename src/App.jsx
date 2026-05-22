import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./utils/supabaseClient";

import AuthScreen from "./components/AuthScreen";
import Profile from "./components/Profile";
import SearchScreen from "./components/Search";
import Spaces from "./components/Spaces";
import HomeFeed from "./components/HomeFeed";
import ItemDetailModal from "./components/ItemDetailModal";
import BottomNav from "./components/BottomNav";
import CreateSpaceModal from "./components/CreateSpaceModal";
import AddContentScreen from "./components/AddContentScreen";
import ProfileSetup from "./components/ProfileSetup";
import SettingsScreen from "./components/SettingsScreen";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [spaces, setSpaces] = useState([]);
  const [defaultFeed, setDefaultFeed] = useState("");
  const [activeFeed, setActiveFeed] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewSpaceForm, setShowNewSpaceForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadSpace, setUploadSpace] = useState(defaultFeed);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [itemNoteDraft, setItemNoteDraft] = useState("");
  const [itemFavoriteDraft, setItemFavoriteDraft] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const feedRef = useRef(null);
  
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setAuthLoading(false);
    }
  
    getUser();
  
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
  
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
  
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
  
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
  
      setProfile(data);
      if (data?.default_space) {
        setDefaultFeed(data.default_space);
        setActiveFeed(data.default_space);
        setUploadSpace(data.default_space);
      }
    }
  
    fetchProfile();
  }, [user]);

  useEffect(() => {
    async function fetchSpaces() {
      const { data, error } = await supabase
        .from("spaces")
        .select("*");
  
      if (error) {
        console.error("Error fetching spaces:", error);
        return;
      }
  
      if (data && data.length > 0) {
        const spaceNames = data.map((space) => space.name);
        setSpaces(spaceNames);
  
        if (!spaceNames.includes(activeFeed)) {
          setActiveFeed(spaceNames[0]);
        }
      }
    }
  
    fetchSpaces();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      if (!user) return;
  
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
      }));
  
      setFeedItems(formattedItems);
    }
  
    fetchItems();
  }, [user]);

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

  const saveItemMemo = async () => {
    if (!selectedItem) return;
  
    const { error } = await supabase
      .from("items")
      .update({
        note: itemNoteDraft,
        favorite: itemFavoriteDraft,
      })
      .eq("id", selectedItem.id);
  
    if (error) {
      console.error("Error saving item:", error);
      return;
    }
  
    const updatedItems = feedItems.map((item) =>
      item.id === selectedItem.id
        ? { ...item, note: itemNoteDraft, favorite: itemFavoriteDraft }
        : item
    );
  
    setFeedItems(updatedItems);
    closeItemModal();
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
  
    const confirmDelete = window.confirm(
      "Delete this item from Looptie?"
    );
  
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", selectedItem.id);
  
    if (error) {
      console.error("Error deleting item:", error);
      return;
    }
  
    const deletedId = selectedItem.id;
  
    closeItemModal();
  
    setFeedItems((prev) =>
      prev.filter((item) => item.id !== deletedId)
    );
  };

  const deleteSpace = async (spaceName) => {
    const confirmDelete = window.confirm(
      `Delete "${spaceName}" and all items inside it?`
    );
  
    if (!confirmDelete) return;
  
    const { error: itemError } = await supabase
      .from("items")
      .delete()
      .eq("space", spaceName);
  
    if (itemError) {
      console.error("Error deleting space items:", itemError);
      return;
    }
  
    const { error: spaceError } = await supabase
      .from("spaces")
      .delete()
      .eq("name", spaceName);
  
    if (spaceError) {
      console.error("Error deleting space:", spaceError);
      return;
    }
  
    setFeedItems((prev) =>
      prev.filter((item) => item.space !== spaceName)
    );
  
    setSpaces((prev) =>
      prev.filter((space) => space !== spaceName)
    );
  
    if (activeFeed === spaceName) {
      setActiveFeed("Motivation");
    }
  
    if (defaultFeed === spaceName) {
      setDefaultFeed("Motivation");
    }
  
    setSelectedSpace(null);
  };

  if (authLoading) return null;

  if (!user) {
    return <AuthScreen setUser={setUser} />;
  }

  if (user && !profile) {
    return (
      <ProfileSetup
        user={user}
        spaces={spaces}
        setProfile={setProfile}
      />
    );
  }

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
          onDeleteSpace={deleteSpace}
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
            user={user}
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
          <Profile
          items={feedItems}
          spaces={spaces}
          setSelectedItem={openItemModal}
          setTab={setTab}
          profile={profile}
        />)}

        {tab === "settings" && (
          <SettingsScreen
          profile={profile}
          spaces={spaces}
          defaultFeed={defaultFeed}
          setDefaultFeed={setDefaultFeed}
          setActiveFeed={setActiveFeed}
          setProfile={setProfile}
          setTab={setTab}
        />
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
          onDelete={deleteItem}
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
};