import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Screen } from '../../components/Screen';
import { InlineError } from '../../components/ScreenState';

import {
  getParentProfile,
  updateParentProfile,
} from '../../lib/api';

import { useSession } from '../../lib/session';
import { errorMessage } from '../../lib/useApi';

const ACCENT = '#F45B2A';

export default function ParentSettings() {
  const { requireToken } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');

      const parent = await getParentProfile(requireToken());

      setName(parent.name ?? '');
      setEmail(parent.email);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
  try {
    setSaving(true);
    setError('');
    setSaved(false);

    const updatedParent = await updateParentProfile(
      requireToken(),
      {
        name: name.trim(),
      }
    );

    setName(updatedParent.name ?? '');
    setEmail(updatedParent.email);
    setSaved(true);
  } catch (err) {
    setError(errorMessage(err));
  } finally {
    setSaving(false);
  }
}

  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingTop: 28,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginBottom: 22,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#2D3034"
            />

            <Text
              className="font-sans-semibold text-ink"
              style={{
                marginLeft: 4,
                fontSize: 14,
              }}
            >
              Back
            </Text>
          </Pressable>

          <Text
            className="font-display text-ink"
            style={{
              fontSize: 29,
              lineHeight: 34,
            }}
          >
            Account Settings
          </Text>

          <Text
            className="font-sans text-slate"
            style={{
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Manage your parent account information.
          </Text>

          {error ? (
            <View style={{ marginTop: 20 }}>
              <InlineError message={error} />
            </View>
          ) : null}

          {loading ? (
            <View
              style={{
                paddingVertical: 90,
                alignItems: 'center',
              }}
            >
              <Text className="font-sans text-[14px] text-slate">
                Loading settings...
              </Text>
            </View>
          ) : (
            <>
              <Text
                className="font-sans-semibold text-ink"
                style={{
                  marginTop: 30,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                Name
              </Text>

              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setSaved(false);
                }}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                style={{
                  height: 50,
                  paddingHorizontal: 15,
                  borderWidth: 1,
                  borderColor: '#E5E7EA',
                  borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  fontSize: 15,
                  color: '#202124',
                }}
              />

              <Text
                className="font-sans-semibold text-ink"
                style={{
                  marginTop: 22,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                Email
              </Text>

              <View
                style={{
                  minHeight: 50,
                  paddingHorizontal: 15,
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E5E7EA',
                  borderRadius: 12,
                  backgroundColor: '#F7F7F8',
                }}
              >
                <Text
                  className="font-sans text-slate"
                  style={{
                    fontSize: 15,
                  }}
                >
                  {email}
                </Text>
              </View>

              <Text
                className="font-sans text-slate"
                style={{
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                Email cannot be changed here yet.
              </Text>

              {saved ? (
                <Text
                  className="font-sans-semibold"
                  style={{
                    marginTop: 18,
                    fontSize: 13,
                    color: '#2E7D32',
                  }}
                >
                  Profile updated successfully.
                </Text>
              ) : null}

              <Pressable
                onPress={handleSave}
                disabled={saving || !name.trim()}
                style={{
                  height: 50,
                  marginTop: 24,
                  borderRadius: 12,
                  backgroundColor:
                    saving || !name.trim()
                      ? '#F7B7A3'
                      : ACCENT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  className="font-sans-semibold"
                  style={{
                    fontSize: 14,
                    color: '#FFFFFF',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}