// app/api/healthier-alternatives/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface SearchStrategy {
  keywords: string[];
  category: string;
  healthierAttributes: string[];
  avoidKeywords: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    // 1. Get the current product details
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        nutrients: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log(`\n🔍 Finding alternatives for: ${product.name}`);
    console.log(`Current rating: ${product.rated}/100`);

    // 2. Use AI to generate smart search strategies
    const searchStrategy = await generateSearchStrategy(product);
    console.log(`📋 AI Search Strategy:`, searchStrategy);

    // 3. Search in local database first
    const localAlternatives = await searchLocalDatabase(product, searchStrategy);
    console.log(`💾 Found ${localAlternatives.length} local alternatives`);

    // 4. Search external sources (OpenFoodFacts, USDA)
    const externalAlternatives = await searchExternalSources(product, searchStrategy);
    console.log(`🌐 Found ${externalAlternatives.length} external alternatives`);

    // 5. Combine and rank alternatives
    const allAlternatives = [...localAlternatives, ...externalAlternatives];
    const rankedAlternatives = rankAlternatives(allAlternatives, product);

    // 6. Return top 5 alternatives
    const topAlternatives = rankedAlternatives.slice(0, 5);
    console.log(`✅ Returning ${topAlternatives.length} top alternatives\n`);

    return NextResponse.json(topAlternatives);
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alternatives' },
      { status: 500 }
    );
  }
}

// Generate smart search strategy using AI
async function generateSearchStrategy(product: any): Promise<SearchStrategy> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this food product and generate a smart search strategy to find healthier alternatives:

Product Name: ${product.name}
Brand: ${product.brandName || product.brandOwner || 'Unknown'}
Ingredients: ${product.ingredients || 'Not available'}
Rating: ${product.rated}/100 (lower is healthier)

Generate a JSON response with:
1. "keywords": Array of 3-5 relevant search terms (product type, category)
2. "category": Main product category (e.g., "biscuits", "beverages", "snacks", "cereals")
3. "healthierAttributes": What makes alternatives healthier (e.g., "low sugar", "whole grain", "organic")
4. "avoidKeywords": Terms to exclude from results (specific brands, unrelated products)

Example for "Oreo Cookies":
{
  "keywords": ["cookies", "biscuits", "sandwich cookies", "chocolate cookies"],
  "category": "biscuits",
  "healthierAttributes": ["low sugar", "whole grain", "no artificial ingredients", "high fiber"],
  "avoidKeywords": ["oreo", "drink", "juice", "milk", "cereal"]
}

Return ONLY valid JSON, no other text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean response
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const strategy = JSON.parse(jsonMatch[0]);
    return strategy;
  } catch (error) {
    console.error('AI search strategy failed, using fallback:', error);
    // Fallback strategy
    return {
      keywords: [product.name.split(' ')[0].toLowerCase()],
      category: 'product',
      healthierAttributes: ['low sugar', 'organic'],
      avoidKeywords: [],
    };
  }
}

// Search local database
async function searchLocalDatabase(product: any, strategy: SearchStrategy) {
  const alternatives = [];

  // Build search query
  const searchTerms = strategy.keywords.map(k => k.toLowerCase());
  
  try {
    const products = await prisma.products.findMany({
      where: {
        AND: [
          { id: { not: product.id } },
          { rated: { lt: product.rated } }, // Only healthier products
          {
            OR: searchTerms.map(term => ({
              name: { contains: term, mode: 'insensitive' as const }
            }))
          }
        ]
      },
      include: { nutrients: true },
      take: 10,
      orderBy: { rated: 'asc' }
    });

    for (const alt of products) {
      // Filter out by avoid keywords
      const nameMatch = strategy.avoidKeywords.some(avoid => 
        alt.name.toLowerCase().includes(avoid.toLowerCase())
      );
      if (nameMatch) continue;

      alternatives.push({
        ...alt,
        source: 'database',
        alternativeType: 'healthier',
        healthScore: calculateHealthScore(alt, product),
        nutritionComparison: compareNutrition(alt, product)
      });
    }
  } catch (error) {
    console.error('Local database search failed:', error);
  }

  return alternatives;
}

