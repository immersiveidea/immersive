export function getPath(): string {
    const path = window.location.pathname.split('/');
    if (path.length == 3 && path[1]) {
        return path[2];
    } else {
        return null;
    }
}