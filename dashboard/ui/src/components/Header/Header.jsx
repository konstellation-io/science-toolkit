import { APPLICATIONS, COLORS } from '../../constants';

import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import PersonIcon from '@material-ui/icons/Person';
import React from 'react';
import SettingsIcon from '@material-ui/icons/Settings';
import Skeleton from '@material-ui/lab/Skeleton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { getUrl } from '../../utils';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  header: {
    backgroundColor: COLORS.HEADER,
  },
  icon: {
    marginRight: 'auto'
  },
  toolbar: {
    minHeight: 'max(7.5vh, 50px)',
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'row'
  },
  skeletonEl: {
    backgroundColor: COLORS.SKELETON,
  },
  settingsIcon: {
    color: COLORS.FONT,
    marginLeft: 8,
    height: 23,
  },
  avatar: {
    width: 35,
    height: 35,
    marginRight: 12
  },
});

function Header({ username }) {
  const classes = useStyles();

  const giteaUrl = getUrl(APPLICATIONS.GITEA.id, '');
  const avatarSrc = `${giteaUrl}user/avatar/${username}/180`;
  const settingsUrl = `${giteaUrl}user/settings`;

  const UserSkeleton = (
    <div className={classes.skeleton}>
      <Skeleton
        width={35}
        height={35}
        variant='circle'
        style={{ marginRight: 8 }}
        className={classes.skeletonEl}
        animation='wave'
      />
      <Skeleton width={90} height={36} animation='wave' className={classes.skeletonEl} />
    </div>
  );

  return (
    <div>
      <AppBar position='static' className={classes.header}>
        <Toolbar color='primary' className={classes.toolbar}>
          <img src='/static/img/logo-vertical-kdl.png' className={classes.icon} alt='KDL' height='45' />
          {username ? (
            <>
              <Avatar
                alt='User avatar'
                src={avatarSrc}
                className={classes.avatar}
              >
                <PersonIcon />
              </Avatar>
              <Typography
                variant='body1'
                color='inherit'
                className={classes.username}
              >
                {username}
              </Typography>
              <Link
                component='a'
                href={settingsUrl}
                target='_blank'
                color='inherit'
              >
                <IconButton
                  aria-label='delete'
                  className={classes.settingsIcon}
                  size='small'
                >
                  <SettingsIcon fontSize='inherit' />
                </IconButton>
              </Link>
            </>
          ) : (
            UserSkeleton
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default Header;
