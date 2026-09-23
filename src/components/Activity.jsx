import { UserPlus, UserMinus, MessageCircle, BookmarkPlus } from "lucide-react";

function labelFor(a, spaces, items) {
  const feed=spaces.find(s=>s.id===a.feed_id);
  const item=items.find(i=>i.id===a.item_id);
  const feedName=feed?.name || "a shared Feed";
  const actor=a.actor_name || "Someone";
  if(a.event_type==="item_added") return {text:`${actor} added a save to ${feedName}`, icon:BookmarkPlus, item};
  if(a.event_type==="note_added") return {text:`${actor} added a note in ${feedName}`, icon:MessageCircle, item};
  if(a.event_type==="member_joined") return {text:`${actor} joined ${feedName}`, icon:UserPlus, feed};
  if(a.event_type==="member_left") return {text:`${actor} left ${feedName}`, icon:UserMinus, feed};
  return {text:`You were removed from ${feedName}`, icon:UserMinus, feed};
}
export default function Activity({activities,spaces,items,onOpenItem,onOpenFeed}){
  if(!activities.length) return <div style={empty}><h2 style={{margin:"0 0 8px"}}>No activity yet</h2><p style={{margin:0}}>Updates from your shared Feeds will show up here.</p></div>;
  return <div style={list}>{activities.map(a=>{const x=labelFor(a,spaces,items); const Icon=x.icon; return <button key={a.id} style={{...row,background:a.read_at?"var(--surface)":"var(--accent-bg)"}} onClick={()=>x.item?onOpenItem(x.item):x.feed&&onOpenFeed(x.feed)}><span style={icon}><Icon size={18}/></span><span style={body}><strong style={copy}>{x.text}</strong><span style={time}>{new Date(a.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span></span>{!a.read_at&&<span style={dot}/>}</button>})}</div>;
}
const list={display:"flex",flexDirection:"column",gap:"10px",padding:"0 10px 110px"};
const row={width:"100%",border:"1px solid var(--border)",borderRadius:"18px",padding:"14px",color:"var(--text-primary)",display:"flex",alignItems:"center",gap:"12px",textAlign:"left",cursor:"pointer"};
const icon={width:"38px",height:"38px",borderRadius:"999px",background:"var(--surface-elevated)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--brand)",flexShrink:0};
const body={display:"flex",flexDirection:"column",gap:"4px",flex:1};
const copy={fontSize:"var(--text-sm)",lineHeight:1.35};
const time={fontSize:"11px",color:"var(--text-secondary)"};
const dot={width:"8px",height:"8px",borderRadius:"999px",background:"var(--brand)",flexShrink:0};
const empty={margin:"64px auto",maxWidth:"340px",padding:"0 24px",textAlign:"center",color:"var(--text-secondary)"};
