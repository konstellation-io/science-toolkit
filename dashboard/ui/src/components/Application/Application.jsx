import { COLORS } from '../../constants';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Link from '@material-ui/core/Link';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import { getUrl } from '../../utils';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    minWidth: 100,
    maxWidth: '11vw',
    backgroundColor: COLORS.CARD,
    borderTopWidth: 8,
    borderTopStyle: 'solid',
    height: '100%',
    boxShadow: '0 0 6px 1px black'
  },
  disabled: {
    pointerEvents: 'none',
  },
  active: {
    borderTopColor: COLORS.OK.DEFAULT,
  },
  inactive: {
    borderTopColor: COLORS.ERROR.DEFAULT,
  },
  iconWarning: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: COLORS.WARNING,
    fontSize: 26,
  },
  content: {
    padding: 0,
    paddingLeft: 8,
    '& p': {
      marginBottom: 0,
    },
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'space-around',
    height: '100%',
    padding: 10,
  },
  media: {
    backgroundSize: 'contain',
    width: '7vw',
    '@media (max-height: 626px)': {
      width: 'inherit',
    },
    height: '75%',
    maxWidth: 110
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
        <CardActionArea
          className={`${classes.button} ${appReady ? '' : classes.disabled}`}
        >
          <CardMedia
            className={classes.media}
            image={icon}
            title='Contemplative Reptile'
          />
          <CardContent className={classes.content}>
            <Typography gutterBottom variant='body1' component='p'>
              {title}
            </Typography>
          </CardContent>
          {!appReady && <WarningRoundedIcon className={classes.iconWarning} />}
        </CardActionArea>
      </Wrapper>
    </Card>
  );
};
export default Application;
