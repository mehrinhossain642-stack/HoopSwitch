# Seeds mirroring the React Native client's data/seed.ts, so the API serves the
# same dataset the prototype renders. Idempotent — safe to re-run.
#
# Tuned so every posting has both a clear "great fit" (score >= 78) and a
# "close but undersized" partial whose weakest component is height:
#
#   Starting PG    great: Marcus Webb 96     undersized: Elijah Carter 74
#   Wing scorer    great: Deshawn Price 94   undersized: Marcus Webb 55
#   Rim-protector  great: Andre Boucher 88   undersized: Tyrell Nkemdi 63
#   Backup PG      great: Marcus Webb 95     undersized: Elijah Carter 66
#
# Highlight URLs are placeholder YouTube links — the MVP only needs an external
# URL to open and a remote thumbnail to render.

PASSWORD = "password123"

def upsert_user!(email:, role:)
  User.find_or_initialize_by(email: email).tap do |user|
    user.role = role
    user.password = PASSWORD
    user.password_confirmation = PASSWORD
    user.save!
  end
end

# --- Players -----------------------------------------------------------------

PLAYERS = [
  {
    email: "marcus.webb@example.com",
    name: "Marcus Webb", position: "PG",
    height_cm: 188, weight_kg: 84, wingspan_cm: 196, age: 22,
    dominant_hand: "Right", eligibility_years: 1, location: "Toronto, ON",
    ppg: 24.1, rpg: 4.8, apg: 6.2, fg_pct: 48,
    bio: "Downhill lead guard who plays with pace and pressures the rim every possession. Two-year captain, ran a top-10 offence in U SPORTS. Looking for a starting role where I can run the show for a final year.",
    career_stats: [
      { season: "2024–25", team_name: "Humber Hawks", gp: 24, ppg: 24.1, rpg: 4.8, apg: 6.2 },
      { season: "2023–24", team_name: "Humber Hawks", gp: 26, ppg: 19.4, rpg: 4.1, apg: 5.5 },
      { season: "2022–23", team_name: "Durham Lords", gp: 22, ppg: 13.8, rpg: 3.2, apg: 4.0 }
    ],
    highlights: [
      { title: "32 pts vs Carleton — full highlights", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds: 212, thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
      { title: "Pick-and-roll reads reel", url: "https://www.youtube.com/watch?v=ScMzIvxBSi4", duration_seconds: 154, thumbnail_url: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg" },
      { title: "Senior season mixtape", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", duration_seconds: 328, thumbnail_url: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg" }
    ]
  },
  {
    email: "elijah.carter@example.com",
    name: "Elijah Carter", position: "PG",
    height_cm: 178, weight_kg: 79, wingspan_cm: 186, age: 20,
    dominant_hand: "Right", eligibility_years: 2, location: "Halifax, NS",
    ppg: 28.4, rpg: 2.0, apg: 3.1, fg_pct: 42,
    bio: "Undersized scoring guard with deep range and a quick trigger. Led the conference in points per game as a sophomore. Want to prove I can score at a higher level.",
    career_stats: [
      { season: "2024–25", team_name: "Dalhousie Tigers", gp: 20, ppg: 28.4, rpg: 2.0, apg: 3.1 },
      { season: "2023–24", team_name: "Dalhousie Tigers", gp: 18, ppg: 21.7, rpg: 1.8, apg: 2.4 }
    ],
    highlights: [
      { title: "41-point night vs Acadia", url: "https://www.youtube.com/watch?v=9bZkp7q19f0", duration_seconds: 268, thumbnail_url: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg" },
      { title: "Pull-up three compilation", url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", duration_seconds: 141, thumbnail_url: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg" }
    ]
  },
  {
    email: "deshawn.price@example.com",
    name: "Deshawn Price", position: "SG",
    height_cm: 196, weight_kg: 85, wingspan_cm: 205, age: 21,
    dominant_hand: "Right", eligibility_years: 2, location: "Windsor, ON",
    ppg: 18.6, rpg: 5.4, apg: 3.0, fg_pct: 46,
    bio: "Two-way wing with real size for the position. Comfortable guarding one through three and scoring off the catch. Shot 39% from three on high volume last season.",
    career_stats: [
      { season: "2024–25", team_name: "Windsor Lancers", gp: 22, ppg: 18.6, rpg: 5.4, apg: 3.0 },
      { season: "2023–24", team_name: "Windsor Lancers", gp: 24, ppg: 12.9, rpg: 4.6, apg: 2.2 }
    ],
    highlights: [
      { title: "Two-way wing reel 2024–25", url: "https://www.youtube.com/watch?v=RgKAFK5djSk", duration_seconds: 196, thumbnail_url: "https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg" },
      { title: "Defensive possessions vs Brock", url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", duration_seconds: 173, thumbnail_url: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg" }
    ]
  },
  {
    email: "andre.boucher@example.com",
    name: "Andre Boucher", position: "C",
    height_cm: 208, weight_kg: 104, wingspan_cm: 218, age: 23,
    dominant_hand: "Right", eligibility_years: 1, location: "Montreal, QC",
    ppg: 14.2, rpg: 11.6, apg: 1.4, fg_pct: 55,
    bio: "Traditional five who protects the paint and finishes everything inside. Led U SPORTS in blocks per game. Bilingual, comfortable anywhere in the country.",
    career_stats: [
      { season: "2024–25", team_name: "Concordia Stingers", gp: 23, ppg: 14.2, rpg: 11.6, apg: 1.4 },
      { season: "2023–24", team_name: "Concordia Stingers", gp: 21, ppg: 11.0, rpg: 9.8, apg: 1.1 },
      { season: "2022–23", team_name: "Vanier Cheetahs", gp: 25, ppg: 8.4, rpg: 8.2, apg: 0.9 }
    ],
    highlights: [
      { title: "Rim protection — season reel", url: "https://www.youtube.com/watch?v=YQHsXMglC9A", duration_seconds: 244, thumbnail_url: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg" },
      { title: "18 & 15 vs McGill", url: "https://www.youtube.com/watch?v=CevxZvSJLk8", duration_seconds: 187, thumbnail_url: "https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg" }
    ]
  },
  {
    email: "jordan.ellis@example.com",
    name: "Jordan Ellis", position: "SF",
    height_cm: 198, weight_kg: 91, wingspan_cm: 206, age: 21,
    dominant_hand: "Left", eligibility_years: 3, location: "Vancouver, BC",
    ppg: 11.4, rpg: 6.8, apg: 2.6, fg_pct: 44,
    bio: "Connective forward who rebounds, moves the ball and takes the tough defensive assignment. Not the first option, but three years of eligibility and a high floor.",
    career_stats: [
      { season: "2024–25", team_name: "UBC Thunderbirds", gp: 21, ppg: 11.4, rpg: 6.8, apg: 2.6 },
      { season: "2023–24", team_name: "UBC Thunderbirds", gp: 19, ppg: 7.2, rpg: 5.1, apg: 1.9 }
    ],
    highlights: [
      { title: "Glue-guy tape 2024–25", url: "https://www.youtube.com/watch?v=e-ORhEE9VVg", duration_seconds: 165, thumbnail_url: "https://img.youtube.com/vi/e-ORhEE9VVg/hqdefault.jpg" }
    ]
  },
  {
    email: "tyrell.nkemdi@example.com",
    name: "Tyrell Nkemdi", position: "PF",
    height_cm: 203, weight_kg: 99, wingspan_cm: 213, age: 22,
    dominant_hand: "Right", eligibility_years: 2, location: "Brampton, ON",
    ppg: 16.8, rpg: 9.2, apg: 1.8, fg_pct: 51,
    bio: "Mobile big who can switch onto guards and stretch it to the arc. Played a lot of five out of necessity last year — happiest at the four next to a rim protector.",
    career_stats: [
      { season: "2024–25", team_name: "Ryerson Rams", gp: 25, ppg: 16.8, rpg: 9.2, apg: 1.8 },
      { season: "2023–24", team_name: "Ryerson Rams", gp: 23, ppg: 12.4, rpg: 7.6, apg: 1.3 }
    ],
    highlights: [
      { title: "Switch-everything defence reel", url: "https://www.youtube.com/watch?v=lp-EO5I60KA", duration_seconds: 158, thumbnail_url: "https://img.youtube.com/vi/lp-EO5I60KA/hqdefault.jpg" },
      { title: "Pick-and-pop highlights", url: "https://www.youtube.com/watch?v=hT_nvWreIhg", duration_seconds: 132, thumbnail_url: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg" }
    ]
  }
].freeze

PLAYERS.each do |attrs|
  attrs = attrs.dup
  email = attrs.delete(:email)
  career_stats = attrs.delete(:career_stats)
  highlights = attrs.delete(:highlights)

  user = upsert_user!(email: email, role: "player")
  profile = PlayerProfile.find_or_initialize_by(user: user)
  profile.update!(attrs)

  career_stats.each do |stat|
    profile.career_stats.find_or_initialize_by(season: stat[:season]).update!(stat)
  end

  highlights.each do |highlight|
    profile.highlights.find_or_initialize_by(url: highlight[:url]).update!(highlight)
  end
end

# --- Teams and postings ------------------------------------------------------

TEAMS = [
  {
    email: "mike.bradley@westernmustangs.example.com",
    name: "Western Mustangs", league: "U SPORTS · OUA", location: "London, ON",
    wins: 18, losses: 6, roster_size: 14, coach_name: "Mike Bradley",
    about: "Perennial OUA contender running a five-out, pace-and-space system. We graduated three starters and are rebuilding the backcourt around a lead guard who can organise the offence from day one.",
    postings: [
      {
        position: "PG", ideal_height_cm: 186, ideal_weight_kg: 82, expected_minutes: 28,
        status: "open", headline: "Looking for a starting Point Guard",
        notes: "Immediate impact starter. Must be able to run pick-and-roll as the primary handler and defend at the point of attack."
      },
      {
        position: "SG", ideal_height_cm: 196, ideal_weight_kg: 88, expected_minutes: 24,
        status: "open", headline: "Wing scorer with size wanted",
        notes: "Wing scorer with size to guard multiple positions. Catch-and-shoot volume is the priority."
      },
      {
        position: "C", ideal_height_cm: 210, ideal_weight_kg: 100, expected_minutes: 26,
        status: "open", headline: "Rim-protecting Centre needed",
        notes: "Rim protector to anchor the defence. Screening and short-roll passing matter more than post scoring."
      }
    ]
  },
  {
    email: "dana.whitfield@carletonravens.example.com",
    name: "Carleton Ravens", league: "U SPORTS · OUA", location: "Ottawa, ON",
    wins: 21, losses: 3, roster_size: 15, coach_name: "Dana Whitfield",
    about: "Defence-first program with a deep rotation and a long track record of national championships. We develop guards into complete two-way players.",
    postings: [
      {
        position: "PG", ideal_height_cm: 190, ideal_weight_kg: 84, expected_minutes: 17,
        status: "in_review", headline: "Backup PG needed for rotation",
        notes: "Backup PG for the rotation. Defensive specialist who can steady the second unit for 15–20 minutes."
      }
    ]
  }
].freeze

TEAMS.each do |attrs|
  attrs = attrs.dup
  email = attrs.delete(:email)
  postings = attrs.delete(:postings)

  user = upsert_user!(email: email, role: "coach")
  team = Team.find_or_initialize_by(user: user)
  team.update!(attrs)

  postings.each do |posting|
    team.postings.find_or_initialize_by(position: posting[:position],
                                       headline: posting[:headline]).update!(posting)
  end
end

# --- A couple of connections so both directions have data --------------------

marcus = PlayerProfile.find_by!(name: "Marcus Webb")
elijah = PlayerProfile.find_by!(name: "Elijah Carter")
starting_pg = Posting.find_by!(headline: "Looking for a starting Point Guard")
backup_pg = Posting.find_by!(headline: "Backup PG needed for rotation")

Connection.find_or_create_by!(posting: starting_pg, player_profile: marcus) do |connection|
  connection.initiated_by = "coach"   # the Mustangs invited Marcus
  connection.status = "pending"
end

Connection.find_or_create_by!(posting: backup_pg, player_profile: elijah) do |connection|
  connection.initiated_by = "player"  # Elijah applied to Carleton
  connection.status = "pending"
end

puts "Seeded #{User.count} users, #{PlayerProfile.count} players, " \
     "#{Team.count} teams, #{Posting.count} postings, #{Connection.count} connections."
puts "All seeded accounts use password: #{PASSWORD}"
