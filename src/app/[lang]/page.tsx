import { useHygraphClient } from "../../hygraphClient";
import { Locale } from "../../i18n";

export default async function IndexPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const client = useHygraphClient(lang);
  const { blogposts } = await client.getBlogposts();

  return <div>{JSON.stringify(blogposts)}</div>;
}
