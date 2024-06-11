import axios from "axios";
import log from "loglevel";

export async function checkDb(localName: string, remoteDbName: string, password: string) {
    const logger = log.getLogger('checkDb');
    const dbs = await axios.get(import.meta.env.VITE_SYNCDB_ENDPOINT + 'list');
    logger.debug(dbs.data);
    if (dbs.data.indexOf(remoteDbName) == -1) {
        logger.warn('sync target missing attempting to create');
        const newdb = await axios.post(import.meta.env.VITE_CREATE_ENDPOINT,
            {
                "_id": "org.couchdb.user:" + localName,
                "name": localName,
                "password": password,
                "roles": ["readers"],
                "type": "user"
            }
        );
        if (newdb.status == 201) {
            logger.info('sync target created');
        } else {
            logger.warn('sync target not created', newdb);
            return false;
        }
    }
    return true;
}