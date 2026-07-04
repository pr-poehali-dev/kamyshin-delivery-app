import json
import os

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    '''Отдаёт публичный ключ Яндекс.Карт фронтенду (ключ ограничен по домену на стороне Яндекса).'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({'yandex_maps_key': os.environ.get('YANDEX_MAPS_API_KEY', '')}),
    }
