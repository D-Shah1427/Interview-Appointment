export type AppRoute = 'candidate' | 'panelists' | 'admin';

/**
 * Determines current route from window.location pathname, hash, or search params
 */
export function getRouteFromUrl(): AppRoute {
  if (typeof window === 'undefined') return 'candidate';

  // 1. Check query parameters: ?role=... or ?view=...
  const searchParams = new URLSearchParams(window.location.search);
  const roleParam = (searchParams.get('role') || searchParams.get('view'))?.toLowerCase();
  const pParam = searchParams.get('p')?.toLowerCase() || '';

  if (roleParam === 'panelists' || roleParam === 'panel' || roleParam === 'interviewer' || pParam.includes('panel')) {
    return 'panelists';
  }
  if (roleParam === 'admin' || roleParam === 'recruiter' || pParam.includes('admin')) {
    return 'admin';
  }
  if (roleParam === 'candidate' || roleParam === 'book' || pParam.includes('book')) {
    return 'candidate';
  }

  // 2. Check hash: #/panelists, #/admin, #/book
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('panelist') || hash.includes('panel')) {
    return 'panelists';
  }
  if (hash.includes('admin')) {
    return 'admin';
  }
  if (hash.includes('book') || hash.includes('candidate')) {
    return 'candidate';
  }

  // 3. Check pathname: e.g. /panelists, /admin, /book
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  if (path.endsWith('/panelists') || path.endsWith('/panel')) {
    return 'panelists';
  }
  if (path.endsWith('/admin')) {
    return 'admin';
  }
  if (path.endsWith('/book')) {
    return 'candidate';
  }

  // Default is candidate booking portal
  return 'candidate';
}

/**
 * Navigates to a route updating URL and notifying listeners
 */
export function navigateToRoute(route: AppRoute) {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  // Strip any existing route segment (/admin, /panelists, /book)
  const basePath = currentPath.replace(/\/(admin|panelists|panel|book)\/?$/i, '').replace(/\/+$/, '');
  
  let targetPath = '';
  if (route === 'candidate') {
    targetPath = `${basePath}/book`;
  } else {
    targetPath = `${basePath}/${route}`;
  }

  // If at root and candidate, clean path to basePath or /
  if (route === 'candidate' && (currentPath === '/' || currentPath === basePath || currentPath === `${basePath}/`)) {
    targetPath = `${basePath}/`;
  }

  window.history.pushState({ route }, '', targetPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Generates an absolute URL for candidates to book
 */
export function getCandidateShareableUrl(): string {
  if (typeof window === 'undefined') return '';
  const currentPath = window.location.pathname;
  const basePath = currentPath.replace(/\/(admin|panelists|panel|book)\/?$/i, '').replace(/\/+$/, '');
  return `${window.location.origin}${basePath}/book`;
}
