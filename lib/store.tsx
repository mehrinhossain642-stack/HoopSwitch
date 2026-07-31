import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CURRENT_PLAYER_ID, CURRENT_TEAM_ID, PLAYERS, TEAMS } from '../data/seed';
import type { Highlight, Player, Posting, Team } from '../data/types';

/** A posting paired with its team, which every feed card needs. */
export type PostingWithTeam = Posting & { team: Team };

type AppState = {
  players: Player[];
  teams: Team[];
  currentPlayer: Player;
  currentTeam: Team;
  /** Every posting across all teams, each carrying its team. */
  allPostings: PostingWithTeam[];

  updatePlayer: (playerId: string, patch: Partial<Player>) => void;
  updateTeam: (teamId: string, patch: Partial<Team>) => void;
  updatePosting: (postingId: string, patch: Partial<Posting>) => void;
  addPosting: (teamId: string) => void;
  addHighlight: (playerId: string) => void;

  appliedPostingIds: string[];
  toggleApply: (postingId: string) => void;
  invitedPlayerIds: string[];
  toggleInvite: (playerId: string) => void;
  messagedPlayerIds: string[];
  toggleMessage: (playerId: string) => void;

  getPlayer: (playerId: string) => Player | undefined;
  getPosting: (postingId: string) => PostingWithTeam | undefined;
};

const AppContext = createContext<AppState | null>(null);

let postingCounter = 100;
let highlightCounter = 100;

/**
 * Single in-memory store seeded from /data. No persistence, no network —
 * edits live for the session and re-render (and therefore re-score) the feeds.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(PLAYERS);
  const [teams, setTeams] = useState<Team[]>(TEAMS);
  const [appliedPostingIds, setApplied] = useState<string[]>([]);
  const [invitedPlayerIds, setInvited] = useState<string[]>([]);
  const [messagedPlayerIds, setMessaged] = useState<string[]>([]);

  const updatePlayer = useCallback((playerId: string, patch: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? { ...player, ...patch } : player))
    );
  }, []);

  const updateTeam = useCallback((teamId: string, patch: Partial<Team>) => {
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, ...patch } : team)));
  }, []);

  const updatePosting = useCallback((postingId: string, patch: Partial<Posting>) => {
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        postings: team.postings.map((posting) =>
          posting.id === postingId ? { ...posting, ...patch } : posting
        ),
      }))
    );
  }, []);

  const addPosting = useCallback((teamId: string) => {
    postingCounter += 1;
    const draft: Posting = {
      id: `ps${postingCounter}`,
      team_id: teamId,
      position: 'SF',
      ideal_height_cm: 198,
      ideal_weight_kg: 90,
      expected_minutes: 20,
      status: 'open',
      notes: 'Describe the role, system fit and what you need from this spot.',
      headline: 'New roster slot',
      posted_ago: 'just now',
      applicant_count: 0,
    };
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, postings: [...team.postings, draft] } : team
      )
    );
  }, []);

  const addHighlight = useCallback((playerId: string) => {
    highlightCounter += 1;
    const draft: Highlight = {
      id: `h${highlightCounter}`,
      title: 'Untitled clip — tap to edit later',
      source_type: 'external',
      url: 'https://www.youtube.com/',
      duration_seconds: 120,
      thumbnail_url: '',
    };
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId
          ? { ...player, highlights: [...player.highlights, draft] }
          : player
      )
    );
  }, []);

  const toggleIn = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) => {
      setter((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    },
    []
  );

  const toggleApply = useMemo(() => toggleIn(setApplied), [toggleIn]);
  const toggleInvite = useMemo(() => toggleIn(setInvited), [toggleIn]);
  const toggleMessage = useMemo(() => toggleIn(setMessaged), [toggleIn]);

  const allPostings = useMemo<PostingWithTeam[]>(
    () => teams.flatMap((team) => team.postings.map((posting) => ({ ...posting, team }))),
    [teams]
  );

  // Personas are seeded ids; the `?? [0]` keeps the types non-optional without
  // a non-null assertion, and can only trip if the seed loses its first entry.
  const currentPlayer = useMemo(
    () => players.find((player) => player.id === CURRENT_PLAYER_ID) ?? players[0]!,
    [players]
  );
  const currentTeam = useMemo(
    () => teams.find((team) => team.id === CURRENT_TEAM_ID) ?? teams[0]!,
    [teams]
  );

  const getPlayer = useCallback(
    (playerId: string) => players.find((player) => player.id === playerId),
    [players]
  );
  const getPosting = useCallback(
    (postingId: string) => allPostings.find((posting) => posting.id === postingId),
    [allPostings]
  );

  const value = useMemo<AppState>(
    () => ({
      players,
      teams,
      currentPlayer,
      currentTeam,
      allPostings,
      updatePlayer,
      updateTeam,
      updatePosting,
      addPosting,
      addHighlight,
      appliedPostingIds,
      toggleApply,
      invitedPlayerIds,
      toggleInvite,
      messagedPlayerIds,
      toggleMessage,
      getPlayer,
      getPosting,
    }),
    [
      players,
      teams,
      currentPlayer,
      currentTeam,
      allPostings,
      updatePlayer,
      updateTeam,
      updatePosting,
      addPosting,
      addHighlight,
      appliedPostingIds,
      toggleApply,
      invitedPlayerIds,
      toggleInvite,
      messagedPlayerIds,
      toggleMessage,
      getPlayer,
      getPosting,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
