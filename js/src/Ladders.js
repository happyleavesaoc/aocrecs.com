import React, {useState} from 'react'

import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Grid from '@material-ui/core/Grid'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Typography from '@material-ui/core/Typography'

import ReactCountryFlag from 'react-country-flag'

import AppLink from './util/AppLink'
import DataQuery from './util/DataQuery'
import RelatedMatches from './util/RelatedMatches'

import User from './User.js'

import GetPlatforms from './graphql/Platforms.js'
import GetLadders from './graphql/Ladders.js'
import GetUser from './graphql/User.js'

const UserWrapper = ({user_id, platform_id}) => {
  const field = 'user'
  return (
    <RelatedMatches query={GetUser} variables={{user_id, platform_id}} field={field}>
      {(data) => (
        <User user={data} />
      )}
  </RelatedMatches>
  )
}

const RankTable = ({platform_id, ladder_id, ranks, selected}) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Rank</TableCell>
          <TableCell>Account</TableCell>
          <TableCell>Player</TableCell>
          <TableCell align='right'>Rating</TableCell>
          <TableCell align='right'>Streak</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ranks.map(rank => (
          <TableRow key={rank.rank} selected={selected === rank.user.id}>
            <TableCell>{rank.rank}</TableCell>
            <TableCell>
              <AppLink path={['ladders', platform_id, ladder_id, rank.user.id]} text={rank.user.name} />
            </TableCell>
            <TableCell>
              {rank.user.person && <span>{rank.user.person.country && <ReactCountryFlag countryCode={rank.user.person.country} title={rank.user.person.country.toUpperCase()} svg />} <AppLink path={['players', rank.user.person.id]} text={rank.user.person.name} /></span>}
            </TableCell>
            <TableCell align='right'>{rank.rating}</TableCell>
            <TableCell align='right'>{rank.streak > 0 ? '+' + rank.streak : rank.streak}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


const LaddersView = ({match, history}) => {
  const ladder_id = parseInt(match.params.id)
  const [platform_id, setPlatform] = useState(match.params.pid ? match.params.pid : 'de')
  return (
    <div>
        <FormControl>
          <InputLabel htmlFor='platform'>Platform</InputLabel>
          <DataQuery query={GetPlatforms}>
            {(data) => (
              <Select value={platform_id} onChange={(e, v) => setPlatform(e.target.value)}>
                {data.search_options.general.platforms.filter((platform) => platform.value === 'de').map((platform) =>
                  <MenuItem key={platform.value} value={platform.value}>{platform.label}</MenuItem>
                )}
              </Select>
            )}
          </DataQuery>
        </FormControl>
        <br />
        <br />

    <DataQuery query={GetLadders} variables={{platform_id, ladder_ids: [3, 4]}}>
      {(data) => (
          <Grid container spacing={24}>
            <Grid item xs={6}>
            {data.meta_ladders.map(ladder => (
              <ExpansionPanel
                key={ladder.id}
                expanded={ladder_id === ladder.id}
                onChange={(o, e) => history.push(e ? '/ladders/' + platform_id + '/' + ladder.id : '/ladders')}
              >
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography><AppLink path={['ladders', platform_id, ladder.id]} text={ladder.name} /></Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <RankTable platform_id={platform_id} ladder_id={ladder.id} ranks={ladder.ranks} selected={ladder_id} />
                </ExpansionPanelDetails>
              </ExpansionPanel>
            ))}
          </Grid>
          {match.params.vid && <Grid item xs={6}>
            <UserWrapper user_id={match.params.vid} platform_id={platform_id} />
            </Grid>}
          </Grid>
      )}
    </DataQuery>
  </div>
  )
}

export default LaddersView
