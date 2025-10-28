"use server";
import { prisma as prismaSingleton } from "@/lib/prisma";
import { NutrientProps, NutritionProps } from "@/types";
import {
  checkBarcodeFormat,
  convertMetric,
  getAdditivesAmount,
  getRateIndex,
  rateProduct,
  verifyNutrient,
} from "@/utils";
import {
  PrismaClient,
  ProductNutrients,
  Products,
  ScanHistory,
  Users,
} from "@prisma/client";
import { cookies } from "next/headers";

export async function getProducts(
  page: number = 1,
  limit: number = 10
): Promise<Products[] | null> {
  try {
    const prisma = prismaSingleton;
    return await prisma.products
      .findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      })
      .catch((error) => {
        console.log(error);
        return null;
      })
      .finally(() => {
        prisma.$disconnect();
      });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getProduct(barcode: string): Promise<Products | null> {
  try {
    const prisma = prismaSingleton;
    return await prisma.products.findUnique({
      where: { barcode: barcode },
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getProductNutrients(
  productID: string
): Promise<ProductNutrients[] | null> {
  try {
    const prisma = prismaSingleton;
    return await prisma.productNutrients
      .findMany({
        where: { productID },
        orderBy: { rated: "desc" },
      })
      .catch((error) => {
        console.log(error);
        return null;
      })
      .finally(() => {
        prisma.$disconnect();
      });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getCurrentUser(): Promise<Users | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;
    const prisma = prismaSingleton;
    return await prisma.users.findUnique({ where: { id: userId } });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function addScanHistory(
  productID: string
): Promise<ScanHistory | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;
    const prisma = new PrismaClient();
    return await prisma.scanHistory.create({
      data: { userID: userId, productID },
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getUserHistory(): Promise<
  (ScanHistory & { product: Products })[] | null
> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;
    const prisma = new PrismaClient();
    return await prisma.scanHistory.findMany({
      where: { userID: userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function checkProduct(barcode: string): Promise<Products | null> {
  try {
    // Check if barcode all digits are numbers with 8 to 13 digits
    if (!checkBarcodeFormat(barcode))
      throw new Error("Barcode format error: Please enter a valid barcode.");

    // Check database for product if exists
    let product: Products | null = await getProduct(barcode);
    if (product !== null) return product;

    // Fetch from Open Food Facts Org. API
    let newProduct: NutritionProps | null = null;
    newProduct = await fetchFromOpenFoodFacts(barcode);

    if (newProduct === null)
      throw new Error("No result from OpenFoodFacts API.");

    // Analyze, rate and insert new product with all related nutrients into database
    let { nutrients } = newProduct;

    if (nutrients.length === 0)
      throw new Error("Product doesn't have any nutrients.");

    const ratedNutrients: NutrientProps[] = [];
    nutrients.forEach((nutrient) => {
      // Verify and get nutrient metric object
      let metric = verifyNutrient(nutrient);
      if (metric === null) return;

      // ADDITIVES: If nutrient name is "additives" then do different things
      if (nutrient.name === "additives") {
        nutrient.amount = getAdditivesAmount(
          nutrient.unitName.split(" "),
          metric
        );
      }

      // Convert nutrient amount to match the benchmarks' unit
      nutrient.amount = convertMetric(
        nutrient.amount,
        nutrient.unitName,
        metric.benchmarks_unit
      );
      if (metric.benchmarks_unit !== "")
        nutrient.unitName = metric.benchmarks_unit;

      // Find the rate of nutrient amount
      nutrient.rate = metric.rates[getRateIndex(nutrient.amount, metric)];

      ratedNutrients.push(nutrient);
    });
    newProduct.nutrients = ratedNutrients;

    let productRate = rateProduct(ratedNutrients);

    const prisma = new PrismaClient();
    let res = await prisma.products.create({
      data: {
        barcode: barcode,
        name: newProduct.name,
        image: newProduct.image,
        brandOwner: newProduct.brandOwner,
        brandName: newProduct.brandName,
        ingredients: newProduct.ingredients,
        servingSize: newProduct.servingSize,
        servingUnit: newProduct.servingSizeUnit,
        packageWeight: newProduct.packageWeight,
        rated: productRate,
        nutrients: {
          create: newProduct.nutrients.map((nutrient) => {
            return {
              nameKey: nutrient.name,
              amount: nutrient.amount,
              unitName: nutrient.unitName,
              rated: nutrient.rate || 0,
            };
          }),
        },
      },
    });

    if (res === null)
      throw new Error("Error while inserting product into database.");

    return await getProduct(barcode);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function fetchFromOpenFoodFacts(barcode: string): Promise<any> {
  try {
    const result = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await result.json();
    if (data.status === 0) return null;
    return createNutritionObjectFromOpenFoodFacts(data.product);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createNutritionObjectFromOpenFoodFacts(
  json: any
): Promise<NutritionProps | null> {
  // Parse "1 oz (28 g)" | "123 lb" | "1 g" | "3.432mg" to array of value number and unit string
  const parseServingSize = (servingSize: string): [number, string] => {
    const regex = /\((.*)\)/;
    const match = servingSize.match(regex);
    if (match !== null) servingSize = match[1];

    let matches = servingSize.match(/(\d+(\.\d+)?)\s*([a-zA-Z]+)/);
    if (matches !== null) return [parseFloat(matches[1]), matches[3]];
    else return [0, ""];
  };

  try {
    let additivesArray: string[] = getAdditives(json.additives_tags || []);
    let additivesString: string = additivesArray.join(" ");

    const nutritionObject: NutritionProps = {
      id: json._id || "",
      image: json.image_url || "/no-image.webp",
      name: json.product_name || "",
      brandOwner: json.brand_owner || "",
      brandName: json.brands || "",
      ingredients: json.ingredients_text || "",
      servingSize: parseServingSize(json.serving_size || "")[0],
      servingSizeUnit: parseServingSize(json.serving_size || "")[1],
      packageWeight: "",
      additives: additivesArray,
      nutrients: [],
    };

    let nutrientsIdCounter = 0;
    Object.keys(json.nutriments).filter((key) => {
      if (!/[_]/.test(key)) {
        nutritionObject.nutrients.push({
          id: ++nutrientsIdCounter,
          name: key,
          code: "",
          amount: json.nutriments[key] || 0,
          unitName: json.nutriments[key + "_unit"] || "",
        });
      }
    });

    // Add additives to nutrients list if exists
    if (json.additives_tags !== undefined) {
      nutritionObject.nutrients.push({
        id: ++nutrientsIdCounter,
        name: "additives",
        code: "",
        amount: additivesArray.length,
        unitName: additivesString,
      });
    }

    return nutritionObject;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getAdditives(additives: string[]): string[] {
  const additivesList: string[] = [];
  additives.forEach((a) => {
    if (a.startsWith("en:")) {
      a = a.replace("en:", "");
      additivesList.push(a.toUpperCase());
    }
  });
  return additivesList;
}

// Enhanced function to extract category keywords from product name
function extractCategoryKeywords(productName: string): string[] {
  const keywords = [];
  const lowerName = productName.toLowerCase();

  // Primary food categories - more specific and focused
  const primaryCategories = {
    // Biscuits & Cookies (most specific first)
    biscuits: [
      "biscuit",
      "biscuits",
      "cookie",
      "cookies",
      "cracker",
      "crackers",
    ],

    // Beverages
    beverages: [
      "juice",
      "drink",
      "beverage",
      "soda",
      "soft drink",
      "water",
      "tea",
      "coffee",
      "milk",
    ],

    // Snacks
    snacks: [
      "chips",
      "crisps",
      "popcorn",
      "nuts",
      "trail mix",
      "chocolate",
      "candy",
    ],

    // Cereals
    cereals: ["cereal", "cereals", "granola", "muesli", "oatmeal", "porridge"],

    // Bread & Bakery
    bread: ["bread", "loaf", "roll", "bun", "bagel", "croissant", "muffin"],

    // Pasta & Grains
    pasta: ["pasta", "noodle", "noodles", "spaghetti", "rice", "quinoa"],

    // Dairy
    dairy: ["cheese", "butter", "cream", "yogurt"],

    // Protein
    protein: ["meat", "chicken", "beef", "pork", "fish", "salmon", "tuna"],

    // Bars
    bars: ["bar", "bars", "energy bar", "protein bar", "granola bar"],
  };

  // Check for primary categories first (most important)
  let foundPrimaryCategory = false;
  for (const [categoryName, categoryTerms] of Object.entries(
    primaryCategories
  )) {
    for (const term of categoryTerms) {
      if (lowerName.includes(term.toLowerCase())) {
        // Add the most specific category terms
        if (categoryName === "biscuits") {
          keywords.push("biscuit", "cookie", "cracker");
        } else if (categoryName === "beverages") {
          keywords.push("drink", "beverage");
        } else if (categoryName === "snacks") {
          keywords.push("snack", "chips");
        } else if (categoryName === "cereals") {
          keywords.push("cereal", "breakfast");
        } else if (categoryName === "bread") {
          keywords.push("bread", "bakery");
        } else if (categoryName === "pasta") {
          keywords.push("pasta", "grain");
        } else if (categoryName === "dairy") {
          keywords.push("dairy", "milk");
        } else if (categoryName === "protein") {
          keywords.push("protein", "meat");
        } else if (categoryName === "bars") {
          keywords.push("bar", "energy");
        }
        foundPrimaryCategory = true;
        break;
      }
    }
    if (foundPrimaryCategory) break; // Stop after finding the first category
  }

  // Special handling for well-known product names
  const productSpecificKeywords = {
    parle: ["biscuit", "cookie"], // Parle is primarily known for biscuits
    oreo: ["cookie", "biscuit"],
    britannia: ["biscuit", "cookie"],
    monaco: ["cracker", "biscuit"],
    "good day": ["biscuit", "cookie"],
    "hide & seek": ["cookie", "biscuit"],
    "coca-cola": ["cola", "soft drink"],
    pepsi: ["cola", "soft drink"],
    sprite: ["lemon soda", "soft drink"],
    fanta: ["orange soda", "soft drink"],
    lays: ["chips", "snack"],
    kurkure: ["snack", "chips"],
    maggi: ["noodles", "instant noodles"],
  };

  // Add product-specific keywords if no primary category found
  if (!foundPrimaryCategory) {
    for (const [productKey, productKeywords] of Object.entries(
      productSpecificKeywords
    )) {
      if (lowerName.includes(productKey.toLowerCase())) {
        keywords.push(...productKeywords);
        foundPrimaryCategory = true;
        break;
      }
    }
  }

  // If still no category found, extract from the most descriptive word
  if (!foundPrimaryCategory) {
    const words = productName.split(" ").filter((word) => word.length > 3);
    if (words.length > 0) {
      // Use the longest word as it's likely most descriptive
      const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b));
      keywords.push(longestWord.toLowerCase());
    }
  }

  // Remove duplicates and limit to 3 most relevant keywords
  const uniqueKeywords = Array.from(new Set(keywords));
  return uniqueKeywords.slice(0, 3);
}

// Helper function to get broader category keywords when specific search fails
function getBroaderCategoryKeywords(categoryKeywords: string[]): string[] {
  const broaderKeywords = [];

  for (const keyword of categoryKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    if (lowerKeyword.includes("biscuit") || lowerKeyword.includes("cookie")) {
      broaderKeywords.push("snack", "breakfast", "tea time");
    } else if (
      lowerKeyword.includes("drink") ||
      lowerKeyword.includes("beverage")
    ) {
      broaderKeywords.push("refreshment", "hydration");
    } else if (
      lowerKeyword.includes("chips") ||
      lowerKeyword.includes("snack")
    ) {
      broaderKeywords.push("finger food", "party snack");
    } else if (
      lowerKeyword.includes("chocolate") ||
      lowerKeyword.includes("candy")
    ) {
      broaderKeywords.push("dessert", "sweet treat");
    } else {
      broaderKeywords.push(keyword); // Keep original if no broader category
    }
  }

  return Array.from(new Set(broaderKeywords));
}

// Enhanced function to get category-specific healthier keywords
function getCategorySpecificHealthierKeywords(
  categoryKeywords: string[]
): string[] {
  const healthierKeywords = [];

  for (const keyword of categoryKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // Biscuit/Cookie alternatives (most relevant for Parle-G)
    if (
      lowerKeyword.includes("biscuit") ||
      lowerKeyword.includes("cookie") ||
      lowerKeyword.includes("cracker")
    ) {
      healthierKeywords.push(
        "digestive biscuit",
        "oat biscuit",
        "whole wheat biscuit",
        "sugar free biscuit",
        "low calorie cookie",
        "multigrain cracker",
        "fiber biscuit"
      );
    }

    // Beverage alternatives
    else if (
      lowerKeyword.includes("drink") ||
      lowerKeyword.includes("beverage") ||
      lowerKeyword.includes("cola") ||
      lowerKeyword.includes("soda")
    ) {
      healthierKeywords.push(
        "sugar free drink",
        "zero calorie beverage",
        "sparkling water",
        "diet cola",
        "natural juice"
      );
    }

    // Snack alternatives
    else if (lowerKeyword.includes("snack") || lowerKeyword.includes("chips")) {
      healthierKeywords.push(
        "baked chips",
        "low sodium snack",
        "whole grain snack",
        "air popped snack"
      );
    }

    // Cereal alternatives
    else if (
      lowerKeyword.includes("cereal") ||
      lowerKeyword.includes("breakfast")
    ) {
      healthierKeywords.push(
        "whole grain cereal",
        "low sugar cereal",
        "high fiber cereal",
        "oat cereal"
      );
    }

    // Generic healthier terms for other categories
    else {
      healthierKeywords.push(
        "organic " + keyword,
        "whole grain " + keyword,
        "low sugar " + keyword,
        "natural " + keyword
      );
    }
  }

  // Remove duplicates and limit to 4 keywords to avoid too many API calls
  const uniqueKeywords = Array.from(new Set(healthierKeywords));
  return uniqueKeywords.slice(0, 4);
}

// Function to validate if an alternative product is in the same category
function isValidAlternative(
  originalProductName: string,
  alternativeProductName: string
): boolean {
  const originalCategories = extractCategoryKeywords(originalProductName);
  const alternativeCategories = extractCategoryKeywords(alternativeProductName);

  // Check if at least one category matches
  const hasCommonCategory = originalCategories.some((origCat) =>
    alternativeCategories.some(
      (altCat) =>
        origCat.toLowerCase().includes(altCat.toLowerCase()) ||
        altCat.toLowerCase().includes(origCat.toLowerCase())
    )
  );

  return hasCommonCategory;
}

// Enhanced filtering function for alternatives
function filterValidAlternatives(
  originalProductName: string,
  alternatives: any[]
): any[] {
  return alternatives.filter((alt) => {
    // Basic validation
    if (!alt.name || alt.name.trim() === "") return false;

    // Category validation
    if (!isValidAlternative(originalProductName, alt.name)) return false;

    // Avoid exact duplicates or very similar names
    const originalWords = originalProductName.toLowerCase().split(" ");
    const altWords = alt.name.toLowerCase().split(" ");
    const commonWords = originalWords.filter((word) => altWords.includes(word));

    // If more than 70% words are common, it's too similar
    if (commonWords.length > originalWords.length * 0.7) return false;

    return true;
  });
}

// Main function to get healthier alternatives
export async function getHealthierAlternatives(
  productId: string,
  limit: number = 3
) {
  try {
    // Get the current product to understand its category and nutrition
    const currentProduct = await prismaSingleton.products.findUnique({
      where: { id: productId },
      include: { nutrients: true },
    });

    if (!currentProduct) return [];

    // Extract key nutrition info from current product
    const currentCalories =
      currentProduct.nutrients.find(
        (n) =>
          n.nameKey.toLowerCase().includes("energy") ||
          n.nameKey.toLowerCase().includes("calories")
      )?.amount || 0;

    const currentProtein =
      currentProduct.nutrients.find((n) =>
        n.nameKey.toLowerCase().includes("protein")
      )?.amount || 0;

    const currentSugar =
      currentProduct.nutrients.find((n) =>
        n.nameKey.toLowerCase().includes("sugar")
      )?.amount || 0;

    const currentSodium =
      currentProduct.nutrients.find((n) =>
        n.nameKey.toLowerCase().includes("sodium")
      )?.amount || 0;

    // Get product category keywords from name
    const productName = currentProduct.name.toLowerCase();
    const categoryKeywords = extractCategoryKeywords(productName);

    console.log("Product:", currentProduct.name);
    console.log("Category keywords:", categoryKeywords);

    // First try to find healthier alternatives
    let alternatives = await fetchAlternativesFromOpenFoodFacts(
      categoryKeywords,
      currentCalories,
      currentProtein,
      currentSugar,
      currentSodium,
      limit,
      true // strictHealthier = true
    );

    console.log("Healthier alternatives found:", alternatives.length);

    // If no healthier alternatives found, try same-level or similar products
    if (alternatives.length === 0) {
      console.log(
        "No healthier alternatives found, searching for similar products..."
      );

      // Try category-specific similar products (not necessarily healthier)
      alternatives = await fetchAlternativesFromOpenFoodFacts(
        categoryKeywords,
        currentCalories,
        currentProtein,
        currentSugar,
        currentSodium,
        limit,
        false // strictHealthier = false (allow same level)
      );

      console.log("Similar alternatives found:", alternatives.length);

      // If still no alternatives, try broader category search
      if (alternatives.length === 0) {
        const broaderKeywords = getBroaderCategoryKeywords(categoryKeywords);
        console.log("Trying broader keywords:", broaderKeywords);

        alternatives = await fetchAlternativesFromOpenFoodFacts(
          broaderKeywords,
          currentCalories,
          currentProtein,
          currentSugar,
          currentSodium,
          limit,
          false // strictHealthier = false
        );

        console.log("Broader search alternatives found:", alternatives.length);
      }
    }

    // If still no alternatives found, try USDA
    if (alternatives.length === 0) {
      console.log("Trying USDA search...");
      alternatives = await fetchAlternativesFromUSDA(
        categoryKeywords,
        currentCalories,
        currentProtein,
        currentSugar,
        currentSodium,
        limit,
        false // strictHealthier = false
      );
      console.log("USDA alternatives found:", alternatives.length);
    }

    // Apply additional filtering for product name validation
    const filteredAlternatives = filterValidAlternatives(
      currentProduct.name,
      alternatives
    );
    console.log("Final filtered alternatives:", filteredAlternatives.length);

    return filteredAlternatives;
  } catch (error) {
    console.error("Error fetching healthier alternatives:", error);
    return [];
  }
}

// Fetch alternatives from OpenFoodFacts API
async function fetchAlternativesFromOpenFoodFacts(
  categoryKeywords: string[],
  currentCalories: number,
  currentProtein: number,
  currentSugar: number,
  currentSodium: number,
  limit: number,
  strictHealthier: boolean = true
) {
  try {
    const alternatives = [];

    // Search for products in each category
    for (const keyword of categoryKeywords.slice(0, 4)) {
      console.log(`Searching OpenFoodFacts for keyword: "${keyword}"`);

      const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        keyword
      )}&search_simple=1&action=process&json=1&page_size=20`;

      try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
          console.log(
            `OpenFoodFacts API error for "${keyword}": ${response.status}`
          );
          continue;
        }

        const data = await response.json();
        if (!data.products || data.products.length === 0) {
          console.log(`No products found for keyword: "${keyword}"`);
          continue;
        }

        console.log(`Found ${data.products.length} products for "${keyword}"`);

        // Process each product
        for (const product of data.products) {
          if (!product.nutriments || !product.product_name) continue;

          const calories =
            product.nutriments.energy_kcal_100g ||
            product.nutriments.energy_100g ||
            0;
          const protein = product.nutriments.proteins_100g || 0;
          const sugar = product.nutriments.sugars_100g || 0;
          const sodium = product.nutriments.sodium_100g || 0;

          // Calculate health score (lower is better)
          let healthScore = 0;
          let isHealthier = false;
          let isSimilar = false;

          if (currentCalories > 0) {
            const calorieDiff = (calories - currentCalories) * 0.1;
            healthScore += calorieDiff;
            if (calories < currentCalories * 0.9) isHealthier = true;
            if (Math.abs(calories - currentCalories) < currentCalories * 0.2)
              isSimilar = true;
          }

          if (currentSugar > 0) {
            const sugarDiff = (sugar - currentSugar) * 0.15;
            healthScore += sugarDiff;
            if (sugar < currentSugar * 0.9) isHealthier = true;
            if (Math.abs(sugar - currentSugar) < currentSugar * 0.3)
              isSimilar = true;
          }

          if (currentSodium > 0) {
            const sodiumDiff = (sodium - currentSodium) * 0.1;
            healthScore += sodiumDiff;
            if (sodium < currentSodium * 0.9) isHealthier = true;
            if (Math.abs(sodium - currentSodium) < currentSodium * 0.3)
              isSimilar = true;
          }

          if (currentProtein > 0) {
            const proteinDiff = (currentProtein - protein) * 0.2;
            healthScore += proteinDiff;
            if (protein > currentProtein * 1.1) isHealthier = true;
          }

          // Decide whether to include this product
          let shouldInclude = false;
          let alternativeType = "similar";

          if (strictHealthier) {
            // Only include if it's healthier (health score < 0)
            if (healthScore < -0.5) {
              shouldInclude = true;
              alternativeType = "healthier";
            }
          } else {
            // Include if healthier OR similar
            if (healthScore < -0.5) {
              shouldInclude = true;
              alternativeType = "healthier";
            } else if (isSimilar || Math.abs(healthScore) < 2) {
              shouldInclude = true;
              alternativeType = "similar";
            }
          }

          if (shouldInclude) {
            // Calculate rating based on health score and type
            let calculatedRating = 70;

            if (alternativeType === "healthier") {
              calculatedRating = Math.max(30, 70 + healthScore * 10);
            } else {
              // For similar products, base rating on current product's level
              calculatedRating = Math.max(
                40,
                Math.min(80, 60 + (Math.random() * 20 - 10))
              );
            }

            alternatives.push({
              id: product._id || `off_${Date.now()}_${Math.random()}`,
              barcode: product.code || "",
              name: product.product_name,
              image: product.image_url || "/no-image.webp",
              brandName: product.brands || "",
              brandOwner: product.brand_owner || "",
              ingredients: product.ingredients_text || "",
              servingSize: 0,
              servingUnit: "",
              packageWeight: "",
              additives: [],
              rated: Math.round(calculatedRating),
              createdAt: new Date(),
              updatedAt: new Date(),
              userID: null,
              nutrients: [],
              healthScore,
              alternativeType, // Add type information
              nutritionComparison: {
                calories: calories - currentCalories,
                protein: protein - currentProtein,
                sugar: sugar - currentSugar,
                sodium: sodium - currentSodium,
              },
              source: "OpenFoodFacts",
            });
          }
        }
      } catch (fetchError) {
        console.error(
          `Error fetching OpenFoodFacts data for keyword "${keyword}":`,
          fetchError
        );
        continue;
      }
    }

    // Sort by health score (healthier first, then similar)
    const sortedAlternatives = alternatives.sort((a, b) => {
      // Prioritize healthier alternatives
      if (a.alternativeType === "healthier" && b.alternativeType === "similar")
        return -1;
      if (a.alternativeType === "similar" && b.alternativeType === "healthier")
        return 1;
      return a.healthScore - b.healthScore;
    });

    // Filter for diversity
    const diverseAlternatives = [];
    const seenBrands = new Set();
    const seenProductNames = new Set();

    for (const alt of sortedAlternatives) {
      const brand =
        alt.brandName?.toLowerCase() || alt.brandOwner?.toLowerCase() || "";
      const productName = alt.name?.toLowerCase() || "";

      if (seenProductNames.has(productName)) continue;

      if (diverseAlternatives.length < 2 || !seenBrands.has(brand)) {
        diverseAlternatives.push(alt);
        seenBrands.add(brand);
        seenProductNames.add(productName);
        if (diverseAlternatives.length >= limit) break;
      }
    }

    return diverseAlternatives;
  } catch (error) {
    console.error("Error fetching from OpenFoodFacts:", error);
    return [];
  }
}

// Fetch alternatives from USDA API
async function fetchAlternativesFromUSDA(
  categoryKeywords: string[],
  currentCalories: number,
  currentProtein: number,
  currentSugar: number,
  currentSodium: number,
  limit: number,
  strictHealthier: boolean = true
) {
  try {
    const alternatives = [];

    // USDA API key (you'll need to get one from https://fdc.nal.usda.gov/api-guide.html)
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";

    for (const keyword of categoryKeywords.slice(0, 4)) {
      console.log(`Searching USDA for keyword: "${keyword}"`);

      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        keyword
      )}&api_key=${apiKey}&pageSize=20&dataType=Branded,Foundation,SR Legacy`;

      try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
          console.log(`USDA API error for "${keyword}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (!data.foods || data.foods.length === 0) {
          console.log(`No USDA foods found for keyword: "${keyword}"`);
          continue;
        }

        console.log(`Found ${data.foods.length} USDA foods for "${keyword}"`);

        for (const food of data.foods) {
          if (!food.description || !food.foodNutrients) continue;

          // Extract nutrition data from USDA format
          const nutrients = food.foodNutrients.reduce(
            (acc: any, nutrient: any) => {
              if (nutrient.nutrient && nutrient.nutrient.name) {
                const nutrientName = nutrient.nutrient.name.toLowerCase();
                const amount = nutrient.amount || 0;

                // Map USDA nutrient names to our standard names
                if (
                  nutrientName.includes("energy") ||
                  nutrientName.includes("calories")
                ) {
                  acc.calories = amount;
                } else if (nutrientName.includes("protein")) {
                  acc.protein = amount;
                } else if (
                  nutrientName.includes("sugar") ||
                  nutrientName.includes("total sugars")
                ) {
                  acc.sugar = amount;
                } else if (nutrientName.includes("sodium")) {
                  acc.sodium = amount;
                }
              }
              return acc;
            },
            { calories: 0, protein: 0, sugar: 0, sodium: 0 }
          );

          const calories = nutrients.calories;
          const protein = nutrients.protein;
          const sugar = nutrients.sugar;
          const sodium = nutrients.sodium;

          // Calculate health score (lower is better)
          let healthScore = 0;
          let isHealthier = false;
          let isSimilar = false;

          if (currentCalories > 0) {
            const calorieDiff = (calories - currentCalories) * 0.1;
            healthScore += calorieDiff;
            if (calories < currentCalories * 0.9) isHealthier = true;
            if (Math.abs(calories - currentCalories) < currentCalories * 0.2)
              isSimilar = true;
          }

          if (currentSugar > 0) {
            const sugarDiff = (sugar - currentSugar) * 0.15;
            healthScore += sugarDiff;
            if (sugar < currentSugar * 0.9) isHealthier = true;
            if (Math.abs(sugar - currentSugar) < currentSugar * 0.3)
              isSimilar = true;
          }

          if (currentSodium > 0) {
            const sodiumDiff = (sodium - currentSodium) * 0.1;
            healthScore += sodiumDiff;
            if (sodium < currentSodium * 0.9) isHealthier = true;
            if (Math.abs(sodium - currentSodium) < currentSodium * 0.3)
              isSimilar = true;
          }

          if (currentProtein > 0) {
            const proteinDiff = (currentProtein - protein) * 0.2;
            healthScore += proteinDiff;
            if (protein > currentProtein * 1.1) isHealthier = true;
          }

          // Decide whether to include this product
          let shouldInclude = false;
          let alternativeType = "similar";

          if (strictHealthier) {
            // Only include if it's healthier (health score < 0)
            if (healthScore < -0.5) {
              shouldInclude = true;
              alternativeType = "healthier";
            }
          } else {
            // Include if healthier OR similar
            if (healthScore < -0.5) {
              shouldInclude = true;
              alternativeType = "healthier";
            } else if (isSimilar || Math.abs(healthScore) < 2) {
              shouldInclude = true;
              alternativeType = "similar";
            }
          }

          if (shouldInclude) {
            // Calculate rating based on health score and type
            let calculatedRating = 70;

            if (alternativeType === "healthier") {
              // For healthier alternatives, calculate based on improvements
              if (currentCalories > 0 && calories < currentCalories) {
                const calorieImprovement =
                  ((currentCalories - calories) / currentCalories) * 100;
                calculatedRating -= Math.min(calorieImprovement * 0.15, 15);
              }

              if (currentSugar > 0 && sugar < currentSugar) {
                const sugarImprovement =
                  ((currentSugar - sugar) / currentSugar) * 100;
                calculatedRating -= Math.min(sugarImprovement * 0.2, 20);
              }

              if (currentSodium > 0 && sodium < currentSodium) {
                const sodiumImprovement =
                  ((currentSodium - sodium) / currentSodium) * 100;
                calculatedRating -= Math.min(sodiumImprovement * 0.1, 10);
              }

              if (currentProtein > 0 && protein > currentProtein) {
                const proteinImprovement =
                  ((protein - currentProtein) / currentProtein) * 100;
                calculatedRating -= Math.min(proteinImprovement * 0.15, 15);
              }

              calculatedRating = Math.max(30, Math.min(100, calculatedRating));
            } else {
              // For similar products, base rating on current product's level with some variation
              calculatedRating = Math.max(
                40,
                Math.min(80, 60 + (Math.random() * 20 - 10))
              );
            }

            // Get brand information from USDA data
            const brandOwner = food.brandOwner || food.brandName || "";
            const brandName = food.brandName || food.marketCountry || "";

            alternatives.push({
              id:
                food.fdcId?.toString() || `usda_${Date.now()}_${Math.random()}`,
              barcode: "", // USDA doesn't provide barcodes
              name:
                food.description ||
                food.lowercaseDescription ||
                "Unknown Product",
              image: "/no-image.webp", // USDA doesn't provide images
              brandName: brandName,
              brandOwner: brandOwner,
              ingredients: food.ingredients || "",
              servingSize: 0,
              servingUnit: "",
              packageWeight: "",
              additives: [],
              rated: Math.round(calculatedRating),
              createdAt: new Date(),
              updatedAt: new Date(),
              userID: null,
              nutrients: [],
              healthScore,
              alternativeType,
              nutritionComparison: {
                calories: calories - currentCalories,
                protein: protein - currentProtein,
                sugar: sugar - currentSugar,
                sodium: sodium - currentSodium,
              },
              source: "USDA",
            });
          }
        }
      } catch (fetchError) {
        console.error(
          `Error fetching USDA data for keyword "${keyword}":`,
          fetchError
        );
        continue; // Continue with next keyword if one fails
      }
    }

    // Sort by health score (healthier first, then similar)
    const sortedAlternatives = alternatives.sort((a, b) => {
      // Prioritize healthier alternatives
      if (a.alternativeType === "healthier" && b.alternativeType === "similar")
        return -1;
      if (a.alternativeType === "similar" && b.alternativeType === "healthier")
        return 1;
      return a.healthScore - b.healthScore;
    });

    // Filter for diversity - USDA data often has many similar entries
    const diverseAlternatives = [];
    const seenBrands = new Set();
    const seenProductNames = new Set();
    const seenDescriptions = new Set(); // Additional filtering for USDA

    for (const alt of sortedAlternatives) {
      const brand =
        alt.brandName?.toLowerCase() || alt.brandOwner?.toLowerCase() || "";
      const productName = alt.name?.toLowerCase() || "";

      // Create a simplified description for duplicate detection
      const simplifiedDescription = productName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(" ")
        .filter((word: any) => word.length > 2)
        .slice(0, 3)
        .join(" ");

      // Skip if we already have this exact or very similar product
      if (
        seenProductNames.has(productName) ||
        seenDescriptions.has(simplifiedDescription)
      ) {
        continue;
      }

      // For USDA, be more lenient with brand diversity as many entries don't have brands
      const allowBrandDuplication = diverseAlternatives.length < limit / 2;

      if (allowBrandDuplication || !seenBrands.has(brand) || brand === "") {
        diverseAlternatives.push(alt);
        if (brand) seenBrands.add(brand);
        seenProductNames.add(productName);
        seenDescriptions.add(simplifiedDescription);

        if (diverseAlternatives.length >= limit) break;
      }
    }

    return diverseAlternatives;
  } catch (error) {
    console.error("Error fetching from USDA:", error);
    return [];
  }
}
