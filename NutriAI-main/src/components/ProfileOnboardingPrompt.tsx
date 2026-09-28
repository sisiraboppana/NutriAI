import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateBmi, getBmiLabel, getSuggestedDailyCalories, type GoalType } from "@/lib/calorieGoal";
import { toast } from "sonner";

interface ProfileForm {
  name: string;
  age: number | null;
  gender: string;
  height_cm: number | null;
  weight_lb: number | null;
  goal: string;
  daily_calorie_goal: number | null;
}

const DISMISS_KEY_PREFIX = "nutriai-profile-onboarding-dismissed";
const COMPLETE_KEY_PREFIX = "nutriai-profile-onboarding-completed";

const numberValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) || null : null;
};

const ProfileOnboardingPrompt = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: null,
    gender: "",
    height_cm: null,
    weight_lb: null,
    goal: "maintain",
    daily_calorie_goal: 2200,
  });
  const suggestedCalories = getSuggestedDailyCalories(form.height_cm, form.weight_lb, form.goal as GoalType);
  const bmiValue = calculateBmi(form.height_cm, form.weight_lb);
  const bmiLabel = getBmiLabel(bmiValue);

  useEffect(() => {
    const loadProfilePromptState = async () => {
      if (!user) {
        setOpen(false);
        setLoading(false);
        return;
      }

      const dismissKey = `${DISMISS_KEY_PREFIX}:${user.id}`;
      const completeKey = `${COMPLETE_KEY_PREFIX}:${user.id}`;
      const dismissedForSession = sessionStorage.getItem(dismissKey) === "true";
      const completed = localStorage.getItem(completeKey) === "true";

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("name, age, gender, height_cm, weight_lb, goal, daily_calorie_goal")
        .eq("id", user.id)
        .maybeSingle<ProfileForm>();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          name: data.name ?? "",
          age: data.age,
          gender: data.gender ?? "",
          height_cm: data.height_cm,
          weight_lb: data.weight_lb,
          goal: data.goal ?? "maintain",
          daily_calorie_goal: data.daily_calorie_goal ?? 2200,
        });
      }

      setOpen(!completed && !dismissedForSession);
      setLoading(false);
    };

    void loadProfilePromptState();
  }, [user]);

  const handleLater = () => {
    if (!user) return;
    sessionStorage.setItem(`${DISMISS_KEY_PREFIX}:${user.id}`, "true");
    setOpen(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...form,
      });

      if (error) throw error;

      localStorage.setItem(`${COMPLETE_KEY_PREFIX}:${user.id}`, "true");
      sessionStorage.removeItem(`${DISMISS_KEY_PREFIX}:${user.id}`);
      toast.success("Profile saved");
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-teal-deep">Tell us a little about you</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This helps personalize NutriAI. None of these fields are required, and anything you answer will be saved to your profile automatically.
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.age ?? ""}
              onChange={(e) => setForm({ ...form, age: numberValue(e.target.value) })}
              placeholder="Age"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            />
            <input
              type="text"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              placeholder="Gender"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.height_cm ?? ""}
              onChange={(e) => setForm({ ...form, height_cm: numberValue(e.target.value) })}
              placeholder="Height (cm)"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            />
            <input
              type="number"
              value={form.weight_lb ?? ""}
              onChange={(e) => setForm({ ...form, weight_lb: numberValue(e.target.value) })}
              placeholder="Weight (lb)"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain weight</option>
            </select>
            <input
              type="number"
              value={form.daily_calorie_goal ?? ""}
              onChange={(e) => setForm({ ...form, daily_calorie_goal: numberValue(e.target.value) })}
              placeholder="Daily calories"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
            />
          </div>
          {suggestedCalories && (
            <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                Suggested daily goal: {suggestedCalories} cal/day
              </p>
              <p className="mt-1 text-muted-foreground">
                Based on your BMI{bmiValue ? ` (${bmiValue.toFixed(1)}${bmiLabel ? `, ${bmiLabel}` : ""})` : ""} and your goal to {form.goal}.
              </p>
              <button
                type="button"
                onClick={() => setForm({ ...form, daily_calorie_goal: suggestedCalories })}
                className="mt-3 rounded-xl bg-white px-3 py-2 font-medium text-teal-deep shadow-sm transition hover:bg-white/80"
              >
                Use suggested goal
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleLater}
            disabled={saving}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Do this later
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 rounded-xl bg-teal-deep px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span> : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboardingPrompt;
