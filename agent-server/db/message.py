import json
import uuid
from datetime import datetime, timezone

from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal
from .models import Message, MessageRole


async def add_message(
	workspace_id: uuid.UUID,
	message: HumanMessage | AIMessage,
	session: AsyncSession | None = None,
) -> Message:
	owns_session = session is None
	if owns_session:
		session = AsyncSessionLocal()

	try:
		content = message.content
		if not isinstance(content, str):
			content = json.dumps(content)

		sequence_query = select(
			func.coalesce(func.max(Message.sequence), -1) + 1
		).where(Message.workspace_id == workspace_id)
		sequence = (await session.execute(sequence_query)).scalar_one()

		record = Message(
			workspace_id=workspace_id,
			role=MessageRole.USER if isinstance(message, HumanMessage) else MessageRole.ASSISTANT,
			content=content,
			sequence=sequence,
			created_at=datetime.now(timezone.utc),
		)
		session.add(record)

		if owns_session:
			await session.commit()
		else:
			await session.flush()

		await session.refresh(record)
		return record
	except Exception:
		if owns_session:
			await session.rollback()
		raise
	finally:
		if owns_session:
			await session.close()
