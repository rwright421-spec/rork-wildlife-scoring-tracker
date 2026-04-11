export interface Animal {
  id: string;
  name: string;
  emoji: string;
  points: number;
  isDefault: boolean;
}

export interface PlayerSightings {
  [animalId: string]: number;
}

export interface TripPlayer {
  playerId: string;
  sightings: PlayerSightings;
  totalPoints: number;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  players: TripPlayer[];
  winnerId: string | null;
  animals: Animal[];
}

export interface PlayerHairMeta {
  style?: string;
  color?: string;
  colorHex?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  hairMeta?: PlayerHairMeta;
}

export interface GameState {
  players: Player[];
  animals: Animal[];
  trips: Trip[];
}
