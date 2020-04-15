export const BASE_URL = '/api/';
export const ENDPOINTS = {
  STATUS: 'status',
  START: 'start',
  STOP: 'stop',
};

export const HEADER = {
  USER: 'x-forwarded-user',
  USER_SLUG: 'x-forwarded-user-slug',
};

export const APPLICATIONS = {
  GITEA: {
    id: 'gitea',
    title: 'Gitea',
    active: true,
    icon: '/static/img/gitea.png',
  },
  MINIO: {
    id: 'minio',
    title: 'Minio',
    active: true,
    icon: '/static/img/minio.png',
  },
  JUPYTER: {
    id: 'jupyter',
    title: 'Jupyter',
    active: false,
    icon: '/static/img/jupyter.png',
  },
  VSCODE: {
    id: 'vscode',
    title: 'VS Code',
    active: false,
    icon: '/static/img/vscode.png',
  },
  DRONE: {
    id: 'drone',
    title: 'Drone CI',
    active: true,
    icon: '/static/img/drone.png',
  },
  MLFLOW: {
    id: 'mlflow',
    title: 'ML Flow',
    active: true,
    icon: '/static/img/mlflow.png',
  },
};

export const APPLICATION_GROUPS = {
  codeRepository: {
    title: 'Code repository',
    children: [APPLICATIONS.GITEA],
  },
  storage: {
    title: 'Storage',
    children: [APPLICATIONS.MINIO],
  },
  analysis: {
    title: 'Analysis',
    children: [APPLICATIONS.JUPYTER],
  },
  experiments: {
    title: 'Experiments',
    children: [APPLICATIONS.VSCODE, APPLICATIONS.DRONE],
  },
  results: {
    title: 'Results',
    children: [APPLICATIONS.MLFLOW],
  },
};

export const COLORS = {
  HEADER: '#27444d',
  BG: {
    BOTTOM: '#253c54',
    MIDDLE: '#304469',
    TOP: '#2f5f68',
  },
  GROUP: {
    BOTTOM: '#2c3d52',
    TOP: '#2a4a54',
  },
  CARD: '#506372',
  OK: {
    DEFAULT: '#8fd14f',
    HIGHLIGHT: '#7cb940',
    DARK: '#486A58',
  },
  ERROR: {
    DEFAULT: '#f24726',
    HIGHLIGHT: '#c13317',
    DARK: '#66414D',
  },
  WARNING: '#f5a31b',
  FONT: '#feffe8',
};
