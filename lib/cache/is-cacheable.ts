export function isCacheable(value: any) {
  return (
    value !== null &&
    value != undefined &&
    (!Array.isArray(value) || value.length > 0)
  );
}
