Below is a concrete build package: a PRD, the canonical schema, the ingestion jobs, and the first 10 source connectors.

The plan assumes an official-source-first product. That is appropriate here because the Victorian Budget site already exposes Budget Papers 1–5, the Department Performance Statement, and “Projects in your area”; VPSC publishes current portfolios, a searchable list of public sector employers, and 2025 workforce data; and machinery-of-government changes are published through Administrative Arrangements Orders in the Victoria Government Gazette. The Vic government directory is useful but explicitly incomplete for all public entities, so it should be treated as one source among several rather than the master registry. ([Budget Victoria][1])

## Product requirements document

### Working title

Victorian Government Map

### One-line product summary

An interactive, source-linked map of the Victorian Government that lets users explore ministers, portfolios, departments, public entities, budget funding, capital projects, workforce data, and machinery-of-government changes over time.

### Problem

Victorian Government structure and spending are published across multiple systems: the Budget website, the Gazette, VPSC directories, minister pages, and datasets. Each source is useful in isolation, but none provides a single navigable model of “who exists, where they sit, who is responsible, what they cost, and how the structure changed.” Official sources confirm this fragmentation: the Budget site separates service delivery, capital, and finance views; VPSC separates portfolios, employers, and workforce data; and the Vic directory itself notes that it does not include all public entities. ([Budget Victoria][1])

### Primary users

Policy staff, journalists, researchers, parliamentary staff, public servants, grant and procurement teams, consultants, civic-tech users, and engaged citizens.

### Core user jobs

A user should be able to:

* search for a minister, department, or entity and see where it sits
* see which minister and portfolio are responsible for a department or public entity
* inspect department-level outputs, performance measures, financials, and capital projects
* compare structure and funding between two dates or Budget years
* follow every visible fact back to an official source

### Non-goals for MVP

* exhaustive coverage of every school, campus, hospital site, or local service point
* predictive analytics
* editorial commentary
* replacing the source documents themselves
* crowdsourced editing

### Product principles

* Official-source-first
* Every fact is traceable
* Structure first, enrichment second
* Time-version everything
* Prefer completeness at the top of the graph over shallow long-tail coverage

### MVP scope

Ship these in v1:

* current ministers
* current portfolios
* current departments
* administrative offices
* a strong first layer of public entities / employers
* department profile pages
* relationship graph and tree view
* budget overlays from Budget Paper 3, Budget Paper 4, Budget Paper 5, Department Performance Statement, and departmental financial/performance datasets
* workforce overlays at department/entity level where available
* machinery-of-government timeline for major changes from AAOs

### Nice-to-have after MVP

* regional/project map overlays
* board and board-member overlays
* procurement / mandated-agency overlays
* advanced comparison mode
* downloadable graph snapshots
* public API

### Success metrics

For MVP, measure:

* search success rate
* time to locate responsible minister for an entity
* time to find budget/performance information for a department
* source citation clickthrough rate
* percentage of visible nodes with at least one primary-source citation
* percentage of department pages with budget, workforce, and performance overlays

## Initial graph rules

These should be hard-coded as business logic and tested:

1. A `person` can hold multiple portfolios at the same time.
2. A `portfolio` can be supported by one primary department at a point in time.
3. A `department` can own many outputs, performance measures, and capital projects.
4. A `public_entity` can belong to a portfolio without being structurally “inside” the department.
5. Gazette-based changes override website-directory structure when dates conflict.
6. Source assertions are immutable; canonical relationships are derived.

## First 10 source connectors

These are the first connectors I would build, in order.

### 1. Victorian Budget index connector

Purpose: crawl the current Budget hub and register links to Budget Papers 1–5, Department Performance Statement, Budget Overview, and “Projects in your area.” The 2025/26 Budget page explicitly lists all of these. ([Budget Victoria][1])

Output:

* `source_documents` for each linked Budget artifact
* crawl queue items for downstream parsers

