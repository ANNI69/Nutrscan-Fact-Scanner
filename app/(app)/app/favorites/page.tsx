"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FavoritesPage(){
  const [items, setItems] = useState<any[]>([]);

  const load = async()=>{
    const res = await fetch('/api/favorites');
    const data = await res.json();
    setItems(data?.items||[]);
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-3">Favorites</h1>
      {items.length===0 && <div className="text-sm text-text-2">No favorites yet. Open a product and tap “Save to Favorites”.</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((it:any)=> (
          <div key={it.id} className="border p-2 flex flex-col gap-2" style={{ borderColor: "var(--background-3)" }}>
            <div className="w-full aspect-square bg-background-1 flex items-center justify-center overflow-hidden">
              {it.image ? <Image src={it.image} alt={it.name} width={200} height={200} className="object-contain w-full h-full"/> : <div className="text-xs text-text-2">No image</div>}
            </div>
            <div className="text-sm font-medium line-clamp-2">{it.name}</div>
            <div className="text-xs text-text-2">{it.brand||''}</div>
            <div className="flex gap-2 mt-auto">
              <button className="border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
                await fetch('/api/diet/add',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: it.name, calories: 0, protein: 0, carbs: 0, fat: 0 })});
                alert('Added to today\'s plan');
              }}>Add to plan</button>
              <button className="border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
                await fetch(`/api/favorites?id=${it.id}`,{ method:'DELETE' }); load();
              }}>Remove</button>
              {it.barcode && <Link href={`/app/compare?barcode=${it.barcode}`} className="border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }}>Compare</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


