import { APPLICATIONS } from './constants';

export function getUrl(service, usernameSlug) {
  const url = new URL(window.location);

  switch (service) {
    case APPLICATIONS.VSCODE.id:
      url.host = url.host.replace('app', `${usernameSlug}-code`);
      break;
    case APPLICATIONS.JUPYTER.id:
      url.host = url.host.replace('app', `${usernameSlug}-jupyter`);
      break;
    default:
      url.host = url.host.replace('app', service);
      break;
  }

  return url.toString();
}
