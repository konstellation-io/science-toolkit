import React, { useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import DirectionsRunIcon from '@material-ui/icons/DirectionsRun';
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import Skeleton from '@material-ui/lab/Skeleton';
import { ThemeProvider, createMuiTheme, Button } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { COLORS } from '../../constants';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: COLORS.ERROR.DEFAULT,
      main: COLORS.ERROR.DEFAULT,
      dark: COLORS.ERROR.HIGHLIGHT,
    },
    secondary: {
      light: COLORS.OK.DEFAULT,
      main: COLORS.OK.DEFAULT,
      dark: COLORS.OK.HIGHLIGHT,
    },
    error: {
      light: COLORS.WARNING,
      main: COLORS.WARNING,
      dark: COLORS.WARNING,
    },
    text: {
      primary: COLORS.FONT,
    },
  },
});

const useStyles = makeStyles({
  skeleton: {
    position: 'fixed',
    bottom: 60,
    left: '5%',
  },
  container: {
    position: 'fixed',
    bottom: 60,
    padding: '0 50px',
    width: '-webkit-fill-available',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  button: {
    color: COLORS.FONT,
    fontWeight: 700,
    height: 36,
    minWidth: 167,
  },
  iconWarning: {
    fontSize: 50,
    marginTop: -8,
    marginRight: -23,
    zIndex: 1,
  },
  iconOk: {
    color: COLORS.FONT,
    backgroundColor: COLORS.OK.DEFAULT,
    borderRadius: '50%',
    padding: 5.8,
    marginRight: -18,
    zIndex: 1,
  },
  info: {
    height: 30,
    lineHeight: '30px',
    padding: '0 25px 0 26px',
    marginTop: 3,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingButton: {
    display: 'flex',
    flexDirection: 'row',
  },
  loading: {
    alignSelf: 'center',
    marginRight: 8,
  },
});

const ColorCircularProgress = withStyles({
  root: {
    color: COLORS.FONT,
  },
})(CircularProgress);

function Alert(props) {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
}

function getButtonLabel(active, loading) {
  const startLabel = loading ? 'STARTING' : 'START';
  const stopLabel = loading ? 'STOPPING' : 'STOP';

  return `${active ? stopLabel : startLabel} USER TOOLS`;
}

function ActionButton({
  active,
  onStart,
  onStop,
  loading,
  error,
  showSkeleton,
}) {
  const [open, setOpen] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  if (showSkeleton)
    return (
      <Skeleton
        width={'90%'}
        height={36}
        variant='rect'
        className={classes.skeleton}
        animation='wave'
      />
    );

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const actionInfoTextBase = 'User tools are ';

  const buttonColor = active ? 'primary' : 'secondary';
  const iconColor = active ? 'secondary' : 'error';
  const infoColor = COLORS[active ? 'OK' : 'ERROR'].DARK;
  const actionInfoText = actionInfoTextBase + (active ? 'running' : 'stopped');
  const action = active ? onStop : onStart;

  const Icon = (props) =>
    active ? (
      <DirectionsRunIcon {...props} className={classes.iconOk} />
    ) : (
      <WarningRoundedIcon {...props} className={classes.iconWarning} />
    );

  return (
    <>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity='error'>
          There was a problem starting the tools. Please, try again later.
        </Alert>
      </Snackbar>
      <ThemeProvider theme={theme}>
        <div className={classes.container}>
          <Button
            variant='contained'
            color={buttonColor}
            onClick={action}
            className={classes.button}
            startIcon={
              loading && (
                <ColorCircularProgress size={18} className={classes.loading} />
              )
            }
          >
            {getButtonLabel(active, loading)}
          </Button>
          <div className={classes.infoContainer}>
            <Icon color={iconColor} />
            <Typography
              className={classes.info}
              style={{ backgroundColor: infoColor }}
              color='textPrimary'
            >
              {actionInfoText}
            </Typography>
          </div>
        </div>
      </ThemeProvider>
    </>
  );
}

export default ActionButton;
