import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { FormField } from '../../components/onboarding/FormField';
import { PositionPicker } from '../../components/onboarding/PositionPicker';
import { StepScaffold } from '../../components/onboarding/StepScaffold';
import { ScreenError, ScreenLoading } from '../../components/ScreenState';
import type { Position } from '../../data/types';
import * as api from '../../lib/api';
import { useSession } from '../../lib/session';
import { cmToFeetInches, kgToLbs, parseHeightToCm, parseLbsToKg } from '../../lib/units';
import { errorMessage, useApiData } from '../../lib/useApi';

/** Step 2 of 4 — positions, physicals, current team. */
export default function OnboardingBasketball() {
  const { requireToken, token } = useSession();
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);

  const [primary, setPrimary] = useState<Position | null>(null);
  const [secondary, setSecondary] = useState<Position | null | undefined>(undefined);
  const [height, setHeight] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [wingspan, setWingspan] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (profile.loading && !profile.data) return <ScreenLoading label="Loading your profile" />;
  if (!profile.data) {
    return <ScreenError message={profile.error ?? 'Profile unavailable'} onRetry={profile.refetch} />;
  }

  const saved = profile.data;
  const primaryValue = primary ?? saved.position;
  // `undefined` means untouched (fall back to saved); `null` means explicitly cleared.
  const secondaryValue = secondary === undefined ? saved.secondary_position : secondary;
  const heightValue = height ?? cmToFeetInches(saved.height_cm).replace(/"/g, '');
  const weightValue = weight ?? String(kgToLbs(saved.weight_kg));
  const wingspanValue = wingspan ?? cmToFeetInches(saved.wingspan_cm).replace(/"/g, '');
  const teamValue = currentTeam ?? saved.current_team ?? '';

  async function handleContinue() {
    setError(null);

    // Parse before sending so unit mistakes are caught inline rather than as a
    // 422 from the server.
    const heightCm = parseHeightToCm(heightValue);
    const weightKg = parseLbsToKg(weightValue);
    const wingspanCm = parseHeightToCm(wingspanValue);

    const next: Record<string, string> = {};
    if (heightCm === null || heightCm < 140 || heightCm > 240) {
      next.height = 'Enter a height like 6\'2"';
    }
    if (weightKg === null || weightKg < 45 || weightKg > 180) {
      next.weight = 'Enter a weight in pounds';
    }
    if (wingspanCm === null || wingspanCm < 140 || wingspanCm > 260) {
      next.wingspan = 'Enter a wingspan like 6\'5"';
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.updateProfile(requireToken(), {
        position: primaryValue,
        secondary_position: secondaryValue,
        height_cm: heightCm!,
        weight_kg: weightKg!,
        wingspan_cm: wingspanCm!,
        ...(teamValue.trim() ? { current_team: teamValue.trim() } : {}),
      });
      router.push('/onboarding/goals');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StepScaffold
      step={2}
      title="Your basketball info"
      subtitle="Help coaches learn about your game."
      onContinue={handleContinue}
      submitting={submitting}
      error={error}>
      <PositionPicker
        label="Primary Position"
        helper="Select the position you play most."
        required
        value={primaryValue}
        onSelect={(next) => {
          if (next === null) return;
          setPrimary(next);
          // Can't hold the same slot twice.
          if (secondaryValue === next) setSecondary(null);
        }}
      />

      <PositionPicker
        label="Secondary Position"
        helper="Select a secondary position if applicable."
        optional
        compact
        value={secondaryValue}
        disabled={primaryValue}
        onSelect={setSecondary}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Height"
            value={heightValue}
            onChangeText={setHeight}
            placeholder={`6'2"`}
            suffix="ft"
            keyboardType="numbers-and-punctuation"
            error={fieldErrors.height}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Weight"
            value={weightValue}
            onChangeText={setWeight}
            placeholder="175"
            suffix="lb"
            keyboardType="number-pad"
            error={fieldErrors.weight}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Wingspan"
            value={wingspanValue}
            onChangeText={setWingspan}
            placeholder={`6'5"`}
            suffix="ft"
            keyboardType="numbers-and-punctuation"
            error={fieldErrors.wingspan}
          />
        </View>
      </View>

      <FormField
        label="Current Team"
        optional
        value={teamValue}
        onChangeText={setCurrentTeam}
        placeholder="Enter your current team"
        icon="shirt-outline"
        autoCapitalize="words"
      />
    </StepScaffold>
  );
}
