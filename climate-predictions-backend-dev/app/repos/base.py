from typing import TypeVar, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas.base import BaseSchemaModel


T = TypeVar("T")  # T is a type variable representing model class

#todo: test these methods

class BaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, model: T, obj_in: BaseSchemaModel) -> T:
        obj = model(**obj_in.model_dump(exclude_unset=True))
        self.db.add(obj)
        await self.db.commit()
        return obj

    async def get_by_id(self, model: T, _id: int) -> T:
        return await self.db.get(model, _id)

    async def get_all(self, model: T) -> List[T]:
        result = await self.db.execute(select(model))
        data = result.scalars().all()
        return data

    async def update(self, model: T, _id: int, obj_in: BaseSchemaModel) -> T:
        obj = await self.get_by_id(model, _id)
        for field, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.commit()
        return obj

    async def delete(self, model: T, _id: int) -> T:
        obj = await self.get_by_id(model, _id)
        await self.db.delete(obj)
        await self.db.commit()
        return obj



