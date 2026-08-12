import { Text, View } from 'react-native';
import type { ApiPosting } from '../lib/api';
import { tierColor } from '../lib/theme';
import { relativeTime } from '../lib/time';
import { cmToFeetInches, kgToLbs } from '../lib/units';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { FitScore } from './FitScore';
import { PositionBadge } from './PositionBadge';
import { SpecStrip } from './StatStrip';
import { StatusPill } from './StatusPill';
import { Touchable } from './Touchable';

type PostingCardProps = {
  posting: ApiPosting;
  applied: boolean;
  pending?: boolean;
  onApply: () => void;
  onPress: () => void;
};

/**
 * Roster-spot card. Reads top to bottom as team → role → requirements → fit,
 * which is the order a player actually evaluates an opening in. The tier-coloured
 * rail lets the ranking survive a fast scroll, and the fit score sits in a
 * separate footer band so the number and the action are the last thing seen.
 */
export function PostingCard({
  posting,
  applied,
  pending = false,
  onApply,
  onPress,
}: PostingCardProps) {
  const teamName = posting.team?.name ?? 'Unknown team';
  const match = posting.match;

  const meta = [posting.team?.league, posting.team?.location, relativeTime(posting.created_at)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${teamName}, ${posting.position}: ${posting.headline}`}
      scaleTo={0.99}
      dimTo={1}
      className="mb-3">
      <Card bare rail={match ? tierColor(match.tier) : undefined}>
        <View className="p-4 pb-3.5">
          <View className="flex-row items-center">
            <Avatar name={teamName} size={40} shape="square" />
            <View className="ml-3 flex-1">
              <Text className="font-sans-bold text-[14px] text-ink" numberOfLines={1}>
                {teamName}
              </Text>
              <Text className="font-sans mt-0.5 text-[11px] text-slate" numberOfLines={1}>
                {meta}
              </Text>
            </View>
            <StatusPill status={posting.status} />
          </View>

          <View className="mt-3.5 flex-row items-start">
            <PositionBadge position={posting.position} tone="dark" />
            <Text
              className="font-display ml-2.5 flex-1 text-[17px] leading-[23px] text-ink"
              numberOfLines={2}
              style={{ letterSpacing: -0.2 }}>
              {posting.headline}
            </Text>
          </View>

          <SpecStrip
            className="mt-3.5"
            specs={[
              { label: 'Ideal ht', value: `${cmToFeetInches(posting.ideal_height_cm)}+` },
              { label: 'Ideal wt', value: `${kgToLbs(posting.ideal_weight_kg)}+` },
              { label: 'Minutes', value: `${posting.expected_minutes} MPG` },
            ]}
          />
        </View>

        <View className="flex-row items-center border-t border-border bg-bg px-4 py-3">
          {match ? (
            <FitScore score={match.score} tier={match.tier} reason={match.reason} />
          ) : (
            <Text className="font-sans flex-1 text-[12px] text-slate">
              Fit not scored — complete your profile.
            </Text>
          )}

          <Button
            label="Apply"
            doneLabel="Applied"
            done={applied}
            loading={pending}
            onPress={onApply}
            fullWidth={false}
            className="ml-3 w-[112px]"
          />
        </View>
      </Card>
    </Touchable>
  );
}
