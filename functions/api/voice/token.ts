interface Env {
    VOICE_TOKEN: string;
}

const handler: ExportedHandler<Env> = {
    async fetch(request, env) {
        console.log(env);
        console.log(request);

        async function gatherResponse(response) {
            const {headers} = response;
            const contentType = headers.get("content-type") || "";
            console.log(contentType);
            if (contentType.includes("application/json")) {
                return JSON.stringify(await response.json());
            }
            return response.text();
        }

        const init = {
            method: 'POST',
            body: JSON.stringify({expires_in: 3600}),
            headers: {authorization: env.VOICE_TOKEN}
        };
        const response = await fetch('https://api.assemblyai.com/v2/realtime/token', init);
        console.log('here');
        const results = await gatherResponse(response);
        console.log(results);
        return new Response(results, {headers: "content-type: application/json", status: 200});
    }
}
export default handler;
/*
export const onRequest: PagesFunction<Env> = async (context) => {
    try {
        const res = await fetch('https://api.assemblyai.com/v2/realtime/token',
            {method: 'POST', body: JSON.stringify({expires_in: 3600}), headers: {authorization: context.env.VOICE_TOKEN}});
        const response = await res.json();
        return Response.json(response);
    } catch (error) {
        return new Response(error.message, {status: 500});
    }
}*/
