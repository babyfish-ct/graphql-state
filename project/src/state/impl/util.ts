export function compare<T, TField extends keyof T>(a: T, b: T, field: TField): number {
    const aField = a[field];
    const bField = b[field];
    if (aField < bField) {
        return -1;
    }
    if (aField > bField) {
        return +1;
    }
    return 0;
}