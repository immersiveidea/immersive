import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const origin = event.headers.origin;
        const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
        const more = 'mike/_all_docs?include_docs=true'
        const dbKey = event.queryStringParameters.shareKey;
        if (!dbKey) {
            throw new Error('No share key provided');
        }
        try {
            const exist = await axios.head(baseurl + dbKey);
            return {
                statusCode: 200,
                body: JSON.stringify({data: exist.data})
            }
        } catch (err) {
            console.log(err);

        }

        const response = await axios.put(
            baseurl + dbKey,
            null,
            {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}});
        const data = await response.data;
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin ? origin : 'https://cameras.immersiveidea.com',
                'Access-Control-Allow-Credentials': 'true'
            },
            statusCode: 200,
            body: JSON.stringify({data: data})
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