// Search external sources (OpenFoodFacts API)
async function searchExternalSources(product: any, strategy: SearchStrategy) {
  const alternatives = [];

  // Search OpenFoodFacts
  for (const keyword of strategy.keywords.slice(0, 2)) { // Limit to 2 keywords
    try {
      const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(keyword)}&search_simple=1&action=process&json=1&page_size=10&sort_by=nutriscore_score`;
      
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'HealthierAlternatives/1.0' }
      });

      if (!response.ok) continue;

      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        for (const offProduct of data.products.slice(0, 5)) {
          // Skip if no nutriscore or if it's worse
          if (!offProduct.nutriscore_grade) continue;
          
          const nutriscoreValue = nutriscoreToRating(offProduct.nutriscore_grade);
          if (nutriscoreValue >= product.rated) continue;

          // Check avoid keywords
          const nameMatch = strategy.avoidKeywords.some(avoid => 
            offProduct.product_name?.toLowerCase().includes(avoid.toLowerCase())
          );
          if (nameMatch) continue;

          alternatives.push({
            id: offProduct.code || offProduct._id,
            barcode: offProduct.code || offProduct._id,
            name: offProduct.product_name || 'Unknown Product',
            brandName: offProduct.brands || null,
            brandOwner: null,
            image: offProduct.image_url || offProduct.image_small_url || null,
            ingredients: offProduct.ingredients_text || null,
            servingSize: offProduct.serving_size || 0,
            servingUnit: offProduct.serving_quantity_unit || 'g',
            rated: nutriscoreValue,
            nutrients: [],
            source: 'OpenFoodFacts',
            alternativeType: 'healthier',
            healthScore: calculateHealthScoreFromNutriscore(offProduct),
            nutritionComparison: compareNutritionExternal(offProduct, product)
          });
        }
      }
    } catch (error) {
      console.error(`OpenFoodFacts search failed for ${keyword}:`, error);
    }
  }

  return alternatives;
}

// Convert Nutriscore (a-e) to rating (lower is better)
function nutriscoreToRating(grade: string): number {
  const gradeMap: { [key: string]: number } = {
    'a': 15,
    'b': 35,
    'c': 55,
    'd': 75,
    'e': 95
  };
  return gradeMap[grade.toLowerCase()] || 50;
}

// Calculate health score
function calculateHealthScore(alternative: any, original: any): number {
  let score = 0;
  
  // Better rating = higher score
  const ratingDiff = original.rated - alternative.rated;
  score += ratingDiff;
  
  // Add bonus for specific nutrients
  const altNutrients = alternative.nutrients || [];
  for (const nutrient of altNutrients) {
    if (nutrient.rated < 2) score += 5; // Positive nutrients
    if (nutrient.rated >= 2) score -= 3; // Negative nutrients
  }
  
  return score;
}

function calculateHealthScoreFromNutriscore(product: any): number {
  const grade = product.nutriscore_grade?.toLowerCase();
  const scoreMap: { [key: string]: number } = {
    'a': 90,
    'b': 70,
    'c': 50,
    'd': 30,
    'e': 10
  };
  return scoreMap[grade || 'c'] || 50;
}

// Compare nutrition between products
function compareNutrition(alternative: any, original: any) {
  const altNutrients = alternative.nutrients || [];
  const origNutrients = original.nutrients || [];
  
  const getAmount = (nutrients: any[], name: string) => {
    const nutrient = nutrients.find(n => 
      n.name && n.name.toLowerCase().includes(name.toLowerCase())
    );
    return nutrient?.amount || 0;
  };
  
  return {
    calories: getAmount(altNutrients, 'calorie') - getAmount(origNutrients, 'calorie'),
    protein: getAmount(altNutrients, 'protein') - getAmount(origNutrients, 'protein'),
    sugar: getAmount(altNutrients, 'sugar') - getAmount(origNutrients, 'sugar'),
    sodium: getAmount(altNutrients, 'sodium') - getAmount(origNutrients, 'sodium')
  };
}

function compareNutritionExternal(offProduct: any, original: any) {
  const origNutrients = original.nutrients || [];
  
  const getOrigAmount = (name: string) => {
    const nutrient = origNutrients.find((n: any) => 
      n.name && n.name.toLowerCase().includes(name.toLowerCase())
    );
    return nutrient?.amount || 0;
  };
  
  const nutriments = offProduct.nutriments || {};
  
  return {
    calories: (nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0) - getOrigAmount('calorie'),
    protein: (nutriments.proteins_100g || 0) - getOrigAmount('protein'),
    sugar: (nutriments.sugars_100g || 0) - getOrigAmount('sugar'),
    sodium: (nutriments.sodium_100g || 0) - getOrigAmount('sodium')
  };
}

// Rank alternatives by health score and relevance
function rankAlternatives(alternatives: any[], original: any) {
  return alternatives
    .sort((a, b) => {
      // Primary: Health score
      const scoreDiff = b.healthScore - a.healthScore;
      if (Math.abs(scoreDiff) > 10) return scoreDiff;
      
      // Secondary: Rating difference
      return a.rated - b.rated;
    })
    .filter((alt, index, self) => {
      // Remove duplicates by name
      return index === self.findIndex(t => 
        t.name.toLowerCase() === alt.name.toLowerCase()
      );
    });
}