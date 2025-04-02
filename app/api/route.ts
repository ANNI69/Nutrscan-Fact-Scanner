import { getProducts } from "@/(app)/actions";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const result = await getProducts(parseInt(page), parseInt(limit));

    if (!result) {
      return Response.json([], {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    return Response.json(result, {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
