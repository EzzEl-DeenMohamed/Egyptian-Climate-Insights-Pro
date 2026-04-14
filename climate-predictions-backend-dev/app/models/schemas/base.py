from pydantic import BaseModel

class BaseSchemaModel(BaseModel):
    class Config:
        arbitrary_types_allowed = True
        from_attributes = True
