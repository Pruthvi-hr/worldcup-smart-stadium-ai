/**
 * Shared mock domain data for the World Cup 2026 Smart Stadium platform.
 * Both the Fan and Volunteer experiences read from these static sources so
 * the simulation feels cohesive. Live values are layered on top at runtime.
 */

export interface Match {
  id: string;
  stage: string;
  group: string;
  home: { name: string; code: string; flag: string; color: string };
  away: { name: string; code: string; flag: string; color: string };
  venue: string;
  city: string;
  kickoff: string; // 24h display string
  minute: number; // live minute, 0 = not started
  status: 'upcoming' | 'live' | 'finished';
  score: { home: number; away: number };
}

export const matches: Match[] = [
  {
    id: 'm1',
    stage: 'Group Stage',
    group: 'Group A',
    home: { name: 'Canada', code: 'CAN', flag: '🇨🇦', color: '#dc2626' },
    away: { name: 'Mexico', code: 'MEX', flag: '🇲🇽', color: '#15803d' },
    venue: 'BMO Field',
    city: 'Toronto',
    kickoff: '20:00',
    minute: 0,
    status: 'upcoming',
    score: { home: 0, away: 0 },
  },
  {
    id: 'm2',
    stage: 'Group Stage',
    group: 'Group B',
    home: { name: 'USA', code: 'USA', flag: '🇺🇸', color: '#1d4ed8' },
    away: { name: 'Brazil', code: 'BRA', flag: '🇧🇷', color: '#facc15' },
    venue: 'MetLife Stadium',
    city: 'New York',
    kickoff: '17:00',
    minute: 67,
    status: 'live',
    score: { home: 2, away: 1 },
  },
  {
    id: 'm3',
    stage: 'Group Stage',
    group: 'Group C',
    home: { name: 'Argentina', code: 'ARG', flag: '🇦🇷', color: '#67e8f9' },
    away: { name: 'France', code: 'FRA', flag: '🇫🇷', color: '#1e3a8a' },
    venue: 'AT&T Stadium',
    city: 'Dallas',
    kickoff: '14:00',
    minute: 90,
    status: 'finished',
    score: { home: 3, away: 2 },
  },
];

export interface StadiumZone {
  id: string;
  name: string;
  occupancy: number; // percentage 0-100
  capacity: number;
  tempC: number;
  status: 'calm' | 'busy' | 'critical';
}

export const stadiumZones: StadiumZone[] = [
  { id: 'z1', name: 'Gate A — North', occupancy: 78, capacity: 12000, tempC: 21, status: 'busy' },
  { id: 'z2', name: 'Gate B — East', occupancy: 92, capacity: 9500, tempC: 23, status: 'critical' },
  { id: 'z3', name: 'Gate C — South', occupancy: 45, capacity: 12000, tempC: 20, status: 'calm' },
  { id: 'z4', name: 'Concourse L1', occupancy: 64, capacity: 18000, tempC: 22, status: 'busy' },
  { id: 'z5', name: 'Concourse L2', occupancy: 38, capacity: 15000, tempC: 21, status: 'calm' },
  { id: 'z6', name: 'Fan Plaza', occupancy: 81, capacity: 20000, tempC: 24, status: 'busy' },
];

export interface Concession {
  id: string;
  name: string;
  waitMin: number;
  queue: number;
  category: 'food' | 'drink' | 'retail';
}

export const concessions: Concession[] = [
  { id: 'c1', name: 'Pitchside Grill', waitMin: 4, queue: 12, category: 'food' },
  { id: 'c2', name: 'Global Eats', waitMin: 9, queue: 28, category: 'food' },
  { id: 'c3', name: 'Hydration Station', waitMin: 2, queue: 5, category: 'drink' },
  { id: 'c4', name: 'Trophy Bar', waitMin: 14, queue: 41, category: 'drink' },
  { id: 'c5', name: 'Official Store', waitMin: 11, queue: 33, category: 'retail' },
];

export interface Restroom {
  id: string;
  name: string;
  cleanliness: number; // 0-100
  status: 'ok' | 'attention' | 'cleaning';
}

