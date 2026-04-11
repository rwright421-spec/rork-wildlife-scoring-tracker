import { Animal } from "@/types";

export const DEFAULT_ANIMALS: Animal[] = [
  { id: "deer", name: "Deer", emoji: "🦌", points: 1, isDefault: true },
  { id: "coyote", name: "Coyote", emoji: "🐺", points: 5, isDefault: true },
  { id: "bear", name: "Bear", emoji: "🐻", points: 25, isDefault: true },
  { id: "cougar", name: "Cougar", emoji: "🐈", points: 50, isDefault: true },
];

export const AVATAR_OPTIONS = ["🧑", "👩", "👨", "👧", "👦", "🧒", "👵", "👴", "🐾", "🌲"];

export const ANIMAL_EMOJI_OPTIONS = [
  "🐰", "🦊", "🐿️", "🦅", "🦃", "🐍", "🦎", "🐢", "🐸", "🦉",
  "🐗", "🦨", "🦝", "🐁", "🦫", "🐎", "🦬", "🐄", "🐑", "🐐",
  "🐘", "🦏", "🦒", "🐆", "🐊", "🦈", "🐋", "🐧", "🦩", "🦜",
  "🐓", "🦆", "🐇", "🐛", "🦋", "🐝", "🐞", "🦂", "🐠", "🐟",
];
