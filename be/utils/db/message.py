import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Message


async def list_messages(
    workspace_id: uuid.UUID,
    session: AsyncSession,
) -> list[Message]:
    result = await session.execute(
        select(Message)
        .where(Message.workspace_id == workspace_id)
        .order_by(Message.sequence.asc())
    )
    return list(result.scalars().all())
