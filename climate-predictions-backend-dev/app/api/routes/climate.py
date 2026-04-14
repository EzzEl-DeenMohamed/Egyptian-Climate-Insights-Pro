import io

from fastapi import APIRouter, Depends, Query, Response
from typing import List

from starlette.responses import StreamingResponse

from app.services.climate import ClimateService
from app.core.dependencies import get_climate_service
from app.models.schemas.climate import ClimateParameterOut, LineChartData, ClimateMapRequest, \
    ClimateMapValuesOut, ClimateLineChartRequest, ChatbotAnswer, ChatbotQuestion, Fact, FactsResponse

router = APIRouter(prefix="/climate", tags=["climate"])

@router.get("/parameters", response_model=List[ClimateParameterOut])
async def get_climate_parameters(param_id: int = Query(default=None), service: ClimateService = Depends(get_climate_service)):
    """
    Get all climate parameters.
    """
    return await service.get_climate_parameters(ids=[param_id] if param_id else None)


@router.post("/analysis/maps/choropleth/values", response_model=ClimateMapValuesOut, response_description="choropleth map data")
async def get_choropleth_map_values(
        request: ClimateMapRequest,
        service: ClimateService = Depends(get_climate_service)
):
    """
    Get climate map values based on the request.
    This endpoint returns a dict mapping (location_code, clim_param_id, timeframe, scenario) to avg_value in range start_year to end_year.
    """
    return await service.get_choropleth_map_values(request)

@router.post("/analysis/charts/line-chart", response_model=LineChartData, response_description="Line chart data")
async def get_line_chart_data(
        req: ClimateLineChartRequest,
        service: ClimateService = Depends(get_climate_service)
):
    """
    get line chart data based on request.
    Each line represents a clm parameter and scenario with all values in the given timeframe.
    """
    return await service.get_line_chart_data(req)

@router.post("/analysis/downloads/choropleth-map", response_class=StreamingResponse, response_description="PNG choropleth map")
async def get_choropleth_map(
        req: ClimateMapRequest,
        service: ClimateService = Depends(get_climate_service)
):
    """
    Get a choropleth map based on request.
    the request for this api should contain a single climate parameter id and a single scenario.
    """
    # ensure there is only one param and one scenario
    if len(req.climate_param_ids) != 1 or len(req.scenario_codes) != 1:
        raise ValueError("Only one climate parameter and one scenario is allowed for choropleth map.")

    # Generate the choropleth map.
    image_buf: io.BytesIO = await service.get_choropleth_map(req)

    # Return the image as a streaming response.
    return StreamingResponse(image_buf, media_type="image/png")


@router.post('/analysis/downloads/excel', response_class=StreamingResponse, response_description="Excel file")
async def download_excel_report(
        req: ClimateMapRequest,
        service: ClimateService = Depends(get_climate_service)
):
    """
    Download climate analysis data as an Excel file.
    """
    excel_buf = await service.generate_excel_report(req)

    return StreamingResponse(
        content=excel_buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={excel_buf.name}"
        }
    )

@router.post("/analysis/facts", response_model=FactsResponse)
async def get_aggr_climate_values(
    req: ClimateMapRequest,
    service: ClimateService = Depends(get_climate_service)
):
    """
    Get aggregated climate facts based on the request.
    """
    return await service.get_climate_facts(req)

@router.get("/analysis/chatbot/questions", response_model=List[ChatbotQuestion])
async def get_chatbot_questions(
    service: ClimateService = Depends(get_climate_service)
):
    """
    Get predefined chatbot questions.
    """
    return await service.get_chatbot_questions()

@router.get("/analysis/chatbot/answer/{question_id}", response_model=ChatbotAnswer)
async def answer_chatbot_question(
    question_id: int,
    service: ClimateService = Depends(get_climate_service)
):
    """
    Answer a predefined chatbot question by ID.
    """
    return await service.answer_chatbot_question(question_id)