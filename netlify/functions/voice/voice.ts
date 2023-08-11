import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const response = await axios.post('https://api.assemblyai.com/v2/realtime/token', // use account token to get a temp user token
            {expires_in: 3600}, // can set a TTL timer in seconds.
            {headers: {authorization: process.env.VOICE_TOKEN}});

        const data = await response.data;
        return {
            headers: {'Content-Type': 'application/json'},
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
};