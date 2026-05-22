import { Player } from './players';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string; // primary neon/branding color
  secondaryColor: string;
  purse: number; // in Crores, starts at 120.0
  players: Player[];
}

export const initialTeams: Team[] = [
  {
    id: 'team_csk',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    color: '#FFCB05', // Gold Yellow
    secondaryColor: '#005CA5', // Royal Blue
    purse: 120.0,
    players: []
  },
  {
    id: 'team_mi',
    name: 'Mumbai Indians',
    shortName: 'MI',
    color: '#004BA0', // Electric Blue
    secondaryColor: '#D1AB3A', // Gold Accent
    purse: 120.0,
    players: []
  },
  {
    id: 'team_rcb',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    color: '#EC1C24', // Crimson Red
    secondaryColor: '#BCA570', // Gold
    purse: 120.0,
    players: []
  },
  {
    id: 'team_kkr',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    color: '#3A225D', // Purple
    secondaryColor: '#F1C40F', // Gold
    purse: 120.0,
    players: []
  },
  {
    id: 'team_dc',
    name: 'Delhi Capitals',
    shortName: 'DC',
    color: '#0078BC', // Blue
    secondaryColor: '#EF4123', // Red
    purse: 120.0,
    players: []
  },
  {
    id: 'team_rr',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    color: '#E73895', // Hot Pink
    secondaryColor: '#004B87', // Royal Blue
    purse: 120.0,
    players: []
  },
  {
    id: 'team_srh',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    color: '#F26522', // Fiery Orange
    secondaryColor: '#000000', // Matte Black
    purse: 120.0,
    players: []
  },
  {
    id: 'team_pbks',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    color: '#DD1D21', // Punjab Red
    secondaryColor: '#D2D3D5', // Silver
    purse: 120.0,
    players: []
  },
  {
    id: 'team_gt',
    name: 'Gujarat Titans',
    shortName: 'GT',
    color: '#1B2133', // Deep Space Blue
    secondaryColor: '#E5B80B', // Gold
    purse: 120.0,
    players: []
  },
  {
    id: 'team_lsg',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    color: '#0C2340', // Navy Blue
    secondaryColor: '#13A499', // Turquoise/Teal
    purse: 120.0,
    players: []
  }
];
