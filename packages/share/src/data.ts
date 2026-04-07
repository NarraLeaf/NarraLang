
export function mapToObject<T>(map: Map<string, T>): Record<string, T> {
    return Object.fromEntries(map.entries());
}
