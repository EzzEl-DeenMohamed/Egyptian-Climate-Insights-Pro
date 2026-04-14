from enum import Enum


class LocationTypeEnum(Enum):
    COUNTRY = "country"  # adm0
    GOVERNORATE = "governorate"  # adm1
    DISTRICT = "district"  # adm2

class SeasonEnum(Enum):
    WINTER = "winter"
    SPRING = "spring"
    SUMMER = "summer"
    FALL = "fall"

class TimeframeEnum(Enum):
    ANNUAL = "annual"
    WINTER = "winter"
    SPRING = "spring"
    SUMMER = "summer"
    FALL = "fall"
    MONTHLY = "monthly"
    JAN = "jan"
    FEB = "feb"
    MAR = "mar"
    APR = "apr"
    MAY = "may"
    JUN = "jun"
    JUL = "jul"
    AUG = "aug"
    SEP = "sep"
    OCT = "oct"
    NOV = "nov"
    DEC = "dec"


class AnalysisOutputEnum(Enum):
    HEATMAP = "heatmap"
    CHOROPLETH_MAP = "choropleth_map"
    CONTOUR_MAP = "contour_map"
    LINE_CHART = "line_chart"
    EXCEL = "excel"

class ScenarioEnum(Enum):
    SSP245 = "ssp245"
    SSP370 = "ssp370"
    HISTORICAL = "historical"

class AggregationType(str, Enum):
    MAX = "max"
    MIN = "min"
    AVG = "avg"

