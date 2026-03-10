import asyncio
import logging

logger = logging.getLogger(__name__)

# Global semaphore to limit concurrent Gemini API calls
# This prevents rate limiting and resource exhaustion
gemini_semaphore = asyncio.Semaphore(5)  # Max 5 concurrent Gemini calls

async def acquire_semaphore():
    """Acquire semaphore slot for Gemini API call"""
    async with gemini_semaphore:
        yield

async def with_concurrency_limit(coro):
    """
    Execute a coroutine with concurrency limit
    
    Usage:
        result = await with_concurrency_limit(my_async_func())
    """
    async with gemini_semaphore:
        return await coro

class ConcurrencyManager:
    """Manages concurrent operations with limits"""
    
    def __init__(self, max_concurrent: int = 5):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.max_concurrent = max_concurrent
        logger.info(f"Initialized ConcurrencyManager with max_concurrent={max_concurrent}")
    
    async def run(self, coro):
        """Run a coroutine with concurrency limit"""
        async with self.semaphore:
            return await coro
    
    async def run_batch(self, coros: list):
        """Run multiple coroutines with concurrency limit"""
        return await asyncio.gather(
            *[self.run(coro) for coro in coros],
            return_exceptions=True
        )
