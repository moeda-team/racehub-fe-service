"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ApiResponse, CheckinParticipant } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

// A deliberately isolated field page: it never mounts organizer auth or links
// to dashboard/wallet screens. Volunteers receive only an event ID + code.
export default function VolunteerRPCPage() {
  const [eventId,setEventId]=useState("");const [code,setCode]=useState("");const [query,setQuery]=useState("");const [items,setItems]=useState<CheckinParticipant[]>([]);const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false);
  const opts={auth:false,headers:{"X-RPC-Access-Code":code}};
  async function search(e:React.FormEvent){e.preventDefault();setError(null);setBusy(true);try{const r=await api.get<ApiResponse<CheckinParticipant[]>>(`/api/v1/events/${eventId}/checkin/search?q=${encodeURIComponent(query)}`,opts);setItems(r.data??[])}catch(e){setError(e instanceof ApiError?e.message:"Akses atau peserta tidak ditemukan.")}finally{setBusy(false)}}
  async function collect(p:CheckinParticipant){try{const r=await api.post<ApiResponse<CheckinParticipant>>(`/api/v1/events/${eventId}/checkin`,{registration_id:p.id,stage:"rpc"},opts);setItems(prev=>prev.map(x=>x.id===p.id?r.data:x))}catch(e){setError(e instanceof ApiError?e.message:"Check-in gagal.")}}
  return <main style={{minHeight:"100vh",background:"var(--color-ink)",color:"white",padding:20,maxWidth:560,margin:"0 auto"}}><h1 style={{fontFamily:"var(--font-display)",fontSize:26}}>Pengambilan Racepack</h1><p style={{color:"var(--color-ink-4)",fontSize:14}}>Masukkan akses dari organizer. Halaman ini tidak memberi akses ke dashboard atau wallet.</p>{error&&<Alert variant="danger" className="mb-4">{error}</Alert>}<form onSubmit={search} style={{display:"grid",gap:10}}><input placeholder="ID Event" value={eventId} onChange={e=>setEventId(e.target.value)} style={input}/><input placeholder="Kode akses RPC" value={code} onChange={e=>setCode(e.target.value)} style={input}/><input placeholder="Cari nama, BIB, atau registrasi" value={query} onChange={e=>setQuery(e.target.value)} style={input}/><Button type="submit" variant="primary" disabled={busy||!eventId||!code||!query}>{busy?"Mencari…":"Cari peserta"}</Button></form><div style={{display:"grid",gap:8,marginTop:20}}>{items.map(p=><div key={p.id} style={{background:"#fff",color:"var(--color-ink)",padding:14,borderRadius:12,display:"flex",justifyContent:"space-between",gap:8}}><span><b>{p.name}</b><br/><small>{p.bib_number||p.registration_number} · {p.age_class||"—"}</small></span><Button size="sm" variant={p.rpc_status==="collected"?"secondary":"primary"} onClick={()=>collect(p)} disabled={p.rpc_status==="collected"}>{p.rpc_status==="collected"?"Sudah diambil":"Tandai ambil"}</Button></div>)}</div></main>;
}
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px",borderRadius:8,border:"1px solid var(--color-ink-2)",background:"#fff",color:"var(--color-ink)"};
