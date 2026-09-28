export type GoalType = "lose" | "maintain" | "gain";

const LB_TO_KG = 0.453592;

const roundToNearest50 = (value: number) => Math.round(value / 50) * 50;

export const calculateBmi = (heightCm: number | null, weightLb: number | null) => {
  if (!heightCm || !weightLb) return null;

  const heightM = heightCm / 100;
  const weightKg = weightLb * LB_TO_KG;

  if (heightM <= 0 || weightKg <= 0) return null;

  return weightKg / (heightM * heightM);
};

export const getSuggestedDailyCalories = (
  heightCm: number | null,
  weightLb: number | null,
  goal: GoalType,
) => {
  const bmi = calculateBmi(heightCm, weightLb);
  if (!bmi || !weightLb) return null;

  let maintainMultiplier = 15;
  if (bmi < 18.5) maintainMultiplier = 16;
  else if (bmi >= 30) maintainMultiplier = 13;
  else if (bmi >= 25) maintainMultiplier = 14;

  const maintainCalories = weightLb * maintainMultiplier;

  let suggested = maintainCalories;
  if (goal === "lose") suggested -= bmi >= 30 ? 650 : 500;
  if (goal === "gain") suggested += bmi < 18.5 ? 400 : 300;

  return Math.max(1200, roundToNearest50(suggested));
};

export const getBmiLabel = (bmi: number | null) => {
  if (!bmi) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy range";
  if (bmi < 30) return "overweight";
  return "obesity range";
};
