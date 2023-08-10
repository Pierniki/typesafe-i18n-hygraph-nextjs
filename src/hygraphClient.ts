import { GraphQLClient } from "graphql-request";
import { graphql } from "./gql";
import { i18n, type HygraphLocaleEnum, type Locale } from "./i18n";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

const hygraphClient = (init?: RequestInit) =>
  new GraphQLClient(process.env.HYGRAPH_CONTENT_API_URL!, {
    fetch: (url, config) => fetch(url, { ...config, ...init }),
  });

const getBlogposts = graphql(`
  query getBlogposts($locales: [Locale!] = [en]) {
    blogposts(locales: $locales) {
      id
      title
      content {
        html
      }
    }
  }
`);

export const useHygraphClient = (inputLocale: Locale) => {
  const locale = inputLocale.replace("-", "_") as HygraphLocaleEnum;

  const makeRequest =
    <TQuery, TVariables>(document: TypedDocumentNode<TQuery, TVariables>) =>
    (init?: RequestInit) =>
      hygraphClient(init).request(document, {
        locales: [locale],
      });

  return {
    getBlogposts: makeRequest(getBlogposts),
  };
};
