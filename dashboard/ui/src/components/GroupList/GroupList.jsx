import React from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core';
import Group from '../Group/Group';
import { APPLICATION_GROUPS } from '../../constants';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '5vh',
  },
}));

const gridSizes = [6, 6, 3, 6, 3];

function GroupList({ usernameSlug, toolsActive, loading }) {
  const classes = useStyles();

  const groups = Object.values(APPLICATION_GROUPS);

  return (
    <Grid container spacing={5} className={classes.container}>
      {groups.map((group, idx) => (
        <Group
          {...group}
          xs={gridSizes[idx]}
          key={group.title}
          usernameSlug={usernameSlug}
          toolsActive={toolsActive}
          loading={loading}
        />
      ))}
    </Grid>
  );
}

export default GroupList;
