import os
import uuid
import shutil
import logging
from typing import Tuple
from fastapi import UploadFile
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    @staticmethod
    async def save_file(file: UploadFile, folder: str = "attachments") -> Tuple[str, str, int]:
        """
        Saves uploaded file securely.
        Returns tuple: (relative_file_path, file_type, file_size_bytes)
        """
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        target_dir = os.path.join(settings.UPLOAD_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        file_path = os.path.join(target_dir, unique_filename)
        
        # Read content and save
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB")

        with open(file_path, "wb") as f:
            f.write(content)
            
        relative_path = os.path.join(folder, unique_filename)
        mime_type = file.content_type or "application/octet-stream"
        
        return relative_path, mime_type, file_size

    @staticmethod
    def get_full_file_path(relative_path: str) -> str:
        upload_root = os.path.abspath(settings.UPLOAD_DIR)
        full_path = os.path.abspath(os.path.join(upload_root, relative_path))
        if os.path.commonpath([upload_root, full_path]) != upload_root:
            raise ValueError("Invalid attachment path")
        return full_path
