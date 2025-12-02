"""
Miyabi Context7 - Query Lambda
MCP-compatible endpoints for document retrieval
"""

import json
import boto3
from typing import List, Dict, Any, Optional
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# AWS Clients
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
            'inputText': text[:8000],
            'dimensions': 1024,
            'normalize': True
        })
    )
    result = json.loads(response['body'].read())
    return result['embedding']

def resolve_library_id(library_name: str) -> Dict:
    """
    Resolve a library name to Context7-compatible library ID
    Similar to Context7's resolve-library-id tool
    """
    client = get_opensearch_client()
    
    # Search for matching libraries
    query = {
        'size': 10,
        'query': {
            'bool': {
                'should': [
                    {'match': {'title': library_name}},
                    {'match': {'library_id': library_name}},
                    {'wildcard': {'library_id': f'*{library_name.lower()}*'}}
                ]
            }
        },
        'aggs': {
            'unique_libraries': {
                'terms': {
                    'field': 'library_id.keyword',
                    'size': 10
                }
            }
        }
    }
    
    response = client.search(index=INDEX_NAME, body=query)
    
    # Extract unique libraries
    libraries = []
    if 'aggregations' in response:
        for bucket in response['aggregations']['unique_libraries']['buckets']:
            library_id = bucket['key']
            doc_count = bucket['doc_count']
            
            # Get title from first hit
            title = library_id
            for hit in response['hits']['hits']:
                if hit['_source'].get('library_id') == library_id:
                    title = hit['_source'].get('title', library_id)
                    break
            
            libraries.append({
                'id': library_id,
                'name': title,
                'chunks': doc_count
            })
    
    return {
        'query': library_name,
        'libraries': libraries
    }

def get_library_docs(
    library_id: str,
    topic: Optional[str] = None,
    tokens: int = 5000
) -> Dict:
    """
    Get documentation for a library using semantic search
    Similar to Context7's get-library-docs tool
    """
    client = get_opensearch_client()
    
    # Build query
    if topic:
        # Semantic search with topic
        query_embedding = generate_embedding(topic)
        
        query = {
            'size': 20,
            'query': {
                'bool': {
                    'must': [
                        {'term': {'library_id.keyword': library_id}}
                    ],
                    'should': [
                        {
                            'script_score': {
                                'query': {'match_all': {}},
                                'script': {
                                    'source': "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                                    'params': {'query_vector': query_embedding}
                                }
                            }
                        }
                    ]
                }
            }
        }
    else:
        # Get all chunks for library, ordered by chunk_index
        query = {
            'size': 50,
            'query': {
                'term': {'library_id.keyword': library_id}
            },
            'sort': [{'chunk_index': 'asc'}]
        }
    
    response = client.search(index=INDEX_NAME, body=query)
    
    # Collect chunks up to token limit (rough estimate: 1 token ≈ 4 chars)
    char_limit = tokens * 4
    collected_text = []
    total_chars = 0
    sources = set()
    
    for hit in response['hits']['hits']:
        chunk = hit['_source']
        chunk_text = chunk['text']
        chunk_chars = len(chunk_text)
        
        if total_chars + chunk_chars > char_limit:
            break
        
        collected_text.append(chunk_text)
        total_chars += chunk_chars
        sources.add(chunk.get('source', ''))
    
    return {
        'library_id': library_id,
        'topic': topic,
        'content': '\n\n---\n\n'.join(collected_text),
        'chunks_returned': len(collected_text),
        'approximate_tokens': total_chars // 4,
        'sources': list(sources)
    }

def handler(event, context):
    """
    Lambda handler for API Gateway
    Supports MCP-compatible tool calls
    """
    # Parse request
    if isinstance(event.get('body'), str):
        body = json.loads(event['body'])
    else:
        body = event.get('body', event)
    
    # Route to appropriate function
    path = event.get('path', '') or event.get('rawPath', '')
    method = body.get('method', '')
    
    try:
        if '/resolve-library-id' in path or method == 'resolve_library_id':
            library_name = body.get('libraryName') or body.get('library_name', '')
            result = resolve_library_id(library_name)
            
        elif '/get-library-docs' in path or method == 'get_library_docs':
            library_id = body.get('context7CompatibleLibraryID') or body.get('library_id', '')
            topic = body.get('topic')
            tokens = body.get('tokens', 5000)
            result = get_library_docs(library_id, topic, tokens)
            
        else:
            # MCP tools/list response
            result = {
                'tools': [
                    {
                        'name': 'resolve_library_id',
                        'description': 'Resolve library name to Miyabi Context7 library ID',
                        'inputSchema': {
                            'type': 'object',
                            'properties': {
                                'libraryName': {
                                    'type': 'string',
                                    'description': 'Library name to search for'
                                }
                            },
                            'required': ['libraryName']
                        }
                    },
                    {
                        'name': 'get_library_docs',
                        'description': 'Get documentation for a library',
                        'inputSchema': {
                            'type': 'object',
                            'properties': {
                                'context7CompatibleLibraryID': {
                                    'type': 'string',
                                    'description': 'Library ID from resolve_library_id'
                                },
                                'topic': {
                                    'type': 'string',
                                    'description': 'Optional topic to focus on'
                                },
                                'tokens': {
                                    'type': 'integer',
                                    'default': 5000,
                                    'description': 'Max tokens to return'
                                }
                            },
                            'required': ['context7CompatibleLibraryID']
                        }
                    }
                ]
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
