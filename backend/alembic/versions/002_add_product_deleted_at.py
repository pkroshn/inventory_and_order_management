"""Add product soft delete (deleted_at)

Revision ID: 002
Revises: 001
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'products',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('ix_products_deleted_at', 'products', ['deleted_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_products_deleted_at', table_name='products')
    op.drop_column('products', 'deleted_at')
