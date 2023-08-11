interface Env {
    VOICE_TOKEN: string;
}

const handler: ExportedHandler<Env> = {
    async fetch(request, context) {
        console.log(context.VOICE_TOKEN);
        return new Response('Hello World 2!');
    }
}
export default handler;