import {Context} from "@netlify/functions";
import axios from 'axios';

const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
const auth = 'admin:stM8Lnm@Cuf-tWZHv';
const authToken = Buffer.from(auth).toString('base64');

function buildOptions(req: Request) {
    if (req.method == 'OPTIONS') {
        const origin = req.headers['origin'];
        return new Response(
            new Blob(),
            {
                headers: {
                    'Allow': 'POST',
                    'Max-Age': '86400',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Origin': origin ? origin : 'https://cameras.immersiveidea.com',
                    'Access-Control-Allow-Credentials': 'true'
                },
                status: 200
            })
    } else {
        return null;
    }
}

type Params = {
    username: string,
    password: string,
    db: string
}

async function checkDB(auth: string, db: string) {
    try {
        console.log('Checking for DB');
        const exist = await axios.head(baseurl + db,
            {headers: {'Authorization': 'Basic ' + auth}});
        if (exist && exist.status == 200) {
            console.log("DB Found");
            return true;
        }
    } catch (err) {
        console.log("DB not Found");
        //console.log(err);
    }
    return false;
}

enum Access {
    DENIED,
    MISSING,
    ALLOWED,
}

function getUserToken(params: Params) {
    const userAuth = params.username + ':' + params.password;
    return Buffer.from(userAuth).toString('base64');
}

async function checkIfDbExists(params: Params): Promise<Access> {
    console.log("Checking if DB exists");
    if (!params.username || !params.password || !params.db) {
        throw new Error('No share key provided');
    }

    if (await checkDB(getUserToken(params), params.db)) {
        return Access.ALLOWED;
    }
    if (await checkDB(authToken, params.db)) {
        return Access.DENIED;
    }
    return Access.MISSING;

}

async function createDB(params: Params) {
    console.log("Creating DB");

    const response = await axios.put(
        baseurl + params.db,
        {},
        {
            headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    console.log(response.status);
    console.log(response.data);
    return response;
}

async function createUser(params: Params) {
    try {
        console.log("Checking for User");
        const userResponse = await axios.head(
            baseurl + '_users/org.couchdb.user:' + params.username,
            {
                headers: {
                    'Authorization': 'Basic ' + getUserToken(params),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        if (userResponse.status == 200) {
            console.log("User Found");
            return userResponse;
        }
    } catch (err) {
        console.log("User Missing");
    }
    console.log("Creating User");
    const userResponse = await axios.put(
        baseurl + '_users/org.couchdb.user:' + params.username,
        {
            _id: 'org.couchdb.user:' + params.username,
            name: params.username,
            password: params.password, roles: [], type: 'user'
        },
        {
            headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    return userResponse;
}

async function authorizeUser(params: Params) {
    console.log("Authorizing User");
    return await axios.put(
        baseurl + params.db + '/_security',
        {admins: {names: [], roles: []}, members: {names: [params.username], roles: []}},
        {
            headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
}

export default async (req: Request, context: Context) => {
    console.log(req.method);

    const options = buildOptions(req);
    if (options) {
        return options;
    }

    try {
        const params = JSON.parse(await req.text());
        console.log(params);
        const createUserResponse = await createUser(params);
        console.log(createUserResponse.status);
        if (createUserResponse.status != 201 && createUserResponse.status != 200) {
            throw new Error('Could not create User');
        }

        const exists = await checkIfDbExists(params);
        switch (exists) {
            case Access.ALLOWED:
                return new Response("OK");
            case Access.DENIED:
                if (exists == Access.DENIED) {
                    return new Response("Denied", {status: 401});
                }
            case Access.MISSING:
                if (exists == Access.MISSING) {
                    const createDbResponse = await createDB(params);
                    if (createDbResponse.status != 201) {
                        throw new Error('Could not create DB');
                    }
                }

        }


        const authorizeUserResponse = await authorizeUser(params);
        if (authorizeUserResponse.status != 200) {
            throw new Error('could not authorize user');
        }
        const origin = req.headers['origin'];
        return new Response(
            "OK",
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin ? origin : 'https://cameras.immersiveidea.com',
                    'Access-Control-Allow-Credentials': 'true'
                },
                status: 200,
            }
        )
    } catch (err) {
        console.log(err);
        const response = {err: err};
        return new Response(JSON.stringify(response),
            {status: 500}
        )
    }
}