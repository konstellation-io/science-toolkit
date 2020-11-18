import Application from '../Application/Application';
import { COLORS } from '../../constants';
import Grid from '@material-ui/core/Grid';
import React from 'react';
import Skeleton from '@material-ui/lab/Skeleton';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  groupContainer: {
    height: '50%',
  },
  skeleton: {
    backgroundColor: COLORS.SKELETON
  },
  group: {
    background: `linear-gradient(to bottom, ${COLORS.GROUP.TOP} 0%,${COLORS.GROUP.BOTTOM} 100%)`,
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  subgroup: {
    height: '100%',
    padding: '16px 0',
  },
  cardContainer: {
    height: '100%',
  },
}));

function Group({ children, title, xs, usernameSlug, toolsActive, loading }) {
  const classes = useStyles();

  return (
    <Grid item xs={12} sm={xs} className={classes.groupContainer}>
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
              <Grid item xs key={app.id} className={classes.cardContainer}>
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
