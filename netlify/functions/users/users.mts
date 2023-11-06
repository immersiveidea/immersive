import {Context} from "@netlify/functions";
import axios from 'axios';

const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
const auth = 'admin:stM8Lnm@Cuf-tWZHv';
const authToken = Buffer.from(auth).toString('base64');

function buildOptions(req: Request) {
    if (req.method == 'OPTIONS') {
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
    password: string
}

async function checkIfDbExists(params: Params) {
    console.log("Checking if DB exists");

    if (!params.username || !params.password) {
        throw new Error('No share key provided');
    }
    try {
        console.log('Checking for DB');
        const exist = await axios.head(baseurl + params.username);
        if (exist) {
            return true;
        }
    } catch (err) {
        console.log("DB not Found");
        console.log(err);
    }
    return false;
}

async function createDB(params: Params) {
    console.log("Creating DB");
    const response = await axios.put(
        baseurl + params.username,
        {},
        {
            headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    const data = await response.data;
    console.log(JSON.stringify(response));
    return data;
}

async function createUser(params: Params) {
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
        baseurl + params.username + '/_security',
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
    const origin = req.headers['origin'];
    const options = buildOptions(req);
    if (options) {
        return options;
    }

    try {
        const params = JSON.parse(await req.text());
        console.log(params);
        const exists = await checkIfDbExists(params);
        if (exists) {
            return new Response("OK");
        }
        const createDbResponse = await createDB(params);
        if (createDbResponse.status != 201) {
            throw new Error('Could not create DB');
        }
        const createUserResponse = await createUser(params);
        if (createUserResponse.status != 201) {
            throw new Error('Could not create User');
        }
        const authorizeUserResponse = await authorizeUser(params);
        if (authorizeUserResponse.status != 200) {
            throw new Error('could not authorize user');
        }

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