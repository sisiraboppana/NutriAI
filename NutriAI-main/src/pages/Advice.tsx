import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Advice = () => {
  const { user } = useAuth();
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const { data: meals } = await supabase
        .from("meals").select("name,calories,protein_g,carbs_g,fat_g,logged_at")
        .eq("user_id", user.id).gte("logged_at", today.toISOString());
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      const goal = prof?.daily_calorie_goal ?? 2200;
      const consumed = (meals || []).reduce((s,m)=>s+(m.calories||0),0);
      const protein = (meals || []).reduce((s,m)=>s+Number(m.protein_g||0),0);
      const out: string[] = [];

      if (consumed < goal * 0.5) out.push(`You've only had ${consumed} of your ${goal} cal goal — make sure you're eating enough.`);
      else if (consumed > goal * 1.1) out.push(`You're over your ${goal} cal goal by ${consumed - goal}. Consider lighter options for the rest of the day.`);
      else out.push(`Nicely on track: ${consumed} / ${goal} cal today.`);

      if (protein < 50) out.push(`Protein is low (${Math.round(protein)}g). Add eggs, chicken, tofu, or Greek yogurt.`);
      if (!meals || meals.length === 0) out.push(`No meals logged today. Snap a photo on the Log page to get started.`);
      if (prof?.goal === "lose") out.push(`To lose weight, aim for a ~500 cal deficit. Walking 30 min burns ~150 cal.`);
      if (prof?.goal === "gain") out.push(`To gain weight, target a ~300 cal surplus and prioritize whole foods.`);

      setTips(out);
    })();
  }, [user]);

  return (
    <AppShell title="Get Advice">
      <div className="nutri-card space-y-3">
        <h2 className="font-display text-xl text-teal-deep">Today's smart tips</h2>
        <ul className="space-y-2 text-sm">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-teal-deep font-bold">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
};

export default Advice;
