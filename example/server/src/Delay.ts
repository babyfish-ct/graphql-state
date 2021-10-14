export async function delay(millis: number): Promise<any> {
    return new Promise<any>(resolve => {
        setTimeout(resolve, millis);
    });
}