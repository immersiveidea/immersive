/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SYNCDB_ENDPOINT: string,
    readonly VITE_SYNCDB_USER: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}