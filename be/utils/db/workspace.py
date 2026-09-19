from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import Workspace


async def create_workspace(
    session: AsyncSession | None = None,
) -> Workspace:
    owns_session = session is None

    if owns_session:
        session = AsyncSessionLocal()

    try:
        now = datetime.now(timezone.utc)
        workspace = Workspace(
            created_at=now,
            updated_at=now,
        )

        session.add(workspace)

        if owns_session:
            await session.commit()
        else:
            await session.flush()

        await session.refresh(workspace)
        return workspace
    except Exception:
        if owns_session:
            await session.rollback()
        raise
    finally:
        if owns_session:
            await session.close()