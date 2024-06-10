import {createSHA256, pbkdf2} from "hash-wasm";
import aes from 'js-crypto-aes';
import {decode, encode} from "uint8-to-b64";

export class Encryption {
    private _key: Uint8Array | null = null;
    private _salt: Uint8Array | null = null;
    private _iv: Uint8Array | null = null;
    private _encrypted: Uint8Array | null = null;

    constructor() {

    }

    private _ready: boolean = false;

    public get ready() {
        return this._ready;
    }

    public async setPassword(password: string, saltString?: string) {
        if (saltString) {
            this._salt = decode(saltString);
        } else {
            const salt = new Uint8Array(16);
            window.crypto.getRandomValues(salt);
            this._salt = salt;
        }
        this._key = await pbkdf2({
            password: password,
            salt: this._salt,
            iterations: 10000,
            hashLength: 32,
            hashFunction: createSHA256(),
            outputType: "binary"
        });
        this._ready = true;
    }

    public async encryptObject(obj: any) {
        return await this.encrypt(JSON.stringify(obj));
    }

    public async decryptToObject(msg: string, iv: string) {
        return JSON.parse(await this.decrypt(msg, iv));
    }

    public async encrypt(msg: string) {
        if (!this._key) {
            throw new Error('No password key set');
        }

        const iv = new Uint8Array(12);
        window.crypto.getRandomValues(iv);
        this._iv = iv;

        const arr: Uint8Array = await aes.encrypt(
            new TextEncoder().encode(msg), this._key, {name: 'AES-GCM', iv: this._iv, tagLength: 16});
        this._encrypted = arr;
        return this._encrypted;
    }

    public async decrypt(msg: string, iv: string) {
        if (!this._key) {
            throw new Error('No key set');
        }
        this._iv = decode(iv);
        const msgArray = decode(msg);
        //Uint8Array.from(atob(decode(msg)), c => c.charCodeAt(0));
        const output = await aes.decrypt(msgArray, this._key, {name: 'AES-GCM', iv: this._iv, tagLength: 16});
        return new TextDecoder().decode(output);
    }

    public getEncrypted() {
        if (
            !this._encrypted ||
            !this._iv ||
            !this._salt
        ) {
            return null;
        } else {
            return {
                encrypted: encode(this._encrypted),
                salt: encode(this._salt),
                iv: encode(this._iv)
            }
        }

    }
}