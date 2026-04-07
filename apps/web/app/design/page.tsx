import Link from "next/link";

import { nodeTypes } from "@govgraph/domain";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  KeyValue,
  MetricBar,
  NodeCard,
  NodeTypeBadge,
  PageShell,
  SectionHeader,
  Skeleton,
  SourceCard,
  StatCard,
  Textarea,
  TimelineEntry,
  Tooltip,
  Input,
} from "@govgraph/ui";

const budgetRows = [
  { agency: "Treasury and Finance", budget: 8300000000, workforce: 1450 },
  { agency: "Transport and Planning", budget: 16700000000, workforce: 3940 },
  { agency: "Education", budget: 23200000000, workforce: 2180 },
] as const;

const budgetColumns = [
  { key: "agency", header: "Agency", sortable: true },
  {
    key: "budget",
    header: "Budget",
    sortable: true,
    align: "right" as const,
    format: "currency" as const,
  },
  {
    key: "workforce",
    header: "Workforce",
    sortable: true,
    align: "right" as const,
    format: "number" as const,
  },
] as const;

export default function DesignPage() {
  return (
    <main>
      <PageShell className="gap-[var(--gg-space-10)]">
        <section className="space-y-[var(--gg-space-5)] rounded-[var(--gg-radius-2xl)] border border-[var(--gg-color-border)] bg-[color:rgba(255,250,241,0.8)] p-[var(--gg-space-8)] shadow-[var(--gg-shadow-lg)]">
          <div className="flex flex-wrap gap-[var(--gg-space-3)]">
            <Badge tone="accent">GovGraph Design System</Badge>
            <Badge tone="success">Live preview route</Badge>
          </div>
          <div className="space-y-[var(--gg-space-3)]">
            <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-eyebrow)] text-[var(--gg-color-semantic-text-secondary)]">
              Register aesthetic
            </p>
            <h1 className="max-w-4xl font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-5xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)] sm:text-[length:var(--gg-font-size-6xl)]">
              Typed tokens, shared components, and a calmer way to build the
              atlas.
            </h1>
            <p className="max-w-3xl text-[length:var(--gg-font-size-lg)] leading-[var(--gg-font-line-height-relaxed)] text-[var(--gg-color-semantic-text-secondary)]">
              This page previews the shared system that now drives the live
              pages. It is where new patterns should be checked before they land
              in the atlas proper.
            </p>
          </div>
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-3">
          <StatCard
            label="Token groups"
            value="6"
            description="Colour, type, spacing, radii, shadows, and motion now live in one typed source."
          />
          <StatCard
            label="Node tones"
            value={nodeTypes.length}
            description="Every node type has a distinct badge treatment for faster scanning."
          />
          <StatCard
            label="Preview route"
            value="/design"
            description="A simple in-app showcase beats an unmaintained component playground at this stage."
          />
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Foundation"
              title="Actions and form controls"
              description="Buttons, badges, fields, and text areas all pull from the same token set."
            />
            <Card className="space-y-[var(--gg-space-5)] p-[var(--gg-space-6)]">
              <div className="flex flex-wrap gap-[var(--gg-space-3)]">
                <Button size="sm">Search</Button>
                <Button size="md" tone="ghost">
                  Secondary
                </Button>
                <Button size="lg" tone="danger">
                  Remove
                </Button>
              </div>
              <div className="flex flex-wrap gap-[var(--gg-space-3)]">
                <Badge>Neutral</Badge>
                <Badge tone="accent">Accent</Badge>
                <Badge tone="success">Success</Badge>
                <Badge tone="warning">Warning</Badge>
              </div>
              <div className="space-y-[var(--gg-space-3)]">
                <Input placeholder="Search ministers, offices, and departments" />
                <Textarea placeholder="Notes, source caveats, or editorial guidance." />
              </div>
            </Card>
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Tones"
              title="Node-type badges"
              description="The atlas can now signal record categories consistently instead of inventing a new label style on every page."
            />
            <Card className="flex flex-wrap gap-[var(--gg-space-3)] p-[var(--gg-space-6)]">
              {nodeTypes.map((nodeType) => (
                <NodeTypeBadge key={nodeType} nodeType={nodeType} />
              ))}
            </Card>
          </div>
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Records"
              title="Cards for nodes and sources"
              description="These are the shared display patterns that now power the live atlas pages."
            />
            <div className="grid gap-[var(--gg-space-4)]">
              <NodeCard
                badges={
                  <>
                    <NodeTypeBadge nodeType="department" />
                    <Badge tone="muted">Lead delivery agency</Badge>
                  </>
                }
                description="Supports the education office grouping, child policy, and statewide school governance."
                footer={
                  <Link
                    href="/"
                    className="text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-deep)] underline-offset-4 hover:underline"
                  >
                    Open record
                  </Link>
                }
                title="Department of Education"
              />
              <SourceCard
                action={
                  <a
                    href="https://www.vpsc.vic.gov.au/"
                    className="text-[length:var(--gg-font-size-sm)] font-medium text-[var(--gg-color-accent)] underline-offset-4 hover:underline"
                  >
                    Open source
                  </a>
                }
                badges={
                  <>
                    <Badge>VPSC</Badge>
                    <Badge tone="muted">HTML</Badge>
                  </>
                }
                description="Published by Victorian Public Sector Commission • effective 2025-06-05"
                metadata="Office mapping"
                title="Working with Ministers and Ministerial Officers"
              />
            </div>
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Details"
              title="Compact data patterns"
              description="Key-value rows and bars give us a cleaner way to show structured facts without falling back to ad hoc grids."
            />
            <Card className="space-y-[var(--gg-space-5)] p-[var(--gg-space-6)]">
              <dl>
                <KeyValue label="Office group" value="Education" />
                <KeyValue label="Supporting department" value="Department of Education" />
                <KeyValue label="Current ministry" value="Allan Ministry" />
              </dl>
              <MetricBar
                detail="Share of a fictional 25,000 workforce comparator used for previewing."
                label="Education workforce"
                max={25000}
                value={2180}
              />
              <MetricBar
                detail="Illustrative budget bar for future fiscal comparisons."
                label="Transport budget"
                max={25000000000}
                tone="deep"
                value={16700000000}
                valueLabel="$16.7B"
              />
            </Card>
          </div>
        </section>

        <section className="space-y-[var(--gg-space-4)]">
          <SectionHeader
            eyebrow="Data"
            title="Sortable tables"
            description="Budget and workforce views can use one shared table rather than inventing a fresh layout every time."
            trailing={
              <Tooltip content="Columns marked SORT can be reordered directly in the table.">
                <span className="inline-flex rounded-[var(--gg-radius-full)] border border-[var(--gg-color-border)] px-[var(--gg-space-3)] py-[var(--gg-space-1)] text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)]">
                  Table help
                </span>
              </Tooltip>
            }
          />
          <DataTable
            caption="Illustrative budget and workforce table"
            columns={budgetColumns}
            rows={budgetRows}
          />
        </section>

        <section className="grid gap-[var(--gg-space-6)] lg:grid-cols-[1fr_1fr]">
          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="States"
              title="Empty and loading surfaces"
              description="The quiet states now match the rest of the product instead of dropping back to generic placeholders."
            />
            <EmptyState
              action={<Button tone="ghost">Clear filters</Button>}
              description="Try a broader search phrase or remove a filter to bring records back into view."
              title="No records match this combination"
            />
            <Card className="space-y-[var(--gg-space-3)] p-[var(--gg-space-6)]">
              <Skeleton className="w-32" />
              <Skeleton className="w-full" />
              <Skeleton className="w-4/5" />
              <Skeleton shape="card" />
            </Card>
          </div>

          <div className="space-y-[var(--gg-space-4)]">
            <SectionHeader
              eyebrow="Timeline"
              title="Event cards"
              description="Machinery-of-government changes can use a consistent dated entry instead of bespoke page markup."
            />
            <div className="grid gap-[var(--gg-space-4)]">
              <TimelineEntry
                date="5 December 2024"
                description="Office responsibilities were regrouped under a simplified education cluster."
                detail="Machinery of Government"
                title="Education office grouping updated"
              />
              <TimelineEntry
                date="7 February 2025"
                description="Source parsing refreshed after the latest parliamentary ministry page update."
                detail="Source refresh"
                title="Current ministry snapshot regenerated"
              />
            </div>
          </div>
        </section>
      </PageShell>
    </main>
  );
}
