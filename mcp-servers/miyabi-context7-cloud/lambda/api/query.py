"""
Miyabi Context7 Cloud - Query Lambda
Semantic search for documentation with multi-tenant support
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
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb')
metadata_table = dynamodb.Table(METADATA_TABLE)

# Redis connection (lazy)
_redis = None
_db_creds = None

def get_redis():
    global _redis
    if _redis is None:
        _redis = redis.Redis(host=REDIS_ENDPOINT, port=REDIS_PORT, decode_responses=True)
    return _redis

def get_db_credentials():
    global _db_creds
    if _db_creds is None:
        response = secrets_client.get_secret_value(SecretId=AURORA_SECRET_ARN)
        _db_creds = json.loads(response['SecretString'])
    return _db_creds

def get_db_connection():
    creds = get_db_credentials()
    return psycopg2.connect(
        host=AURORA_ENDPOINT,
        database=AURORA_DATABASE,
        user=creds['username'],
        password=creds['password'],
        cursor_factory=RealDictCursor
    )

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using Bedrock Titan Embeddings V2"""
    response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            'inputText': text[:8000],
            'dimensions': 1024,
            'normalize': True
        })
    )
    result = json.loads(response['body'].read())
    return result['embedding']

def semantic_search(
    library_id: str,
    topic: Optional[str],
    tenant_id: str,
    limit: int = 50
) -> List[Dict]:
    """Perform semantic search using pgvector"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if topic:
                # Generate embedding for topic
                query_embedding = generate_embedding(topic)
                
                # Vector similarity search
                cur.execute("""
                    SELECT 
                        chunk_id,
                        chunk_index,
                        content,
                        source_file,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM document_chunks
                    WHERE tenant_id = %s
                      AND library_id = %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                """, (query_embedding, tenant_id, library_id, query_embedding, limit))
            else:
                # Get all chunks ordered by index
                cur.execute("""
                    SELECT 
                        chunk_id,
                        chunk_index,
                        content,
                        source_file,
                        1.0 as similarity
                    FROM document_chunks
                    WHERE tenant_id = %s
                      AND library_id = %s
                    ORDER BY chunk_index
                    LIMIT %s
                """, (tenant_id, library_id, limit))
            
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

def check_rate_limit(tenant_id: str, plan: str) -> bool:
    """Check if tenant is within rate limits"""
    r = get_redis()
    key = f"ratelimit:{tenant_id}"
    
    # Get current count
    count = r.get(key)
    if count is None:
        # First request in window
        r.setex(key, 60, 1)  # 1 minute window
        return True
    
    count = int(count)
    
    # Rate limits by plan
    limits = {
        'free': 60,      # 60 requests/min
        'pro': 600,      # 600 requests/min
        'enterprise': 6000  # 6000 requests/min
    }
    
    limit = limits.get(plan, limits['free'])
    
    if count >= limit:
        return False
    
    r.incr(key)
    return True

def track_usage(tenant_id: str, tokens: int):
    """Track token usage for billing"""
    r = get_redis()
    
    # Increment daily usage
    from datetime import datetime
    today = datetime.utcnow().strftime('%Y-%m-%d')
    key = f"usage:{tenant_id}:{today}"
    
    r.incrby(key, tokens)
    r.expire(key, 86400 * 7)  # Keep for 7 days

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for get-library-docs"""
    try:
        # Parse request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        # Get tenant from authorizer context
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        tenant_id = authorizer_context.get('tenantId', 'default')
        plan = authorizer_context.get('plan', 'free')
        
        # Check rate limit
        if not check_rate_limit(tenant_id, plan):
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Rate limit exceeded',
                    'plan': plan,
                    'upgrade_url': 'https://context7.miyabi.ai/pricing'
                })
            }
        
        # Extract parameters
        library_id = body.get('context7CompatibleLibraryID', body.get('library_id', ''))
        topic = body.get('topic')
        max_tokens = body.get('tokens', 5000)
        
        if not library_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'library_id is required'})
            }
        
        # Check cache first
        r = get_redis()
        cache_key = f"docs:{tenant_id}:{library_id}:{topic or 'all'}:{max_tokens}"
        cached = r.get(cache_key)
        
        if cached:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'HIT'
                },
                'body': cached
            }
        
        # Perform semantic search
        chunks = semantic_search(library_id, topic, tenant_id)
        
        # Collect content up to token limit
        char_limit = max_tokens * 4
        collected_text = []
        total_chars = 0
        sources = set()
        
        for chunk in chunks:
            content = chunk['content']
            if total_chars + len(content) > char_limit:
                break
            collected_text.append(content)
            total_chars += len(content)
            sources.add(chunk.get('source_file', ''))
        
        approximate_tokens = total_chars // 4
        
        # Track usage
        track_usage(tenant_id, approximate_tokens)
        
        response_body = {
            'library_id': library_id,
            'topic': topic,
            'content': '\n\n---\n\n'.join(collected_text),
            'chunks_returned': len(collected_text),
            'approximate_tokens': approximate_tokens,
            'sources': list(sources)
        }
        
        response_json = json.dumps(response_body)
        
        # Cache for 5 minutes
        r.setex(cache_key, 300, response_json)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'MISS'
            },
            'body': response_json
        }
        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def mcp_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handler for MCP tools/call endpoint"""
    try:
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        name = body.get('name')
        arguments = body.get('arguments', {})
        
        if name == 'get_library_docs':
            # Reformat for main handler
            event['body'] = json.dumps({
                'context7CompatibleLibraryID': arguments.get('context7CompatibleLibraryID'),
                'topic': arguments.get('topic'),
                'tokens': arguments.get('tokens', 5000)
            })
            return handler(event, context)
        
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f'Tool not found: {name}'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
