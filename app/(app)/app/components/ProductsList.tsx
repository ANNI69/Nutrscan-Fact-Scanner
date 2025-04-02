import { Products } from "@prisma/client";
import { ProductCard } from "@/(app)/components";
import Link from 'next/link';
import { ProductSkeleton } from "@/(app)/components/skeleton";

const fetchData = async (): Promise<Products[] | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/`, { 
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};

export default async function ProductsList() {
  const products = await fetchData();
  
  return (
    <div className="flex flex-col gap-4">
      {products && products.length > 0 ? (
        products.map((product) => (
          <Link href={`/app/product/${product.barcode}`} key={product.id} className="border-b pb-4 last:border-0 last:pb-0 border-background-1"> 
            <ProductCard product={product} />
          </Link>
        ))
      ) : (
        Array.from({length: 8}, (_, index) => (
          <ProductSkeleton key={index} />
        ))
      )}
    </div>
  )
}