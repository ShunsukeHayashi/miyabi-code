"""
Miyabi Context7 Cloud - Resolver Lambda
Resolves library names to IDs with multi-tenant support
"""

import json
import os
import boto3
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis

# Environment
STAGE = os.environ.get('STAGE', 'dev')
AURORA_SECRET_ARN = os.environ['AURORA_SECRET_ARN']
AURORA_ENDPOINT = os.environ['AURORA_ENDPOINT']
AURORA_DATABASE = os.environ['AURORA_DATABASE']
METADATA_TABLE = os.environ['METADATA_TABLE']
REDIS_ENDPOINT = os.environ.get('REDIS_ENDPOINT', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))

# Clients
secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
metadata_table = dynamodb.Table(METADATA_TABLE)

# Redis connection (lazy)
_redis = None

def get_redis():
    global _redis
    if _redis is None:
        _redis = redis.Redis(host=REDIS_ENDPOINT, port=REDIS_PORT, decode_responses=True)
    return _redis

def get_db_credentials():
    """Get Aurora credentials from Secrets Manager"""
    response = secrets_client.get_secret_value(SecretId=AURORA_SECRET_ARN)
    return json.loads(response['SecretString'])

def get_db_connection():
    """Get PostgreSQL connection"""
    creds = get_db_credentials()
    return psycopg2.connect(
        host=AURORA_ENDPOINT,
        database=AURORA_DATABASE,
        user=creds['username'],
        password=creds['password'],
        cursor_factory=RealDictCursor
    )

def search_libraries(query: str, tenant_id: str, limit: int = 10) -> List[Dict]:
    """Search for libraries matching the query"""
    cache_key = f"search:{tenant_id}:{query}"
    
    # Check cache
    r = get_redis()
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Full-text search with tenant filter
            cur.execute("""
                SELECT 
                    library_id,
                    title,
                    description,
                    COUNT(*) as chunk_count,
                    ts_rank(search_vector, plainto_tsquery('english', %s)) as rank
                FROM document_chunks
                WHERE tenant_id = %s
                  AND (
                    search_vector @@ plainto_tsquery('english', %s)
                    OR library_id ILIKE %s
                    OR title ILIKE %s
                  )
                GROUP BY library_id, title, description, search_vector
                ORDER BY rank DESC, chunk_count DESC
                LIMIT %s
            """, (query, tenant_id, query, f'%{query}%', f'%{query}%', limit))
            
            results = cur.fetchall()
            
            libraries = [
                {
                    'id': row['library_id'],
                    'name': row['title'],
                    'description': row['description'] or '',
                    'chunks': row['chunk_count'],
                    'score': float(row['rank']) if row['rank'] else 0
                }
                for row in results
            ]
            
            # Cache for 5 minutes
            r.setex(cache_key, 300, json.dumps(libraries))
            
            return libraries
    finally:
        conn.close()

def get_tenant_libraries(tenant_id: str) -> List[Dict]:
    """Get all libraries for a tenant"""
    cache_key = f"libraries:{tenant_id}"
    
    r = get_redis()
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Query DynamoDB for library metadata
    response = metadata_table.query(
        IndexName='GSI1',
        KeyConditionExpression='GSI1PK = :pk',
        ExpressionAttributeValues={
            ':pk': f'TENANT#{tenant_id}'
        }
    )
    
    libraries = [
        {
            'id': item['LibraryId'],
            'name': item.get('Title', item['LibraryId']),
            'description': item.get('Description', ''),
            'chunks': item.get('ChunkCount', 0),
            'lastUpdated': item.get('UpdatedAt', '')
        }
        for item in response.get('Items', [])
        if item['SK'].startswith('LIBRARY#')
    ]
    
    # Cache for 5 minutes
    r.setex(cache_key, 300, json.dumps(libraries))
    
    return libraries

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for resolve-library-id"""
    try:
        # Parse request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        # Get tenant from authorizer context
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        tenant_id = authorizer_context.get('tenantId', 'default')
        
        library_name = body.get('libraryName', '')
        
        if not library_name:
            # Return all libraries for tenant
            libraries = get_tenant_libraries(tenant_id)
        else:
            # Search for matching libraries
            libraries = search_libraries(library_name, tenant_id)
        
        response_body = {
            'query': library_name,
            'libraries': libraries,
            'tenant': tenant_id
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
