// Wildlife Spotter - Native Intent
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  console.log("[Wildlife Spotter] redirectSystemPath", path, initial);
  if (initial) {
    return "/";
  }
  return path;
}
