"use client";

import React, { useMemo, useState } from "react";
import { BreakfastIcon, DinnerIcon, InfoIcon, LunchIcon, PlusIcon, SnackIcon, TargetIcon, TrashIcon, SpinnerIcon, CheckIcon } from "./Icons";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type Portion = "S" | "M" | "L";

type Meal = {
  id: string;
  name: string;
  type: MealType;
  portion: Portion;
};

const defaultMeals: Meal[] = [];

const BASE_NUTRITION: Record<MealType, { calories: number; protein: number; carbs: number; fat: number; defaultName: string }> = {
  breakfast: { calories: 350, protein: 18, carbs: 45, fat: 10, defaultName: "Breakfast" },
  lunch: { calories: 550, protein: 32, carbs: 55, fat: 18, defaultName: "Lunch" },
  dinner: { calories: 600, protein: 30, carbs: 60, fat: 20, defaultName: "Dinner" },
  snack: { calories: 200, protein: 10, carbs: 20, fat: 8, defaultName: "Snack" },
};

const PORTION_SCALE: Record<Portion, number> = { S: 0.75, M: 1, L: 1.25 };

function computeMealNutrition(meal: Meal) {
  const base = BASE_NUTRITION[meal.type];
  const k = PORTION_SCALE[meal.portion];
  return {
    calories: Math.round(base.calories * k),
    protein: Math.round(base.protein * k),
    carbs: Math.round(base.carbs * k),
    fat: Math.round(base.fat * k),
  };
}

