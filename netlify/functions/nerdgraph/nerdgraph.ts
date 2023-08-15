import {Handler, HandlerContext, HandlerEvent} from "@netlify/functions";
import axios from 'axios';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        switch (event.httpMethod) {
            case 'POST':
                const apiKey = event.headers['api-key'];
                const query = event.body;
                const response = await axios.post('https://api.newrelic.com/graphql',
                    query,
                    {headers: {'Api-Key': apiKey, 'Content-Type': 'application/json'}});
                const data = await response.data;
                return {
                    headers: {'Content-Type': 'application/json'},
                    statusCode: 200,
                    body: JSON.stringify(data)
                }
                break;
            case 'OPTIONS':
                const headers = {
                    'Access-Control-Allow-Origin': 'https://cameras.immersiveidea.com',
                    'Access-Control-Allow-Headers': 'content-type, api-key',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
                };
                return {
                    statusCode: 200,
                    headers,
                    body: 'OK'
                }
                break;
            default:
                return {
                    statusCode: 405,
                    body: 'Method Not Allowed'
                }
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
};