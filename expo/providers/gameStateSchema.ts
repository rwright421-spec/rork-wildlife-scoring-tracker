import { z } from "zod";

const AnimalSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  points: z.number(),
  isDefault: z.boolean(),
});

const PlayerSightingsSchema = z.record(z.string(), z.number());

const TripPlayerSchema = z.object({
  playerId: z.string(),
  sightings: PlayerSightingsSchema,
  totalPoints: z.number(),
});

const TripSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  players: z.array(TripPlayerSchema),
  winnerId: z.string().nullable(),
  animals: z.array(AnimalSchema),
});

const PlayerHairMetaSchema = z.object({
  style: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
});

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  hairMeta: PlayerHairMetaSchema.optional(),
});

export const GameStateSchema = z.object({
  players: z.array(PlayerSchema),
  animals: z.array(AnimalSchema),
  trips: z.array(TripSchema),
});
