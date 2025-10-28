'use client'

import Link from "next/link";

interface ProductActionsProps {
  product: {
    name: string;
    barcode: string;
    image: string | null;
    brandName: string | null;
    brandOwner: string | null;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const handleAddToPlan = async () => {
    await fetch('/api/diet/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })
    });
    alert('Added to today\'s plan');
  };

  const handleAddToPantry = async () => {
    await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        barcode: product.barcode,
        quantity: 1
      })
    });
    alert('Added to pantry');
  };

  const handleSaveToFavorites = async () => {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        barcode: product.barcode,
        image: product.image,
        brand: product.brandName || product.brandOwner
      })
    });
    alert('Saved to favorites');
  };

  return (
    <div className="border p-3 flex gap-2 flex-wrap" style={{ borderColor: "var(--background-3)" }}>
      <button
        className="border px-3 py-1"
        style={{ borderColor: "var(--background-3)" }}
        onClick={handleAddToPlan}
      >
        Add to plan
      </button>
      <button
        className="border px-3 py-1"
        style={{ borderColor: "var(--background-3)" }}
        onClick={handleAddToPantry}
      >
        Add to pantry
      </button>
      <Link
        href={`/app/compare?barcode=${product.barcode}`}
        className="border px-3 py-1"
        style={{ borderColor: "var(--background-3)" }}
      >
        Compare
      </Link>
      <button
        className="border px-3 py-1"
        style={{ borderColor: "var(--background-3)" }}
        onClick={handleSaveToFavorites}
      >
        Save to favorites
      </button>
    </div>
  );
}