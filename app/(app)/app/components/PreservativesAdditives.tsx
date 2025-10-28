"use client";

import { useEffect, useState } from "react";

interface Additive {
  name: string;
  code?: string;
  type: 'preservative' | 'additive';
  description: string;
  healthConcerns?: string;
}

interface PreservativesAdditivesProps {
  ingredients?: string | null;
  productName: string;
}

export default function PreservativesAdditives({
  ingredients,
  productName,
}: PreservativesAdditivesProps) {
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!ingredients) {
      setLoading(false);
      return;
    }

    const fetchAdditives = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analyze-additives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients, productName }),
        });
        
        if (!response.ok) {
          setAdditives([]);
          return;
        }

        const data = await response.json();
        setAdditives(data.additives || []);
      } catch (error) {
        setAdditives([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdditives();
  }, [ingredients, productName]);

  // Don't render anything if no ingredients
  if (!ingredients) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="border p-4 rounded-lg animate-pulse" style={{ borderColor: "var(--background-3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full bg-background-3"></div>
          <div className="h-4 bg-background-3 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-10 bg-background-2 rounded"></div>
          <div className="h-10 bg-background-2 rounded"></div>
          <div className="h-10 bg-background-2 rounded"></div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-2">
          <div className="animate-spin">⚗️</div>
          <span>Analyzing ingredients for preservatives and additives...</span>
        </div>
      </div>
    );
  }

  // Don't render if no additives found
  if (additives.length === 0) return null;

  const preservatives = additives.filter(a => a.type === 'preservative');
  const otherAdditives = additives.filter(a => a.type === 'additive');

  return (
    <div className="border p-4 rounded-lg" style={{ borderColor: "var(--background-3)" }}>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        ⚠️ Preservatives & Additives Found
      </h3>
      
      <div className="flex flex-col gap-4">
        {preservatives.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-2 mb-2 uppercase tracking-wide">
              Preservatives:
            </p>
            <div className="flex flex-col gap-2">
              {preservatives.map((item, index) => (
                <div key={`p-${index}`}>
                  <button
                    onClick={() => setExpanded(expanded === `p-${index}` ? null : `p-${index}`)}
                    className="w-full text-left px-3 py-2 text-xs rounded border hover:bg-opacity-80 transition-colors"
                    style={{
                      borderColor: "var(--background-3)",
                      backgroundColor: "rgba(255, 165, 0, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {item.name} {item.code && <span className="text-text-2">({item.code})</span>}
                      </span>
                      <span className="text-xs">
                        {expanded === `p-${index}` ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expanded === `p-${index}` && (
                    <div className="mt-2 p-3 text-xs border rounded" style={{ 
                      borderColor: "var(--background-3)", 
                      backgroundColor: "var(--background-2)" 
                    }}>
                      <p className="mb-2">
                        <strong>What it does:</strong> {item.description}
                      </p>
                      {item.healthConcerns && (
                        <p className="text-text-2">
                          <strong>Health notes:</strong> {item.healthConcerns}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {otherAdditives.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-2 mb-2 uppercase tracking-wide">
              Other Additives:
            </p>
            <div className="flex flex-col gap-2">
              {otherAdditives.map((item, index) => (
                <div key={`a-${index}`}>
                  <button
                    onClick={() => setExpanded(expanded === `a-${index}` ? null : `a-${index}`)}
                    className="w-full text-left px-3 py-2 text-xs rounded border hover:bg-opacity-80 transition-colors"
                    style={{
                      borderColor: "var(--background-3)",
                      backgroundColor: "rgba(99, 179, 237, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {item.name} {item.code && <span className="text-text-2">({item.code})</span>}
                      </span>
                      <span className="text-xs">
                        {expanded === `a-${index}` ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expanded === `a-${index}` && (
                    <div className="mt-2 p-3 text-xs border rounded" style={{ 
                      borderColor: "var(--background-3)", 
                      backgroundColor: "var(--background-2)" 
                    }}>
                      <p className="mb-2">
                        <strong>What it does:</strong> {item.description}
                      </p>
                      {item.healthConcerns && (
                        <p className="text-text-2">
                          <strong>Health notes:</strong> {item.healthConcerns}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-text-2 mt-4 italic">
        💡 Click on any item to learn more about it
      </p>
    </div>
  );
}