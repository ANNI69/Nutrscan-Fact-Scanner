import { ProductCard } from "@/(app)/components";
import { ProductActions } from "@/(app)/components/ProductActions"; // adjust path as needed
import { ProductNutrients, Products } from "@prisma/client";

async function fetchData(barcode: string): Promise<{product: Products, nutrients: ProductNutrients[]}> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${barcode}`);
  return await response.json();
}

export default async function page(
  { params }:
  { params: { barcode: string } }
) {
  const { product, nutrients } = await fetchData(params.barcode);

  return (
    <div className="p-4 flex flex-col gap-4">
      {product && <ProductCard product={product} nutrients={nutrients} />}
      {/* {product && <ProductActions product={product} />} */}
    </div>
  );
}