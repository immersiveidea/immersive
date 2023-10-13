import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const baseurl = 'https://syncdb-service-d3f974de56ef.herokuapp.com/';
        const more = 'mike/_all_docs?include_docs=true'
        const dbKey = event.queryStringParameters.shareKey;
        if (!dbKey) {
            throw new Error('No share key provided');
        }
        const exist = await axios.head(baseurl + dbKey);
        if (exist.status == 200) {
            throw new Error('Share key already exists');
        }
        const response = await axios.put(
            baseurl + dbKey,
            null,
            {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}});
        const data = await response.data;
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://cameras.immersiveidea.com',
                'Access-Control-Allow-Credentials': 'true'
            },
            statusCode: 200,
            body: data
        }
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: err
        }
    }
}