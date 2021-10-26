export function format(date: Date) {
    return `${
        date.getFullYear()
    }-${
        date.getMonth()
    }-${
        date.getDay()
    } ${
        date.getHours()
    }:${
        date.getMinutes()
    }:${
        date.getSeconds()
    }`;
}