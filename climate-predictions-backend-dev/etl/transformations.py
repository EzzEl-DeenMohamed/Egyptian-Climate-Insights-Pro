from abc import ABC, abstractmethod
from typing import Dict, Any
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

class TransformationStrategy(ABC):
    """Abstract base class for transformation strategies."""
    @abstractmethod
    def transform(self, values: np.ndarray | Dict[str, np.ndarray]) -> np.ndarray:
        pass

class KelvinToCelsius(TransformationStrategy):
    """Converts temperature from Kelvin to Celsius."""
    def transform(self, values: np.ndarray) -> np.ndarray:
        logging.debug("Applying KelvinToCelsius")
        return values - 273.15

class PrToMmMonth(TransformationStrategy):
    """Converts precipitation from kg/m^2/s to mm/month, assuming 30 days."""
    def transform(self, values: np.ndarray) -> np.ndarray:
        logging.debug("Applying PrToMmMonth")
        # 1 kg/m^2 = 1 mm, convert seconds to 30 days (30 * 86400 s)
        return values * 30 * 86400

class DeriveVaporPressure(TransformationStrategy):
    """Derives vapor pressure from hurs and tas."""
    def transform(self, values: Dict[str, np.ndarray]) -> np.ndarray:
        logging.debug("Applying DeriveVaporPressure")
        hurs = values["hurs"]
        tas = values["tas"]
        return hurs * 0.0611 * np.exp((17.27 * (tas - 273.15)) / (tas - 35.85))

class EvspsblpotToMmDay(TransformationStrategy):
    """Converts potential evapotranspiration from kg/m^2/s to mm/day."""
    def transform(self, values: np.ndarray) -> np.ndarray:
        logging.debug("Applying EvspsblpotToMmDay")
        return values * 86400

class FrostDays(TransformationStrategy):
    """Identifies days where daily minimum temperature (tasmin) is below 0°C."""
    def transform(self, values: np.ndarray) -> np.ndarray:
        logging.debug("Applying FrostDays")
        tasmin_c = np.array(values) - 273.15  # Convert K to °C
        return (tasmin_c < 0).astype(np.int32)  # 2D daily mask [lat, lon]

class WetDays(TransformationStrategy):
    """Identifies days where daily precipitation is >= 1 mm/day."""
    def transform(self, values: np.ndarray) -> np.ndarray:
        logging.debug("Applying WetDays")
        pr_mm_day = np.array(values) * 86400  # Convert kg/m^2/s to mm/day
        return (pr_mm_day >= 1).astype(np.int32)  # 2D daily mask [lat, lon]

class DiurnalTemperatureRange(TransformationStrategy):
    """Calculates daily diurnal temperature range (tasmax - tasmin)."""
    def transform(self, values: Dict[str, np.ndarray]) -> np.ndarray:
        logging.debug("Applying DiurnalTemperatureRange")
        tasmax_c = np.array(values["tasmax"]) - 273.15  # Convert K to °C
        tasmin_c = np.array(values["tasmin"]) - 273.15
        return tasmax_c - tasmin_c  # 2D daily DTR [lat, lon]

class TransformationFactory:
    """Factory for creating transformation strategies."""
    @staticmethod
    def get_strategy(transformation_name: str) -> TransformationStrategy:
        strategies = {
            "kelvin_to_celsius": KelvinToCelsius(),
            "pr_to_mm_month": PrToMmMonth(),
            "derive_vapor_pressure": DeriveVaporPressure(),
            "evspsblpot_to_mm_day": EvspsblpotToMmDay(),
            "frost_days": FrostDays(),
            "wet_days": WetDays(),
            "diurnal_temperature_range": DiurnalTemperatureRange()
        }
        strategy = strategies.get(transformation_name)
        if not strategy:
            raise ValueError(f"Unknown transformation: {transformation_name}")
        return strategy