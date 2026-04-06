import { Button, Input } from "@govgraph/ui";

type SearchFormProps = {
  defaultValue?: string;
  action?: string;
  placeholder?: string;
};

export function SearchForm({
  defaultValue = "",
  action = "/",
  placeholder = "Search ministers, offices, and departments",
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
      <Button type="submit" className="min-w-32">
        Search
      </Button>
    </form>
  );
}
