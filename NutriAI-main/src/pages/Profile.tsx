import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateBmi, getBmiLabel, getSuggestedDailyCalories, type GoalType } from "@/lib/calorieGoal";
import { toast } from "sonner";

const COMPLETE_KEY_PREFIX = "nutriai-profile-onboarding-completed";

interface Profile {
  name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_lb: number | null;
  goal: string | null;
  daily_calorie_goal: number | null;
}

const Profile = () => {
  const { user } = useAuth();
  const [p, setP] = useState<Profile>({
    name: "",
    age: null,
    gender: "",
    height_cm: null,
    weight_lb: null,
    goal: "maintain",
    daily_calorie_goal: 2200,
  });
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [busy, setBusy] = useState(false);
  const bmiValue = calculateBmi(p.height_cm, p.weight_lb);
  const bmiLabel = getBmiLabel(bmiValue);
  const suggestedCalories = getSuggestedDailyCalories(
    p.height_cm,
    p.weight_lb,
    (p.goal ?? "maintain") as GoalType,
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setP(data as Profile);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: meals } = await supabase
        .from("meals")
        .select("calories, logged_at")
        .eq("user_id", user.id);

      if (meals) {
        const todaySum = meals.filter((m) => new Date(m.logged_at) >= today).reduce((s, m) => s + m.calories, 0);
        const totalSum = meals.reduce((s, m) => s + m.calories, 0);
        setStats({ today: todaySum, total: totalSum });
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...p });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      localStorage.setItem(`${COMPLETE_KEY_PREFIX}:${user.id}`, "true");
      toast.success("Profile saved");
    }
  };

  return (
    <AppShell title="User Profile">
      <div className="nutri-card space-y-3">
        {[
          { k: "name", label: "Name", type: "text" },
          { k: "age", label: "Age", type: "number" },
          { k: "gender", label: "Gender", type: "text" },
          { k: "height_cm", label: "Height (cm)", type: "number" },
          { k: "weight_lb", label: "Weight (lb)", type: "number" },
          { k: "daily_calorie_goal", label: "Daily Calorie Goal", type: "number" },
        ].map(({ k, label, type }) => (
          <div key={k} className="flex items-center gap-3">
            <label className="font-display font-semibold text-foreground w-40 text-sm">{label}:</label>
            <input
              type={type}
              value={(p as Record<string, string | number | null>)[k] ?? ""}
              onChange={(e) =>
                setP({
                  ...p,
                  [k]: type === "number" ? Number(e.target.value) || null : e.target.value,
                })
              }
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-white"
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <label className="font-display font-semibold text-foreground w-40 text-sm">Goal:</label>
          <select
            value={p.goal ?? "maintain"}
            onChange={(e) => setP({ ...p, goal: e.target.value })}
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-white"
          >
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>

        {suggestedCalories && (
          <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
            <p className="font-display font-semibold text-foreground">
              Suggested daily goal: {suggestedCalories} cal/day
            </p>
            <p className="mt-1 text-muted-foreground">
              Based on your BMI {bmiValue ? `${bmiValue.toFixed(1)}${bmiLabel ? ` (${bmiLabel})` : ""}` : ""}
              {" "}and your goal to {p.goal ?? "maintain"}.
            </p>
            <button
              type="button"
              onClick={() => setP({ ...p, daily_calorie_goal: suggestedCalories })}
              className="mt-3 rounded-xl bg-white px-3 py-2 font-medium text-teal-deep shadow-sm transition hover:bg-white/80"
            >
              Use suggested goal
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-border space-y-1 text-sm">
          <p className="font-display">
            <b>BMI:</b> {bmiValue ? bmiValue.toFixed(1) : "--"}{bmiLabel ? ` (${bmiLabel})` : ""}
          </p>
          <p className="font-display"><b>Calories consumed today:</b> {stats.today}</p>
          <p className="font-display"><b>Calories consumed total:</b> {stats.total}</p>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="w-full mt-3 rounded-xl bg-teal-deep text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save profile"}
        </button>
      </div>
    </AppShell>
  );
};

export default Profile;
