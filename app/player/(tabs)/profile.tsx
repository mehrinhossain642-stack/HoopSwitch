import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { getProfile, login } from '../../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { EditableField } from '../../../components/EditableField';
import { AddHighlightTile, HighlightCard } from '../../../components/HighlightCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { SectionTitle } from '../../../components/SectionTitle';
import { StatBlock } from '../../../components/StatBlock';
import { DotPill } from '../../../components/StatusPill';
import { SwitchRoleButton } from '../../../components/SwitchRoleButton';
import type { DominantHand, Position } from '../../../data/types';
import { useApp } from '../../../lib/store';
import { cmToFeetInches, kgToLbsLabel, parseHeightToCm, parseLbsToKg } from '../../../lib/units';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const HANDS: readonly DominantHand[] = ['Left', 'Right', 'Ambidextrous'];

/** Player Profile — own view, editable. Every commit re-scores the job feed. */
export default function PlayerProfile() {
  const { currentPlayer, updatePlayer, addHighlight, appliedPostingIds } = useApp();

  const [backendPlayer, setBackendPlayer] = useState<typeof currentPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await login(
          'marcus.webb@example.com',
          'password123'
        );

        const profile = await getProfile(token);

        const mappedPlayer = {
          ...currentPlayer,
          ...profile,

          // Rails uses snake_case; frontend expects careerStats
          careerStats: profile.career_stats ?? currentPlayer.careerStats,

          // Make sure these remain arrays
          highlights: profile.highlights ?? [],
        };

        setBackendPlayer(mappedPlayer);

        console.log('Player profile is now using Rails data:', mappedPlayer);
      } catch (error) {
        console.error('Could not load backend player:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const player = backendPlayer ?? currentPlayer;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between py-3">
          <Text className="font-sans-semibold text-[12px] uppercase tracking-widest text-slate">
            My profile
          </Text>
          <SwitchRoleButton />
        </View>
        <Text className="font-sans mb-2 text-[11px] text-slate">
          {loading
            ? 'Loading profile from Rails...'
            : backendPlayer
              ? 'Profile loaded from Rails API'
              : 'Using local fallback data'}
        </Text>

        {/* Hero */}
        <Card className="items-center pb-5 pt-6">
          <Avatar name={player.name} size={92} />
          <View className="mt-4 flex-row items-center">
            <Text className="font-display text-[24px] text-ink">{player.name}</Text>
            <View className="ml-2">
              <PositionBadge position={player.position} variant="dark" />
            </View>
          </View>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {player.location} · Age {player.age} · {player.eligibility_years} yr
            {player.eligibility_years === 1 ? '' : 's'} eligibility
          </Text>
          <View className="mt-3">
            <DotPill label="Free Agent" />
          </View>

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={player.ppg.toFixed(1)} label="PPG" />
            <StatBlock value={player.rpg.toFixed(1)} label="RPG" />
            <StatBlock value={player.apg.toFixed(1)} label="APG" />
            <StatBlock value={`${Math.round(player.fg_pct)}%`} label="FG%" />
          </View>
        </Card>

        {/* Physical & role — edits here move the feed */}
        <View className="mt-4">
          <SectionTitle title="Physical & Role" className="mb-2" />
          <Card bare className="px-4 pb-1 pt-1">
            <EditableField
              label="Height"
              value={cmToFeetInches(player.height_cm)}
              editSeed={cmToFeetInches(player.height_cm).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              onCommit={(next) => {
                const cm = parseHeightToCm(next);
                if (cm === null || cm < 140 || cm > 240) return false;
                updatePlayer(player.id, { height_cm: cm });
                return true;
              }}
            />
            <EditableField
              label="Weight"
              value={kgToLbsLabel(player.weight_kg)}
              editSeed={String(Math.round(player.weight_kg * 2.20462))}
              keyboardType="number-pad"
              onCommit={(next) => {
                const kg = parseLbsToKg(next);
                if (kg === null || kg < 45 || kg > 180) return false;
                updatePlayer(player.id, { weight_kg: kg });
                return true;
              }}
            />
            <EditableField
              label="Wingspan"
              value={cmToFeetInches(player.wingspan_cm)}
              editSeed={cmToFeetInches(player.wingspan_cm).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              onCommit={(next) => {
                const cm = parseHeightToCm(next);
                if (cm === null || cm < 140 || cm > 260) return false;
                updatePlayer(player.id, { wingspan_cm: cm });
                return true;
              }}
            />
            <EditableField
              label="Primary Pos."
              value={player.position}
              options={POSITIONS}
              onCommit={(next) => {
                updatePlayer(player.id, { position: next as Position });
                return true;
              }}
            />
            <EditableField
              label="Dominant Hand"
              value={player.dominant_hand}
              options={HANDS}
              onCommit={(next) => {
                updatePlayer(player.id, { dominant_hand: next as DominantHand });
                return true;
              }}
            />
            <EditableField
              label="Age"
              value={String(player.age)}
              keyboardType="number-pad"
              last
              onCommit={(next) => {
                const age = Number(next.trim());
                if (!Number.isFinite(age) || age < 15 || age > 40) return false;
                updatePlayer(player.id, { age: Math.round(age) });
                return true;
              }}
            />
          </Card>
          <Text className="font-sans mt-2 px-1 text-[12px] leading-[17px] text-slate">
            Editing height, weight or position re-scores every roster spot in your feed.
          </Text>
        </View>

        {/* Highlights */}
        <View className="mt-5">
          <SectionTitle title="Highlights" className="mb-3" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}>
            {player.highlights.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
            <AddHighlightTile onPress={() => addHighlight(player.id)} />
          </ScrollView>
        </View>

        {/* Bio */}
        <View className="mt-5">
          <Card>
            <EditableField
              label="About me"
              value={player.bio}
              multiline
              onCommit={(next) => {
                const trimmed = next.trim();
                if (trimmed.length === 0) return false;
                updatePlayer(player.id, { bio: trimmed });
                return true;
              }}
            />
          </Card>
        </View>

        {/* Career stats */}
        <View className="mt-5">
          <SectionTitle title="Career Stats" className="mb-3" />
          <Card>
            <CareerStatsTable stats={player.careerStats} />
          </Card>
        </View>

        {/* Applications */}
        <View className="mt-5">
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-semibold text-[13px] text-ink">
                Active applications
              </Text>
              <Text className="font-display text-[18px] text-primary">
                {appliedPostingIds.length}
              </Text>
            </View>
            <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
              Apply from the Home feed to track roster spots here.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
