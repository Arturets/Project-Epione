export type RouteRole = 'public' | 'customer' | 'coach' | 'admin';

export type RouteManifestItem = {
  id: string;
  path: string;
  title: string;
  role: RouteRole;
  components: string[];
  linksTo: string[];
  subroutes?: Array<{ id: string; name: string }>;
};

export const ROUTES_MANIFEST: RouteManifestItem[] = [
  {
    id: 'root',
    path: '/',
    title: 'Home',
    role: 'public',
    components: ['MarketingShell', 'Navbar'],
    linksTo: ['dashboard', 'coach/dashboard', 'developer/console']
  },
  {
    id: 'dashboard',
    path: '/dashboard',
    title: 'Customer Dashboard',
    role: 'customer',
    components: ['AppShell', 'Dashboard'],
    linksTo: ['graph', 'anatomy', 'interventions', 'snapshots', 'account', 'settings', 'root']
  },
  {
    id: 'graph',
    path: '/graph',
    title: 'Metric Graph',
    role: 'customer',
    components: ['AppShell', 'MetricGraph'],
    linksTo: ['anatomy', 'interventions', 'dashboard', 'account', 'root']
  },
  {
    id: 'anatomy',
    path: '/anatomy',
    title: 'Anatomical Diagram',
    role: 'customer',
    components: ['AppShell', 'MuscleHeadDiagram'],
    linksTo: ['graph', 'dashboard', 'interventions', 'root']
  },
  {
    id: 'interventions',
    path: '/interventions',
    title: 'Intervention Explorer',
    role: 'customer',
    components: ['AppShell', 'InterventionList', 'SimulationTable'],
    linksTo: ['dashboard', 'graph', 'anatomy', 'account', 'root']
  },
  {
    id: 'snapshots',
    path: '/snapshots',
    title: 'Snapshot History',
    role: 'customer',
    components: ['AppShell', 'SnapshotTimeline'],
    linksTo: ['dashboard', 'account', 'root']
  },
  {
    id: 'account',
    path: '/account',
    title: 'Account Settings',
    role: 'customer',
    components: ['AppShell', 'AccountCenter'],
    linksTo: ['dashboard', 'settings', 'root']
  },
  {
    id: 'coach/dashboard',
    path: '/coach/dashboard',
    title: 'Coach Dashboard',
    role: 'coach',
    components: ['CoachShell', 'CoachDashboard'],
    linksTo: ['coach/clients', 'coach/care-plans', 'coach/reports', 'root']
  },
  {
    id: 'coach/clients',
    path: '/coach/clients',
    title: 'Manage Clients',
    role: 'coach',
    components: ['CoachShell', 'ClientList'],
    linksTo: ['coach/dashboard', 'coach/reports', 'root']
  },
  {
    id: 'developer/console',
    path: '/developer/console',
    title: 'Developer Console',
    role: 'admin',
    components: ['AppShell', 'DeveloperConsole'],
    linksTo: ['root', 'dashboard', 'coach/dashboard'],
    subroutes: [
      { id: 'developer/console/interventions', name: 'Intervention Builder' },
      { id: 'developer/console/sitemap', name: 'Site Map' },
      { id: 'developer/console/stats', name: 'Usage Stats' },
      { id: 'developer/console/graph', name: 'Graph Metrics' }
    ]
  }
];

export const SHARED_COMPONENTS = [
  {
    id: 'AppShell',
    role: 'container',
    appearsIn: ['dashboard', 'graph', 'anatomy', 'interventions', 'snapshots', 'account', 'developer/console']
  },
  {
    id: 'CoachShell',
    role: 'container',
    appearsIn: ['coach/dashboard', 'coach/clients']
  },
  {
    id: 'Navbar',
    role: 'navigation',
    appearsIn: ['root', 'dashboard', 'graph', 'anatomy', 'interventions', 'snapshots', 'account', 'coach/dashboard', 'developer/console']
  }
] as const;
