import { ProductCard } from "@/(app)/components";
import Link from "next/link";
import { ProductNutrients, Products } from "@prisma/client";
// import { Metadata } from 'next'
 
// export const metadata: Metadata = {
//   title: 'Next.js',
// }

async function fetchData(barcode: string): Promise<{product: Products, nutrients: ProductNutrients[]}> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${barcode}`);
  return await response.json();
}; 

export default async function page(
  { params }:
  { params: { barcode: string } }
 ) {

  const { product, nutrients } = await fetchData( params.barcode );

  return (
    <div className="p-4 flex flex-col gap-4">
      {product && <ProductCard product={product} nutrients={nutrients} />}
      {product && (
        <div className="border p-3 flex gap-2 flex-wrap" style={{ borderColor: "var(--background-3)" }}>
          <form action={`/api/diet/add`} method="post" className="flex gap-2 items-center" onSubmit={(e)=>{e.preventDefault();}}>
            <button className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}
              onClick={async()=>{
                await fetch('/api/diet/add',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: product.name, calories: 0, protein: 0, carbs: 0, fat: 0 })});
                alert('Added to today\'s plan');
              }}
            >Add to plan</button>
            <button className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}
              onClick={async()=>{
                await fetch('/api/pantry',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: product.name, barcode: product.barcode, quantity: 1 })});
                alert('Added to pantry');
              }}
            >Add to pantry</button>
            <Link href={`/app/compare?barcode=${product.barcode}`} className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}>Compare</Link>
            <button className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}
              onClick={async()=>{
                await fetch('/api/favorites',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: product.name, barcode: product.barcode, image: product.image, brand: product.brandName || product.brandOwner })});
                alert('Saved to favorites');
              }}
            >Save to favorites</button>
          </form>
        </div>
      )}
    </div>
  )
}
