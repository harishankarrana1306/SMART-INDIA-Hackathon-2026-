"""Initial database schema

Revision ID: 0001
Revises: 
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op  # type: ignore
import sqlalchemy as sa

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Cases
    op.create_table(
        'cases',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('case_code', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=256), nullable=False),
        sa.Column('case_type', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='open'),
        sa.Column('opened_on', sa.Date(), nullable=True),
        sa.Column('is_synthetic', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_code')
    )
    op.create_index(op.f('ix_cases_case_code'), 'cases', ['case_code'], unique=True)

    # Source Records
    op.create_table(
        'source_records',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('record_code', sa.String(length=32), nullable=False),
        sa.Column('case_id', sa.String(length=36), nullable=True),
        sa.Column('source_type', sa.String(length=32), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('file_name', sa.String(length=256), nullable=True),
        sa.Column('ingested_by', sa.String(length=36), nullable=True),
        sa.Column('ingested_at', sa.DateTime(), nullable=False),
        sa.Column('is_synthetic', sa.Boolean(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ),
        sa.ForeignKeyConstraint(['ingested_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('record_code')
    )
    op.create_index(op.f('ix_source_records_record_code'), 'source_records', ['record_code'], unique=True)

    # Extracted Entities
    op.create_table(
        'extracted_entities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('source_record_id', sa.String(length=36), nullable=False),
        sa.Column('entity_type', sa.String(length=32), nullable=False),
        sa.Column('raw_value', sa.String(length=256), nullable=False),
        sa.Column('normalized_value', sa.String(length=256), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='pending'),
        sa.Column('reviewed_by', sa.String(length=36), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['source_record_id'], ['source_records.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Graph Entities Mirror
    op.create_table(
        'graph_entities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('neo4j_node_id', sa.String(length=128), nullable=False),
        sa.Column('entity_type', sa.String(length=32), nullable=False),
        sa.Column('display_name', sa.String(length=256), nullable=False),
        sa.Column('is_masked_sensitive', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('neo4j_node_id')
    )
    op.create_index(op.f('ix_graph_entities_neo4j_node_id'), 'graph_entities', ['neo4j_node_id'], unique=True)

    # Entity Match Candidates
    op.create_table(
        'entity_match_candidates',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('entity_a_id', sa.String(length=36), nullable=False),
        sa.Column('entity_b_id', sa.String(length=36), nullable=False),
        sa.Column('match_confidence', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('match_reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='pending'),
        sa.Column('decided_by', sa.String(length=36), nullable=True),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['decided_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['entity_a_id'], ['graph_entities.id'], ),
        sa.ForeignKeyConstraint(['entity_b_id'], ['graph_entities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Alerts
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('rule_name', sa.String(length=128), nullable=False),
        sa.Column('threshold_description', sa.Text(), nullable=True),
        sa.Column('supporting_entity_ids', sa.JSON(), nullable=True),
        sa.Column('supporting_record_ids', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=24), nullable=False, server_default='requires_review'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('dismissed_by', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['dismissed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('seq_no', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('target_type', sa.String(length=64), nullable=True),
        sa.Column('target_id', sa.String(length=128), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('record_hash', sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('seq_no')
    )
    op.create_index(op.f('ix_audit_logs_seq_no'), 'audit_logs', ['seq_no'], unique=True)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('alerts')
    op.drop_table('entity_match_candidates')
    op.drop_table('graph_entities')
    op.drop_table('extracted_entities')
    op.drop_table('source_records')
    op.drop_table('cases')
    op.drop_table('users')
