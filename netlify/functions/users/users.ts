import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const origin = event.headers.origin;
        const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
        const params = JSON.parse(event.body);
        const dbKey = params.shareKey;
        const password = params.password;

        if (!dbKey || !password) {
            console.log(params);
            throw new Error('No share key provided');
        }
        try {
            const exist = await axios.head(baseurl + dbKey);
            return {
                statusCode: 200,
                body: JSON.stringify({data: "OK"})
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
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin ? origin : 'https://cameras.immersiveidea.com',
                'Access-Control-Allow-Credentials': 'true'
            },
            statusCode: 200,
            body: JSON.stringify({data: data}, null, 2)
        }
    } catch (err) {
        console.log(err);
        const response = {err: err};
        return {
            statusCode: 500,
            body: JSON.stringify(response)
        }
    }
}