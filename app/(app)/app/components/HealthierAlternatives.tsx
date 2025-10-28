"use client";

import {
  productRateBenchmarks,
  productRateTags,
  rateIndexColors,
} from "@/constants";
import { ProductNutrients, Products } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HealthierAlternativesProps {
  productId: string;
  currentProductRating: number;
  productName?: string;
}

interface NutritionComparison {
  calories: number;
  protein: number;
  sugar: number;
  sodium: number;
}

interface AlternativeProduct extends Products {
  nutrients: ProductNutrients[];
  healthScore: number;
  nutritionComparison: NutritionComparison;
  source?: string;
  alternativeType?: string;
}

export default function HealthierAlternatives({
  productId,
  currentProductRating,
  productName = "",
}: HealthierAlternativesProps) {
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/healthier-alternatives/${productId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch alternatives");
        }

        const data = await response.json();
        setAlternatives(data);
      } catch (err) {
        console.error("Error fetching alternatives:", err);
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchAlternatives();
    }
  }, [productId]);

  // Don't show anything if no alternatives found
  if (!loading && alternatives.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="pt-6">
        <div className="flex items-center gap-2 pb-4">
          <h3 className="font-semibold text-lg text-primary">
            🔍 Finding Healthier Alternatives
          </h3>
          
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-24 h-24 bg-background-3 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-background-3 rounded w-3/4"></div>
                <div className="h-3 bg-background-3 rounded w-1/2"></div>
                <div className="h-3 bg-background-3 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-center gap-2 pb-4">
        <h3 className="font-semibold text-lg text-primary">
          🌱 Healthier Alternatives
        </h3>
        <span className="text-sm text-text-2">
          ({alternatives.length} found)
        </span>
      </div>

      <div className="space-y-4">
        {alternatives.map((product, index) => {
          // Determine rating and color
          let productRate;
          if (product.source && product.source !== "database") {
            // External product rating (lower = better)
            if (product.rated <= 30) {
              productRate = { tag: "Excellent", color: "#49a160" };
            } else if (product.rated <= 50) {
              productRate = { tag: "Good", color: "#30cc70" };
            } else if (product.rated <= 70) {
              productRate = { tag: "Fair", color: "#e57e24" };
            } else {
              productRate = { tag: "Poor", color: "#ec4a3c" };
            }
          } else {
            // Internal database rating (higher = better)
            const productRateIndex = productRateBenchmarks.findIndex(
              (benchmark) => product.rated >= benchmark
            );
            productRate = {
              tag: productRateTags[productRateIndex] || "Unknown",
              color: rateIndexColors[productRateIndex] || "#999999",
            };
          }

          // Calculate improvements
          const improvements = [];
          if (product.nutritionComparison) {
            if (product.nutritionComparison.calories < -10) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.calories).toFixed(0)} fewer calories`
              );
            }
            if (product.nutritionComparison.protein > 1) {
              improvements.push(
                `${product.nutritionComparison.protein.toFixed(1)}g more protein`
              );
            }
            if (product.nutritionComparison.sugar < -2) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.sugar).toFixed(1)}g less sugar`
              );
            }
            if (product.nutritionComparison.sodium < -50) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.sodium).toFixed(0)}mg less sodium`
              );
            }
          }

          // Determine if external product
          const isExternalProduct = product.source && product.source !== "database";
          const productLink = isExternalProduct
            ? product.source === "OpenFoodFacts"
              ? `https://world.openfoodfacts.org/product/${product.barcode}`
              : `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${product.id}`
            : `/app/product/${product.barcode}`;

          return (
            <a
              key={`${product.id}-${index}`}
              href={productLink}
              target={isExternalProduct ? "_blank" : "_self"}
              rel={isExternalProduct ? "noopener noreferrer" : undefined}
              className="group block hover:bg-background-2 rounded-xl p-3 -m-3 transition-all duration-200"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: "var(--background-3)" }}>
                  <Image
                    src={product.image || "/no-image.webp"}
                    alt={product.name || "Product"}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    width={96}
                    height={96}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/no-image.webp";
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <h4 className="font-medium group-hover:underline line-clamp-2 text-sm">
                    {product.name}
                  </h4>
                  
                  {(product.brandName || product.brandOwner) && (
                    <p className="text-text-2 text-xs line-clamp-1">
                      {product.brandName || product.brandOwner}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="rounded-full w-3 h-3"
                      style={{ backgroundColor: productRate.color }}
                    ></div>
                    <span className="font-medium">
                      {productRate.tag} ({product.rated}/100)
                    </span>
                  </div>

                  {/* Improvements */}
                  {improvements.length > 0 && (
                    <div className="pt-1 space-y-0.5">
                      {improvements.slice(0, 3).map((improvement, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-primary flex items-center gap-1"
                        >
                          <span className="text-primary">✓</span>
                          {improvement}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Source Badge */}
                  {isExternalProduct && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--background-3)" }}>
                        {product.source === "OpenFoodFacts" ? "🌍" : "🏛️"}
                        {product.source}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="pt-3 text-xs text-text-2 text-center italic">
        💡 Alternatives found using AI-powered search across multiple databases
      </div>
    </div>
  );
}