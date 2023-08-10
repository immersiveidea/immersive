interface Env {
    VOICE_TOKEN: string;
}
export const onRequest: PagesFunction<Env> = async (context) => {
    try {
        const res = await fetch('https://api.assemblyai.com/v2/realtime/token',
            {
                method: 'POST',
                body: JSON.stringify({expires_in: 3600}),
                headers: {authorization: context.env.VOICE_TOKEN}
            });
        const response = await res.json();
        return new Response(JSON.stringify(response), {status: 200});
    } catch (error) {
        return new Response(error.message, {status: 500});
    }
}
