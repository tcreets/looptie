const deleteSpace = async (spaceName, feedItems, setFeedItems, setSelectedSpace) => {
    if (!user) return;
  
    const confirmDelete = window.confirm(
      `Delete "${spaceName}" and all items inside it?`
    );
  
    if (!confirmDelete) return;
  
    const itemsInSpace = feedItems.filter((item) => item.space === spaceName);
  
    const filePaths = itemsInSpace
      .map((item) => item.image)
      .filter(Boolean)
      .map((url) => {
        const marker = "/storage/v1/object/public/items/";
        return url.includes(marker) ? url.split(marker)[1] : null;
      })
      .filter(Boolean);
  
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("items")
        .remove(filePaths);
  
      if (storageError) {
        console.error("Error deleting storage files:", storageError);
        return;
      }
    }
  
    const { error: itemError } = await supabase
      .from("items")
      .delete()
      .eq("space", spaceName)
      .eq("user_id", user.id);
  
    if (itemError) {
      console.error("Error deleting space items:", itemError);
      return;
    }
  
    const { error: spaceError } = await supabase
      .from("spaces")
      .delete()
      .eq("name", spaceName)
      .eq("user_id", user.id);
  
    if (spaceError) {
      console.error("Error deleting space:", spaceError);
      return;
    }
  
    setFeedItems((prev) => prev.filter((item) => item.space !== spaceName));
  
    const remainingSpaces = spaces.filter((space) => space !== spaceName);
    setSpaces(remainingSpaces);
  
    if (remainingSpaces.length > 0) {
      setActiveFeed(remainingSpaces[0]);
      setDefaultFeed(remainingSpaces[0]);
      setUploadSpace(remainingSpaces[0]);
    } else {
      setActiveFeed("");
      setDefaultFeed("");
      setUploadSpace("");
    }
  
    setSelectedSpace(null);
  };