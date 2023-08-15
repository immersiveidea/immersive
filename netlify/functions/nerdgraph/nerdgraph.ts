import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        console.log(JSON.stringify(event.headers));
        const apiKey = event.headers['Api-Key'];
        console.log(apiKey.substring(-5));
        const query = event.body;
        console.log(query);
        const response = await axios.post('https://api.newrelic.com/graphql', // use account token to get a temp user token
            query,
            {headers: {'Api-Key': apiKey, 'Content-Type': 'application/json'}});

        const data = await response.data;
        console.log(data)
        return {
            headers: {'Content-Type': 'application/json'},
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
};