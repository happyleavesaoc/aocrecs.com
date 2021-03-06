import gql from 'graphql-tag';

import MatchFragment from '../graphql/MatchFragment.js';

export default gql`
query Series($id: String!, $order: [String], $offset: Int!, $limit: Int!) {
  series(id: $id) {
    name
    played
    sides {
      name
      winner
      score
      users {
        id
        name
        platform_id
      }
    }
    tournament {
      id
      name
      event {
        id
        name
      }
    }
    matches(order: $order, offset: $offset, limit: $limit) {
      count
      hits {
        ...MatchFragment
      }
    }
  }
}
${MatchFragment}
`
