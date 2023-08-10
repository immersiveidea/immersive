interface Env {
    VOICE_TOKEN: string;
}

addEventListener('fetch', event => {
    event.respondWith(eventHandler(event));
});

async function eventHandler(event) {
    try {
        const res = await fetch('https://api.assemblyai.com/v2/realtime/token',
            {
                method: 'POST',
                body: JSON.stringify({expires_in: 3600}),
                headers: {authorization: event.context.env.VOICE_TOKEN}
            });
        const response = await res.json();
        return new Response(JSON.stringify(response), {status: 200});
    } catch (error) {
        return new Response(error.message, {status: 500});
    }
}
