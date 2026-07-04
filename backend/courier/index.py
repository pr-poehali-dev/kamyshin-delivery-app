import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

STATUS_FLOW = ['new', 'accepted', 'cooking', 'on_way', 'delivered']


def handler(event: dict, context) -> dict:
    '''Курьерский модуль: список заказов, принятие заказа и смена статуса доставки.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            scope = params.get('scope', 'available')
            courier_id = params.get('courier_id')

            if scope == 'available':
                cur.execute(
                    "SELECT * FROM orders WHERE status = 'new' ORDER BY created_at ASC"
                )
            elif scope == 'mine' and courier_id:
                cid = int(courier_id)
                cur.execute(
                    "SELECT * FROM orders WHERE courier_id = %s AND status != 'delivered' ORDER BY updated_at DESC",
                    (cid,),
                )
            else:
                cur.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50")

            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'orders': rows}, default=str)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')
            order_id = int(body.get('order_id'))

            if action == 'accept':
                courier_id = int(body.get('courier_id'))
                cur.execute(
                    "UPDATE orders SET status = 'accepted', courier_id = %s, updated_at = CURRENT_TIMESTAMP "
                    "WHERE id = %s AND status = 'new' RETURNING *",
                    (courier_id, order_id),
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Заказ уже занят'})}
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': row}, default=str)}

            if action == 'next_status':
                cur.execute("SELECT status FROM orders WHERE id = %s", (order_id,))
                r = cur.fetchone()
                if not r:
                    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
                current = r['status']
                idx = STATUS_FLOW.index(current) if current in STATUS_FLOW else 0
                new_status = STATUS_FLOW[min(idx + 1, len(STATUS_FLOW) - 1)]
                cur.execute(
                    "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (new_status, order_id),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': cur.fetchone()}, default=str)}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}

        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        cur.close()
        conn.close()
