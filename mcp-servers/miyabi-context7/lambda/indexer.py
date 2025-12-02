"""
Miyabi Context7 - Document Indexer Lambda
Indexes markdown/text documents from S3 into OpenSearch vectors
"""

import json
import boto3
import hashlib
from typing import List, Dict, Any
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# AWS Clients
s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# OpenSearch config
OPENSEARCH_ENDPOINT = 'your-collection.ap-northeast-1.aoss.amazonaws.com'
INDEX_NAME = 'miyabi-docs'

def get_opensearch_client():
    """Get authenticated OpenSearch client"""
    credentials = boto3.Session().get_credentials()
    auth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        'ap-northeast-1',
        'aoss',
        session_token=credentials.token
    )
    return OpenSearch(
        hosts=[{'host': OPENSEARCH_ENDPOINT, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
    )

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using Bedrock Titan Embeddings V2"""
    response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            'inputText': text[:8000],  # Titan limit
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

def extract_metadata(content: str, s3_key: str) -> Dict:
    """Extract metadata from document"""
    lines = content.split('\n')
    title = None
    description = None
    
    for line in lines[:20]:  # Check first 20 lines
        if line.startswith('# ') and not title:
            title = line[2:].strip()
        elif line.startswith('## ') and not description:
            description = line[3:].strip()
    
    # Derive library ID from path
    # e.g., docs/miyabi.txt -> /miyabi/docs
    parts = s3_key.replace('.txt', '').replace('.md', '').split('/')
    library_id = '/' + '/'.join(parts)
    
    return {
        'title': title or s3_key,
        'description': description or '',
        'library_id': library_id,
        'source': s3_key
    }

def index_document(bucket: str, key: str) -> Dict:
    """Index a single document from S3"""
    client = get_opensearch_client()
    
    # Get document from S3
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')
    
    # Extract metadata
    metadata = extract_metadata(content, key)
    
    # Chunk document
    chunks = chunk_document(content)
    
    # Index each chunk
    indexed_count = 0
    for i, chunk in enumerate(chunks):
        doc_id = hashlib.md5(f"{key}:{i}".encode()).hexdigest()
        
        # Generate embedding
        embedding = generate_embedding(chunk['text'])
        
        # Prepare document
        doc = {
            'chunk_id': doc_id,
            'chunk_index': i,
            'text': chunk['text'],
            'embedding': embedding,
            'library_id': metadata['library_id'],
            'title': metadata['title'],
            'source': metadata['source'],
            'char_count': chunk['char_count']
        }
        
        # Index to OpenSearch
        client.index(
            index=INDEX_NAME,
            id=doc_id,
            body=doc
        )
        indexed_count += 1
    
    return {
        'library_id': metadata['library_id'],
        'chunks_indexed': indexed_count,
        'source': key
    }

def handler(event, context):
    """Lambda handler for S3 events or direct invocation"""
    results = []
    
    # Handle S3 event trigger
    if 'Records' in event:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            if key.endswith(('.txt', '.md')):
                result = index_document(bucket, key)
                results.append(result)
    
    # Handle direct invocation
    elif 'bucket' in event and 'prefix' in event:
        bucket = event['bucket']
        prefix = event.get('prefix', '')
        
        # List objects
        paginator = s3.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get('Contents', []):
                key = obj['Key']
                if key.endswith(('.txt', '.md')):
                    result = index_document(bucket, key)
                    results.append(result)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'indexed': len(results),
            'results': results
        })
    }
