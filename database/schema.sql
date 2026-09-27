-- ==============================================================================
-- DATABASE SCHEMA: ENTERPRISE AUTOMOTIVE SHOWROOM AI AGENT SYSTEM
-- Multi-Tenant PostgreSQL 16 + pgvector Extension
-- Standards: 3NF, Zero Data Leakage, Idempotency Ledger, Audit Logging
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ------------------------------------------------------------------------------
-- 1. MULTI-TENANCY & IDENTITY DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE business_accounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    hotline VARCHAR(20) NOT NULL,
    working_hours VARCHAR(100) DEFAULT '08:00 - 18:00',
    kb_version VARCHAR(20) DEFAULT 'v1.0',
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id VARCHAR(50) REFERENCES business_accounts(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL CHECK (role IN ('CUSTOMER', 'SALES_CONSULTANT', 'SALES_MANAGER', 'DEALER_MANAGER', 'SYSTEM_ADMIN')),
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_business_role ON users(business_id, role);

-- ------------------------------------------------------------------------------
-- 2. VEHICLE & INVENTORY MANAGEMENT DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    model_name VARCHAR(150) NOT NULL,
    trim_level VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    model_year INT NOT NULL,
    listed_price NUMERIC(15, 2) NOT NULL CHECK (listed_price > 0),
    deposit_required NUMERIC(15, 2) NOT NULL DEFAULT 20000000,
    available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    rolling_price_estimates JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_available_for_test_drive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_business ON vehicles(business_id);

CREATE TABLE price_update_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    previous_price NUMERIC(15, 2) NOT NULL,
    new_price NUMERIC(15, 2) NOT NULL,
    source_system VARCHAR(50) NOT NULL DEFAULT 'DMS_SYNC',
    approved_by_user_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ROLLED_BACK')),
    approval_notes TEXT,
    embedding_reindexed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. PROMOTIONS & RULE ENGINE DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE promotions (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED')),
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE NOT NULL,
    applicable_vehicle_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    rule_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    benefit_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    approved_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_business_active ON promotions(business_id, status);

-- ------------------------------------------------------------------------------
-- 4. KNOWLEDGE BASE & PGVECTOR (RAG RETRIEVAL)
-- ------------------------------------------------------------------------------

CREATE TABLE kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(150),
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kb_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    section_title VARCHAR(255),
    content TEXT NOT NULL,
    citation_metadata JSONB NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kb_chunks_business ON kb_chunks(business_id);
-- HNSW Index for cosine distance vector search
CREATE INDEX idx_kb_chunks_vector ON kb_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ------------------------------------------------------------------------------
-- 5. CONVERSATION, STATE & MEMORY DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE conversations (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id),
    state VARCHAR(30) NOT NULL DEFAULT 'AI_ACTIVE' CHECK (state IN ('AI_ACTIVE', 'HANDOFF_PENDING', 'HUMAN_ACTIVE', 'RESOLVED')),
    assigned_consultant_id UUID REFERENCES users(id),
    cycle_id INT DEFAULT 1,
    lead_intent_score INT DEFAULT 0 CHECK (lead_intent_score BETWEEN 0 AND 100),
    summary_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maximum 1 active conversation per (customer_id, business_id) at a time
CREATE UNIQUE INDEX uq_active_customer_conversation 
ON conversations (customer_id, business_id) 
WHERE state != 'RESOLVED';

CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('CUSTOMER', 'AI_AGENT', 'EMPLOYEE', 'SYSTEM')),
    sender_id VARCHAR(100),
    client_message_id VARCHAR(100),
    sequence_number INT NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_seq ON messages(conversation_id, sequence_number);

CREATE TABLE customer_memories (
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    confirmed_facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    intent_summary TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, business_id)
);

-- ------------------------------------------------------------------------------
-- 6. APPOINTMENTS & HANDOFF DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE test_drive_bookings (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN ('TEST_DRIVE', 'IN_PERSON_CONSULTATION')),
    location VARCHAR(255) NOT NULL,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    assigned_consultant_id UUID REFERENCES users(id),
    special_notes TEXT,
    idempotency_request_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_business_date ON test_drive_bookings(business_id, slot_start);

CREATE TABLE handoff_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    business_id VARCHAR(50) NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'customer_requested',
        'complaint_escalation',
        'capability_exceeded',
        'price_negotiation_out_of_bounds',
        'conflicting_price_source',
        'no_approved_source'
    )),
    urgency_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    claimed_by_consultant_id UUID REFERENCES users(id),
    claimed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_handoff_pending ON handoff_cases(business_id, claimed_at) WHERE claimed_at IS NULL;

-- ------------------------------------------------------------------------------
-- 7. TOOL EXECUTION LEDGER & USAGE AUDIT DOMAIN
-- ------------------------------------------------------------------------------

CREATE TABLE tool_executions (
    request_id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    business_id VARCHAR(50) NOT NULL,
    input_payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('RECEIVED', 'VALIDATED', 'EXECUTED', 'FAILED', 'UNKNOWN')),
    result_data JSONB,
    error_message TEXT,
    execution_duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id VARCHAR(50) NOT NULL,
    conversation_id VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
    latency_ms INT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_audit_business ON usage_audit_logs(business_id, created_at);