### 2. Budget Paper 3: Service Delivery connector

Purpose: extract departmental outputs, service groupings, output funding, and performance-target references. Official Budget pages describe BP3 as the document that outlines the goods and services delivered by departments and includes a breakdown of output funding. ([Victorian Budget 2023][2])

Output:

* `program_output` nodes
* `DELIVERS_OUTPUT` edges
* `budget_metrics` rows for output funding
* output-to-department mappings

### 3. Budget Paper 4 / capital program connector

Purpose: extract capital projects and portfolio/department ownership. The Budget site and long-running budget data files already separate the State Capital Program as its own layer. ([Budget Victoria][1])

Output:

* `capital_projects`
* `HAS_CAPITAL_PROJECT` edges
* project location and investment fields where available

### 4. Budget Paper 5 / statement of finances connector

Purpose: extract department-level and whole-of-state finance metrics from the Statement of Finances layer listed on the 2025/26 Budget site. ([Budget Victoria][1])

Output:

* `budget_metrics` for expenses, revenue, assets, liabilities, cash flow summaries as needed

### 5. Department Performance Statement connector

Purpose: extract objectives, outputs, and medium-term output performance measures. The Budget site describes the Department Performance Statement as covering departmental objectives, outputs, and associated output performance measures. ([Victorian Budget 2024][3])

Output:

* `performance_measures`
* links from departments and outputs to measures

### 6. DataVic budget datasets connector

Purpose: load downloadable CSV/XLSX budget datasets instead of scraping every page. DataVic currently lists many Victorian State Budget datasets, including 2025–26 departmental financial statements and departmental performance measures, and it also hosts raw data used for prior interactive budget map visualisations. ([Data Vic][4])

Output:

* bulk `budget_metrics`
* bulk `performance_measures`
* capital/map-ready project data
* a cleaner machine-readable backfill path

### 7. VPSC portfolios connector

Purpose: ingest current portfolio-to-department structure. VPSC states that its portfolios page lists the departments and ministerial portfolios in the Victorian public sector and notes the page accuracy date. ([VPSC][5])

Output:

* `portfolio` nodes
* `department` nodes where missing
* `SUPPORTED_BY_DEPARTMENT` edges
* portfolio metadata snapshot

### 8. VPSC public sector employers connector

Purpose: ingest the entity registry. VPSC’s public-sector-employers directory is searchable by portfolio, employer type, public sector body type, industry, and sub-sector, and is updated with a dated snapshot. ([VPSC][6])

Output:

* `public_entity` nodes
* `IN_PORTFOLIO` edges
* body-type metadata
* candidate `administrative_office` nodes

### 9. Premier / Parliament ministry connector

Purpose: ingest current ministers and portfolio assignments, cross-checked across executive and parliamentary pages. Vic.gov says the Premier appoints ministers who are allocated responsibility for specific areas of government, and Parliament states ministers are responsible for one or more portfolios and for the relevant department. ([Victoria Government][7])

Output:

* `person` nodes
* `HOLDS_PORTFOLIO` edges
* `MEMBER_OF_MINISTRY` edges

### 10. Gazette AAO connector

Purpose: ingest legal machinery-of-government changes. Administrative Arrangements Orders are published in the Gazette with title, authorising provision, and commencement/effective dates, making them the authoritative source for dated structural changes. ([Victoria Government Gazette][8])

Output:

* `change_events`
* `RENAMED_TO`, `SUCCEEDED_BY`, `MOVED_TO_PORTFOLIO`, `REPORTS_TO` updates
* valid-from / valid-to changes to existing edges

## Ingestion jobs

These are the concrete jobs I would create in `apps/worker`.

### 1. `crawl_budget_index`

Frequency: manual + monthly during quiet periods + daily around Budget release
Inputs: budget index URL
Outputs: discovered Budget documents, changed checksums, crawl queue items

### 2. `import_budget_document`

Frequency: fan-out from index changes
Inputs: source document URL
Logic:

* fetch PDF/XLSX/CSV/HTML
* store raw artifact
* register `source_document`
* route to parser by file type and family

### 3. `parse_bp3_service_delivery`

Frequency: on new BP3
Outputs:

* output nodes
* output-to-department edges
* output funding metrics

### 4. `parse_dps_performance_measures`

Frequency: on new DPS dataset or PDF
Outputs:

* performance measures
* links to departments / outputs

### 5. `parse_capital_program`

Frequency: on new BP4 or dataset
Outputs:

* capital project records
* location and investment fields

### 6. `parse_statement_of_finances`

Frequency: on new BP5 / datasets
Outputs:

* finance metrics by department / whole-of-state nodes

### 7. `sync_vpsc_portfolios`

Frequency: weekly
Outputs:

* current portfolio snapshot
* changed department/portfolio relationships

### 8. `sync_vpsc_employers`

Frequency: weekly
Outputs:

* public entity updates
* portfolio assignments
* body-type changes

### 9. `sync_ministry`

Frequency: daily
Inputs: Premier and Parliament ministry pages
Outputs:

* minister portfolio assignments
* discrepancy alerts if the two sources disagree

### 10. `parse_aao_pdf`

Frequency: daily on Gazette updates
Outputs:

* dated change events
* successor/predecessor relations
* closed/opened graph edges

### 11. `sync_workforce_datasets`

Frequency: annual + manual refresh
Outputs:

* workforce headcount/FTE by organisation
* executive counts where applicable

### 12. `resolve_entities`

Frequency: after every structural import
Purpose: canonicalise names across Budget, VPSC, Gazette, and ministry sources
Outputs:

* alias mappings
* proposed merges/splits for human review

### 13. `rebuild_search_index`

Frequency: after normalisation batches
Outputs:

* search documents for nodes, aliases, and projects

### 14. `materialise_graph_views`

Frequency: after structural changes
Outputs:

* denormalised view tables for UI tree and graph queries

## Parser strategy by source type

### HTML pages

Use CSS selector extraction first.
Good for:

* ministry pages
* VPSC portfolios
* VPSC employer directory pagination
* budget landing pages

### PDF

Use structured PDF extraction plus page/line citation mapping.
Good for:

* AAOs
* BP3/BP4/BP5 where datasets are not sufficient

### XLSX / CSV

Treat as preferred ingest format over PDF when both exist.
Good for:

* workforce data
* departmental performance measures
* departmental financial statements
* map-supporting budget data

## Matching and deduplication strategy

Entity resolution is the hardest part, so the matching rules should be explicit.

### Match keys

* exact canonical name
* normalised name without “Department of”, “Victorian”, “The”
* acronym
* alias table
* source family priority
* portfolio context
* effective-date overlap

### Source priority for structure

1. Gazette AAO
2. Premier / Parliament ministry pages
3. VPSC portfolios
4. VPSC employers
5. Vic.gov directory
6. Budget documents

### Source priority for metrics

1. DataVic structured datasets
2. Budget Papers / Department Performance Statement
3. project web pages derived from the same budget material

### Review flags

Create manual-review tasks when:

* two sources map one label to different canonical nodes
* an AAO introduces a transfer without a matched destination
* a Budget entity has no matching department/entity node
* a ministry page and Parliament page disagree on portfolio assignment

## API surface for the app

These are the minimum API endpoints I would design.

* `GET /search?q=`
* `GET /nodes/:slug`
* `GET /nodes/:slug/relationships`
* `GET /nodes/:slug/metrics?fiscalYear=2025-26`
* `GET /nodes/:slug/timeline`
* `GET /compare?leftDate=&rightDate=&node=`
* `GET /projects?postcode=&suburb=&portfolio=`
* `GET /sources/:id`
* `GET /graph?asOfDate=`

## UI views

### 1. Global search

Search ministers, departments, entities, outputs, and projects.

### 2. Node profile

For any node, show:

* canonical name
* type
* current relationships
* timeline
* budget metrics
* workforce metrics
* performance measures
* source citations

### 3. Graph view

Interactive relation map with filters:

* current / as-of date
* ministries only
* departments only
* public entities only
* show budget overlay
* show workforce overlay

### 4. Timeline view

Chronological list of change events from AAOs and ministry changes.

### 5. Budget view

Department/portfolio cards with output funding, key performance measures, capital projects.

## Suggested repo layout

```text
apps/
  web/
  api/
  worker/
packages/
  db/
    src/schema/
      nodes.ts
      edges.ts
      sources.ts
      metrics.ts
      change-events.ts
  domain/
    src/government/
      node-types.ts
      edge-types.ts
      source-priority.ts
      entity-resolution.ts
  parsers/
    src/budget/
    src/gazette/
    src/vpsc/
    src/ministry/
  ui/
```


## Risks and controls

### Risk: incomplete public-entity coverage

The Vic directory explicitly says it does not include all public entities, and VPSC points users to its employer list and other sector-specific materials. Control: treat the directory as a discovery source, not the master registry. ([Victoria Government][9])

### Risk: date ambiguity

AAOs can take effect on dates earlier than publication, and VPSC portfolio and workforce pages publish “accurate as of” or “as at June 2025” timestamps. Control: store both publication date and effective/as-at date on every record. ([Victoria Government Gazette][8])

### Risk: parser brittleness

Budget data appears in both human-readable pages and machine-readable datasets. Control: prefer DataVic/XLSX/CSV where available and use PDF parsing as a fallback. ([Data Vic][4])

### Risk: licensing uncertainty

The Budget site states that information is generally reusable under Creative Commons Attribution 4.0, with exceptions. Control: store source-family licence metadata and keep raw-source attribution visible. ([Budget Victoria][10])

## Final recommendation

Build the product around a versioned relational graph with source assertions, not a front-end-first visualisation. The official source landscape already supports a strong MVP because Budget 2025/26 exposes the major budget document families, VPSC exposes current portfolios, employers, and workforce data, and the Gazette exposes dated machinery-of-government changes. That gives you enough for a defensible first release without trying to solve the entire Victorian public sector in one pass. ([Budget Victoria][1])

The best next step is to turn this into three concrete artifacts: a Drizzle schema, a source registry config, and a Trigger.dev job map.

[1]: https://www.budget.vic.gov.au/budget-papers?utm_source=chatgpt.com "2025/26 State Budget papers"
[2]: https://www.2023.budget.vic.gov.au/budget-papers?utm_source=chatgpt.com "Budget papers | Victorian Budget 23/24"
[3]: https://www.2024.budget.vic.gov.au/budget-papers?utm_source=chatgpt.com "Budget papers - Helping Families | Victorian Budget 24/25"
[4]: https://discover.data.vic.gov.au/dataset?organization=victorian-state-budget&utm_source=chatgpt.com "Dataset - Victorian Government Data Vic"
[5]: https://www.vpsc.vic.gov.au/working-public-sector/conduct-integrity-and-values/working-ministers/working-ministerial-officer/portfolios?utm_source=chatgpt.com "Portfolios"
[6]: https://www.vpsc.vic.gov.au/about-public-sector/list-public-sector-employers?utm_source=chatgpt.com "List of public sector employers"
[7]: https://www.vic.gov.au/premier-and-ministers?utm_source=chatgpt.com "The Premier and ministers"
[8]: https://www.gazette.vic.gov.au/gazette/Gazettes2025/GG2025S438.pdf?utm_source=chatgpt.com "Victoria Government Gazette"
[9]: https://www.vic.gov.au/find-a-vic-gov-department-agency-or-service?utm_source=chatgpt.com "Find a Vic Gov department, agency or service"
[10]: https://www.budget.vic.gov.au/copyright?utm_source=chatgpt.com "Copyright | Victorian Budget 25/26"
