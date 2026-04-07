## Canonical data model

The key design decision is to separate **identity**, **relationships**, **metrics**, and **sources**, then version all of them by effective date.

### Core entities

```ts
type NodeType =
  | 'person'
  | 'ministry'
  | 'ministerial_office'
  | 'department'
  | 'administrative_office'
  | 'public_entity'
  | 'program_output'
  | 'capital_project'
  | 'performance_measure'
  | 'budget_document'
  | 'source_document'
  | 'organisation_group'
```

```ts
type EdgeType =
  | 'HOLDS_OFFICE'
  | 'MEMBER_OF_MINISTRY'
  | 'SUPPORTED_BY_DEPARTMENT'
  | 'IN_PORTFOLIO'
  | 'REPORTS_TO'
  | 'RESPONSIBLE_FOR'
  | 'DELIVERS_OUTPUT'
  | 'HAS_PERFORMANCE_MEASURE'
  | 'HAS_CAPITAL_PROJECT'
  | 'FUNDED_BY'
  | 'SUCCEEDED_BY'
  | 'RENAMED_TO'
  | 'MOVED_TO_PORTFOLIO'
  | 'HAS_SOURCE'
```

### Tables

#### `nodes`

Canonical identity table for every graph object.

```sql
create table nodes (
  id uuid primary key,
  node_type text not null,
  canonical_name text not null,
  slug text not null unique,
  status text not null default 'active', -- active | ceased | superseded | draft
  description text,
  website_url text,
  source_confidence text not null default 'high', -- high | medium | low
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

#### `node_aliases`

Needed for renamed departments, alternate spellings, acronyms, and cross-source matching.

```sql
create table node_aliases (
  id uuid primary key,
  node_id uuid not null references nodes(id),
  alias text not null,
  alias_type text not null, -- acronym | former_name | source_name | short_name
  source_document_id uuid references source_documents(id),
  valid_from date,
  valid_to date
);
```

#### `edges`

Relationship table; every relationship is time-bound.

```sql
create table edges (
  id uuid primary key,
  edge_type text not null,
  from_node_id uuid not null references nodes(id),
  to_node_id uuid not null references nodes(id),
  valid_from date,
  valid_to date,
  status text not null default 'active',
  notes text
);
```

When an edge is supported by more than one source document, keep those links in a join table.

```sql
create table edge_source_documents (
  edge_id uuid not null references edges(id),
  source_document_id uuid not null references source_documents(id),
  primary key (edge_id, source_document_id)
);
```

#### `source_documents`

Provenance table for every crawled or imported source.

```sql
create table source_documents (
  id uuid primary key,
  source_type text not null, -- html | pdf | xlsx | csv | api
  source_family text not null, -- budget | gazette | vpsc | vic_gov | parliament
  title text not null,
  source_url text not null unique,
  publisher text not null,
  publication_date date,
  effective_date date,
  retrieved_at timestamptz not null,
  checksum text,
  parser_version text not null,
  licence text,
  raw_storage_path text not null
);
```

#### `source_assertions`

This is the credibility layer: every parsed fact is stored as a structured assertion before normalisation.

```sql
create table source_assertions (
  id uuid primary key,
  source_document_id uuid not null references source_documents(id),
  subject_text text not null,
  predicate text not null,
  object_text text,
  value_json jsonb,
  page_ref text,
  row_ref text,
  extracted_at timestamptz not null,
  confidence text not null
);
```

#### `budget_metrics`

Department, output, or project-level financial values.

```sql
create table budget_metrics (
  id uuid primary key,
  node_id uuid not null references nodes(id),
  metric_family text not null, -- output_funding | expense | revenue | asset | liability | capex
  metric_name text not null,
  amount numeric,
  currency text not null default 'AUD',
  fiscal_year text not null, -- e.g. 2025-26
  budget_phase text not null default 'budget', -- budget | revised | actual if later added
  source_document_id uuid not null references source_documents(id),
  notes text
);
```

#### `performance_measures`

Performance targets and results.

```sql
create table performance_measures (
  id uuid primary key,
  node_id uuid not null references nodes(id), -- usually department or output
  measure_name text not null,
  measure_unit text,
  target_value text,
  actual_value text,
  period_label text not null,
  source_document_id uuid not null references source_documents(id)
);
```

#### `workforce_metrics`

Headcount, FTE, executives, organisation type.

```sql
create table workforce_metrics (
  id uuid primary key,
  node_id uuid not null references nodes(id),
  metric_name text not null, -- headcount | fte | executives_headcount | executives_fte
  metric_value numeric not null,
  as_at_date date not null,
  source_document_id uuid not null references source_documents(id)
);
```

#### `capital_projects`

Capital-program overlay.

```sql
create table capital_projects (
  id uuid primary key,
  node_id uuid references nodes(id), -- owning dept/entity if known
  project_name text not null,
  category text,
  project_type text,
  location_text text,
  investment_amount numeric,
  fiscal_year text,
  source_document_id uuid not null references source_documents(id)
);
```

#### `change_events`

A structured layer specifically for AAO and ministry changes.

```sql
create table change_events (
  id uuid primary key,
  event_type text not null, -- created | abolished | renamed | transferred | portfolio_changed
  affected_node_id uuid references nodes(id),
  from_node_id uuid references nodes(id),
  to_node_id uuid references nodes(id),
  effective_date date not null,
  source_document_id uuid not null references source_documents(id),
  summary text not null
);
```

### Normalisation rules

* Every real-world organisation gets one canonical `node`.
* Every source-specific label lands first in `node_aliases` or `source_assertions`.
* A change in name does not automatically create a new node; an abolition or legal successor does.
* Relationships are never overwritten in place; old edges close with `valid_to`, new edges open with `valid_from`.
* Budget, workforce, and performance values are append-only by period and source.
