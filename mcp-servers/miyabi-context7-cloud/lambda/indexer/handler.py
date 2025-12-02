"""
Miyabi Context7 Cloud - Indexer Lambda
Document processing, chunking, embedding, and storage
"""

import json
import os
import hashlib
import boto3
from typing import Dict, Any, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

# Environment
STAGE = os.environ.get('STAGE', 'dev')
AURORA_SECRET_ARN = os.environ['AURORA_SECRET_ARN']
AURORA_ENDPOINT = os.environ['AURORA_ENDPOINT']
AURORA_DATABASE = os.environ['AURORA_DATABASE']
METADATA_TABLE = os.environ['METADATA_TABLE']
DOCUMENTS_BUCKET = os.environ['DOCUMENTS_BUCKET']

# Clients
secrets_client = boto3.client('secretsmanager')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
metadata_table = dynamodb.Table(METADATA_TABLE)

# DB credentials cache
_db_creds = None

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

def ensure_schema(conn):
    """Ensure database schema exists with pgvector"""
    with conn.cursor() as cur:
        # Enable pgvector extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        
        # Create chunks table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                chunk_id VARCHAR(64) PRIMARY KEY,
                tenant_id VARCHAR(64) NOT NULL,
                library_id VARCHAR(256) NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                source_file VARCHAR(512),
                title VARCHAR(512),
                embedding vector(1024),
                search_vector tsvector,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_chunks_tenant_library 
            ON document_chunks(tenant_id, library_id)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
            ON document_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_chunks_search 
            ON document_chunks USING gin(search_vector)
        """)
        
        conn.commit()

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

def chunk_document(content: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict]:
    """Split document into overlapping chunks"""
    chunks = []
    lines = content.split('\n')
    current_chunk = []
    current_size = 0
    
    for line in lines:
        line_size = len(line)
        if current_size + line_size > chunk_size and current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                'text': chunk_text,
                'char_count': len(chunk_text)
            })
            # Keep overlap
            overlap_lines = []
            overlap_size = 0
            for l in reversed(current_chunk):
                if overlap_size + len(l) <= overlap:
                    overlap_lines.insert(0, l)
                    overlap_size += len(l)
                else:
                    break
            current_chunk = overlap_lines
            current_size = overlap_size
        
        current_chunk.append(line)
        current_size += line_size
    
    if current_chunk:
        chunk_text = '\n'.join(current_chunk)
        chunks.append({
            'text': chunk_text,
            'char_count': len(chunk_text)
        })
    
    return chunks

def extract_metadata(content: str, source_key: str) -> Dict:
    """Extract metadata from document"""
    lines = content.split('\n')
    title = None
    description = None
    
    for line in lines[:20]:
        if line.startswith('# ') and not title:
            title = line[2:].strip()
        elif line.startswith('## ') and not description:
            description = line[3:].strip()
    
    # Derive library ID from path
    parts = source_key.replace('.txt', '').replace('.md', '').split('/')
    library_id = '/' + '/'.join(parts)
    
    return {
        'title': title or source_key,
        'description': description or '',
        'library_id': library_id,
        'source': source_key
    }

def index_document(
    tenant_id: str,
    library_id: str,
    content: str,
    source_file: str,
    title: Optional[str] = None
) -> Dict:
    """Index a document into the vector database"""
    conn = get_db_connection()
    
    try:
        ensure_schema(conn)
        
        # Chunk document
        chunks = chunk_document(content)
        
        # Delete existing chunks for this document
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM document_chunks 
                WHERE tenant_id = %s AND library_id = %s AND source_file = %s
            """, (tenant_id, library_id, source_file))
        
        # Prepare chunk data
        chunk_data = []
        for i, chunk in enumerate(chunks):
            chunk_id = hashlib.md5(f"{tenant_id}:{library_id}:{source_file}:{i}".encode()).hexdigest()
            embedding = generate_embedding(chunk['text'])
            
            chunk_data.append((
                chunk_id,
                tenant_id,
                library_id,
                i,
                chunk['text'],
                source_file,
                title,
                embedding,
                chunk['text']  # For tsvector
            ))
        
        # Batch insert
        with conn.cursor() as cur:
            execute_values(cur, """
                INSERT INTO document_chunks 
                (chunk_id, tenant_id, library_id, chunk_index, content, source_file, title, embedding, search_vector)
                VALUES %s
                ON CONFLICT (chunk_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    embedding = EXCLUDED.embedding,
                    search_vector = to_tsvector('english', EXCLUDED.content),
                    updated_at = CURRENT_TIMESTAMP
            """, chunk_data, template="""
                (%s, %s, %s, %s, %s, %s, %s, %s::vector, to_tsvector('english', %s))
            """)
        
        conn.commit()
        
        # Update metadata in DynamoDB
        now = datetime.utcnow().isoformat()
        metadata_table.put_item(Item={
            'PK': f'TENANT#{tenant_id}',
            'SK': f'LIBRARY#{library_id}',
            'GSI1PK': f'TENANT#{tenant_id}',
            'GSI1SK': f'LIBRARY#{library_id}',
            'LibraryId': library_id,
            'Title': title or library_id,
            'ChunkCount': len(chunks),
            'UpdatedAt': now,
            'CreatedAt': now
        })
        
        return {
            'status': 'success',
            'tenant_id': tenant_id,
            'library_id': library_id,
            'chunks_indexed': len(chunks),
            'source_file': source_file
        }
        
    finally:
        conn.close()

