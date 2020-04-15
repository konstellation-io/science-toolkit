import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import CardMedia from '@material-ui/core/CardMedia';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { COLORS } from '../../constants';
import { getUrl } from '../../utils';

const useStyles = makeStyles({
  root: {
    minWidth: 100,
    maxWidth: 150,
    backgroundColor: COLORS.CARD,
    borderLeftWidth: 5,
    borderLeftStyle: 'solid',
  },
  disabled: {
    pointerEvents: 'none',
  },
  active: {
    borderLeftColor: COLORS.OK.DEFAULT,
  },
  inactive: {
    borderLeftColor: COLORS.ERROR.DEFAULT,
  },
  iconWarning: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: COLORS.WARNING,
    fontSize: 20,
  },
  content: {
    padding: '1vh',
  },
  media: {
    height: '15vh',
    backgroundSize: 'contain',
    margin: '2vh',
  },
});

const Application = ({
  title,
  active,
  icon,
  id,
  usernameSlug,
  toolsActive,
}) => {
  const classes = useStyles();

  const appReady = active || (!active && toolsActive);
  const activeClass = appReady ? classes.active : classes.inactive;
  const url = getUrl(id, usernameSlug);

  const Wrapper = ({ children }) =>
    appReady ? (
      <Link
        component='a'
        href={url}
        target='_blank'
        underline='none'
        color='inherit'
      >
        {children}
      </Link>
    ) : (
      <>{children}</>
    );

  return (
    <Card className={`${classes.root} ${activeClass}`}>
      <Wrapper>
        <CardActionArea className={appReady ? '' : classes.disabled}>
          <CardMedia
            className={classes.media}
            image={icon}
            title='Contemplative Reptile'
          />
          {!appReady && <WarningRoundedIcon className={classes.iconWarning} />}
          <CardContent className={classes.content}>
            <Typography gutterBottom variant='body1' component='p'>
              {title}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Wrapper>
    </Card>
  );
};
export default Application;
