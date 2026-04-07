CREATE TYPE "public"."administration_mode" AS ENUM('sole', 'joint', 'joint_and_several', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."administration_scope" AS ENUM('whole_act', 'provision_list', 'residual');--> statement-breakpoint
CREATE TYPE "public"."alias_type" AS ENUM('acronym', 'former_name', 'source_name', 'short_name');--> statement-breakpoint
CREATE TYPE "public"."assertion_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."budget_phase" AS ENUM('budget', 'revised', 'actual');--> statement-breakpoint
CREATE TYPE "public"."change_event_type" AS ENUM('created', 'abolished', 'renamed', 'transferred', 'portfolio_changed');--> statement-breakpoint
CREATE TYPE "public"."edge_type" AS ENUM('HOLDS_OFFICE', 'MEMBER_OF_MINISTRY', 'SUPPORTED_BY_DEPARTMENT', 'IN_PORTFOLIO', 'REPORTS_TO', 'RESPONSIBLE_FOR', 'DELIVERS_OUTPUT', 'HAS_PERFORMANCE_MEASURE', 'HAS_CAPITAL_PROJECT', 'FUNDED_BY', 'SUCCEEDED_BY', 'RENAMED_TO', 'MOVED_TO_PORTFOLIO', 'HAS_SOURCE');--> statement-breakpoint
CREATE TYPE "public"."general_order_heading_style" AS ENUM('plain', 'except', 'scoped_list');--> statement-breakpoint
CREATE TYPE "public"."general_order_parse_status" AS ENUM('parsed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."general_order_rule_kind" AS ENUM('default', 'listed_scope', 'residual');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('person', 'ministry', 'ministerial_office', 'department', 'administrative_office', 'public_entity', 'program_output', 'capital_project', 'performance_measure', 'budget_document', 'source_document', 'organisation_group');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('active', 'ceased', 'superseded', 'draft');--> statement-breakpoint
CREATE TYPE "public"."source_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."source_family" AS ENUM('budget', 'gazette', 'vpsc', 'vic_gov', 'parliament');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('html', 'pdf', 'xlsx', 'csv', 'api');--> statement-breakpoint
CREATE TABLE "act_administration_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_document_id" uuid NOT NULL,
	"effective_date" date,
	"office_name" text NOT NULL,
	"act_name" text NOT NULL,
	"heading_text" text NOT NULL,
	"heading_style" "general_order_heading_style" NOT NULL,
	"rule_kind" "general_order_rule_kind" NOT NULL,
	"scope" "administration_scope" NOT NULL,
	"raw_text" text NOT NULL,
	"scope_text" text,
	"administration_mode" "administration_mode" NOT NULL,
	"administering_office_names" jsonb NOT NULL,
	"provision_references" jsonb NOT NULL,
	"nested_raw_texts" jsonb NOT NULL,
	"parse_status" "general_order_parse_status" NOT NULL,
	"unparsed_tail" text,
	"kanon_assistance" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" "change_event_type" NOT NULL,
	"affected_node_id" uuid,
	"from_node_id" uuid,
	"to_node_id" uuid,
	"effective_date" date NOT NULL,
	"source_document_id" uuid NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edge_source_documents" (
	"edge_id" uuid NOT NULL,
	"source_document_id" uuid NOT NULL,
	CONSTRAINT "edge_source_documents_edge_id_source_document_id_pk" PRIMARY KEY("edge_id","source_document_id")
);
--> statement-breakpoint
CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"edge_type" "edge_type" NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "budget_metrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_id" uuid NOT NULL,
	"metric_family" text NOT NULL,
	"metric_name" text NOT NULL,
	"amount" numeric,
	"currency" text DEFAULT 'AUD' NOT NULL,
	"fiscal_year" text NOT NULL,
	"budget_phase" "budget_phase" DEFAULT 'budget' NOT NULL,
	"source_document_id" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "capital_projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_id" uuid,
	"project_name" text NOT NULL,
	"category" text,
	"project_type" text,
	"location_text" text,
	"investment_amount" numeric,
	"fiscal_year" text,
	"source_document_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_measures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_id" uuid NOT NULL,
	"measure_name" text NOT NULL,
	"measure_unit" text,
	"target_value" text,
	"actual_value" text,
	"period_label" text NOT NULL,
	"source_document_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workforce_metrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_id" uuid NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" numeric NOT NULL,
	"as_at_date" date NOT NULL,
	"source_document_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"alias_type" "alias_type" NOT NULL,
	"source_document_id" uuid,
	"valid_from" date,
	"valid_to" date
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"node_type" "node_type" NOT NULL,
	"canonical_name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"website_url" text,
	"source_confidence" "source_confidence" DEFAULT 'high' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_assertions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_document_id" uuid NOT NULL,
	"subject_text" text NOT NULL,
	"predicate" text NOT NULL,
	"object_text" text,
	"value_json" jsonb,
	"page_ref" text,
	"row_ref" text,
	"extracted_at" timestamp with time zone NOT NULL,
	"confidence" "assertion_confidence" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_type" "source_type" NOT NULL,
	"source_family" "source_family" NOT NULL,
	"title" text NOT NULL,
	"source_url" text NOT NULL,
	"publisher" text NOT NULL,
	"publication_date" date,
	"effective_date" date,
	"retrieved_at" timestamp with time zone NOT NULL,
	"checksum" text,
	"parser_version" text NOT NULL,
	"licence" text,
	"raw_storage_path" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "act_administration_rules" ADD CONSTRAINT "act_administration_rules_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_affected_node_id_nodes_id_fk" FOREIGN KEY ("affected_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_from_node_id_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_to_node_id_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_source_documents" ADD CONSTRAINT "edge_source_documents_edge_id_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_source_documents" ADD CONSTRAINT "edge_source_documents_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_from_node_id_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_to_node_id_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_metrics" ADD CONSTRAINT "budget_metrics_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_metrics" ADD CONSTRAINT "budget_metrics_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_projects" ADD CONSTRAINT "capital_projects_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_projects" ADD CONSTRAINT "capital_projects_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_measures" ADD CONSTRAINT "performance_measures_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_measures" ADD CONSTRAINT "performance_measures_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_metrics" ADD CONSTRAINT "workforce_metrics_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_metrics" ADD CONSTRAINT "workforce_metrics_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_aliases" ADD CONSTRAINT "node_aliases_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_aliases" ADD CONSTRAINT "node_aliases_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_assertions" ADD CONSTRAINT "source_assertions_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "act_administration_rules_source_document_idx" ON "act_administration_rules" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "act_administration_rules_office_lookup_idx" ON "act_administration_rules" USING btree ("office_name","act_name");--> statement-breakpoint
CREATE INDEX "edge_source_documents_source_document_idx" ON "edge_source_documents" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "edges_lookup_idx" ON "edges" USING btree ("edge_type","from_node_id","to_node_id");--> statement-breakpoint
CREATE INDEX "node_aliases_node_alias_idx" ON "node_aliases" USING btree ("node_id","alias");--> statement-breakpoint
CREATE UNIQUE INDEX "nodes_slug_idx" ON "nodes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "nodes_type_name_idx" ON "nodes" USING btree ("node_type","canonical_name");--> statement-breakpoint
CREATE UNIQUE INDEX "source_documents_source_url_idx" ON "source_documents" USING btree ("source_url");