def process_s3_document(bucket: str, key: str, tenant_id: str) -> Dict:
    """Process a document from S3"""
    # Get document
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')
    
    # Extract metadata
    metadata = extract_metadata(content, key)
    
    return index_document(
        tenant_id=tenant_id,
        library_id=metadata['library_id'],
        content=content,
        source_file=key,
        title=metadata['title']
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for indexing"""
    results = []
    
    # Handle SQS messages
    if 'Records' in event:
        for record in event['Records']:
            try:
                message = json.loads(record['body'])
                
                if 's3' in message:
                    # S3 event
                    bucket = message['s3']['bucket']['name']
                    key = message['s3']['object']['key']
                    tenant_id = message.get('tenant_id', 'default')
                    
                    result = process_s3_document(bucket, key, tenant_id)
                    results.append(result)
                    
                elif 'action' in message:
                    # Step Functions task
                    action = message['action']
                    
                    if action == 'parse':
                        # Parse document
                        doc = message['document']
                        content = doc.get('content', '')
                        if doc.get('s3_key'):
                            response = s3.get_object(
                                Bucket=DOCUMENTS_BUCKET,
                                Key=doc['s3_key']
                            )
                            content = response['Body'].read().decode('utf-8')
                        
                        return {'content': content, 'metadata': doc.get('metadata', {})}
                    
                    elif action == 'chunk':
                        # Chunk content
                        chunks = chunk_document(message['content'])
                        return {'chunks': chunks}
                    
                    elif action == 'embed':
                        # Generate embeddings
                        chunks = message['chunks']
                        vectors = []
                        for chunk in chunks:
                            embedding = generate_embedding(chunk['text'])
                            vectors.append({
                                'text': chunk['text'],
                                'embedding': embedding
                            })
                        return {'vectors': vectors}
                    
                    elif action == 'store':
                        # Store in database
                        vectors = message['vectors']
                        metadata = message['metadata']
                        
                        result = index_document(
                            tenant_id=metadata.get('tenant_id', 'default'),
                            library_id=metadata['library_id'],
                            content='\n\n'.join(v['text'] for v in vectors),
                            source_file=metadata.get('source', 'unknown'),
                            title=metadata.get('title')
                        )
                        return result
                        
                else:
                    # Direct index request
                    result = index_document(
                        tenant_id=message.get('tenant_id', 'default'),
                        library_id=message['library_id'],
                        content=message['content'],
                        source_file=message.get('source_file', 'api'),
                        title=message.get('title')
                    )
                    results.append(result)
                    
            except Exception as e:
                print(f'Error processing record: {e}')
                import traceback
                traceback.print_exc()
                results.append({'status': 'error', 'error': str(e)})
    
    # Handle direct API invocation
    elif 'body' in event:
        if isinstance(event['body'], str):
            body = json.loads(event['body'])
        else:
            body = event['body']
        
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        tenant_id = authorizer_context.get('tenantId', body.get('tenant_id', 'default'))
        
        result = index_document(
            tenant_id=tenant_id,
            library_id=body['library_id'],
            content=body['content'],
            source_file=body.get('source_file', 'api'),
            title=body.get('title')
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }
