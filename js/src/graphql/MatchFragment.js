import gql from 'graphql-tag';

export default gql`
fragment MatchFragment on Match {
  id
  duration
  duration_secs
  played
  has_playback
  type
  rated
  diplomacy_type
  team_size
  map_name
  rms_seed
  rms_custom
  direct_placement
  effect_quantity
  guard_state
  fixed_positions
  map_events {
    id
    name
  }
  postgame
  platform_match_id
  cheats
  map_size
  map_reveal_choice
  minimap_link
  population_limit
  speed
  lock_teams
  difficulty
  mirror
  dataset {
    name
  }
  platform {
    id
    name
    url
    match_url
  }
  dataset_version
  ladder {
    id
    platform_id
    name
  }
  series {
    id
    name
  }
  tournament {
    id
    name
  }
  event {
    id
    name
  }
  version
  game_version
  save_version
  build
  winning_team_id
  teams {
    winner
    players {
      name
      color_id
      platform_id
      user {
        id
        name
        platform_id
        person {
          id
          country
          name
        }
      }
      civilization {
        id
        dataset_id
        name
      }
      rate_snapshot
      mvp
      human
      winner
      score
      rate_before
      rate_after
      military_score
      economy_score
      technology_score
      society_score
      units_killed
      units_lost
      buildings_razed
      buildings_lost
      units_converted
      food_collected
      wood_collected
      stone_collected
      gold_collected
      tribute_sent
      tribute_received
      trade_gold
      relic_gold
      feudal_time
      castle_time
      imperial_time
      explored_percent
      research_count
      total_wonders
      total_castles
      total_relics
      villager_high
    }
  }
  files {
    id
    download_link
    original_filename
    size
    owner {
      name
    }
  }
}
`
