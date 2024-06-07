export function getPath(): string {
    const path = window.location.pathname.split('/');
    if (path.length == 3 && path[1]) {
        return path[2];
    } else {
        return null;
    }
}

export function getParameter(name: string) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
}

export function viewOnly(): boolean {
    return getParameter('viewonly') == 'true';
}