import {DEFAULT_DB_NAME} from "../../util/constants";

export const db = new PouchDB(DEFAULT_DB_NAME);