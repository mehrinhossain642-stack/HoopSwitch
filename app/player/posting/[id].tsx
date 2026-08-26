import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DetailHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { FitScore } from '../../../components/FitScore';
import { Meter } from '../../../components/Meter';
import { PositionBadge } from '../../../components/PositionBadge';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { Sheet } from '../../../components/Sheet';
import { Touchable } from '../../../components/Touchable';
import {
  EmptyState,
  InlineError,
  ScreenError,
  ScreenLoading,
} from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { SpecStrip, StatStrip } from '../../../components/StatStrip';
import { StatusPill } from '../../../components/StatusPill';
import {
  STICKY_BAR_CLEARANCE,
  StickyActionBar,
} from '../../../components/StickyActionBar';
import * as api from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useGoBack } from '../../../lib/useGoBack';
import { useTierColors, useThemeColors } from '../../../lib/theme';
import { relativeTime } from '../../../lib/time';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

const COMPONENT_LABELS = {
  position: 'Position',
  height: 'Height',
  weight: 'Weight',
  production: 'Production',
} as const;

/**
 * Posting detail — the full slot spec plus the server's score breakdown.
 * There is no GET /postings/:id in the MVP surface, so this reads the scored feed
 * and picks the row, which keeps the score authoritative.
 */
export default function PostingDetail() {
  const { id, from } = useLocalSearchParams<{
  id: string;
  from?: string;
}>();

const router = useRouter();

// Where the back button should go if there is no navigation history.
const goBack = useGoBack(
  from === 'activity'
    ? '/player/activity'
    : '/player/opportunities'
);
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({
    paddingTop: 16,
    paddingBottom: STICKY_BAR_CLEARANCE,
  });

  const feed = useApiData(() => api.getPostingFeed(requireToken()), [token]);
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [submittedOpen, setSubmittedOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
type ReviewSection =
  | 'personal'
  | 'athletic'
  | 'academics'
  | 'basketball'
  | 'highlights';

const [expandedSection, setExpandedSection] =
  useState<ReviewSection | null>(null);

const [reviewedSections, setReviewedSections] = useState<
  Record<ReviewSection, boolean>
>({
  personal: false,
  athletic: false,
  academics: false,
  basketball: false,
  highlights: false,
});

const allSectionsReviewed =
  Object.values(reviewedSections).every(Boolean);
  const posting = feed.data?.postings.find((item) => String(item.id) === String(id));

  const openApplicationReview = useCallback(() => {
  if (!posting || posting.connected) return;

  setApplyError(null);
  setConfirmedAccurate(false);
  setReviewOpen(true);
}, [posting]);

const confirmApplication = useCallback(async () => {
  if (!posting || posting.connected || !confirmedAccurate) return;

  setApplyError(null);
  setApplying(true);

  try {
    await api.createConnection(requireToken(), posting.id);

    setReviewOpen(false);
    setSubmittedOpen(true);

    await feed.refetch();
  } catch (caught) {
    setApplyError(errorMessage(caught));
  } finally {
    setApplying(false);
  }
}, [posting, confirmedAccurate, requireToken, feed]);

  if (feed.loading && !feed.data) return <ScreenLoading label="Loading roster spot" />;
  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  if (!posting) {
    return (
      <Screen edges={[]}>
        <DetailHeader onBack={goBack} title="Roster spot" />
        <View className="flex-1 justify-center" style={contentStyle}>
          <EmptyState
            icon="alert-circle-outline"
            title="Spot not found"
            body="This posting is no longer in your feed — it may have been filled or closed."
            action={
  <Button
    label="Back to opportunities"
    variant="secondary"
    size="sm"
    fullWidth={false}
    onPress={() => router.replace('/player/opportunities')}
  />
}
          />
        </View>
      </Screen>
    );
  }

  const match = posting.match;
  const team = posting.team;

  return (
    <Screen edges={[]}>
      <DetailHeader
        onBack={goBack}
        title="Roster spot"
        right={<StatusPill status={posting.status} onDark />}
      />

      <ScrollView contentContainerStyle={contentStyle}>
        {applyError ? (
  <InlineError
    message={applyError}
    onRetry={() => setApplyError(null)}
  />
) : null}

        <Card bare>
          <View className="p-4">
            <View className="flex-row items-center">
              <Avatar name={team?.name ?? 'Team'} size={48} shape="square" />
              <View className="ml-3.5 flex-1">
                <Text className="font-display text-[18px] text-ink" numberOfLines={2}>
                  {team?.name}
                </Text>
                <Text className="font-sans mt-0.5 text-[12px] text-slate">
                  {[team?.league, team?.location].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row items-start">
              <PositionBadge position={posting.position} tone="dark" size="lg" />
              <Text
                className="font-display ml-3 flex-1 text-[20px] leading-[26px] text-ink"
                style={{ letterSpacing: -0.3 }}>
                {posting.headline}
              </Text>
            </View>

            <Text className="font-sans mt-2 text-[12px] text-slate">
              Posted {relativeTime(posting.created_at)} · {posting.applicant_count} applied
            </Text>
          </View>

          <StatStrip
            tone="plain"
            className="border-t border-border"
            stats={[
              { value: team?.record ?? '—', label: 'Record' },
              { value: team?.roster_size ?? 0, label: 'Roster' },
              { value: posting.applicant_count, label: 'Applied' },
            ]}
          />
        </Card>

        {/* Fit is the reason this screen exists, so it gets its own panel above the
            requirements rather than a chip somewhere in the middle. */}
        {match ? (
          <>
            <SectionTitle title="Your fit" className="mb-2.5 mt-6" />
            <Card>
              <FitScore
                variant="hero"
                score={match.score}
                tier={match.tier}
                reason={match.reason}
              />

              <View className="mt-5 border-t border-border pt-4">
                <Text className="font-stat mb-3 text-[14px] tracking-eyebrow text-slate">
                  SCORE BREAKDOWN
                </Text>
                {(['position', 'height', 'weight', 'production'] as const).map(
                  (component, index) => (
                    <ScoreRow
                      key={component}
                      label={COMPONENT_LABELS[component]}
                      value={match.breakdown[component]}
                      last={index === 3}
                    />
                  )
                )}
              </View>
            </Card>
          </>
        ) : null}

        <SectionTitle title="What they want" className="mb-2.5 mt-6" />
        <Card>
          <SpecStrip
            specs={[
              { label: 'Ideal ht', value: `${cmToFeetInches(posting.ideal_height_cm)}+` },
              { label: 'Ideal wt', value: `${kgToLbs(posting.ideal_weight_kg)}+ lbs` },
              { label: 'Minutes', value: `${posting.expected_minutes} MPG` },
            ]}
          />
          <Text className="font-sans mt-3.5 text-[14px] leading-[21px] text-slate">
            {posting.notes}
          </Text>
        </Card>

        <SectionTitle title="About the program" className="mb-2.5 mt-6" />
        <Card>
          <Text className="font-sans text-[14px] leading-[21px] text-slate">{team?.about}</Text>
          <View className="mt-3.5 flex-row items-center border-t border-border pt-3.5">
            <Ionicons name="person-outline" size={15} color={colors.slate} />
            <Text className="font-sans-medium ml-2 text-[13px] text-ink">
              Head coach · {team?.coach_name}
            </Text>
          </View>
        </Card>
      </ScrollView>

      <StickyActionBar>
        <View className="mr-3 flex-1">
          {match ? <FitScore score={match.score} tier={match.tier} /> : null}
        </View>
        <Button
          label="Apply to this spot"
          doneLabel="Applied"
          done={posting.connected === true}
          loading={applying}
          onPress={openApplicationReview}
          fullWidth={false}
          className="w-[170px]"
        />
      </StickyActionBar>
      <Sheet
  visible={reviewOpen}
  onClose={() => setDiscardConfirmOpen(true)}
  title="Review Your Profile"
  subtitle="Make sure everything is accurate before you apply.">

  <ScrollView
    contentContainerStyle={{
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 28,
    }}>

    {/* Athlete summary */}
    <View className="flex-row items-center rounded-card border border-border bg-mist p-4">
      <Avatar
        name={profile.data?.name ?? 'Athlete'}
        size={52}
      />

      <View className="ml-3 flex-1">
        <Text className="font-sans-bold text-[16px] text-ink">
          {profile.data?.name ?? 'Your Profile'}
        </Text>

        <Text className="font-sans mt-1 text-[12px] text-slate">
          {[
            profile.data?.position,
            profile.data?.secondary_position,
          ]
            .filter(Boolean)
            .join(' / ')}
          {profile.data?.graduation_year
            ? ` · Class of ${profile.data.graduation_year}`
            : ''}
        </Text>
      </View>
    </View>

    {/* Review sections */}
<View className="mt-5 overflow-hidden rounded-card border border-border bg-surface">

  <ReviewSectionRow
    icon="person-outline"
    label="Personal Information"
    reviewed={reviewedSections.personal}
    expanded={expandedSection === 'personal'}
    onPress={() =>
      setExpandedSection(
        expandedSection === 'personal' ? null : 'personal'
      )
    }>
    <ProfileField
      label="Name"
      value={profile.data?.name ?? ''}
    />

    <ProfileField
      label="Location"
      value={profile.data?.location ?? ''}
    />

    <SectionConfirmButton
      onPress={() => {
        setReviewedSections((prev) => ({
          ...prev,
          personal: true,
        }));
        setExpandedSection(null);
      }}
    />
  </ReviewSectionRow>


  <ReviewSectionRow
    icon="fitness-outline"
    label="Athletic Information"
    reviewed={reviewedSections.athletic}
    expanded={expandedSection === 'athletic'}
    onPress={() =>
      setExpandedSection(
        expandedSection === 'athletic' ? null : 'athletic'
      )
    }>
    <ProfileField
      label="Height"
      value={
        profile.data?.height_cm
          ? cmToFeetInches(profile.data.height_cm)
          : ''
      }
    />

    <ProfileField
      label="Weight"
      value={
        profile.data?.weight_kg
          ? `${kgToLbs(profile.data.weight_kg)} lbs`
          : ''
      }
    />

    <SectionConfirmButton
      onPress={() => {
        setReviewedSections((prev) => ({
          ...prev,
          athletic: true,
        }));
        setExpandedSection(null);
      }}
    />
  </ReviewSectionRow>


  <ReviewSectionRow
    icon="school-outline"
    label="Academics"
    reviewed={reviewedSections.academics}
    expanded={expandedSection === 'academics'}
    onPress={() =>
      setExpandedSection(
        expandedSection === 'academics' ? null : 'academics'
      )
    }>
    <ProfileField
      label="School"
      value={profile.data?.school ?? ''}
    />

    <ProfileField
      label="Graduation Year"
      value={
        profile.data?.graduation_year
          ? String(profile.data.graduation_year)
          : ''
      }
    />

    <SectionConfirmButton
      onPress={() => {
        setReviewedSections((prev) => ({
          ...prev,
          academics: true,
        }));
        setExpandedSection(null);
      }}
    />
  </ReviewSectionRow>


  <ReviewSectionRow
    icon="basketball-outline"
    label="Basketball Information"
    reviewed={reviewedSections.basketball}
    expanded={expandedSection === 'basketball'}
    onPress={() =>
      setExpandedSection(
        expandedSection === 'basketball' ? null : 'basketball'
      )
    }>
    <ProfileField
      label="Primary Position"
      value={profile.data?.position ?? ''}
    />

    <ProfileField
      label="Secondary Position"
      value={profile.data?.secondary_position ?? 'None'}
    />

    <ProfileField
      label="Current Team"
      value={profile.data?.current_team ?? ''}
    />

    <SectionConfirmButton
      onPress={() => {
        setReviewedSections((prev) => ({
          ...prev,
          basketball: true,
        }));
        setExpandedSection(null);
      }}
    />
  </ReviewSectionRow>


  <ReviewSectionRow
    icon="videocam-outline"
    label="Highlights"
    reviewed={reviewedSections.highlights}
    expanded={expandedSection === 'highlights'}
    onPress={() =>
      setExpandedSection(
        expandedSection === 'highlights' ? null : 'highlights'
      )
    }
    last>

    <ProfileField
      label="Highlights"
      value={
        profile.data?.highlights?.length
          ? `${profile.data.highlights.length} highlight${
              profile.data.highlights.length === 1 ? '' : 's'
            } added`
          : 'No highlights added'
      }
    />

    <SectionConfirmButton
      onPress={() => {
        setReviewedSections((prev) => ({
          ...prev,
          highlights: true,
        }));
        setExpandedSection(null);
      }}
    />
  </ReviewSectionRow>

</View>

    {/* Edit */}
    <Touchable
      onPress={() => {
        setReviewOpen(false);
        router.push('/player/profile');
      }}
      className="mt-3 flex-row items-center justify-center rounded-btn border border-border bg-surface px-4 py-3">

      <Ionicons
        name="create-outline"
        size={17}
        color={colors.primary}
      />

      <Text className="font-sans-semibold ml-2 text-[13px] text-primary">
        Edit Profile
      </Text>
    </Touchable>

    {/* Accuracy confirmation */}
    <Touchable
      onPress={() => setConfirmedAccurate((current) => !current)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: confirmedAccurate }}
      className="mt-5 flex-row items-center">

      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          confirmedAccurate
            ? 'border-primary bg-primary'
            : 'border-border-strong bg-surface'
        }`}>

        {confirmedAccurate ? (
          <Ionicons
            name="checkmark"
            size={15}
            color="#FFFFFF"
          />
        ) : null}
      </View>

      <Text className="font-sans-medium ml-3 flex-1 text-[13px] text-ink">
        Everything is true and accurate
      </Text>
    </Touchable>

    <View className="mt-5">
      <Button
        label="Confirm & Apply"
        loading={applying}
        disabled={!confirmedAccurate || !allSectionsReviewed}
        onPress={confirmApplication}
      />
    </View>

    <View className="mt-2">
      <Button
        label="Cancel"
        variant="secondary"
        onPress={() => setDiscardConfirmOpen(true)}
      />
    </View>
  </ScrollView>
</Sheet>
<ConfirmDialog
  visible={discardConfirmOpen}
  title="Discard application?"
  body="Are you sure you want to leave? Your application progress will be discarded."
  confirmLabel="Discard & Leave"
  cancelLabel="Keep Reviewing"
  destructive
  icon="warning-outline"
  onCancel={() => setDiscardConfirmOpen(false)}
  onConfirm={() => {
    setDiscardConfirmOpen(false);
    setReviewOpen(false);
    setConfirmedAccurate(false);
    router.replace('/player/opportunities');
  }}
/>
<Sheet
  visible={submittedOpen}
  onClose={() => {
  setSubmittedOpen(false);
  router.replace('/player/opportunities');
}}
  title="Application Submitted">

  <View className="items-center px-6 pb-8 pt-5">

    <View className="h-20 w-20 items-center justify-center rounded-full bg-good-soft">
      <Ionicons
        name="checkmark"
        size={42}
        color={colors.good}
      />
    </View>

    <Text className="font-display mt-5 text-center text-[20px] text-ink">
      Application Submitted!
    </Text>

    <Text className="font-sans mt-2 max-w-[340px] text-center text-[13px] leading-[20px] text-slate">
      Your application has been sent to your parent for approval.
    </Text>

    <View className="mt-6 w-full rounded-card bg-mist p-4">
      <Text className="font-sans-bold text-[14px] text-ink">
        What happens next?
      </Text>

      <NextStep text="Your parent reviews your application." />
      <NextStep text="Your parent confirms that your profile is accurate." />
      <NextStep text="Once approved, your application is sent to the coach." />
      <NextStep text="You can track the status from Activity." />
    </View>

    <View className="mt-6 w-full">
      <Button
        label="View Activity"
        onPress={() => {
  setSubmittedOpen(false);
  router.replace('/player/activity');
}}
      />
    </View>

   <View className="mt-2 w-full">
  <Button
    label="Done"
    variant="secondary"
    onPress={() => {
      setSubmittedOpen(false);
      router.replace('/player/opportunities');
    }}
  />
</View>
  </View>
</Sheet>
    </Screen>
  );
}

/** One component of the server's score, as a labelled bar. */
function ScoreRow({ label, value, last }: { label: string; value: number; last: boolean }) {
  const colors = useThemeColors();
  const tiers = useTierColors();
  const pct = Math.round(value * 100);
  // Thresholds mirror the server's own tiering, so a row's colour agrees with the
  // headline score.
  const tone =
    value >= 0.78 ? tiers.color('good') : value >= 0.4 ? tiers.color('partial') : colors.danger;

  return (
    <View className={last ? '' : 'mb-3.5'}>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans-medium text-[13px] text-ink">{label}</Text>
        <Text className="font-stat-bold text-[18px] tracking-stat" style={{ color: tone }}>
          {pct}%
        </Text>
      </View>
      <Meter value={value} color={tone} />
    </View>
  );
}
function ReviewSectionRow({
  icon,
  label,
  reviewed,
  expanded,
  onPress,
  children,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  reviewed: boolean;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
  last?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <View className={last ? '' : 'border-b border-border'}>
      <Touchable
        onPress={onPress}
        className="flex-row items-center px-4 py-4">

        <Ionicons
          name={icon}
          size={18}
          color={colors.slate}
        />

        <Text className="font-sans-semibold ml-3 flex-1 text-[13px] text-ink">
          {label}
        </Text>

        {reviewed ? (
          <Ionicons
            name="checkmark-circle"
            size={21}
            color={colors.good}
          />
        ) : (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={19}
            color={colors.slate}
          />
        )}
      </Touchable>

      {expanded ? (
        <View className="border-t border-border bg-mist px-4 pb-4 pt-2">
          {children}
        </View>
      ) : null}
    </View>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="border-b border-border py-3">
      <Text className="font-sans-medium text-[10px] uppercase tracking-wide text-slate">
        {label}
      </Text>

      <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
        {value || 'Not provided'}
      </Text>
    </View>
  );
}

function SectionConfirmButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <View className="mt-4">
      <Button
        label="Confirm this section"
        size="sm"
        onPress={onPress}
      />
    </View>
  );
}

function NextStep({ text }: { text: string }) {
  const colors = useThemeColors();

  return (
    <View className="mt-3 flex-row items-start">
      <Ionicons
        name="checkmark-circle-outline"
        size={17}
        color={colors.primary}
      />

      <Text className="font-sans ml-2 flex-1 text-[12px] leading-[18px] text-slate">
        {text}
      </Text>
    </View>
  );
}
