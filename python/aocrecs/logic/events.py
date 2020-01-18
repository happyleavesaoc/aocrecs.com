"""Events."""
import asyncio

import networkx
from aocrecs.cache import cached
from aocrecs.util import by_key


def get_sides(matches, participants):
    """Get users per side given matches."""
    users = {}
    for match in matches:
        users.update({
            p['user_id']: dict(
                id=p['user_id'],
                name=p['user_name'] or p['name'],
                platform_id=p['platform_id']
            ) for p in match['players']
        })
    return [
        dict(p, users=[users[u] for u in p['user_ids'] if u])
        for p in compute_participants(matches, participants)
    ]


@cached(ttl=None)
async def get_series(database, series_id):
    """Get a series."""
    series_query = """
        select series.id, series.played, series_metadata.name, rounds.tournament_id, tournaments.id as tournament_id,
        tournaments.name as tournament_name, events.id as event_id, events.name as event_name
        from series join rounds on series.round_id=rounds.id join series_metadata on series.id=series_metadata.series_id
        join tournaments on rounds.tournament_id=tournaments.id
        join events on tournaments.event_id=events.id
        where series.id=:id
    """
    participants_query = 'select series_id, name, score, winner from participants where series_id=:id'
    matches_query = 'select id, series_id from matches where series_id=:id'
    values = {'id': series_id}
    series, participants, matches = await asyncio.gather(
        database.fetch_one(series_query, values=values),
        database.fetch_all(participants_query, values=values),
        database.fetch_all(matches_query, values=values)
    )
    return dict(
        series,
        participants=list(map(dict, participants)),
        match_ids=list(map(lambda m: m['id'], matches)),
        tournament=dict(
            id=series['tournament_id'],
            name=series['tournament_name'],
            event=dict(
                id=series['event_id'],
                name=series['event_name']
            )
        )
    )


@cached(ttl=None)
async def get_events(database): # pylint: disable=too-many-locals
    """Get events."""
    events_query = 'select id, name from events'
    tournaments_query = 'select id, event_id, name from tournaments'
    series_query = """
        select
            series.id, series.played, series_metadata.name, rounds.tournament_id
        from series
            join rounds on series.round_id=rounds.id
            join series_metadata on series.id=series_metadata.series_id
    """
    participants_query = 'select series_id, name, score, winner from participants'
    matches_query = 'select id, series_id from matches where series_id <> \'\''
    maps_query = 'select id, event_id, name from event_maps'
    events, tournaments, series, participants, matches, maps = await asyncio.gather(
        database.fetch_all(events_query),
        database.fetch_all(tournaments_query),
        database.fetch_all(series_query),
        database.fetch_all(participants_query),
        database.fetch_all(matches_query),
        database.fetch_all(maps_query)
    )
    tournament_data = by_key(tournaments, 'event_id')
    series_data = by_key(series, 'tournament_id')
    participant_data = by_key(participants, 'series_id')
    match_data = by_key(matches, 'series_id')
    map_data = by_key(maps, 'event_id')
    return [
        dict(
            event,
            maps=map_data[event['id']],
            tournaments=[dict(
                tournament,
                series=[dict(
                    series_,
                    participants=participant_data[series_['id']],
                    match_ids=[m['id'] for m in match_data[series_['id']]]
                ) for series_ in series_data[tournament['id']]]
            ) for tournament in tournament_data[event['id']]]
        ) for event in events
    ]


def compute_participants(matches, challonge_data):
    """Compute series participants.

    Iterate all matches and players to create a graph.
    Apply connected components algorithm to resolve distinct
    participant groups over all matches.

    Sort participant groups by number of wins to correlate
    with Challonge participant data (which also includes number
    of wins).

    Note that edge cases exist that are not covered. For example,
    teams sometimes field a 1v1 player for a single match. If neither
    player in the 1v1 match takes part in any other matches,
    the players can't be placed in a participant group and their win
    is not counted. There are two consequences:

    1. Not counting a win may make the number of wins between
       participants even, in which case we don't know which
       participant group won the series.
    2. Not grouping a player means the participant player list
       will be incomplete.
    """
    graph = networkx.DiGraph()
    win_id = 0
    platform_ids = []
    for match in matches:
        # Record a win
        win_id += 1
        graph.add_node(win_id, type='win')

        # Record platform ID
        platform_ids.append(match['platform_id'])

        # Add node for each player
        for player in match['players']:
            graph.add_node(player['user_id'], type='player')

        # Connect winning players to recorded win
        for player in match['winning_team']['players']:
            graph.add_edge(player['user_id'], win_id)

        # Connect all players on the same team
        for team in match['teams']:
            for i in team['players']:
                for j in team['players']:
                    graph.add_edge(i['user_id'], j['user_id'])

    mgz_data = [{
        'wins': len([node for node in g if graph.nodes[node]['type'] == 'win']),
        'players': [node for node in g if graph.nodes[node]['type'] == 'player']
    } for g in networkx.weakly_connected_components(graph)]

    return [{
        'user_ids': mgz['players'],
        'winner': challonge['winner'],
        'name': challonge['name'],
        'score': challonge['score'],
        'platform_id': max(platform_ids)
    } for mgz, challonge in zip(
        sorted(mgz_data, key=lambda k: -1 * k['wins']),
        sorted(challonge_data, key=lambda k: -1 * k['score'])
    )]