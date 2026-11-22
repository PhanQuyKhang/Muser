// Seed catalog for Muser: real artists, albums and songs (metadata only).
//
// IMPORTANT
// - This is METADATA ONLY. No audio is licensed or uploaded; `audio.storagePath`
//   values are placeholders. Replace with cleared audio before real playback.
// - Durations are rounded to the second and may differ slightly from releases.
// - Tags are chosen so the tag-based recommender has meaningful overlap:
//   songs carry 1-2 genres + 1-2 moods; artists carry their typical tags.

export type TagCategory = "genre" | "mood";

export interface TagSeed {
  id: string; // <category>_<name>
  label: string;
  category: TagCategory;
}

export interface ArtistSeed {
  id: string;
  name: string;
  tagIds: string[];
}

export interface AlbumSeed {
  id: string;
  title: string;
  artistId: string;
  releaseDate: string; // YYYY-MM-DD
}

export interface SongSeed {
  albumId: string;
  title: string;
  durationSec: number;
  tagIds: string[];
  explicit?: boolean;
  // Where My Explore starts playback (chorus/peak), in seconds. When omitted the
  // seed uses a PLACEHOLDER of 30% of the duration; curate real values by ear.
  peakSec?: number;
  // Defaults to the album's artist. Use for collaborations.
  artistIds?: string[];
}

export const tags: TagSeed[] = [
  { id: "genre_pop", label: "Pop", category: "genre" },
  { id: "genre_rock", label: "Rock", category: "genre" },
  { id: "genre_alternative", label: "Alternative", category: "genre" },
  { id: "genre_indie", label: "Indie", category: "genre" },
  { id: "genre_hip_hop", label: "Hip-Hop", category: "genre" },
  { id: "genre_rnb", label: "R&B", category: "genre" },
  { id: "genre_electronic", label: "Electronic", category: "genre" },
  { id: "genre_jazz", label: "Jazz", category: "genre" },
  { id: "mood_chill", label: "Chill", category: "mood" },
  { id: "mood_happy", label: "Happy", category: "mood" },
  { id: "mood_energetic", label: "Energetic", category: "mood" },
  { id: "mood_melancholy", label: "Melancholy", category: "mood" },
  { id: "mood_romantic", label: "Romantic", category: "mood" },
  { id: "mood_dreamy", label: "Dreamy", category: "mood" },
  { id: "mood_focus", label: "Focus", category: "mood" },
  { id: "mood_party", label: "Party", category: "mood" },
];

export const artists: ArtistSeed[] = [
  { id: "artist_tame_impala", name: "Tame Impala", tagIds: ["genre_indie", "genre_alternative", "mood_dreamy", "mood_chill"] },
  { id: "artist_billie_eilish", name: "Billie Eilish", tagIds: ["genre_pop", "genre_alternative", "mood_melancholy", "mood_dreamy"] },
  { id: "artist_the_weeknd", name: "The Weeknd", tagIds: ["genre_pop", "genre_rnb", "mood_energetic", "mood_romantic"] },
  { id: "artist_dua_lipa", name: "Dua Lipa", tagIds: ["genre_pop", "genre_electronic", "mood_party", "mood_energetic"] },
  { id: "artist_daft_punk", name: "Daft Punk", tagIds: ["genre_electronic", "mood_party", "mood_happy"] },
  { id: "artist_arctic_monkeys", name: "Arctic Monkeys", tagIds: ["genre_rock", "genre_indie", "mood_energetic"] },
  { id: "artist_radiohead", name: "Radiohead", tagIds: ["genre_alternative", "genre_rock", "mood_melancholy"] },
  { id: "artist_kendrick_lamar", name: "Kendrick Lamar", tagIds: ["genre_hip_hop", "mood_energetic", "mood_focus"] },
  { id: "artist_frank_ocean", name: "Frank Ocean", tagIds: ["genre_rnb", "mood_chill", "mood_melancholy", "mood_romantic"] },
  { id: "artist_miles_davis", name: "Miles Davis", tagIds: ["genre_jazz", "mood_chill", "mood_focus"] },
  { id: "artist_fleetwood_mac", name: "Fleetwood Mac", tagIds: ["genre_rock", "genre_pop", "mood_chill", "mood_romantic"] },
];

