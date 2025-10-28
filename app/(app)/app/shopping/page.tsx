"use client";

import { useEffect, useState } from "react";

export default function ShoppingPage(){
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [loading, setLoading] = useState(false);

  const load = async()=>{
    setLoading(true);
    try{
      const res = await fetch('/api/shopping');
      const data = await res.json();
      setItems(data?.items||[]);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Shopping list</h1>
      <div className="border p-3 flex flex-col sm:flex-row gap-2 sm:items-end" style={{ borderColor: "var(--background-3)" }}>
        <div>
          <label className="text-sm text-text-2">Item</label>
          <input className="border p-2" style={{ borderColor: "var(--background-3)" }} value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-text-2">Qty</label>
          <input type="number" className="border p-2 w-20" style={{ borderColor: "var(--background-3)" }} value={quantity} onChange={e=>setQuantity(e.target.value)} />
        </div>
        <button className="border px-3 py-2" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
          await fetch('/api/shopping', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, quantity }) });
          setName(""); setQuantity("1"); load();
        }}>Add</button>
        <button className="border px-3 py-2 sm:ml-auto" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
          // Build shopping list from today's plan + favorites
          setLoading(true);
          try{
            const today = new Date();
            const dateStr = today.toISOString().slice(0,10);
            const [planRes, favRes] = await Promise.all([
              fetch(`/api/diet/plans?date=${dateStr}`),
              fetch(`/api/favorites`),
            ]);
            const planData = await planRes.json();
            const favData = await favRes.json();
            const plan = planData?.plan;
            const favs: any[] = favData?.items || [];
            if(!plan || !plan.meals || favs.length===0){ setLoading(false); return; }
            // Keyword map from meal names to favorites
            const addReqs: Promise<any>[] = [];
            const normalize = (s:string)=> (s||'').toLowerCase();
            plan.meals.forEach((m:any)=>{
              const words = normalize(m.name).split(/\s+/);
              const matches = favs.filter(f=> {
                const n = normalize(f.name);
                return words.some(w=> w.length>2 && n.includes(w));
              }).slice(0,3);
              const qty = m.calories>500? 2 : 1; // simple quantity based on meal size
              matches.forEach(match=>{
                addReqs.push(fetch('/api/shopping', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: match.name, barcode: match.barcode, quantity: qty }) }));
              });
            });
            await Promise.all(addReqs);
            await load();
          } finally { setLoading(false); }
        }}>Generate from plan</button>
      </div>
      {loading ? <div>Loading…</div> : (
        <div className="grid gap-2">
          {items.map((it:any)=>(
            <div key={it.id} className="border p-2 flex justify-between items-center" style={{ borderColor: "var(--background-3)" }}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!it.checked} onChange={async()=>{ await fetch('/api/shopping', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ id: it.id, checked: !it.checked }) }); load(); }} />
                <div className={it.checked? 'line-through text-text-2' : ''}>{it.name} <span className="text-xs text-text-2">x{it.quantity}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <button className="border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{ await fetch('/api/shopping',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ id: it.id, quantity: Math.max(1, (it.quantity||1)-1) }) }); load(); }}>-</button>
                <button className="border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{ await fetch('/api/shopping',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ id: it.id, quantity: (it.quantity||1)+1 }) }); load(); }}>+</button>
                <button className="text-sm" onClick={async()=>{ await fetch(`/api/shopping?id=${it.id}`, { method:'DELETE' }); load(); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length>0 && (
        <div className="pt-2 flex justify-end">
          <button className="border px-3 py-2" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
            await Promise.all(items.filter((i:any)=>i.checked).map((i:any)=> fetch(`/api/shopping?id=${i.id}`,{ method:'DELETE' }) ));
            load();
          }}>Clear purchased</button>
        </div>
      )}
    </div>
  );
}


