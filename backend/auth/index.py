import json
import os
import random
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

TEST_PHONES = {'89061678157', '79061678157'}
TEST_CODE = '0000'


def send_sms(phone: str, code: str):
    api_id = os.environ.get('SMSRU_API_ID')
    text = urllib.parse.quote(f'Ваш код для входа в Камышин Экспресс: {code}')
    url = f'https://sms.ru/sms/send?api_id={api_id}&to={phone}&msg={text}&json=1'
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {'error': str(e)}


def handler(event: dict, context) -> dict:
    '''Авторизация по номеру телефона через SMS-код: отправка кода и его проверка.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    phone = (body.get('phone') or '').strip()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if action == 'send_code':
            if not phone or len(phone) < 10:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Некорректный номер телефона'})}

            if phone in TEST_PHONES:
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'sent': True, 'test_mode': True})}

            code = str(random.randint(1000, 9999))
            expires = datetime.utcnow() + timedelta(minutes=5)
            cur.execute(
                "INSERT INTO auth_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
                (phone, code, expires),
            )
            send_sms(phone, code)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'sent': True})}

        if action == 'verify_code':
            code = (body.get('code') or '').strip()

            if phone in TEST_PHONES:
                if code != TEST_CODE:
                    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный код'})}
                cur.execute("SELECT * FROM users WHERE phone = %s", (phone,))
                user = cur.fetchone()
                if not user:
                    cur.execute("INSERT INTO users (phone) VALUES (%s) RETURNING *", (phone,))
                    user = cur.fetchone()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user}, default=str)}

            cur.execute(
                "SELECT * FROM auth_codes WHERE phone = %s AND code = %s AND is_used = FALSE "
                "AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1",
                (phone, code),
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный или истёкший код'})}

            cur.execute("UPDATE auth_codes SET is_used = TRUE WHERE id = %s", (row['id'],))

            cur.execute("SELECT * FROM users WHERE phone = %s", (phone,))
            user = cur.fetchone()
            if not user:
                cur.execute(
                    "INSERT INTO users (phone) VALUES (%s) RETURNING *", (phone,)
                )
                user = cur.fetchone()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user}, default=str)}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}
    finally:
        cur.close()
        conn.close()