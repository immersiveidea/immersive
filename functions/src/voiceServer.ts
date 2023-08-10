export const onRequest: PagesFunction = async (context) => {
    const response = new Response('Hello World!');
    return response;
}