export const albums: AlbumSeed[] = [
  { id: "album_currents", title: "Currents", artistId: "artist_tame_impala", releaseDate: "2015-07-17" },
  { id: "album_the_slow_rush", title: "The Slow Rush", artistId: "artist_tame_impala", releaseDate: "2020-02-14" },
  { id: "album_when_we_all_fall_asleep", title: "When We All Fall Asleep, Where Do We Go?", artistId: "artist_billie_eilish", releaseDate: "2019-03-29" },
  { id: "album_happier_than_ever", title: "Happier Than Ever", artistId: "artist_billie_eilish", releaseDate: "2021-07-30" },
  { id: "album_after_hours", title: "After Hours", artistId: "artist_the_weeknd", releaseDate: "2020-03-20" },
  { id: "album_future_nostalgia", title: "Future Nostalgia", artistId: "artist_dua_lipa", releaseDate: "2020-03-27" },
  { id: "album_discovery", title: "Discovery", artistId: "artist_daft_punk", releaseDate: "2001-03-12" },
  { id: "album_random_access_memories", title: "Random Access Memories", artistId: "artist_daft_punk", releaseDate: "2013-05-17" },
  { id: "album_am", title: "AM", artistId: "artist_arctic_monkeys", releaseDate: "2013-09-09" },
  { id: "album_ok_computer", title: "OK Computer", artistId: "artist_radiohead", releaseDate: "1997-05-21" },
  { id: "album_in_rainbows", title: "In Rainbows", artistId: "artist_radiohead", releaseDate: "2007-10-10" },
  { id: "album_good_kid_maad_city", title: "good kid, m.A.A.d city", artistId: "artist_kendrick_lamar", releaseDate: "2012-10-22" },
  { id: "album_to_pimp_a_butterfly", title: "To Pimp a Butterfly", artistId: "artist_kendrick_lamar", releaseDate: "2015-03-15" },
  { id: "album_damn", title: "DAMN.", artistId: "artist_kendrick_lamar", releaseDate: "2017-04-14" },
  { id: "album_blonde", title: "Blonde", artistId: "artist_frank_ocean", releaseDate: "2016-08-20" },
  { id: "album_channel_orange", title: "Channel Orange", artistId: "artist_frank_ocean", releaseDate: "2012-07-10" },
  { id: "album_kind_of_blue", title: "Kind of Blue", artistId: "artist_miles_davis", releaseDate: "1959-08-17" },
  { id: "album_rumours", title: "Rumours", artistId: "artist_fleetwood_mac", releaseDate: "1977-02-04" },
];

const S = (
  albumId: string,
  title: string,
  durationSec: number,
  tagIds: string[],
  explicit = false,
): SongSeed => ({ albumId, title, durationSec, tagIds, explicit });

export const songs: SongSeed[] = [
  // Tame Impala — Currents
  S("album_currents", "Let It Happen", 467, ["genre_indie", "genre_electronic", "mood_dreamy", "mood_energetic"]),
  S("album_currents", "The Less I Know the Better", 216, ["genre_indie", "genre_pop", "mood_happy", "mood_dreamy"]),
  S("album_currents", "Eventually", 318, ["genre_indie", "genre_alternative", "mood_melancholy", "mood_dreamy"]),
  S("album_currents", "Yes I'm Changing", 270, ["genre_indie", "mood_melancholy", "mood_chill"]),
  // Tame Impala — The Slow Rush
  S("album_the_slow_rush", "Borderline", 237, ["genre_indie", "genre_alternative", "mood_chill", "mood_dreamy"]),
  S("album_the_slow_rush", "Lost in Yesterday", 249, ["genre_indie", "genre_electronic", "mood_chill", "mood_dreamy"]),

  // Billie Eilish
  S("album_when_we_all_fall_asleep", "bad guy", 194, ["genre_pop", "genre_electronic", "mood_energetic"]),
  S("album_when_we_all_fall_asleep", "when the party's over", 195, ["genre_pop", "mood_melancholy"]),
  S("album_when_we_all_fall_asleep", "bury a friend", 193, ["genre_alternative", "genre_pop", "mood_energetic"]),
  S("album_happier_than_ever", "Happier Than Ever", 298, ["genre_pop", "genre_alternative", "mood_melancholy", "mood_energetic"]),
  S("album_happier_than_ever", "Your Power", 245, ["genre_pop", "mood_melancholy", "mood_chill"]),

  // The Weeknd — After Hours
  S("album_after_hours", "Blinding Lights", 200, ["genre_pop", "genre_electronic", "mood_energetic", "mood_party"]),
  S("album_after_hours", "Save Your Tears", 215, ["genre_pop", "mood_melancholy", "mood_party"]),
  S("album_after_hours", "In Your Eyes", 237, ["genre_pop", "genre_rnb", "mood_romantic", "mood_energetic"]),
  S("album_after_hours", "After Hours", 361, ["genre_rnb", "genre_electronic", "mood_melancholy", "mood_dreamy"]),
  S("album_after_hours", "Heartless", 198, ["genre_rnb", "genre_hip_hop", "mood_energetic"], true),

  // Dua Lipa — Future Nostalgia
  S("album_future_nostalgia", "Don't Start Now", 183, ["genre_pop", "genre_electronic", "mood_party", "mood_energetic"]),
  S("album_future_nostalgia", "Levitating", 203, ["genre_pop", "mood_happy", "mood_party"]),
  S("album_future_nostalgia", "Physical", 193, ["genre_pop", "genre_electronic", "mood_energetic", "mood_party"]),
  S("album_future_nostalgia", "Break My Heart", 221, ["genre_pop", "mood_happy", "mood_energetic"]),

  // Daft Punk — Discovery
  S("album_discovery", "One More Time", 320, ["genre_electronic", "mood_happy", "mood_party"]),
  S("album_discovery", "Digital Love", 298, ["genre_electronic", "mood_happy", "mood_romantic"]),
  S("album_discovery", "Harder, Better, Faster, Stronger", 224, ["genre_electronic", "mood_energetic", "mood_focus"]),
  S("album_discovery", "Aerodynamic", 207, ["genre_electronic", "mood_energetic"]),
  // Daft Punk — Random Access Memories
  S("album_random_access_memories", "Get Lucky", 369, ["genre_electronic", "genre_pop", "mood_happy", "mood_party"]),
  S("album_random_access_memories", "Instant Crush", 337, ["genre_electronic", "genre_pop", "mood_melancholy", "mood_dreamy"]),
  S("album_random_access_memories", "Giorgio by Moroder", 544, ["genre_electronic", "mood_focus", "mood_dreamy"]),

  // Arctic Monkeys — AM
  S("album_am", "Do I Wanna Know?", 272, ["genre_rock", "genre_alternative", "mood_melancholy", "mood_dreamy"]),
  S("album_am", "R U Mine?", 201, ["genre_rock", "mood_energetic"]),
  S("album_am", "Why'd You Only Call Me When You're High?", 161, ["genre_rock", "genre_indie", "mood_romantic", "mood_energetic"]),
  S("album_am", "Arabella", 207, ["genre_rock", "mood_dreamy", "mood_romantic"]),

  // Radiohead
  S("album_ok_computer", "Paranoid Android", 383, ["genre_alternative", "genre_rock", "mood_melancholy", "mood_energetic"]),
  S("album_ok_computer", "Karma Police", 261, ["genre_alternative", "genre_rock", "mood_melancholy", "mood_chill"]),
  S("album_ok_computer", "No Surprises", 228, ["genre_alternative", "mood_melancholy", "mood_chill"]),
  S("album_ok_computer", "Let Down", 299, ["genre_alternative", "mood_melancholy", "mood_dreamy"]),
  S("album_in_rainbows", "Nude", 255, ["genre_alternative", "mood_melancholy", "mood_dreamy"]),
  S("album_in_rainbows", "Weird Fishes/Arpeggi", 318, ["genre_alternative", "genre_indie", "mood_dreamy", "mood_focus"]),

  // Kendrick Lamar
  S("album_good_kid_maad_city", "Swimming Pools (Drank)", 313, ["genre_hip_hop", "mood_party", "mood_melancholy"], true),
  S("album_good_kid_maad_city", "Money Trees", 386, ["genre_hip_hop", "mood_chill", "mood_dreamy"], true),
  S("album_good_kid_maad_city", "m.A.A.d city", 350, ["genre_hip_hop", "mood_energetic"], true),
  S("album_to_pimp_a_butterfly", "Alright", 219, ["genre_hip_hop", "mood_happy", "mood_energetic"], true),
  S("album_to_pimp_a_butterfly", "King Kunta", 234, ["genre_hip_hop", "mood_energetic", "mood_party"], true),
  S("album_damn", "HUMBLE.", 177, ["genre_hip_hop", "mood_energetic"], true),
  S("album_damn", "DNA.", 185, ["genre_hip_hop", "mood_energetic"], true),

  // Frank Ocean
  S("album_blonde", "Nights", 307, ["genre_rnb", "mood_chill", "mood_melancholy"], true),
  S("album_blonde", "Pink + White", 184, ["genre_rnb", "mood_chill", "mood_happy"]),
  S("album_blonde", "Ivy", 249, ["genre_rnb", "mood_romantic", "mood_melancholy"]),
  S("album_blonde", "Self Control", 249, ["genre_rnb", "mood_romantic", "mood_melancholy"]),
  S("album_channel_orange", "Thinkin Bout You", 200, ["genre_rnb", "mood_romantic", "mood_melancholy"]),
  S("album_channel_orange", "Pyramids", 593, ["genre_rnb", "genre_electronic", "mood_dreamy", "mood_energetic"], true),
  S("album_channel_orange", "Super Rich Kids", 304, ["genre_rnb", "genre_hip_hop", "mood_chill"], true),

  // Miles Davis — Kind of Blue
  S("album_kind_of_blue", "So What", 562, ["genre_jazz", "mood_chill", "mood_focus"]),
  S("album_kind_of_blue", "Blue in Green", 337, ["genre_jazz", "mood_melancholy", "mood_focus"]),
  S("album_kind_of_blue", "All Blues", 693, ["genre_jazz", "mood_chill", "mood_focus"]),
  S("album_kind_of_blue", "Freddie Freeloader", 586, ["genre_jazz", "mood_happy", "mood_chill"]),

  // Fleetwood Mac — Rumours
  S("album_rumours", "Dreams", 257, ["genre_rock", "genre_pop", "mood_chill", "mood_dreamy"]),
  S("album_rumours", "Go Your Own Way", 218, ["genre_rock", "mood_energetic"]),
  S("album_rumours", "The Chain", 270, ["genre_rock", "mood_energetic", "mood_melancholy"]),
  S("album_rumours", "Don't Stop", 193, ["genre_rock", "genre_pop", "mood_happy"]),
];
