import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { MatchResult } from '../lib/match';
import type { PostingWithTeam } from '../lib/store';
import { COLORS } from '../lib/theme';
import { cmToFeetInches, kgToLbs } from '../lib/units';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { MatchChip } from './MatchChip';
import { PositionBadge } from './PositionBadge';
import { SpecRow } from './SpecRow';
import { StatusPill } from './StatusPill';

type PostingCardProps = {
  posting: PostingWithTeam;
  match: MatchResult;
  applied: boolean;
  onApply: () => void;
  onPress: () => void;
};

/** Job-feed card: team, headline, spec row, fit chip, Apply CTA. */
export function PostingCard({ posting, match, applied, onApply, onPress }: PostingCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Card className="mb-3">
        <View className="flex-row items-center">
          <Avatar name={posting.team.name} size={38} shape="square" />
          <View className="ml-3 flex-1">
            <Text className="font-sans-bold text-[14px] text-ink">{posting.team.name}</Text>
            <Text className="font-sans mt-0.5 text-[12px] text-slate">
              {posting.team.league} · {posting.team.location}
            </Text>
          </View>
          <StatusPill status={posting.status} />
        </View>

        <View className="mt-3 flex-row items-center">
          <PositionBadge position={posting.position} />
          <Text className="font-display ml-2 flex-1 text-[17px] leading-[22px] text-ink">
            {posting.headline}
          </Text>
        </View>

        <View className="mt-3">
          <SpecRow
            specs={[
              { label: 'Ideal ht', value: `${cmToFeetInches(posting.ideal_height_cm)}+` },
              { label: 'Ideal wt', value: `${kgToLbs(posting.ideal_weight_kg)}+ lbs` },
              { label: 'Minutes', value: `${posting.expected_minutes} MPG` },
            ]}
          />
        </View>

        <View className="mt-3">
          <MatchChip score={match.score} tier={match.tier} reason={match.reason} />
        </View>

        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={13} color={COLORS.slate} />
            <Text className="font-sans ml-1 text-[12px] text-slate">
              Posted {posting.posted_ago}
            </Text>
          </View>
          <Button
            label="Apply"
            doneLabel="Applied"
            done={applied}
            onPress={onApply}
            className="w-[124px]"
          />
        </View>
      </Card>
    </Pressable>
  );
}
