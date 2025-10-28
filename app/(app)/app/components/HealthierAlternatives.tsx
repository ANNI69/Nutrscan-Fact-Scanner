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
  productName?: string; // Add product name for better category matching
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
  alternativeType?: string; // Add type to distinguish healthier vs similar
}

export default function HealthierAlternatives({
  productId,
  currentProductRating,
  productName = "",
}: HealthierAlternativesProps) {
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        setLoading(true);
        setError("");
        setSearchAttempted(false);

        const response = await fetch(
          `/api/healthier-alternatives/${productId}`
        );

        setSearchAttempted(true);

        if (!response.ok) {
          throw new Error("Failed to fetch alternatives");
        }

        const data = await response.json();

        // Filter out invalid alternatives (should be done server-side but adding client-side backup)
        const validAlternatives = data.filter((alt: AlternativeProduct) => {
          // Basic validation
          if (!alt.name || alt.name.trim() === "") return false;

          // If we have product name, do basic category matching
          if (productName) {
            const originalLower = productName.toLowerCase();
            const altLower = alt.name.toLowerCase();

            // Simple category checks
            const isBiscuitProduct =
              originalLower.includes("biscuit") ||
              originalLower.includes("cookie") ||
              originalLower.includes("cracker");
            const isDrinkProduct =
              originalLower.includes("drink") ||
              originalLower.includes("juice") ||
              originalLower.includes("water") ||
              originalLower.includes("soda");

            const altIsBiscuit =
              altLower.includes("biscuit") ||
              altLower.includes("cookie") ||
              altLower.includes("cracker");
            const altIsDrink =
              altLower.includes("drink") ||
              altLower.includes("juice") ||
              altLower.includes("water") ||
              altLower.includes("soda") ||
              altLower.includes("fizz") ||
              altLower.includes("cola");

            // Don't show drinks for biscuits and vice versa
            if (isBiscuitProduct && altIsDrink) return false;
            if (isDrinkProduct && altIsBiscuit) return false;
          }

          return true;
        });

        setAlternatives(validAlternatives);
      } catch (err) {
        setError("Failed to load alternatives");
        console.error("Error fetching alternatives:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchAlternatives();
    }
  }, [productId, productName]);

  // Loading state
  if (loading) {
    return (
      <>
        <div className="flex justify-between items-center pt-6 pb-2">
          <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
            🔍 Finding Alternatives
            <span className="text-sm font-normal text-primary-3">
              (Searching OpenFoodFacts & USDA)
            </span>
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-1/3 bg-text-2 aspect-square rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-text-2 rounded w-3/4"></div>
                <div className="h-3 bg-text-2 rounded w-1/2"></div>
                <div className="h-3 bg-text-2 rounded w-2/3"></div>
                <div className="h-3 bg-text-2 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Error state - only show if there's an actual error
  if (error) {
    return (
      <>
        <div className="flex justify-between items-center pt-6 pb-2">
          <h3 className="font-semibold text-lg text-text-2 flex items-center gap-2">
            🔍 Product Alternatives
            <span className="text-sm font-normal text-primary-3">
              (OpenFoodFacts & USDA)
            </span>
          </h3>
        </div>
        <div className="p-4 bg-text-4 rounded-xl border border-text-3">
          <p className="text-text-2 text-sm text-center">
            Unable to find alternatives at the moment. Please try again later.
          </p>
        </div>
      </>
    );
  }

  // Don't render anything if no alternatives and no search attempted yet
  if (!searchAttempted || alternatives.length === 0) {
    return null;
  }

  // Determine if we have healthier alternatives or just similar products
  const hasHealthierAlternatives = alternatives.some(
    (alt) => alt.alternativeType === "healthier"
  );

  return (
    <>
      <div className="flex justify-between items-center pt-6 pb-2">
        <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
          {/* Dynamic title based on alternative types */}
          {hasHealthierAlternatives
            ? "🌱 Healthier Alternatives"
            : "🔄 Similar Products"}
          <span className="text-sm font-normal text-primary-3">
            ({alternatives.length} found from OpenFoodFacts & USDA)
          </span>
        </h3>
      </div>

      {/* Show info message if showing similar instead of healthier */}
      {!hasHealthierAlternatives && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Good news!</span> This product is
            already quite healthy in its category. Here are similar products you
            might also enjoy:
          </p>
        </div>
      )}

      <div className="space-y-4">
        {alternatives.map((product) => {
          // For external products, use a different rating system
          let productRate;
          if (product.source && product.source !== "database") {
            // External product rating system - adjusted thresholds
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
            // Regular product rating system (higher = better)
            const productRateIndex = productRateBenchmarks.findIndex(
              (benchmark) => product.rated >= benchmark
            );
            productRate = {
              tag: productRateTags[productRateIndex] || "Unknown",
              color: rateIndexColors[productRateIndex] || "#999999",
            };
          }

          // Get nutrition improvements or similarities
          const improvements = [];
          const isHealthierAlternative =
            product.alternativeType === "healthier";

          if (isHealthierAlternative) {
            // Show improvements for healthier alternatives
            if (product.nutritionComparison?.calories < 0) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.calories).toFixed(
                  0
                )} fewer calories`
              );
            }
            if (product.nutritionComparison?.protein > 0) {
              improvements.push(
                `${product.nutritionComparison.protein.toFixed(
                  1
                )}g more protein`
              );
            }
            if (product.nutritionComparison?.sugar < 0) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.sugar).toFixed(
                  1
                )}g less sugar`
              );
            }
            if (product.nutritionComparison?.sodium < 0) {
              improvements.push(
                `${Math.abs(product.nutritionComparison.sodium).toFixed(
                  0
                )}mg less sodium`
              );
            }
          } else {
            // Show similarities for similar products
            if (product.nutritionComparison) {
              if (Math.abs(product.nutritionComparison.calories) < 50) {
                improvements.push("Similar calorie content");
              }
              if (Math.abs(product.nutritionComparison.sugar) < 5) {
                improvements.push("Comparable sweetness");
              }
              if (product.nutritionComparison.protein > 0) {
                improvements.push(
                  `+${product.nutritionComparison.protein.toFixed(1)}g protein`
                );
              }
              // Always show at least one similarity message
              if (improvements.length === 0) {
                improvements.push("Similar nutritional profile");
              }
            }
          }

          // Handle external products differently
          const isExternalProduct =
            product.source && product.source !== "database";
          const productLink = isExternalProduct
            ? product.source === "OpenFoodFacts"
              ? `https://world.openfoodfacts.org/product/${product.barcode}`
              : product.source === "USDA"
              ? `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${product.id}`
              : "#"
            : `/app/product/${product.barcode}`;

          return (
            <a
              key={`${product.id}-${product.source || "db"}`}
              href={productLink}
              target={isExternalProduct ? "_blank" : "_self"}
              rel={isExternalProduct ? "noopener noreferrer" : undefined}
              className="group block hover:bg-text-4 rounded-xl p-2 -m-2 transition-colors"
            >
              <div className="flex gap-4">
                <div className="w-1/3 overflow-hidden rounded-xl">
                  <Image
                    src={product.image || "/no-image.webp"}
                    alt={product.name || "Product image"}
                    className="w-full h-full object-contain bg-text aspect-square group-hover:scale-105 transition-transform duration-300"
                    width={170}
                    height={170}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/no-image.webp";
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="font-normal group-hover:underline line-clamp-2">
                    {product.name}
                  </h3>
                  {(product.brandName || product.brandOwner) && (
                    <p className="text-text-2 font-light text-sm line-clamp-1">
                      {product.brandName || product.brandOwner}
                    </p>
                  )}

                  {/* Nutrition improvements or similarities */}
                  {improvements.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {improvements.slice(0, 2).map((improvement, idx) => (
                        <div
                          key={idx}
                          className={`text-xs font-medium flex items-center gap-1 ${
                            isHealthierAlternative
                              ? "text-primary"
                              : "text-blue-600"
                          }`}
                        >
                          <span
                            className={
                              isHealthierAlternative
                                ? "text-primary"
                                : "text-blue-600"
                            }
                          >
                            {isHealthierAlternative ? "✓" : "≈"}
                          </span>
                          {improvement}
                        </div>
                      ))}
                      {improvements.length > 2 && (
                        <div className="text-xs text-primary-3 font-medium">
                          +{improvements.length - 2} more{" "}
                          {isHealthierAlternative
                            ? "improvements"
                            : "similarities"}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm pt-2">
                    <div
                      className="rounded-2xl w-4 h-4"
                      style={{ backgroundColor: productRate.color }}
                    ></div>
                    <p>
                      {productRate.tag} <i>({product.rated}/100)</i>
                    </p>
                  </div>

                  {/* Source indicator */}
                  {isExternalProduct && (
                    <div className="pt-1 flex items-center gap-1">
                      <span className="text-xs text-primary-3 font-medium">
                        {product.source === "OpenFoodFacts"
                          ? "🌍 OpenFoodFacts"
                          : product.source === "USDA"
                          ? "🏛️ USDA"
                          : "🔗 External"}
                      </span>
                      <span className="text-xs text-text-2">• External</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer note for external products */}
      {alternatives.some((alt) => alt.source && alt.source !== "database") && (
        <div className="pt-3 text-xs text-text-2 text-center">
          External products will open in a new tab for more details
        </div>
      )}
    </>
  );
}

// Helper function to determine product category from name
function getProductCategory(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes("biscuit") || name.includes("cookie")) return "biscuit";
  if (name.includes("drink") || name.includes("juice") || name.includes("soda"))
    return "beverage";
  if (name.includes("chips") || name.includes("snack")) return "snack";
  if (name.includes("cereal")) return "cereal";
  if (name.includes("bread")) return "bread";
  if (name.includes("pasta")) return "pasta";
  if (name.includes("chocolate") || name.includes("candy"))
    return "confectionery";
  return "product";
}
