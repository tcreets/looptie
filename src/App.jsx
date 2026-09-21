import React, { useRef, useState, useEffect } from "react";
import "./App.css";

import AuthScreen from "./components/AuthScreen";
import Onboarding from "./components/Onboarding";
import Profile from "./components/Profile";
import SearchScreen from "./components/Search";
import Spaces from "./components/Spaces";
import HomeFeed from "./components/HomeFeed";
import ItemDetailModal from "./components/ItemDetailModal";
import BottomNav from "./components/BottomNav";
import CreateSpaceModal from "./components/CreateSpaceModal";
import AddContentScreen from "./components/AddContentScreen";
import SettingsScreen from "./components/SettingsScreen";
import { useSpaces } from "./hooks/useSpaces";
import { useProfile } from "./hooks/useProfile";
import { useItems } from "./hooks/useItems";
import { useItemModal } from "./hooks/useItemModal";
import { useSearch } from "./hooks/useSearch";
import { useAuth } from "./hooks/useAuth";
import { trackEvent } from "./utils/trackEvent";
import { supabase } from "./utils/supabaseClient";

export default function App() {
  const [tab, setTab] = useState("home");
  const [showNewSpaceForm, setShowNewSpaceForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const feedRef = useRef(null);

  const { user, setUser, authLoading } = useAuth();
  const { spaces, setSpaces, spacesLoading, defaultFeed, setDefaultFeed, saveDefaultFeed, activeFeed, setActiveFeed, uploadSpace, setUploadSpace, deleteSpace, renameSpace } = useSpaces(user);
  const { profile, setProfile, profileLoading } = useProfile(user, setDefaultFeed, setActiveFeed, setUploadSpace);
  const { feedItems, setFeedItems, itemsLoading, saveItemTags, toggleFavorite, deleteItem, deleteAllUserItemsAndStorage } = useItems(user);
  const { selectedItem, itemFavoriteDraft, setItemFavoriteDraft, itemTagsDraft, setItemTagsDraft, openItemModal, closeItemModal } = useItemModal();
  const { searchTerm, setSearchTerm, searchResults } = useSearch(feedItems);

  const currentFeed = activeFeed || defaultFeed;
  const currentFeedRecord = spaces.find((feed) => feed.name === currentFeed);
  const filteredFeedItems = feedItems.filter((item) => currentFeedRecord && item.space_id ? item.space_id === currentFeedRecord.id : item.space === currentFeed);

  useEffect(() => {
    if (!user) return;
    trackEvent("app_opened", { source: "app_start" });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const joinToken = params.get("join");
    if (!joinToken) return;

    let cancelled = false;
    async function joinSharedFeed() {
      const { data, error } = await supabase.rpc("join_feed_by_token", { share_token: joinToken });
      if (cancelled) return;
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("join");
      window.history.replaceState({}, "", cleanUrl.toString());
      if (error) {
        alert(error.message);
        return;
      }
      alert(data?.status === "owner" ? `This is already your ${data.feed_name} Feed.` : `You joined the ${data?.feed_name || "shared"} Feed!`);
      window.location.reload();
    }
    joinSharedFeed();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (authLoading) return null;
  if (!user) return <AuthScreen setUser={setUser} />;

  if (profileLoading || spacesLoading || itemsLoading) {
    return <div style={appStyle}><p style={{ color: "var(--text-secondary)", margin: "auto" }}>Loading your Looptie...</p></div>;
  }

  if (user && profile && !profile.has_completed_onboarding) {
    return <Onboarding user={user} setProfile={setProfile} onComplete={(newSpace) => {
      setSpaces([newSpace]); setDefaultFeed(newSpace.name); setActiveFeed(newSpace.name); setUploadSpace(newSpace.name); setTab("home");
    }} />;
  }

  return (
    <div style={appStyle}>
      <div style={contentStyle}>
        {tab === "home" && <HomeFeed spaces={spaces} activeFeed={currentFeed} setActiveFeed={setActiveFeed} feedRef={feedRef} filteredFeedItems={filteredFeedItems} setSelectedItem={openItemModal} onAddContent={() => setTab("add")} />}
        {tab === "spaces" && <Spaces user={user} spaces={spaces} setSpaces={setSpaces} defaultFeed={defaultFeed} setDefaultFeed={saveDefaultFeed} selectedSpace={selectedSpace} setSelectedSpace={setSelectedSpace} feedItems={feedItems} setFeedItems={setFeedItems} setSelectedItem={openItemModal} setShowNewSpaceForm={setShowNewSpaceForm} setUploadSpace={setUploadSpace} setTab={setTab} renameSpace={renameSpace} onDeleteSpace={(spaceName) => deleteSpace(spaceName, feedItems, setFeedItems, setSelectedSpace)} />}
        {tab === "search" && <SearchScreen searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchResults={searchResults} setSelectedItem={openItemModal} spaces={spaces} />}
        {tab === "add" && <AddContentScreen user={user} spaces={spaces} setSpaces={setSpaces} defaultFeed={defaultFeed} uploadSpace={uploadSpace} setUploadSpace={setUploadSpace} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} feedItems={feedItems} setFeedItems={setFeedItems} setActiveFeed={setActiveFeed} setTab={setTab} />}
        {tab === "profile" && <Profile items={feedItems} spaces={spaces} setSelectedItem={openItemModal} setTab={setTab} profile={profile} />}
        {tab === "settings" && <SettingsScreen profile={profile} spaces={spaces} defaultFeed={defaultFeed} setDefaultFeed={setDefaultFeed} setActiveFeed={setActiveFeed} setProfile={setProfile} setTab={setTab} user={user} deleteAllUserItemsAndStorage={deleteAllUserItemsAndStorage} />}
        {showNewSpaceForm && <CreateSpaceModal user={user} newSpaceName={newSpaceName} setNewSpaceName={setNewSpaceName} spaces={spaces} setSpaces={setSpaces} setSelectedSpace={setSelectedSpace} setShowNewSpaceForm={setShowNewSpaceForm} setTab={setTab} />}
        {selectedItem && <ItemDetailModal selectedItem={selectedItem} itemTagsDraft={itemTagsDraft} setItemTagsDraft={setItemTagsDraft} onClose={closeItemModal} itemFavoriteDraft={itemFavoriteDraft} setItemFavoriteDraft={setItemFavoriteDraft} onToggleFavorite={async () => { const nextFavorite = !itemFavoriteDraft; setItemFavoriteDraft(nextFavorite); await toggleFavorite(selectedItem, nextFavorite); }} onSaveTags={(tags) => saveItemTags(selectedItem, tags)} onDelete={() => deleteItem({ selectedItem, closeItemModal })} />}
      </div>
      <BottomNav defaultFeed={defaultFeed} setActiveFeed={setActiveFeed} setTab={setTab} setSelectedSpace={setSelectedSpace} />
    </div>
  );
}

const appStyle = {
  background: "var(--bg)",
  color: "var(--text-primary)",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, sans-serif",
};

const contentStyle = { flex: 1, overflow: "hidden" };