export const restrooms: Restroom[] = [
  { id: 'r1', name: 'Block 101', cleanliness: 88, status: 'ok' },
  { id: 'r2', name: 'Block 112', cleanliness: 41, status: 'attention' },
  { id: 'r3', name: 'Block 124', cleanliness: 100, status: 'ok' },
  { id: 'r4', name: 'Block 136', cleanliness: 0, status: 'cleaning' },
];

export interface Incident {
  id: string;
  type: 'medical' | 'security' | 'facility' | 'crowd';
  severity: 'low' | 'medium' | 'high';
  location: string;
  reportedAt: string;
  status: 'open' | 'en-route' | 'resolved';
  description: string;
}

export const initialIncidents: Incident[] = [
  {
    id: 'i1',
    type: 'medical',
    severity: 'medium',
    location: 'Block 112, Row F',
    reportedAt: '17:42',
    status: 'en-route',
    description: 'Fan experiencing heat exhaustion. Medics dispatched.',
  },
  {
    id: 'i2',
    type: 'crowd',
    severity: 'high',
    location: 'Gate B — East',
    reportedAt: '17:35',
    status: 'open',
    description: 'Crowd density exceeding safe threshold at entry turnstiles.',
  },
  {
    id: 'i3',
    type: 'facility',
    severity: 'low',
    location: 'Concourse L1, Restroom Block 136',
    reportedAt: '17:20',
    status: 'en-route',
    description: 'Scheduled restroom deep-clean in progress — facility team dispatched.',
  },
  {
    id: 'i4',
    type: 'security',
    severity: 'low',
    location: 'Fan Plaza',
    reportedAt: '16:58',
    status: 'resolved',
    description: 'Unattended bag reported and cleared by K-9 unit.',
  },
];

export interface Volunteer {
  id: string;
  name: string;
  zone: string;
  status: 'active' | 'break' | 'offline';
  role: string;
}

export const volunteers: Volunteer[] = [
  { id: 'v1', name: 'Maria Santos', zone: 'Gate A', status: 'active', role: 'Wayfinder' },
  { id: 'v2', name: 'Liam O’Connor', zone: 'Concourse L1', status: 'active', role: 'Crowd Mgmt' },
  { id: 'v3', name: 'Yuki Tanaka', zone: 'Fan Plaza', status: 'break', role: 'Hospitality' },
  { id: 'v4', name: 'Priya Nair', zone: 'Gate B', status: 'active', role: 'Crowd Mgmt' },
  { id: 'v5', name: 'Diego Romero', zone: 'Block 112', status: 'active', role: 'Medical Assist' },
  { id: 'v6', name: 'Emma Schmidt', zone: 'Concourse L2', status: 'offline', role: 'Wayfinder' },
];

export interface TransitRoute {
  id: string;
  line: string;
  mode: 'metro' | 'bus' | 'shuttle';
  status: 'on-time' | 'delayed' | 'disrupted';
  nextArrival: string;
  load: number; // 0-100
}

export const transitRoutes: TransitRoute[] = [
  { id: 't1', line: 'Metro Line 3', mode: 'metro', status: 'on-time', nextArrival: '4 min', load: 72 },
  { id: 't2', line: 'Express Shuttle', mode: 'shuttle', status: 'delayed', nextArrival: '11 min', load: 88 },
  { id: 't3', line: 'Bus Route 88', mode: 'bus', status: 'on-time', nextArrival: '7 min', load: 55 },
  { id: 't4', line: 'Metro Line 7', mode: 'metro', status: 'disrupted', nextArrival: '—', load: 95 },
];

export interface NewsItem {
  id: string;
  category: 'match' | 'stadium' | 'transit' | 'fan';
  text: string;
  time: string;
}

export const newsFeed: NewsItem[] = [
  { id: 'n1', category: 'match', text: 'GOAL! USA extends lead to 2-1 over Brazil in the 64th minute.', time: '17:48' },
  { id: 'n2', category: 'stadium', text: 'Gate B occupancy at 92% — consider routing to Gate C.', time: '17:45' },
  { id: 'n3', category: 'transit', text: 'Metro Line 7 experiencing signal delays. Shuttle service enhanced.', time: '17:30' },
  { id: 'n4', category: 'fan', text: 'Halftime show featuring local artists starts at 18:15 on the main pitch screen.', time: '17:10' },
  { id: 'n5', category: 'stadium', text: 'Trophy Bar queue exceeds 40 — additional vendor opened.', time: '16:55' },
];