export default function DietPlanner() {
  const [targetCalories, setTargetCalories] = useState<string>("2000");
  const [meals, setMeals] = useState<Meal[]>(defaultMeals);
  const [preset, setPreset] = useState<string>("Balanced");
  const [planId, setPlanId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("My plan");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [plans, setPlans] = useState<any[]>([]);

  const totals = useMemo(() => {
    return meals.reduce((acc, m) => {
      const n = computeMealNutrition(m);
      acc.calories += n.calories;
      acc.protein += n.protein;
      acc.carbs += n.carbs;
      acc.fat += n.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  const addMeal = (type: MealType = "breakfast") => {
    setMeals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: BASE_NUTRITION[type].defaultName,
        type,
        portion: "M",
      },
    ]);
  };

  const updateMeal = (id: string, patch: Partial<Meal>) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const targetCaloriesNum = parseInt(targetCalories || "0", 10) || 0;
  const remaining = Math.max(0, targetCaloriesNum - totals.calories);

  return (
    <div className="border p-4 flex flex-col gap-4" style={{ borderColor: "var(--background-3)" }}>
      <div className="border p-3 bg-background" style={{ borderColor: "var(--background-3)" }}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Plan your day</h2>
          <button className="text-sm underline" onClick={()=>setShowHelp(!showHelp)}>{showHelp? 'Hide help' : 'How it works'}</button>
        </div>
        {showHelp && (
          <ol className="list-decimal pl-5 text-sm text-text-2 mt-2 space-y-1">
            <li>Set a daily calorie goal.</li>
            <li>Tap Quick add (Breakfast/Lunch/Dinner/Snack).</li>
            <li>Adjust name or portion (Small/Regular/Large).</li>
            <li>Save plan. Load it anytime from Saved plans.</li>
          </ol>
        )}
      </div>
      <div className="grid md:grid-cols-4 gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm text-text-2">Plan title</label>
          <input className="border p-2 w-full" style={{ borderColor: "var(--background-3)" }} value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="text-sm text-text-2">Date</label>
          <input type="date" className="border p-2 w-full" style={{ borderColor: "var(--background-3)" }} value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="text-sm text-text-2">Daily calorie goal</label>
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => setTargetCalories(e.target.value)}
            className="border p-2 w-full max-w-[10rem]"
            style={{ borderColor: "var(--background-3)" }}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-text-2">Quick add</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="border px-2 py-1 text-sm flex items-center gap-1" style={{ borderColor: "var(--background-3)" }} onClick={()=>addMeal("breakfast")}><BreakfastIcon />Breakfast</button>
            <button type="button" className="border px-2 py-1 text-sm flex items-center gap-1" style={{ borderColor: "var(--background-3)" }} onClick={()=>addMeal("lunch")}><LunchIcon />Lunch</button>
            <button type="button" className="border px-2 py-1 text-sm flex items-center gap-1" style={{ borderColor: "var(--background-3)" }} onClick={()=>addMeal("dinner")}><DinnerIcon />Dinner</button>
            <button type="button" className="border px-2 py-1 text-sm flex items-center gap-1" style={{ borderColor: "var(--background-3)" }} onClick={()=>addMeal("snack")}><SnackIcon />Snack</button>
          </div>
        </div>
        <div className="text-sm text-text-2 md:text-right flex items-center gap-2">
          <TargetIcon /> <span>Remaining today:</span> <b>{remaining}</b> kcal
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {meals.map((m) => (
          <div key={m.id} className="grid grid-cols-12 items-start gap-2 border p-2" style={{ borderColor: "var(--background-3)" }}>
            <div className="col-span-1 flex items-center justify-center">
              {m.type === 'breakfast' && <BreakfastIcon />}
              {m.type === 'lunch' && <LunchIcon />}
              {m.type === 'dinner' && <DinnerIcon />}
              {m.type === 'snack' && <SnackIcon />}
            </div>
            <input
              aria-label="Meal name"
              placeholder={BASE_NUTRITION[m.type].defaultName}
              className="col-span-6 border p-2 w-full"
              style={{ borderColor: "var(--background-3)" }}
              value={m.name}
              onChange={(e) => updateMeal(m.id, { name: e.target.value })}
            />
            <div className="col-span-3">
              <label className="text-xs text-text-2">Portion size</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <button type="button" className={`border px-2 py-1 text-xs ${m.portion==='S'?'bg-background-2':''}`} style={{ borderColor: "var(--background-3)" }} onClick={()=>updateMeal(m.id,{ portion: 'S' })}>Small
                  <span className="ml-1 text-text-2">(~75%)</span>
                </button>
                <button type="button" className={`border px-2 py-1 text-xs ${m.portion==='M'?'bg-background-2':''}`} style={{ borderColor: "var(--background-3)" }} onClick={()=>updateMeal(m.id,{ portion: 'M' })}>Regular
                  <span className="ml-1 text-text-2">(100%)</span>
                </button>
                <button type="button" className={`border px-2 py-1 text-xs ${m.portion==='L'?'bg-background-2':''}`} style={{ borderColor: "var(--background-3)" }} onClick={()=>updateMeal(m.id,{ portion: 'L' })}>Large
                  <span className="ml-1 text-text-2">(125%)</span>
                </button>
              </div>
            </div>
            <button className="col-span-2 text-sm flex items-center justify-center" onClick={() => removeMeal(m.id)} aria-label="Delete meal" title="Delete meal">
              <TrashIcon />
            </button>
            <div className="col-span-12 text-xs text-text-2 flex flex-wrap items-center gap-3">
              {(() => { const n = computeMealNutrition(m); return (
                <div className="flex gap-3">
                  <span>{n.calories} kcal</span>
                  <span>P {n.protein}g</span>
                  <span>C {n.carbs}g</span>
                  <span>F {n.fat}g</span>
                </div>
              ); })()}
            </div>
            <div className="col-span-12 text-xs text-text-2 flex items-center gap-2">
              <InfoIcon /> Estimated macros based on portion. You can adjust after saving.
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 items-start text-sm text-text-2">
        <div className="flex items-center gap-4">
          <TargetIcon />
          <span>Total today:</span>
          <span>{totals.calories} kcal</span>
          <span>{totals.protein} g protein</span>
          <span>{totals.carbs} g carbs</span>
          <span>{totals.fat} g fat</span>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button className="border px-3 py-1 flex items-center gap-2" style={{ borderColor: "var(--background-3)" }} onClick={()=>addMeal()}>
            <PlusIcon /> Quick add
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2 flex-wrap" aria-live="polite">
        <div className="text-sm text-text-2">
          Saved plans:
          <button className="ml-2 border px-2 py-1 text-xs" style={{ borderColor: "var(--background-3)" }} onClick={async()=>{
            try{
              const res = await fetch(`/api/diet/plans`);
              const data = await res.json();
              setPlans(data?.plans || []);
            }catch{}
          }}>Refresh</button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {saving ? <SpinnerIcon /> : savedAt ? <span className="flex items-center gap-1 text-accent"><CheckIcon /> Saved</span> : null}
          <button className="border px-3 py-1" style={{ borderColor: "var(--background-3)" }}
            onClick={async ()=>{
              try{
                setSaving(true); setSavedAt(0);
                const res = await fetch('/api/diet/plans',{
                  method:'POST',
                  headers:{'content-type':'application/json'},
                  body: JSON.stringify({ id: planId, title, date, caloriesTarget: parseInt(targetCalories||'0',10)||0, meals: meals.map(m=>({
                    name: m.name,
                    ...computeMealNutrition(m),
                  })) })
                });
                const data = await res.json();
                if(data?.plan){ setPlanId(data.plan.id); setSavedAt(Date.now()); }
              }catch{} finally{ setSaving(false); }
            }}
          >Save plan</button>
        </div>
      </div>

      {plans.length>0 && (
        <div className="mt-2 border p-2" style={{ borderColor: "var(--background-3)" }}>
          <div className="text-sm text-text-2 mb-2">Your plans</div>
          <div className="grid md:grid-cols-2 gap-2">
            {plans.map((p)=> (
              <button key={p.id} className="text-left border p-2" style={{ borderColor: "var(--background-3)" }} onClick={()=>{
                setPlanId(p.id);
                setTitle(p.title||'My plan');
                setDate(p.date ? String(p.date).slice(0,10) : new Date().toISOString().slice(0,10));
                setTargetCalories(String(p.caloriesTarget||0));
                setMeals((p.meals||[]).map((m:any)=>({ id: crypto.randomUUID(), name: m.name, type: 'lunch', portion: 'M' })));
              }}>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-text-2">{p.date ? String(p.date).slice(0,10) : ''} • {p.caloriesTarget} kcal • {p.meals?.length||0} meals</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


