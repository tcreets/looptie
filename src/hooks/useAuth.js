import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function getInitialSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
      setAuthLoading(false);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    setUser,
    authLoading,
  };
}