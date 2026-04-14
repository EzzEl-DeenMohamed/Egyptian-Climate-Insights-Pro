import os
import tempfile

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db.base import MaterializedViewBase
from app.models.db.materialized_views import ClmValsPerGovOrCountryYearMatView, ClmValsPerGovOrCountryMonthMatView
from app.models.schemas.common import TimeframeEnum


def timeframe_to_months(timeframe: TimeframeEnum) -> list[int] | None:
    mapping = {
        TimeframeEnum.WINTER: [12, 1, 2],
        TimeframeEnum.SPRING: [3, 4, 5],
        TimeframeEnum.SUMMER: [6, 7, 8],
        TimeframeEnum.FALL: [9, 10, 11],
        TimeframeEnum.JAN: [1],
        TimeframeEnum.FEB: [2],
        TimeframeEnum.MAR: [3],
        TimeframeEnum.APR: [4],
        TimeframeEnum.MAY: [5],
        TimeframeEnum.JUN: [6],
        TimeframeEnum.JUL: [7],
        TimeframeEnum.AUG: [8],
        TimeframeEnum.SEP: [9],
        TimeframeEnum.OCT: [10],
        TimeframeEnum.NOV: [11],
        TimeframeEnum.DEC: [12],
        TimeframeEnum.MONTHLY: None,  # Means "all months"
        TimeframeEnum.ANNUAL: None  # Means "all months"
    }
    return mapping.get(timeframe)

def which_mat_view(timeframe: TimeframeEnum) -> (ClmValsPerGovOrCountryYearMatView | ClmValsPerGovOrCountryMonthMatView, str):
    """
    Determines which materialized view to use based on the provided timeframe.

    :param timeframe: The timeframe for which to determine the materialized view.
    :return: A tuple containing the materialized view class and the bucket column name.
    """
    if timeframe == TimeframeEnum.ANNUAL:
        return ClmValsPerGovOrCountryYearMatView, 'year_bucket'
    else:
        return ClmValsPerGovOrCountryMonthMatView, 'month_bucket'
