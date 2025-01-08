import asyncio
import redis.asyncio as redis

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(host='db_redis', port=6379, db=0)
    return _redis_client
