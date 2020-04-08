import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import SettingsIcon from '@material-ui/icons/Settings';
import Skeleton from '@material-ui/lab/Skeleton';
import PersonIcon from '@material-ui/icons/Person';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';
import { COLORS, APPLICATIONS } from '../../constants';
import { getUrl } from '../../utils';

const useStyles = makeStyles({
  header: {
    backgroundColor: COLORS.HEADER,
  },
  title: {
    margin: 'auto',
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'row',
  },
  settingsIcon: {
    color: COLORS.FONT,
    marginLeft: 8,
    height: 23,
  },
  avatar: {
    width: 35,
    height: 35,
    marginRight: 12,
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
        animation='wave'
      />
      <Skeleton width={90} height={36} animation='wave' />
    </div>
  );

  return (
    <div>
      <AppBar position='static' className={classes.header}>
        <Toolbar color='primary'>
          <img src='/static/img/intelygenz-lab.png' alt='Kitten' height='30' />
          <Typography variant='h5' color='inherit' className={classes.title}>
            Intelygenz A.I. Science Toolkit
          </Typography>
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
