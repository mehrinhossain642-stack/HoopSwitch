import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { ApiPosting } from '../lib/api';
import { COLORS } from '../lib/theme';
import { cmToFeetInches, kgToLbs } from '../lib/units';
import { relativeTime } from '../lib/time';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { MatchChip } from './MatchChip';
import { PositionBadge } from './PositionBadge';
import { SpecRow } from './SpecRow';
import { StatusPill } from './StatusPill';

type PostingCardProps = {
  posting: ApiPosting;
  applied: boolean;
  onApply: () => void;
  onPress: () => void;
};

/** Job-feed card: team, headline, spec row, server-scored fit chip, Apply CTA. */
export function PostingCard({ posting, applied, onApply, onPress }: PostingCardProps) {
  const teamName = posting.team?.name ?? 'Unknown team';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Card className="mb-3">
        <View className="flex-row items-center">
          <Avatar name={teamName} size={38} shape="square" />
          <View className="ml-3 flex-1">
            <Text className="font-sans-bold text-[14px] text-ink">{teamName}</Text>
            <Text className="font-sans mt-0.5 text-[12px] text-slate">
              {[posting.team?.league, posting.team?.location].filter(Boolean).join(' · ')}
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

        {posting.match ? (
          <View className="mt-3">
            <MatchChip
              score={posting.match.score}
              tier={posting.match.tier}
              reason={posting.match.reason}
            />
          </View>
        ) : null}

        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={13} color={COLORS.slate} />
            <Text className="font-sans ml-1 text-[12px] text-slate">
              Posted {relativeTime(posting.created_at)}
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
