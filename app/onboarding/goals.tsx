import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { FormField } from '../../components/onboarding/FormField';
import { GOAL_OPTIONS, GoalCard } from '../../components/onboarding/GoalCard';
import { StepScaffold } from '../../components/onboarding/StepScaffold';
import { ScreenError, ScreenLoading } from '../../components/ScreenState';
import * as api from '../../lib/api';
import type { PlayerGoal } from '../../lib/api';
import { useSession } from '../../lib/session';
import { errorMessage, useApiData } from '../../lib/useApi';

/** Step 3 of 4 — what the player is working towards. */
export default function OnboardingGoals() {
  const { requireToken, token } = useSession();
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);

  const [goals, setGoals] = useState<PlayerGoal[] | null>(null);
  const [shortTermGoal, setShortTermGoal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile.loading && !profile.data) return <ScreenLoading label="Loading your profile" />;
  if (!profile.data) {
    return <ScreenError message={profile.error ?? 'Profile unavailable'} onRetry={profile.refetch} />;
  }

  const saved = profile.data;
  const selected = goals ?? saved.goals ?? [];
  const shortTermValue = shortTermGoal ?? saved.short_term_goal ?? '';

  function toggle(goal: PlayerGoal) {
    setGoals(
      selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal]
    );
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await api.updateProfile(requireToken(), {
        goals: selected,
        ...(shortTermValue.trim() ? { short_term_goal: shortTermValue.trim() } : {}),
      });
      router.push('/onboarding/highlights');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StepScaffold
      step={3}
      title="Your goals & focus"
      subtitle="Tell us what you're working towards."
      onContinue={handleContinue}
      submitting={submitting}
      error={error}
      canContinue={selected.length > 0}>
      <Text className="font-sans-semibold text-[13px] text-ink">What are your goals?</Text>
      <Text className="font-sans mb-3 mt-0.5 text-[12px] text-slate">Select all that apply.</Text>

      {GOAL_OPTIONS.map((option) => (
        <GoalCard
          key={option.key}
          option={option}
          selected={selected.includes(option.key)}
          onToggle={() => toggle(option.key)}
        />
      ))}

      <FormField
        label="Short-term goal"
        optional
        value={shortTermValue}
        onChangeText={setShortTermGoal}
        placeholder="E.g., Earn a starting spot this season"
        icon="flag-outline"
      />
    </StepScaffold>
  );
}
