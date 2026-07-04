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

ADMIN_PHONES = {'89061678157', '79061678157'}


def is_admin(event: dict) -> bool:
    headers = event.get('headers') or {}
    phone = headers.get('X-User-Phone') or headers.get('x-user-phone') or ''
    return phone.strip() in ADMIN_PHONES


def handler(event: dict, context) -> dict:
    '''Админ-панель: статистика выручки, все заказы города, управление курьерами и точками/меню.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if not is_admin(event):
        return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Доступ только для администратора'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            resource = params.get('resource', 'stats')

            if resource == 'stats':
                cur.execute("SELECT COUNT(*) AS cnt, COALESCE(SUM(total_price),0) AS revenue FROM orders")
                totals = cur.fetchone()
                cur.execute("SELECT COUNT(*) AS active FROM orders WHERE status != 'delivered'")
                active = cur.fetchone()['active']
                cur.execute("SELECT COUNT(*) AS online FROM couriers WHERE is_online = TRUE")
                online = cur.fetchone()['online']
                cnt = totals['cnt'] or 0
                revenue = int(totals['revenue'] or 0)
                avg_check = int(revenue / cnt) if cnt else 0
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'orders_count': cnt, 'revenue': revenue, 'avg_check': avg_check,
                    'active_orders': active, 'couriers_online': online,
                }, default=str)}

            if resource == 'orders':
                status = params.get('status')
                if status and status != 'all':
                    cur.execute("SELECT * FROM orders WHERE status = %s ORDER BY created_at DESC LIMIT 100", (status,))
                else:
                    cur.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100")
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'orders': cur.fetchall()}, default=str)}

            if resource == 'couriers':
                cur.execute("SELECT c.*, (SELECT COUNT(*) FROM orders o WHERE o.courier_id = c.id) AS orders_total FROM couriers c ORDER BY c.id")
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'couriers': cur.fetchall()}, default=str)}

            if resource == 'places':
                cur.execute("SELECT p.*, (SELECT COUNT(*) FROM products pr WHERE pr.place_id = p.id) AS products_count FROM places p ORDER BY p.id")
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'places': cur.fetchall()}, default=str)}

            if resource == 'products' and params.get('place_id'):
                cur.execute("SELECT * FROM products WHERE place_id = %s ORDER BY id", (int(params['place_id']),))
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'products': cur.fetchall()}, default=str)}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный ресурс'})}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')

            if action == 'set_order_status':
                cur.execute(
                    "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (body['status'], int(body['order_id'])),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': cur.fetchone()}, default=str)}

            if action == 'add_courier':
                cur.execute(
                    "INSERT INTO couriers (name, phone, has_child_seat, is_online) VALUES (%s, %s, %s, TRUE) RETURNING *",
                    (body['name'], body.get('phone'), bool(body.get('has_child_seat', False))),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'courier': cur.fetchone()}, default=str)}

            if action == 'toggle_courier':
                cur.execute(
                    "UPDATE couriers SET is_online = NOT is_online WHERE id = %s RETURNING *",
                    (int(body['courier_id']),),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'courier': cur.fetchone()}, default=str)}

            if action == 'add_place':
                cur.execute(
                    "INSERT INTO places (name, section, address, rating, delivery_minutes) "
                    "VALUES (%s, %s, %s, %s, %s) RETURNING *",
                    (body['name'], body.get('section', 'food'), body['address'],
                     body.get('rating', 4.8), int(body.get('delivery_minutes', 35))),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'place': cur.fetchone()}, default=str)}

            if action == 'add_product':
                cur.execute(
                    "INSERT INTO products (place_id, name, category, price, weight, emoji) "
                    "VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                    (int(body['place_id']), body['name'], body.get('category'),
                     int(body['price']), body.get('weight'), body.get('emoji', '🍽️')),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'product': cur.fetchone()}, default=str)}

            if action == 'update_product_price':
                cur.execute(
                    "UPDATE products SET price = %s WHERE id = %s RETURNING *",
                    (int(body['price']), int(body['product_id'])),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'product': cur.fetchone()}, default=str)}

            if action == 'toggle_place':
                cur.execute(
                    "UPDATE places SET is_active = NOT is_active WHERE id = %s RETURNING *",
                    (int(body['place_id']),),
                )
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'place': cur.fetchone()}, default=str)}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}

        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        cur.close()
        conn.close()
