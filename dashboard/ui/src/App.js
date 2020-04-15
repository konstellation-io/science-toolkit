import './global.css';

import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import ActionButton from './components/ActionButton/ActionButton';
import GroupList from './components/GroupList/GroupList';
import { BASE_URL, ENDPOINTS, COLORS, HEADER } from './constants';
import { makeStyles } from '@material-ui/core/styles';
import { ThemeProvider, createMuiTheme } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import useAxios from 'axios-hooks';

const appTheme = createMuiTheme({
  palette: {
    primary: {
      light: '#27444d',
      main: '#27444d',
      dark: '#27444d',
      contrastText: '#fff',
    },
    text: {
      primary: COLORS.FONT,
    },
  },
});

const useStyles = makeStyles({
  body: {
    height: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    background: `linear-gradient(to bottom, ${COLORS.BG.TOP} 0%,${COLORS.BG.MIDDLE} 79%,${COLORS.BG.BOTTOM} 100%)`,
  },
});

const STATUS_URL = `${BASE_URL}${ENDPOINTS.STATUS}`;
const START_URL = `${BASE_URL}${ENDPOINTS.START}`;
const STOP_URL = `${BASE_URL}${ENDPOINTS.STOP}`;

function Alert(props) {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
}

function App() {
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [usernameSlug, setUsernameSlug] = useState('');
  const [toolsActive, setToolsActive] = useState(false);
  const [open, setOpen] = useState(false);

  const [{ data, loading, error, response }] = useAxios({
    url: STATUS_URL,
    method: 'post',
  });

  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  const [
    { data: startData, loading: startLoading, error: startError },
    start,
  ] = useAxios(
    {
      url: START_URL,
      method: 'post',
    },
    { manual: true }
  );
  const [
    { data: stopData, loading: stopLoading, error: stopError },
    stop,
  ] = useAxios(
    {
      url: STOP_URL,
      method: 'post',
    },
    { manual: true }
  );

  useEffect(() => {
    if (data && response.headers) {
      setUsername(response.headers[HEADER.USER]);
      setUsernameSlug(response.headers[HEADER.USER_SLUG]);
      setToolsActive(data.running);
    }
  }, [data, response]);

  useEffect(() => {
    if (startData?.running) setToolsActive(startData.running);
  }, [startData]);

  useEffect(() => {
    if (stopData?.setupOk) setToolsActive(false);
  }, [stopData]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <ThemeProvider theme={appTheme}>
      <Snackbar open={open} onClose={handleClose}>
        <Alert onClose={handleClose} severity='error'>
          Could not connect to the server. Please, try again later.
        </Alert>
      </Snackbar>
      <Header username={username} />
      <div className={classes.body}>
        <GroupList
          usernameSlug={usernameSlug}
          toolsActive={toolsActive}
          loading={error || loading}
        />
      </div>
      <ActionButton
        active={toolsActive}
        onStart={start}
        onStop={stop}
        showSkeleton={loading || error}
        loading={startLoading || stopLoading}
        error={startError || stopError}
      />
    </ThemeProvider>
  );
}

export default App;
