from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.file_parser import FileParserService
from app.services.lead_service import LeadService
from app.database import supabase


router = APIRouter()


@router.post("/file")
async def import_file(file: UploadFile = File(...)):
    """Import leads from file (PDF, Excel, Word, CSV)"""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate file type
    allowed_extensions = {".pdf", ".xlsx", ".xls", ".csv", ".docx", ".doc"}
    file_ext = "." + file.filename.split(".")[-1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    try:
        # Read file content
        content = await file.read()

        # Parse file
        file_parser = FileParserService()
        parsed_data = await file_parser.parse_file(file.filename, content)

        if not parsed_data:
            raise HTTPException(
                status_code=400,
                detail="No valid contact data found in file"
            )

        # Import leads
        lead_service = LeadService(supabase)
        results = await lead_service.bulk_create_leads(parsed_data)

        return {
            "filename": file.filename,
            "total_records": len(parsed_data),
            "successful": results["successful"],
            "failed": results["failed"],
            "skipped": results["skipped"],
            "errors": results["errors"][:10]  # Limit error messages
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )
