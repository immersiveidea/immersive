import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const apiKey = event.headers['Api-Key'];
        const query = event.body;
        const response = await axios.post('https://api.newrelic.com/graphql', // use account token to get a temp user token
            query,
            {headers: {'Api-Key': apiKey, 'Content-Type': 'application/json'}});

        const data = await response.data;
        return {
            headers: {'Content-Type': 'application/json'},
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
};