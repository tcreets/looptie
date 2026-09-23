import { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useActivity(user) {
  const [activities,setActivities]=useState([]);
  const [loading,setLoading]=useState(false);
  const loadActivity=useCallback(async()=>{
    if(!user){setActivities([]);return;}
    setLoading(true);
    const {data,error}=await supabase.from("activity").select("*").order("created_at",{ascending:false}).limit(100);
    if(error) console.error("Error loading activity:",error); else setActivities(data||[]);
    setLoading(false);
  },[user?.id]);
  useEffect(()=>{loadActivity();},[loadActivity]);
  const markAllRead=useCallback(async()=>{
    if(!user) return;
    const now=new Date().toISOString();
    const {error}=await supabase.from("activity").update({read_at:now}).eq("recipient_id",user.id).is("read_at",null);
    if(!error) setActivities(prev=>prev.map(a=>a.read_at?a:{...a,read_at:now}));
  },[user?.id]);
  return {activities,activityLoading:loading,hasUnreadActivity:activities.some(a=>!a.read_at),markAllRead,refreshActivity:loadActivity};
}
