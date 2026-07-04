import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    '''Каталог для клиента: список активных товаров с точками, фильтр по разделу еда/товары.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        params = event.get('queryStringParameters') or {}
        section = params.get('section', 'food')

        cur.execute(
            "SELECT pr.id, pr.name, pr.category, pr.price, pr.weight, pr.emoji, "
            "pl.name AS place, pl.rating, pl.delivery_minutes, pl.address AS pickup_address, pl.section "
            "FROM products pr JOIN places pl ON pl.id = pr.place_id "
            "WHERE pr.is_active = TRUE AND pl.is_active = TRUE AND pl.section = %s "
            "ORDER BY pl.rating DESC, pr.id",
            (section,),
        )
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'products': cur.fetchall()}, default=str)}
    finally:
        cur.close()
        conn.close()
