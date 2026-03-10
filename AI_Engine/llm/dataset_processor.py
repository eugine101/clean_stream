import asyncio
import json
import logging
from typing import Dict, Any, List
from uuid import UUID
import httpx
from async_cleaning import process_row_async
from config import DATABASE_URL

logger = logging.getLogger(__name__)

class DatasetProcessingService:
    """Service to process entire datasets asynchronously with streaming results"""
    
    def __init__(self, spring_boot_base_url: str = "http://localhost:8080"):
        self.spring_boot_base_url = spring_boot_base_url
        self.active_tasks: Dict[UUID, asyncio.Task] = {}
    
    async def process_dataset(
        self,
        tenant_id: str,
        dataset_id: UUID,
        rows: List[Dict[str, Any]],
        on_row_processed: callable = None
    ) -> Dict[str, Any]:
        """
        Process all rows in a dataset asynchronously with streaming
        
        Args:
            tenant_id: Tenant ID for multi-tenant isolation
            dataset_id: Dataset ID for tracking
            rows: List of rows to process
            on_row_processed: Optional callback function for each processed row
                             callback signature: on_row_processed(row_index, cleaned_row, confidence)
        
        Returns:
            {"status": "processing", "dataset_id": dataset_id, "total_rows": len(rows)}
        """
        
        logger.info(f"Starting dataset processing - tenant: {tenant_id}, dataset: {dataset_id}, rows: {len(rows)}")
        
        # Create background task
        task = asyncio.create_task(
            self._process_dataset_background(
                tenant_id,
                dataset_id,
                rows,
                on_row_processed
            )
        )
        
        # Track active task
        self.active_tasks[dataset_id] = task
        
        # Clean up completed tasks
        task.add_done_callback(lambda t: self.active_tasks.pop(dataset_id, None))
        
        return {
            "status": "processing",
            "dataset_id": str(dataset_id),
            "total_rows": len(rows),
            "message": "Dataset processing started in background"
        }
    
    async def _process_dataset_background(
        self,
        tenant_id: str,
        dataset_id: UUID,
        rows: List[Dict[str, Any]],
        on_row_processed: callable = None
    ):
        """Background task to process all rows"""
        
        try:
            processed_count = 0
            failed_count = 0
            
            # Process rows with concurrency limit (5 concurrent)
            semaphore = asyncio.Semaphore(5)
            
            async def process_with_limit(row_index: int, row: Dict[str, Any]):
                nonlocal processed_count, failed_count
                async with semaphore:
                    try:
                        result = await process_row_async(tenant_id, dataset_id, row)
                        processed_count += 1
                        
                        # Call callback or stream to Spring Boot
                        if on_row_processed:
                            await on_row_processed(row_index, result, True)
                        else:
                            await self._stream_to_spring_boot(
                                tenant_id,
                                dataset_id,
                                row_index,
                                result
                            )
                        
                        logger.debug(f"Processed row {row_index + 1}/{len(rows)}")
                        
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"Failed to process row {row_index}: {str(e)}")
                        if on_row_processed:
                            await on_row_processed(row_index, None, False)
                        else:
                            await self._stream_error_to_spring_boot(
                                tenant_id,
                                dataset_id,
                                row_index,
                                str(e)
                            )
            
            # Process all rows concurrently with limit
            tasks = [
                process_with_limit(idx, row)
                for idx, row in enumerate(rows)
            ]
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
            logger.info(
                f"Dataset {dataset_id} processing completed. "
                f"Processed: {processed_count}, Failed: {failed_count}"
            )
            
        except Exception as e:
            logger.error(f"Error in dataset background processing: {str(e)}", exc_info=True)
            await self._stream_error_to_spring_boot(
                tenant_id,
                dataset_id,
                -1,
                f"Dataset processing failed: {str(e)}"
            )
    
    async def _stream_to_spring_boot(
        self,
        tenant_id: str,
        dataset_id: UUID,
        row_index: int,
        result: Dict[str, Any]
    ):
        """
        Stream cleaned row to Spring Boot via HTTP callback
        Spring Boot will broadcast to WebSocket clients
        """
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                callback_url = f"{self.spring_boot_base_url}/api/dataset-processing/row-processed"
                
                payload = {
                    "tenantId": tenant_id,
                    "datasetId": str(dataset_id),
                    "rowIndex": row_index,
                    "cleanedRow": result.get("suggestion", {}),
                    "confidence": result.get("suggestion", {}).get("confidence", 0),
                }
                
                response = await client.post(callback_url, json=payload)
                response.raise_for_status()
                
                logger.debug(f"Streamed row {row_index} to Spring Boot")
                
        except Exception as e:
            logger.error(
                f"Failed to stream row {row_index} to Spring Boot: {str(e)}"
            )
    
    async def _stream_error_to_spring_boot(
        self,
        tenant_id: str,
        dataset_id: UUID,
        row_index: int,
        error_message: str
    ):
        """Stream error notification to Spring Boot"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                callback_url = f"{self.spring_boot_base_url}/api/dataset-processing/row-error"
                
                payload = {
                    "tenantId": tenant_id,
                    "datasetId": str(dataset_id),
                    "rowIndex": row_index,
                    "error": error_message,
                }
                
                response = await client.post(callback_url, json=payload)
                response.raise_for_status()
                
        except Exception as e:
            logger.error(f"Failed to stream error to Spring Boot: {str(e)}")
    
    def is_processing(self, dataset_id: UUID) -> bool:
        """Check if dataset is currently processing"""
        return dataset_id in self.active_tasks
    
    def cancel_processing(self, dataset_id: UUID) -> bool:
        """Cancel dataset processing"""
        task = self.active_tasks.get(dataset_id)
        if task:
            task.cancel()
            return True
        return False

# Global instance
_processing_service = None

def get_processing_service() -> DatasetProcessingService:
    """Get or create global processing service"""
    global _processing_service
    if _processing_service is None:
        _processing_service = DatasetProcessingService()
    return _processing_service
