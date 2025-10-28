import Link from "next/link";

export default async function ComparePage({ searchParams }: any){
  const barcode = searchParams?.barcode || '';
  const alt = searchParams?.alt || '';

  async function fetchData(bc: string){
    if(!bc) return null;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${bc}`, { cache: 'no-store' });
    if(!res.ok) return null;
    return res.json();
  }

  const [a, b] = await Promise.all([fetchData(barcode), fetchData(alt)]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-3">Compare products</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="border p-2" style={{ borderColor: "var(--background-3)" }}>
          {!a ? <div>Pick first</div> : (
            <div>
              <div className="font-medium">{a.product?.name}</div>
              <div className="text-sm text-text-2">Rated {a.product?.rated}</div>
            </div>
          )}
        </div>
        <div className="border p-2" style={{ borderColor: "var(--background-3)" }}>
          {!b ? <div>Pick second</div> : (
            <div>
              <div className="font-medium">{b.product?.name}</div>
              <div className="text-sm text-text-2">Rated {b.product?.rated}</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-sm text-text-2">Paste another barcode as `alt` query to compare.</div>
      <div className="mt-3 flex gap-2">
        <Link href="/app" className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}>Back</Link>
      </div>
    </div>
  );
}


