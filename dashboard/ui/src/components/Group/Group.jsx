import React from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Application from '../Application/Application';
import Skeleton from '@material-ui/lab/Skeleton';
import { COLORS } from '../../constants';

const useStyles = makeStyles((theme) => ({
  group: {
    background: `linear-gradient(to bottom, ${COLORS.GROUP.TOP} 0%,${COLORS.GROUP.BOTTOM} 100%)`,
    padding: 16,
  },
  subgroup: {
    padding: 16,
  },
}));

function Group({ children, title, xs, usernameSlug, toolsActive, loading }) {
  const classes = useStyles();

  return (
    <Grid item xs={12} sm={xs}>
      {loading ? (
        <Skeleton
          width={'100%'}
          height={'calc(35vh)'}
          variant='rect'
          className={classes.skeleton}
          animation='wave'
        />
      ) : (
        <Grid container className={classes.group}>
          <Typography align='left' color='textPrimary'>
            {title}
          </Typography>
          <Grid
            container
            className={classes.subgroup}
            justify='space-around'
            align='center'
          >
            {children.map((app) => (
              <Grid item xs key={app.id}>
                <Application
                  {...app}
                  usernameSlug={usernameSlug}
                  toolsActive={toolsActive}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}

export default Group;
