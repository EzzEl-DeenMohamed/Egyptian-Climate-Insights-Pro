# import tempfile
#
# import rasterio
# from matplotlib import pyplot as plt
# from rasterio import MemoryFile
# from rasterio.mask import mask
# from rasterio.merge import merge
# from shapely.geometry.geo import mapping, shape

# from pyproj import Transformer
# from shapely.ops import transform

# from app.models.schemas.geo import GeoJsonOut

from pyproj import Transformer, CRS
from shapely.ops import transform

from app.models.schemas.common import TimeframeEnum


def reproject(geom, src_crs, dest_crs):
    """
    Reproject a shapely geometry from a source CRS to a destination CRS.
    :param geom:  shapely geometry object
    :param src_crs:  source CRS, e.g. 'EPSG:4326'
    :param dest_crs:  destination CRS, e.g. 'EPSG:32636'
    :return:
    """
    project = Transformer.from_crs(
        CRS(src_crs),  # source coordinate system
        CRS(dest_crs),
        always_xy=True)  # destination coordinate system
    return transform(project.transform, geom)  # apply projection

