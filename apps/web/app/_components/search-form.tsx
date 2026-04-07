import { Button, Input } from "@govgraph/ui";

type SearchFormProps = {
  defaultValue?: string;
  action?: string;
  placeholder?: string;
  size?: "md" | "lg";
};

export function SearchForm({
  defaultValue = "",
  action = "/",
  placeholder = "Search ministers, portfolios, and departments",
  size = "lg",
}: SearchFormProps) {
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <Input
        defaultValue={defaultValue}
        name="q"
        placeholder={placeholder}
        aria-label="Search the government map"
        className="min-w-0 flex-1"
      />
      <Button type="submit" className="min-w-32" size={size}>
        Search
      </Button>
    </form>
  );
}
