import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Camera, Search, Check, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Detected {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string;
  confidence: string;
}

interface MealRow {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

interface SearchResult {
  name: string;
  serving: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

const LogMeal = () => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [goal, setGoal] = useState(2200);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  const loadMeals = async () => {
    if (!user) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const { data } = await supabase
      .from("meals")
      .select("id,name,calories,protein_g,carbs_g,fat_g,logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", today.toISOString())
      .order("logged_at", { ascending: false });
    setMeals(data || []);
    const { data: prof } = await supabase.from("profiles").select("daily_calorie_goal").eq("id", user.id).maybeSingle();
    if (prof?.daily_calorie_goal) setGoal(prof.daily_calorie_goal);
  };
  useEffect(() => { loadMeals(); }, [user]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setDetected(null);
      setAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke("recognize-food", {
          body: { imageBase64: dataUrl },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setDetected(data as Detected);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to recognize food";
        toast.error(message);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(f);
  };

  const saveDetected = async () => {
    if (!user || !detected) return;
    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      name: detected.name,
      calories: Math.round(detected.calories),
      protein_g: detected.protein_g,
      carbs_g: detected.carbs_g,
      fat_g: detected.fat_g,
      ingredients: detected.ingredients,
      source: "vision",
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Meal logged");
      setDetected(null);
      setImagePreview(null);
      loadMeals();
    }
  };

  const runSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-food", { body: { query: search } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSearchResults(data.foods || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      toast.error(message);
    } finally {
      setSearching(false);
    }
  };

  const logSearchItem = async (f: SearchResult) => {
    if (!user) return;
    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      name: f.name,
      calories: Math.round(f.calories),
      protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g,
      ingredients: f.serving,
      source: "search",
    });
    if (error) toast.error(error.message);
    else { toast.success(`Logged ${f.name}`); loadMeals(); }
  };

  const deleteMeal = async (mealId: string) => {
    if (!user) return;
    setDeletingMealId(mealId);
    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId)
        .eq("user_id", user.id);

      if (error) throw error;

      setMeals((current) => current.filter((meal) => meal.id !== mealId));
      toast.success("Meal deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete meal";
      toast.error(message);
    } finally {
      setDeletingMealId(null);
    }
  };

  const consumed = meals.reduce((s, m) => s + m.calories, 0);
  const remaining = Math.max(0, goal - consumed);
  const pct = Math.min(100, (consumed / goal) * 100);

  return (
    <AppShell title="Log Your Meal">
      <div className="space-y-5">
        {/* Camera card */}
        <div className="nutri-card">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-deep text-white font-semibold hover:opacity-90"
          >
            <Camera size={22} /> {analyzing ? "Analyzing…" : "Take or upload photo"}
            {analyzing && <Loader2 className="ml-auto animate-spin" size={18} />}
          </button>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />

          {imagePreview && (
            <div className="mt-4 relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="meal" className="w-full max-h-72 object-cover" />
              {detected && (
                <div className="absolute bottom-2 right-2 bg-white/95 px-3 py-1 rounded-lg font-display text-sm">
                  {Math.round(detected.calories)} cal
                </div>
              )}
            </div>
          )}

          {detected && (
            <div className="mt-4 space-y-2 text-sm">
              <p><b>Logged Meal:</b> {detected.name} ({detected.portion})</p>
              <p><b>Total calories:</b> {Math.round(detected.calories)}</p>
              <p><b>Macros:</b> P {detected.protein_g}g · C {detected.carbs_g}g · F {detected.fat_g}g</p>
              <p><b>Ingredients:</b> {detected.ingredients}</p>
              <p className="text-xs text-muted-foreground">AI confidence: {detected.confidence}</p>
              <button
                onClick={saveDetected}
                className="w-full mt-2 rounded-xl bg-teal text-white py-2 font-semibold flex items-center justify-center gap-2"
              >
                <Check size={18} /> Confirm & save
              </button>
            </div>
          )}
        </div>

        {/* Search card */}
        <div className="nutri-card">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search foods (e.g. grilled chicken)"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-white"
            />
            <button onClick={runSearch} disabled={searching} className="rounded-lg bg-teal-deep text-white px-3">
              {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mt-3 divide-y divide-border">
              {searchResults.map((f, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.serving} · {Math.round(f.calories)} cal</p>
                  </div>
                  <button onClick={() => logSearchItem(f)} className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg">
                    Log
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Progress */}
        <div className="nutri-card">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Calories consumed: <b>{consumed}</b></span>
            <span>Remaining: <b>{remaining}</b></span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-teal-deep transition-all" style={{ width: `${pct}%` }} />
          </div>
          {meals.length > 0 && (
            <ul className="mt-4 divide-y divide-border text-sm">
              {meals.map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-3">
                  <div className="flex-1">
                    <p>{m.name}</p>
                    <p className="text-muted-foreground">{m.calories} cal</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteMeal(m.id)}
                    disabled={deletingMealId === m.id}
                    aria-label={`Delete ${m.name}`}
                    className="rounded-lg border border-border bg-white px-2.5 py-2 text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingMealId === m.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default LogMeal;
