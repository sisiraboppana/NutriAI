import { useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

interface Recipe {
  name: string;
  calories: number;
  protein_g: number; carbs_g: number; fat_g: number;
  prep_minutes: number;
  ingredients: string[];
  steps: string[];
  diet_tags: string[];
}

const Recipes = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [maxCal, setMaxCal] = useState(800);
  const [diet, setDiet] = useState("any");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [logging, setLogging] = useState<number | null>(null);

  const logRecipe = async (r: Recipe, i: number) => {
    if (!user) { toast.error("Please sign in"); return; }
    setLogging(i);
    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      name: r.name,
      calories: Math.round(r.calories),
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      ingredients: r.ingredients?.join(", "),
      source: "recipe",
    });
    setLogging(null);
    if (error) toast.error(error.message);
    else toast.success(`Added ${r.name} to today's log`);
  };

  const search = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-recipes", {
        body: { query, maxCalories: maxCal, diet },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecipes(data.recipes || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Get Recipes">
      <div className="nutri-card space-y-3">
        <input
          placeholder="What do you feel like? (e.g. high-protein lunch)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground">Max calories</label>
            <input type="number" value={maxCal} onChange={(e) => setMaxCal(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 bg-white" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Diet</label>
            <select value={diet} onChange={(e) => setDiet(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 bg-white">
              <option value="any">Any</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Keto</option>
              <option value="gluten-free">Gluten-free</option>
              <option value="high-protein">High-protein</option>
            </select>
          </div>
        </div>
        <button onClick={search} disabled={loading}
          className="w-full rounded-xl bg-teal-deep text-white font-semibold py-2.5 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {loading ? "Cooking up ideas…" : "Find recipes"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {recipes.map((r, i) => (
          <div key={i} className="nutri-card">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">{r.name}</h3>
                <span className="text-sm text-teal-deep font-bold">{r.calories} cal</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {r.prep_minutes} min · P {r.protein_g}g · C {r.carbs_g}g · F {r.fat_g}g
                {r.diet_tags?.length ? " · " + r.diet_tags.join(", ") : ""}
              </p>
            </button>
            {open === i && (
              <div className="mt-3 pt-3 border-t border-border space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Ingredients</h4>
                  <ul className="list-disc list-inside space-y-0.5">{r.ingredients.map((x,j)=><li key={j}>{x}</li>)}</ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Steps</h4>
                  <ol className="list-decimal list-inside space-y-1">{r.steps.map((x,j)=><li key={j}>{x}</li>)}</ol>
                </div>
                <button
                  onClick={() => logRecipe(r, i)}
                  disabled={logging === i}
                  className="w-full rounded-xl bg-teal text-white font-semibold py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {logging === i ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {logging === i ? "Adding…" : "Add to today's log"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default Recipes;
