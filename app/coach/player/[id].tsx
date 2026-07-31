import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { HighlightCard } from '../../../components/HighlightCard';
import { MatchChip } from '../../../components/MatchChip';
import { PositionBadge } from '../../../components/PositionBadge';
import { SectionTitle } from '../../../components/SectionTitle';
import { SpecRow } from '../../../components/SpecRow';
import { StatBlock } from '../../../components/StatBlock';
import { roleLabel } from '../../../lib/labels';
import { scoreMatch } from '../../../lib/match';
import { useApp } from '../../../lib/store';
import { COLORS } from '../../../lib/theme';
import { cmToFeetInches, kgToLbsLabel } from '../../../lib/units';

/** Player detail from the coach's side, scored against the team's top slot. */
export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getPlayer,
    currentTeam,
    invitedPlayerIds,
    messagedPlayerIds,
    toggleInvite,
    toggleMessage,
  } = useApp();

  const player = getPlayer(id);

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
        <DetailHeader onBack={() => router.back()} title="Player" />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={28} color={COLORS.slate} />
          <Text className="font-display mt-3 text-[17px] text-ink">Player not found</Text>
          <Text className="font-sans mt-1 text-center text-[13px] text-slate">
            This player is no longer in your feed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const invited = invitedPlayerIds.includes(player.id);
  const messaged = messagedPlayerIds.includes(player.id);

  // Fit against every slot on the roster, best first — a coach comparing one
  // player wants to know which of their openings he actually fills.
  const fits = currentTeam.postings
    .map((posting) => ({ posting, match: scoreMatch(player, posting) }))
    .sort((a, b) => b.match.score - a.match.score);
  const bestFit = fits[0];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <DetailHeader onBack={() => router.back()} title="Player" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Card className="items-center pb-5 pt-6">
          <Avatar name={player.name} size={84} />
          <View className="mt-4 flex-row items-center">
            <Text className="font-display text-[23px] text-ink">{player.name}</Text>
            <View className="ml-2">
              <PositionBadge position={player.position} variant="dark" />
            </View>
          </View>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {player.location} · Age {player.age} · {player.eligibility_years} yr
            {player.eligibility_years === 1 ? '' : 's'} eligibility · {player.dominant_hand}{' '}
            handed
          </Text>

          {bestFit ? (
            <View className="mt-3">
              <MatchChip
                score={bestFit.match.score}
                tier={bestFit.match.tier}
                reason={bestFit.match.reason}
              />
            </View>
          ) : null}

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={player.ppg.toFixed(1)} label="PPG" />
            <StatBlock value={player.rpg.toFixed(1)} label="RPG" />
            <StatBlock value={player.apg.toFixed(1)} label="APG" />
            <StatBlock value={`${Math.round(player.fg_pct)}%`} label="FG%" />
          </View>
        </Card>

        <View className="mt-4">
          <SpecRow
            specs={[
              { label: 'Height', value: cmToFeetInches(player.height_cm) },
              { label: 'Weight', value: kgToLbsLabel(player.weight_kg) },
              { label: 'Wingspan', value: cmToFeetInches(player.wingspan_cm) },
            ]}
          />
        </View>

        <View className="mt-5">
          <SectionTitle title="Fit across your slots" className="mb-3" />
          <Card bare>
            {fits.map((fit, index) => (
              <View
                key={fit.posting.id}
                className={`px-4 py-3 ${index < fits.length - 1 ? 'border-b border-border' : ''}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <PositionBadge position={fit.posting.position} />
                    <Text className="font-sans-semibold ml-2.5 text-[14px] text-ink">
                      {roleLabel(fit.posting.position, fit.posting.expected_minutes)}
                    </Text>
                  </View>
                  <MatchChip
                    score={fit.match.score}
                    tier={fit.match.tier}
                    reason={fit.match.reason}
                  />
                </View>
              </View>
            ))}
          </Card>
        </View>

        <View className="mt-5">
          <SectionTitle title="Highlights" className="mb-3" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}>
            {player.highlights.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
          </ScrollView>
        </View>

        <View className="mt-5">
          <SectionTitle title="Scouting notes" className="mb-3" />
          <Card>
            <Text className="font-sans text-[14px] leading-[20px] text-slate">{player.bio}</Text>
          </Card>
        </View>

        <View className="mt-5">
          <SectionTitle title="Career Stats" className="mb-3" />
          <Card>
            <CareerStatsTable stats={player.careerStats} />
          </Card>
        </View>

        <View className="mt-6 flex-row">
          <Button
            label="Message"
            doneLabel="Messaged"
            done={messaged}
            variant="secondary"
            onPress={() => toggleMessage(player.id)}
            className="flex-1"
          />
          <View className="w-3" />
          <Button
            label="Invite to visit"
            doneLabel="Invited"
            done={invited}
            onPress={() => toggleInvite(player.id)}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View className="flex-row items-center px-5 py-3">
      <Pressable
        onPress={onBack}
        hitSlop={10}
        className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Ionicons name="chevron-back" size={18} color={COLORS.ink} />
      </Pressable>
      <Text className="font-sans-semibold ml-3 text-[12px] uppercase tracking-widest text-slate">
        {title}
      </Text>
    </View>
  );
}
