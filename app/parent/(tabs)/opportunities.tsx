import { useEffect, useState } from 'react';
import { useThemeColors } from '../../../lib/theme';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';

import {
  createParentApplication,
  getParentAthletes,
  getParentOpportunities,
  type ApiPosting,
  type LinkedAthlete,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';


export default function ParentOpportunities() {
  const { requireToken } = useSession();

  const [athletes, setAthletes] = useState<LinkedAthlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] =
    useState<LinkedAthlete | null>(null);

  const [postings, setPostings] = useState<ApiPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAthletes();
  }, []);

  async function loadAthletes() {
    try {
      setLoading(true);
      setError('');

      const result = await getParentAthletes(requireToken());
      setAthletes(result);

      const firstAthlete = result[0];

if (firstAthlete) {
  setSelectedAthlete(firstAthlete);
  await loadOpportunities(firstAthlete);
}
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadOpportunities(athlete: LinkedAthlete) {
    try {
      setLoading(true);
      setError('');
      setSelectedAthlete(athlete);

      const result = await getParentOpportunities(
        requireToken(),
        athlete.id
      );

      setPostings(result.postings);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }
async function applyForAthlete(posting: ApiPosting) {
  if (!selectedAthlete?.player_profile_id) {
    setError('This athlete does not have a completed player profile.');
    return;
  }

  try {
    setError('');

    await createParentApplication(
      requireToken(),
      posting.id,
      selectedAthlete.player_profile_id
    );

    await loadOpportunities(selectedAthlete);
  } catch (err) {
    setError(errorMessage(err));
  }
}
  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent opportunities" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: 40,
        }}
      >
        <Text className="font-display text-[28px] text-ink">
          Opportunities
        </Text>

        <Text className="font-sans mt-1 text-[14px] text-slate">
          Find basketball opportunities for your athlete.
        </Text>

        {athletes.length > 0 ? (
          <View className="mt-7">
            <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
              APPLYING FOR
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
            >
              {athletes.map((athlete) => {
                const selected =
                  selectedAthlete?.id === athlete.id;

                return (
                  <Pressable
                    key={athlete.id}
                    onPress={() => loadOpportunities(athlete)}
                    className={`mr-3 rounded-full border px-4 py-2 ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <Text
                      className={`font-sans-semibold text-[13px] ${
                        selected ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {athlete.name ?? 'Athlete'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {error ? (
          <View className="mt-5">
            <InlineError message={error} />
          </View>
        ) : null}

        {loading ? (
          <View className="items-center py-16">
            <Text className="font-sans text-[14px] text-slate">
              Loading opportunities...
            </Text>
          </View>
        ) : athletes.length === 0 ? (
          <View className="items-center py-16">
            <Text className="font-display text-[20px] text-ink">
              No athlete linked
            </Text>

            <Text className="font-sans mt-2 text-center text-[14px] text-slate">
              Link an athlete before browsing opportunities.
            </Text>
          </View>
        ) : postings.length === 0 ? (
          <View className="items-center py-16">
            <Text className="font-display text-[20px] text-ink">
              No opportunities found
            </Text>

            <Text className="font-sans mt-2 text-center text-[14px] text-slate">
              Check back later for new opportunities.
            </Text>
          </View>
        ) : (
          <View className="mt-7">
            <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
              RECOMMENDED
            </Text>

            {postings.map((posting) => (
              <View
                key={posting.id}
                className="mt-3 rounded-2xl border border-line bg-surface p-5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="mr-4 flex-1">
                    <Text className="font-display text-[18px] text-ink">
                      {posting.headline ??
                        `${posting.position} opportunity`}
                    </Text>

                    <Text className="font-sans mt-1 text-[14px] text-slate">
                      {posting.team?.name ?? 'Basketball Team'}
                    </Text>

                    {posting.team?.location ? (
                      <Text className="font-sans mt-1 text-[12px] text-slate">
                        {posting.team.location}
                      </Text>
                    ) : null}
                  </View>

                  {posting.match ? (
                    <View className="rounded-full bg-good-soft px-3 py-1.5">
                      <Text className="font-sans-semibold text-[12px] text-good">
                        {posting.match.score}% Match
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View className="mt-4 flex-row">
                  <View className="mr-6">
                    <Text className="font-stat text-[11px] text-slate">
                      POSITION
                    </Text>

                    <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
                      {posting.position}
                    </Text>
                  </View>

                  <View>
                    <Text className="font-stat text-[11px] text-slate">
                      MINUTES
                    </Text>

                    <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
                      {posting.expected_minutes}
                    </Text>
                  </View>
                </View>

                <View className="mt-5">
                  {posting.connected ? (
                    <Button
                      label="Application Submitted"
                      variant="secondary"
                      disabled
                      onPress={() => {}}
                    />
                  ) : (
                    <Button
  label={`Apply for ${selectedAthlete?.name ?? 'Athlete'}`}
  onPress={() => applyForAthlete(posting)}
/>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}