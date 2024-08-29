export type AccountSettings = {
    privateEnabled: boolean,
    cloudEnabled: boolean,
    maxDbCount: number,
    maxDocCount: number,
}
export type GlobalSettings = {
    user: AccountSettings,
    free?: AccountSettings,
    pro?: AccountSettings,
    custom?: AccountSettings
}
export const settings: GlobalSettings = {
    user: {
        privateEnabled: false,
        cloudEnabled: false,
        maxDbCount: 6,
        maxDocCount: 30,
    }
}