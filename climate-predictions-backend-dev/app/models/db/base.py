from sqlalchemy import Connection, text
from sqlalchemy.ext.declarative import declarative_base

_Base = declarative_base()
_MatViewBase = declarative_base()

class MaterializedViewBase(_MatViewBase):
    """
    Base class for all materialized views
    """
    __abstract__ = True
    schema_name = ""

    @classmethod
    def refresh(cls, conn: Connection):
        """
        Refresh the materialized view
        """
        conn.execute(text(f"REFRESH MATERIALIZED VIEW {cls.schema_name}.{cls.__tablename__}"))



class SQLBase(_Base):
    """
    Base class for all SQL models
    """
    __abstract__ = True
    schema_name = ""

    # id: int
    # created_at: datetime
    # updated_at: datetime
    # deleted_at: datetime
    # created_by: str
    # updated_by: str
    # deleted_by: str
    # is_deleted: bool
    # is_active: bool
    #
    # def __repr__(self):
    #     return f"<{self.__name__} id={self.id}>"

    #
    # @classmethod
    # def from_orm(cls, obj):
    #     """
    #     Create a new instance of the model from an ORM object
    #     """
    #     return cls(**{k: getattr(obj, k) for k in cls.__annotations__ if hasattr(obj, k)})
    #
    # def to_dict(self):
    #     """
    #     Return the model as a dictionary
    #     """
    #     return {k: getattr(self, k) for k in self.__annotations__}
    #
    # def update(self, **kwargs):
    #     """
    #     Update the model with the given values
    #     """
    #     for k, v in kwargs.items():
    #         setattr(self, k, v)
    #     return self
    #