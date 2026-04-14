import logging

def setup_logging():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("uvicorn")
    logger.setLevel(logging.INFO)
    logger.info("Logging is set up")

setup_logging()
