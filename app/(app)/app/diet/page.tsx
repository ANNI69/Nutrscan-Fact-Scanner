import DietPlanner from "../components/DietPlanner";

export default function DietPage() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Diet planner</h1>
      <p className="text-text-2 text-sm">Plan your day with calorie target and quick macros.</p>
      <DietPlanner />
    </div>
  );
}


