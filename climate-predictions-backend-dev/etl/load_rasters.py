import os

# remove postgis env variables if set
os.environ.pop('PROJ_LIB', None)  # Remove PROJ_LIB if set
os.environ.pop('GDAL_DATA', None)  # Remove GDAL_DATA if set


from datetime import datetime
import numpy as np
import rasterio
from dotenv import load_dotenv
from geoalchemy2 import RasterElement

from app.core.db import init_db_sync, get_db_sync
from app.models.db.climate import ClimateRasters, ClimateParameterDim

import struct
from sys import byteorder


def write_wkb_raster(dataset):
    """Creates a WKB raster from the given raster file with rasterio.
    :dataset: Rasterio dataset
    :returns: binary: Binary raster in WKB format

    This function was imported from
    https://github.com/nathancahill/wkb-raster/blob/master/wkb_raster.py
    and slightly adapted.
    """
    _DTYPE = {
        "?": [0, "?", 1],
        "u1": [2, "B", 1],
        "i1": [3, "b", 1],
        "B": [4, "B", 1],
        "i2": [5, "h", 2],
        "u2": [6, "H", 2],
        "i4": [7, "i", 4],
        "u4": [8, "I", 4],
        "f4": [10, "f", 4],
        "f8": [11, "d", 8],
    }

    # Define format, see https://docs.python.org/3/library/struct.html
    format_string = "bHHddddddIHH"

    if byteorder == "big":
        endian = ">"
        endian_byte = 0
    elif byteorder == "little":
        endian = "<"
        endian_byte = 1

    # Write the raster header data.
    header = bytes()

    transform = dataset.transform.to_gdal()

    version = 0
    nBands = int(dataset.count)
    scaleX = transform[1]
    scaleY = transform[5]
    ipX = transform[0]
    ipY = transform[3]
    skewX = 0
    skewY = 0
    srid = int(dataset.crs.to_string().split("EPSG:")[1])
    width = int(dataset.meta.get("width"))
    height = int(dataset.meta.get("height"))

    fmt = f"{endian}{format_string}"

    header = struct.pack(
        fmt,
        endian_byte,
        version,
        nBands,
        scaleX,
        scaleY,
        ipX,
        ipY,
        skewX,
        skewY,
        srid,
        width,
        height,
    )

    bands = []

    # Create band header data

    # not used - always False
    isOffline = False
    hasNodataValue = False

    if "nodata" in dataset.meta:
        hasNodataValue = True

    # not used - always False
    isNodataValue = False

    # unset
    reserved = False

    # # Based on the pixel type, determine the struct format, byte size and
    # # numpy dtype
    rasterio_dtype = dataset.meta.get("dtype")
    dt_short = np.dtype(rasterio_dtype).str[1:]
    pixtype, nodata_fmt, _ = _DTYPE[dt_short]

    # format binary -> :b
    binary_str = f"{isOffline:b}{hasNodataValue:b}{isNodataValue:b}{reserved:b}{pixtype:b}"
    # convert to int
    binary_decimal = int(binary_str, 2)

    # pack to 1 byte
    # 4 bits for ifOffline, hasNodataValue, isNodataValue, reserved
    # 4 bit for pixtype
    # -> 8 bit = 1 byte
    band_header = struct.pack("<b", binary_decimal)

    # Write the nodata value
    nodata = struct.pack(nodata_fmt, int(dataset.meta.get("nodata") or 0))

    for i in range(1, nBands + 1):
        band_array = dataset.read(i)

        # # Write the pixel values: width * height * size

        # numpy tobytes() method instead of packing with struct.pack()
        band_binary = band_array.reshape(width * height).tobytes()

        bands.append(band_header + nodata + band_binary)

    # join all bands
    allbands = bytes()
    for b in bands:
        allbands += b

    wkb = header + allbands

    return wkb


def insert_raster_to_db(raster_path, climate_param_id, timestamp):
    """Insert a raster file into the database."""
    global session

    with rasterio.open(raster_path, "r+") as dataset:
        dataset.crs = rasterio.crs.CRS().from_epsg(RASTER_FILE_SRC_CRS)
        raw_wkb = write_wkb_raster(dataset)


    raster_record = ClimateRasters(
        clm_param_id=climate_param_id,
        timestamp=timestamp,
        rast=RasterElement(raw_wkb)
    )

    session.add(raster_record)
    session.commit()


def process_rasters_for_climate_param(output_folder, climate_param_code):
    """Process and insert all raster files for a given climate parameter."""
    global climate_param_dict

    # todo: use thread for each file

    for file in os.listdir(output_folder):
        if file.endswith(".tif"):  # Ensure it's a raster file
            raster_path = os.path.join(output_folder, file)

            timestamp_str = str(file.replace(".tif", ""))  # Extract timestamp from filename
            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d").date()

            climate_param_id = climate_param_dict.get(climate_param_code, None)
            if not climate_param_id:
                print(f"Climate parameter '{climate_param_code}' not found in database.")
                continue

            insert_raster_to_db(raster_path, climate_param_id, timestamp)


def insert_all_output_rasters(base_folder):
    """Iterate through all climate parameter folders and insert their rasters."""
    for climate_param_code in os.listdir(base_folder):
        global session
        param_folder = os.path.join(base_folder, climate_param_code)
        if os.path.isdir(param_folder):
            try:
                process_rasters_for_climate_param(param_folder, climate_param_code.lower())
                session.commit()  # Commit changes for each climate parameter

            except Exception as e:
                print(f"Error processing climate parameter folder '{climate_param_code}': {e}")


if __name__ == "__main__":
    #todo: test the script on the created rasters and validate it in db
    RASTER_FILE_SRC_CRS = 32636 # UTM 36
    load_dotenv()

    OUTPUT_RASTERS_BASE_FOLDER = os.getenv("OUTPUT_RASTERS_BASE_FOLDER")

    init_db_sync()
    session = get_db_sync()

    climate_parameters = session.query(ClimateParameterDim).all()
    climate_param_dict = {param.code: param.id for param in climate_parameters}

    insert_all_output_rasters(OUTPUT_RASTERS_BASE_FOLDER)

    # datetime = datetime.strptime("1991-01-16", "%Y-%m-%d").date()
    # insert_raster_to_db(r"C:\Users\abdoe\OneDrive\Desktop\workspace\rasters\Pre\1991-01-16.tif", 4,datetime)