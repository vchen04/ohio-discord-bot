/**
 * Creates an array of the non-null arguments.
 * @param {(T | null)[]} args the arguments to get non-null entries from
 * @returns {T[]} an array of the non-null arguments
 */
export function nonNullArgs<T>(...args: (T | null)[]): T[] {
    return args.filter(arg => arg != null);
}
