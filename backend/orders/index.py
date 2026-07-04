import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    '''Заказы пользователя: создание, список, повтор заказа, адреса доставки.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            resource = params.get('resource', 'orders')
            user_id = params.get('user_id')

            if resource == 'addresses' and user_id:
                cur.execute(
                    "SELECT * FROM addresses WHERE user_id = %s ORDER BY is_default DESC, id DESC",
                    (int(user_id),),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'addresses': cur.fetchall()}, default=str)}

            if resource == 'orders' and user_id:
                status_filter = params.get('status')
                if status_filter == 'active':
                    cur.execute(
                        "SELECT * FROM orders WHERE user_id = %s AND status != 'delivered' ORDER BY created_at DESC",
                        (int(user_id),),
                    )
                elif status_filter == 'completed':
                    cur.execute(
                        "SELECT * FROM orders WHERE user_id = %s AND status = 'delivered' ORDER BY created_at DESC",
                        (int(user_id),),
                    )
                else:
                    cur.execute(
                        "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC",
                        (int(user_id),),
                    )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'orders': cur.fetchall()}, default=str)}

            if resource == 'order' and params.get('order_id'):
                cur.execute("SELECT * FROM orders WHERE id = %s", (int(params.get('order_id')),))
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': cur.fetchone()}, default=str)}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Не указаны параметры'})}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')

            if action == 'create_address':
                cur.execute(
                    "INSERT INTO addresses (user_id, district, address, comment, is_default, lat, lon) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
                    (
                        int(body['user_id']), body['district'], body['address'],
                        body.get('comment'), bool(body.get('is_default', False)),
                        body.get('lat'), body.get('lon'),
                    ),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'address': cur.fetchone()}, default=str)}

            if action == 'create_order':
                cur.execute(
                    "INSERT INTO orders (customer_name, customer_phone, section, place, pickup_address, "
                    "delivery_address, district, items, total_price, payment_method, comment, user_id, eta_minutes) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
                    (
                        body['customer_name'], body.get('customer_phone'), body.get('section', 'food'),
                        body['place'], body['pickup_address'], body['delivery_address'], body['district'],
                        json.dumps(body['items']), int(body['total_price']), body.get('payment_method', 'cash'),
                        body.get('comment'), body.get('user_id'), int(body.get('eta_minutes', 40)),
                    ),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': cur.fetchone()}, default=str)}

            if action == 'repeat_order':
                order_id = int(body['order_id'])
                cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
                src = cur.fetchone()
                if not src:
                    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Заказ не найден'})}
                cur.execute(
                    "INSERT INTO orders (customer_name, customer_phone, section, place, pickup_address, "
                    "delivery_address, district, items, total_price, payment_method, comment, user_id, eta_minutes) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
                    (
                        src['customer_name'], src['customer_phone'], src['section'], src['place'],
                        src['pickup_address'], src['delivery_address'], src['district'],
                        json.dumps(src['items']), src['total_price'], src['payment_method'],
                        src['comment'], src['user_id'], src['eta_minutes'],
                    ),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': cur.fetchone()}, default=str)}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}

        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        cur.close()
        conn.close()
