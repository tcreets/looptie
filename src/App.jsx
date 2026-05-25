import React, { useRef, useState } from "react";
import "./App.css";

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
import { useSpaces } from "./hooks/useSpaces";
import { useProfile } from "./hooks/useProfile";
import { useItems } from "./hooks/useItems";
import { useItemModal } from "./hooks/useItemModal";
import { useSearch } from "./hooks/useSearch";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [tab, setTab] = useState("home");
  const [showNewSpaceForm, setShowNewSpaceForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const feedRef = useRef(null);

  const {
    user,
    setUser,
    authLoading,
  } = useAuth();
 
  const {
    spaces,
    setSpaces,
    defaultFeed,
    setDefaultFeed,
    saveDefaultFeed,
    activeFeed,
    setActiveFeed,
    uploadSpace,
    setUploadSpace,
    deleteSpace,
  } = useSpaces(user);

  const {
    profile,
    setProfile,
    profileLoading,
  } = useProfile(user, setDefaultFeed, setActiveFeed, setUploadSpace);

  const {
    feedItems,
    setFeedItems,
    saveItemMemo,
    deleteItem,
    deleteAllUserItemsAndStorage,
  } = useItems(user);

  const {
    selectedItem,
    itemNoteDraft,
    setItemNoteDraft,
    itemFavoriteDraft,
    setItemFavoriteDraft,
    openItemModal,
    closeItemModal,
  } = useItemModal();

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
  } = useSearch(feedItems);

  
  const filteredFeedItems = feedItems.filter(
    (item) => item.space === activeFeed
  );

  if (authLoading) return null;

  if (!user) {
    return <AuthScreen setUser={setUser} />;
  }
  
  if (profileLoading) {
    return (
      <div style={appStyle}>
        <p style={{ color: "#a1a1aa", margin: "auto" }}>
          Loading your Looptie...
        </p>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <ProfileSetup
        user={user}
        spaces={spaces}
        setSpaces={setSpaces}
        setProfile={setProfile}
        setDefaultFeed={setDefaultFeed}
        setActiveFeed={setActiveFeed}
        setUploadSpace={setUploadSpace}
        setSelectedSpace={setSelectedSpace}
        setTab={setTab}

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
          setDefaultFeed={saveDefaultFeed}
          selectedSpace={selectedSpace}
          setSelectedSpace={setSelectedSpace}
          feedItems={feedItems}
          setSelectedItem={openItemModal}
          setShowNewSpaceForm={setShowNewSpaceForm}
          setUploadSpace={setUploadSpace}
          setTab={setTab}
          onDeleteSpace={(spaceName) =>
            deleteSpace(spaceName, feedItems, setFeedItems, setSelectedSpace)
          }
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
          user={user}
          deleteAllUserItemsAndStorage={deleteAllUserItemsAndStorage}
        />
        )}

        {showNewSpaceForm && (
          <CreateSpaceModal
            user={user}
            newSpaceName={newSpaceName}
            setNewSpaceName={setNewSpaceName}
            spaces={spaces}
            setSpaces={setSpaces}
            setSelectedSpace={setSelectedSpace}
            setShowNewSpaceForm={setShowNewSpaceForm}
            setTab={setTab}
          />
        )}

        {selectedItem && (
          <ItemDetailModal
            selectedItem={selectedItem}
            itemNoteDraft={itemNoteDraft}
            setItemNoteDraft={setItemNoteDraft}
            onClose={closeItemModal}
            itemFavoriteDraft={itemFavoriteDraft}
            setItemFavoriteDraft={setItemFavoriteDraft}
            onSave={() =>
              saveItemMemo({
                selectedItem,
                itemNoteDraft,
                itemFavoriteDraft,
                closeItemModal,
              })
            }
            onDelete={() =>
              deleteItem({
                selectedItem,
                closeItemModal,
              })
            }
          />
        )}
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