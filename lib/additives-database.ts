// lib/additives-database.ts
export interface Additive {
  name: string;
  code?: string;
  type: 'preservative' | 'additive';
  description: string;
  healthConcerns?: string;
  aliases?: string[]; // Alternative names
}

export const KNOWN_ADDITIVES: Additive[] = [
  // Preservatives
  {
    name: "Sodium Benzoate",
    code: "E211",
    type: "preservative",
    description: "Prevents growth of bacteria, yeast, and mold in acidic foods",
    healthConcerns: "May cause allergic reactions in some individuals; concerns about benzene formation with vitamin C",
    aliases: ["benzoate of soda"]
  },
  {
    name: "Potassium Sorbate",
    code: "E202",
    type: "preservative",
    description: "Prevents mold and yeast growth in foods",
    healthConcerns: "Generally recognized as safe; may cause mild skin irritation in sensitive individuals",
    aliases: ["sorbic acid potassium salt"]
  },
  {
    name: "Calcium Propionate",
    code: "E282",
    type: "preservative",
    description: "Prevents mold growth in baked goods",
    healthConcerns: "Generally recognized as safe",
    aliases: ["propionic acid calcium salt"]
  },
  {
    name: "Sodium Nitrite",
    code: "E250",
    type: "preservative",
    description: "Preserves meat products and gives them pink color",
    healthConcerns: "Can form nitrosamines (potential carcinogens) when heated at high temperatures",
    aliases: ["nitrite"]
  },
  {
    name: "Sodium Nitrate",
    code: "E251",
    type: "preservative",
    description: "Preserves cured meats and prevents botulism",
    healthConcerns: "Can convert to sodium nitrite; concerns about nitrosamine formation",
    aliases: ["nitrate"]
  },
  {
    name: "Sulfur Dioxide",
    code: "E220",
    type: "preservative",
    description: "Prevents browning and bacterial growth in dried fruits and wine",
    healthConcerns: "Can trigger asthma attacks in sensitive individuals",
    aliases: ["sulfites", "sulphites"]
  },
  {
    name: "Sorbic Acid",
    code: "E200",
    type: "preservative",
    description: "Inhibits mold and yeast growth",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },
  {
    name: "Benzoic Acid",
    code: "E210",
    type: "preservative",
    description: "Prevents microbial growth in acidic foods",
    healthConcerns: "May cause allergic reactions; not suitable for people with aspirin sensitivity",
    aliases: []
  },
  {
    name: "Propionic Acid",
    code: "E280",
    type: "preservative",
    description: "Prevents mold in bread and baked goods",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },
  {
    name: "BHA",
    code: "E320",
    type: "preservative",
    description: "Prevents fats and oils from becoming rancid",
    healthConcerns: "Possible carcinogen; banned in some countries",
    aliases: ["butylated hydroxyanisole"]
  },
  {
    name: "BHT",
    code: "E321",
    type: "preservative",
    description: "Antioxidant that prevents rancidity in fats",
    healthConcerns: "Concerns about long-term health effects; some studies suggest hormone disruption",
    aliases: ["butylated hydroxytoluene"]
  },
  {
    name: "TBHQ",
    code: "E319",
    type: "preservative",
    description: "Preservative for vegetable oils and animal fats",
    healthConcerns: "High doses may cause nausea and vomiting; long-term effects debated",
    aliases: ["tertiary butylhydroquinone", "tert-butylhydroquinone"]
  },

  // Colors
  {
    name: "Tartrazine",
    code: "E102",
    type: "additive",
    description: "Yellow food coloring used in drinks, candies, and snacks",
    healthConcerns: "May cause hyperactivity in children; allergic reactions in aspirin-sensitive individuals",
    aliases: ["yellow 5", "fd&c yellow 5"]
  },
  {
    name: "Sunset Yellow",
    code: "E110",
    type: "additive",
    description: "Orange-yellow food coloring",
    healthConcerns: "May cause hyperactivity in children; allergic reactions possible",
    aliases: ["yellow 6", "fd&c yellow 6"]
  },
  {
    name: "Allura Red",
    code: "E129",
    type: "additive",
    description: "Red food coloring used in beverages and candy",
    healthConcerns: "May cause hyperactivity in children",
    aliases: ["red 40", "fd&c red 40"]
  },
  {
    name: "Carmoisine",
    code: "E122",
    type: "additive",
    description: "Red food coloring",
    healthConcerns: "Banned in some countries; may cause allergic reactions",
    aliases: ["azorubine"]
  },
  {
    name: "Brilliant Blue",
    code: "E133",
    type: "additive",
    description: "Blue food coloring",
    healthConcerns: "Generally recognized as safe; rarely causes allergic reactions",
    aliases: ["blue 1", "fd&c blue 1"]
  },
  {
    name: "Caramel Color",
    code: "E150",
    type: "additive",
    description: "Brown coloring used in sodas and sauces",
    healthConcerns: "Some types may contain 4-MEI, a possible carcinogen",
    aliases: ["caramel coloring", "caramel colour"]
  },

  // Sweeteners
  {
    name: "Aspartame",
    code: "E951",
    type: "additive",
    description: "Artificial sweetener 200x sweeter than sugar",
    healthConcerns: "Not suitable for people with phenylketonuria; some controversy about safety",
    aliases: ["nutrasweet", "equal"]
  },
  {
    name: "Sucralose",
    code: "E955",
    type: "additive",
    description: "Artificial sweetener 600x sweeter than sugar",
    healthConcerns: "Generally recognized as safe; some concerns about gut bacteria effects",
    aliases: ["splenda"]
  },
  {
    name: "Acesulfame K",
    code: "E950",
    type: "additive",
    description: "Artificial sweetener often combined with other sweeteners",
    healthConcerns: "Generally recognized as safe; limited long-term studies",
    aliases: ["acesulfame potassium", "ace-k"]
  },
  {
    name: "Saccharin",
    code: "E954",
    type: "additive",
    description: "One of the oldest artificial sweeteners",
    healthConcerns: "Previously thought to cause cancer (now considered safe); may have bitter aftertaste",
    aliases: ["sweet'n low"]
  },

  // Emulsifiers & Stabilizers
  {
    name: "Mono and Diglycerides",
    code: "E471",
    type: "additive",
    description: "Emulsifiers that help mix oil and water in foods",
    healthConcerns: "Generally recognized as safe",
    aliases: ["monoglycerides", "diglycerides"]
  },
  {
    name: "Lecithin",
    code: "E322",
    type: "additive",
    description: "Emulsifier derived from soybeans or eggs",
    healthConcerns: "Generally recognized as safe; may cause allergic reactions in soy-sensitive individuals",
    aliases: ["soy lecithin", "soya lecithin"]
  },
  {
    name: "Carrageenan",
    code: "E407",
    type: "additive",
    description: "Thickener and stabilizer derived from seaweed",
    healthConcerns: "Some studies suggest digestive issues; degraded form may cause inflammation",
    aliases: []
  },
  {
    name: "Xanthan Gum",
    code: "E415",
    type: "additive",
    description: "Thickening agent and stabilizer",
    healthConcerns: "Generally recognized as safe; may cause digestive issues in large amounts",
    aliases: []
  },
  {
    name: "Guar Gum",
    code: "E412",
    type: "additive",
    description: "Thickener and stabilizer from guar beans",
    healthConcerns: "Generally recognized as safe; may cause bloating in sensitive individuals",
    aliases: []
  },
  {
    name: "Polysorbate 80",
    code: "E433",
    type: "additive",
    description: "Emulsifier that helps ingredients blend together",
    healthConcerns: "Some concerns about effects on gut bacteria; generally recognized as safe",
    aliases: []
  },

  // Flavor Enhancers
  {
    name: "Monosodium Glutamate",
    code: "E621",
    type: "additive",
    description: "Flavor enhancer that provides umami taste",
    healthConcerns: "Some people report sensitivity (headaches, flushing); generally recognized as safe",
    aliases: ["msg", "glutamic acid"]
  },
  {
    name: "Disodium Inosinate",
    code: "E631",
    type: "additive",
    description: "Flavor enhancer often used with MSG",
    healthConcerns: "Generally recognized as safe; may cause issues for those with gout",
    aliases: []
  },
  {
    name: "Disodium Guanylate",
    code: "E627",
    type: "additive",
    description: "Flavor enhancer that boosts umami taste",
    healthConcerns: "Generally recognized as safe; may cause issues for those with gout",
    aliases: []
  },

  // Acidity Regulators
  {
    name: "Citric Acid",
    code: "E330",
    type: "additive",
    description: "Acidity regulator and flavor enhancer",
    healthConcerns: "Generally recognized as safe; may erode tooth enamel in high concentrations",
    aliases: []
  },
  {
    name: "Sodium Citrate",
    code: "E331",
    type: "additive",
    description: "Acidity regulator and emulsifier",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },
  {
    name: "Phosphoric Acid",
    code: "E338",
    type: "additive",
    description: "Acidity regulator common in sodas",
    healthConcerns: "May contribute to bone density loss when consumed in excess",
    aliases: []
  },

  // Anti-caking Agents
  {
    name: "Silicon Dioxide",
    code: "E551",
    type: "additive",
    description: "Anti-caking agent that prevents clumping",
    healthConcerns: "Generally recognized as safe",
    aliases: ["silica"]
  },
  {
    name: "Calcium Silicate",
    code: "E552",
    type: "additive",
    description: "Anti-caking agent",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },

  // Other Common Additives
  {
    name: "Sodium Alginate",
    code: "E401",
    type: "additive",
    description: "Thickener and stabilizer from seaweed",
    healthConcerns: "Generally recognized as safe",
    aliases: ["alginate"]
  },
  {
    name: "Pectin",
    code: "E440",
    type: "additive",
    description: "Gelling agent used in jams and jellies",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },
  {
    name: "Modified Starch",
    code: "E1404",
    type: "additive",
    description: "Thickener and stabilizer",
    healthConcerns: "Generally recognized as safe",
    aliases: ["modified food starch"]
  },
  {
    name: "Calcium Chloride",
    code: "E509",
    type: "additive",
    description: "Firming agent and preservative",
    healthConcerns: "Generally recognized as safe",
    aliases: []
  },
  {
    name: "Annatto",
    code: "E160b",
    type: "additive",
    description: "Natural yellow-orange food coloring",
    healthConcerns: "Generally recognized as safe; rare allergic reactions",
    aliases: ["annatto extract"]
  },
];

// Function to detect additives in ingredients string
export function detectAdditives(ingredients: string): Additive[] {
  if (!ingredients) return [];
  
  const lowerIngredients = ingredients.toLowerCase();
  const detected: Additive[] = [];
  const detectedNames = new Set<string>();

  // Check each known additive
  for (const additive of KNOWN_ADDITIVES) {
    const searchTerms = [
      additive.name.toLowerCase(),
      additive.code?.toLowerCase(),
      ...(additive.aliases || []).map(a => a.toLowerCase())
    ].filter(Boolean) as string[];

    // Check if any search term is found
    const found = searchTerms.some(term => {
      // Use word boundary for better matching
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerIngredients);
    });

    if (found && !detectedNames.has(additive.name)) {
      detected.push(additive);
      detectedNames.add(additive.name);
    }
  }

  return detected;
}