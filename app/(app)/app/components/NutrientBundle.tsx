import { NutrientBar } from "@/(app)/components";
import { ProductNutrients } from "@prisma/client";
import AdditivesBar from "./AdditivesBar";

export default function NutrientBundle( {title, nutrients}: {title: string, nutrients: ProductNutrients[]} ) {

  if( nutrients.length === 0 )
    return;

  // Determine if this is negatives or positives
  const isNegative = title.toLowerCase().includes('negative');
  const icon = isNegative ? '⚠️' : '✅';
  const accentColor = isNegative ? 'rgba(236, 74, 60, 0.1)' : 'rgba(73, 161, 96, 0.1)';

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--background-3)" }}>
      {/* Header */}
      <div 
        className="px-5 py-4 flex justify-between items-center"
        style={{ backgroundColor: accentColor }}
      >
        <h3 className="font-bold text-base flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </h3>
        <div className="text-xs font-medium text-text-2 uppercase tracking-wider">
          Per 100g
        </div>
      </div>

      {/* Nutrients List */}
      <div className="bg-background">
        {nutrients.map((nutrient) => {
          if ( nutrient.nameKey === 'additives' )
            return <AdditivesBar key={nutrient.id} nutrient={nutrient} />;
          else
            return <NutrientBar key={nutrient.id} nutrient={nutrient} />;
        })}
      </div>
    </div>
  )
}
