import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { FormField } from '../../components/onboarding/FormField';
import { SelectField } from '../../components/onboarding/SelectField';
import { StepScaffold } from '../../components/onboarding/StepScaffold';
import { ScreenError, ScreenLoading } from '../../components/ScreenState';
import * as api from '../../lib/api';
import { useSession } from '../../lib/session';
import { errorMessage, useApiData } from '../../lib/useApi';

const GRADES = [
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Prep / Post-grad',
  'University Year 1',
  'University Year 2',
  'University Year 3',
  'University Year 4',
  'University Year 5',
] as const;

const PROVINCES = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
} as const;

type ProvinceCode = keyof typeof PROVINCES;

/** Graduation years span a couple back and several forward from today. */
function graduationYears(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, index) => current - 2 + index);
}

/** Step 1 of 4 — name, school, grad year, grade, city, province. */
export default function OnboardingBasics() {
  const { requireToken, token } = useSession();
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);

  const [fullName, setFullName] = useState<string | null>(null);
  const [school, setSchool] = useState<string | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [province, setProvince] = useState<ProvinceCode | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile.loading && !profile.data) return <ScreenLoading label="Loading your profile" />;
  if (!profile.data) {
    return <ScreenError message={profile.error ?? 'Profile unavailable'} onRetry={profile.refetch} />;
  }

  // Seed from the server so re-entering the flow shows what's already saved.
  const saved = profile.data;
  const nameValue = fullName ?? saved.name ?? '';
  const schoolValue = school ?? saved.school ?? '';
  const cityValue = city ?? saved.city ?? '';
  const yearValue = graduationYear ?? saved.graduation_year;
  const gradeValue = grade ?? saved.grade;
  const provinceValue = province ?? (saved.province as ProvinceCode | null);

  const canContinue = nameValue.trim().length > 0;

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await api.updateProfile(requireToken(), {
        name: nameValue.trim(),
        ...(schoolValue.trim() ? { school: schoolValue.trim() } : {}),
        ...(yearValue ? { graduation_year: yearValue } : {}),
        ...(gradeValue ? { grade: gradeValue } : {}),
        ...(cityValue.trim() ? { city: cityValue.trim() } : {}),
        ...(provinceValue ? { province: provinceValue } : {}),
      });
      router.push('/onboarding/basketball');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StepScaffold
      step={1}
      title="Let's start with the basics"
      subtitle="Tell us a bit about yourself."
      onContinue={handleContinue}
      submitting={submitting}
      error={error}
      canContinue={canContinue}>
      <FormField
        label="Full Name"
        value={nameValue}
        onChangeText={setFullName}
        placeholder="Enter your full name"
        icon="person-outline"
        autoCapitalize="words"
      />

      <FormField
        label="School"
        value={schoolValue}
        onChangeText={setSchool}
        placeholder="Enter your school"
        icon="school-outline"
        autoCapitalize="words"
      />

      <View className="flex-row gap-3">
        <SelectField
          label="Graduation Year"
          value={yearValue}
          options={graduationYears()}
          onSelect={setGraduationYear}
          placeholder="Select year"
          icon="calendar-outline"
        />
        <SelectField
          label="Grade"
          value={gradeValue}
          options={GRADES}
          onSelect={setGrade}
          placeholder="Select grade"
        />
      </View>

      <FormField
        label="City"
        value={cityValue}
        onChangeText={setCity}
        placeholder="Enter your city"
        icon="location-outline"
        autoCapitalize="words"
      />

      <SelectField
        label="Province"
        value={provinceValue}
        options={Object.keys(PROVINCES) as ProvinceCode[]}
        onSelect={setProvince}
        placeholder="Select province"
        icon="map-outline"
        labelFor={(code) => PROVINCES[code]}
      />
    </StepScaffold>
  );
}
