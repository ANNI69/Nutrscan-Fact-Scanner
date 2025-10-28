"use client";

import { useEffect, useState } from "react";

export default function PantryPage(){
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const load = async()=>{
    const res = await fetch('/api/pantry');
    const data = await res.json();
    setItems(data?.items||[]);
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Pantry</h1>
      <div className="border p-3 flex gap-2 items-end" style={{ borderColor: "var(--background-3)" }}>
        <div>
          <label className="text-sm text-text-2">Item</label>
          <input className="border p-2" style={{ borderColor: "var(--background-3)" }} value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-2">Qty</label>
          <input type="number" className="border p-2 w-20" style={{ borderColor: "var(--background-3)" }} value={quantity} onChange={e=>setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-2">Expires</label>
          <input type="date" className="border p-2" style={{ borderColor: "var(--background-3)" }} value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
        </div>
        <button className="border px-3 py-2" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
          await fetch('/api/pantry', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, quantity, expiresAt }) });
          setName(""); setQuantity("1"); setExpiresAt(""); load();
        }}>Add</button>
      </div>
      <div className="grid gap-2">
        {items.map((it:any)=>(
          <div key={it.id} className="border p-2 flex justify-between" style={{ borderColor: "var(--background-3)" }}>
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-text-2">Qty {it.quantity} {it.expiresAt ? `• exp ${String(it.expiresAt).slice(0,10)}`:''}</div>
            </div>
            <button className="text-sm" onClick={async()=>{ await fetch(`/api/pantry?id=${it.id}`, { method:'DELETE' }); load(); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}


