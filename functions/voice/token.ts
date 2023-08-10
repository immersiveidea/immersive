import axios from 'axios';

interface Env {
    VOICE_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    try {
        const response = await axios.post('https://api.assemblyai.com/v2/realtime/token', // use account token to get a temp user token
            {expires_in: 3600}, // can set a TTL timer in seconds.
            {headers: {authorization: context.env.VOICE_TOKEN}});
        const {data} = response;
        return new Response(JSON.stringify(data), {status: 200});
    } catch (error) {
        return new Response(error.message, {status: 500});
    }
}
