import {Context} from "@netlify/functions";
import axios from 'axios';

export default async (req: Request, context: Context) => {
    try {
        console.log(req.method);
        const origin = req.headers['origin'];
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
        }
        const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
        console.log(baseurl);
        const params = JSON.parse(await req.text());
        console.log(params);

        const dbKey = params.username;
        const password = params.password;

        if (!dbKey || !password) {
            console.log(params);
            throw new Error('No share key provided');
        }
        try {
            const exist = await axios.head(baseurl + dbKey);
            if (exist) {
                return
                new Response('OK');
            }

        } catch (err) {
            console.log(err);
        }
        const auth = 'admin:stM8Lnm@Cuf-tWZHv';
        const authToken = Buffer.from(auth).toString('base64');

        const response = await axios.put(
            baseurl + dbKey,
            {},
            {
                headers: {
                    'Authorization': 'Basic ' + authToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        const data = await response.data;
        if (response.status == 201) {
            const response2 = await axios.put(
                baseurl + '_users/org.couchdb.user:' + dbKey,
                {_id: 'org.couchdb.user:' + dbKey, name: dbKey, password: password, roles: [], type: 'user'},
                {
                    headers: {
                        'Authorization': 'Basic ' + authToken,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
            data.auth = response2.data;
            const authresponse = await axios.put(
                baseurl + dbKey + '/_security',
                {admins: {names: [], roles: []}, members: {names: [dbKey], roles: []}},
                {
                    headers: {
                        'Authorization': 'Basic ' + authToken,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
        }
        return
        new Response(
            new Blob(),
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
        return
        new Response(JSON.stringify(response),
            {status: 500}
        )
    }
}