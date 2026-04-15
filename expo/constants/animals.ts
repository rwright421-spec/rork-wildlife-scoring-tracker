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

export const NO_EMOJI = "";

export const EMOJI_NAME_MAP: Record<string, string> = {
  "🦌": "Deer",
  "🐺": "Coyote",
  "🐻": "Bear",
  "🐈": "Cougar",
  "🐰": "Rabbit",
  "🦊": "Fox",
  "🐿️": "Squirrel",
  "🦅": "Eagle",
  "🦃": "Turkey",
  "🐍": "Snake",
  "🦎": "Lizard",
  "🐢": "Turtle",
  "🐸": "Frog",
  "🦉": "Owl",
  "🐗": "Boar",
  "🦨": "Skunk",
  "🦝": "Raccoon",
  "🐁": "Mouse",
  "🦫": "Beaver",
  "🐎": "Horse",
  "🦬": "Bison",
  "🐄": "Cow",
  "🐑": "Sheep",
  "🐐": "Goat",
  "🐘": "Elephant",
  "🦏": "Rhino",
  "🦒": "Giraffe",
  "🐆": "Leopard",
  "🐊": "Crocodile",
  "🦈": "Shark",
  "🐋": "Whale",
  "🐧": "Penguin",
  "🦩": "Flamingo",
  "🦜": "Parrot",
  "🐓": "Rooster",
  "🦆": "Duck",
  "🐇": "Hare",
  "🐛": "Caterpillar",
  "🦋": "Butterfly",
  "🐝": "Bee",
  "🐞": "Ladybug",
  "🦂": "Scorpion",
  "🐠": "Tropical Fish",
  "🐟": "Fish",
};

export function getNameForEmoji(emoji: string): string {
  return EMOJI_NAME_MAP[emoji] ?? "";
}
