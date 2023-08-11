interface Env {
    VOICE_TOKEN: string;
}
export const onRequest: PagesFunction<Env> = async (context) => {
    try {
        console.log('start');

        async function gatherResponse(response: Response) {
            const {headers} = response;
            const contentType = headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return JSON.stringify(await response.json());
            } else if (contentType.includes('application/text')) {
                return await response.text();
            } else if (contentType.includes('text/html')) {
                return await response.text();
            } else {
                return await response.text();
            }
        }

        const res = await fetch('https://api.assemblyai.com/v2/realtime/token',
            {
                method: 'POST',
                body: JSON.stringify({expires_in: 3600}),
                headers: {authorization: context.env.VOICE_TOKEN}
            });
        const results = await gatherResponse(res);

        return new Response(results, {status: 200});
    } catch (error) {
        return new Response(error.message, {status: 500});
    }
}
