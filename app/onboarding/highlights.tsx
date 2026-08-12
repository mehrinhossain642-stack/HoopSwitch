import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { FormField, Label } from '../../components/onboarding/FormField';
import { StepScaffold } from '../../components/onboarding/StepScaffold';
import { ScreenError, ScreenLoading } from '../../components/ScreenState';
import { Touchable } from '../../components/Touchable';
import * as api from '../../lib/api';
import type { ApiHighlight } from '../../lib/api';
import { useSession } from '../../lib/session';
import { COLORS } from '../../lib/theme';
import { durationLabel, isLikelyVideoUrl, youTubeThumbnail } from '../../lib/youtube';
import { errorMessage, useApiData } from '../../lib/useApi';

/** Step 4 of 4 — attach highlight links, then finish. */
export default function OnboardingHighlights() {
  const { requireToken, token } = useSession();
  const highlights = useApiData(() => api.getProfile(requireToken()), [token]);

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (highlights.loading && !highlights.data) return <ScreenLoading label="Loading" />;
  if (!highlights.data) {
    return (
      <ScreenError message={highlights.error ?? 'Profile unavailable'} onRetry={highlights.refetch} />
    );
  }

  const added = highlights.data.highlights;

  async function addLink() {
    setLinkError(null);
    if (!isLikelyVideoUrl(url)) {
      setLinkError('Paste a full link, e.g. https://youtube.com/watch?v=…');
      return;
    }

    setAdding(true);
    try {
      await api.addHighlight(requireToken(), {
        title: title.trim() || `Highlight ${added.length + 1}`,
        url: url.trim(),
        ...(youTubeThumbnail(url) ? { thumbnail_url: youTubeThumbnail(url)! } : {}),
      });
      setUrl('');
      setTitle('');
      highlights.refetch();
    } catch (caught) {
      setLinkError(errorMessage(caught));
    } finally {
      setAdding(false);
    }
  }

  async function remove(highlight: ApiHighlight) {
    try {
      await api.deleteHighlight(requireToken(), highlight.id);
      highlights.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function finish() {
    setError(null);
    setSubmitting(true);
    try {
      await api.completeOnboarding(requireToken());
      // replace, not push: onboarding shouldn't be back-navigable once done.
      router.replace('/player');
    } catch (caught) {
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <StepScaffold
      step={4}
      title="Add a highlight video"
      subtitle="Show coaches what you can do."
      ctaLabel="Complete Profile"
      onContinue={finish}
      submitting={submitting}
      error={error}>
      <Label label="Highlight Video" optional />

      {/*
        File upload is deliberately out of scope for the MVP — there is no
        storage, transcoding or CDN yet (proposal §6). Rather than ship a button
        that does nothing, the tile states the constraint and points at links.
      */}
      <View className="mt-2 items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-7">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
        </View>
        <Text className="font-display mt-2.5 text-[14px] text-ink">
          Video upload coming soon
        </Text>
        <Text className="font-sans mt-1 text-center text-[12px] leading-[17px] text-slate">
          For now, paste a YouTube or Hudl link below — it plays for coaches just the same.
        </Text>
      </View>

      <View className="mt-5">
        <FormField
          label="Video Link"
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/watch?v=..."
          icon="link-outline"
          autoCapitalize="none"
          keyboardType="url"
          error={linkError}
        />

        <FormField
          label="Title"
          optional
          value={title}
          onChangeText={setTitle}
          placeholder="E.g., Summer Elite Run"
          icon="text-outline"
        />

        <Button
          label={added.length === 0 ? 'Add link' : 'Add another link'}
          variant="secondary"
          icon="add"
          loading={adding}
          onPress={addLink}
        />
      </View>

      {added.length > 0 ? (
        <View className="mt-6">
          <Text className="font-stat mb-2.5 text-[15px] tracking-eyebrow text-slate">
            {added.length} {added.length === 1 ? 'CLIP ADDED' : 'CLIPS ADDED'}
          </Text>
          {added.map((highlight) => (
            <HighlightRow key={highlight.id} highlight={highlight} onRemove={() => remove(highlight)} />
          ))}
        </View>
      ) : (
        <Text className="font-sans mt-5 text-center text-[12px] text-slate">
          No highlights yet — you can always add them later from your profile.
        </Text>
      )}
    </StepScaffold>
  );
}

function HighlightRow({
  highlight,
  onRemove,
}: {
  highlight: ApiHighlight;
  onRemove: () => void;
}) {
  const thumbnail = highlight.thumbnail_url || youTubeThumbnail(highlight.url);
  const duration = durationLabel(highlight.duration_seconds);

  return (
    <View className="mb-2.5 flex-row items-center rounded-card border border-border bg-surface p-2.5">
      <View className="h-[46px] w-[80px] overflow-hidden rounded-md bg-ink-900">
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="videocam-outline" size={16} color={COLORS.slateSoft} />
          </View>
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-sans-semibold text-[13px] text-ink" numberOfLines={1}>
          {highlight.title}
        </Text>
        <Text className="font-sans mt-0.5 text-[11px] text-slate">
          {duration ?? 'External link'}
        </Text>
      </View>

      {/* Destructive action gets the danger colour, not brand orange. */}
      <Touchable
        onPress={onRemove}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${highlight.title}`}
        className="h-9 w-9 items-center justify-center rounded-full bg-danger-soft">
        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
      </Touchable>
    </View>
  );
}
