import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, EmptyState, Text, List } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const rawResponse = await admin.graphql(
    `#graphql
    query getOrders($first: Int) {
      orders(first: $first, reverse: true) {
        nodes {
          id
          name
          createdAt
          statusPageUrl
          tags
          customer {
            id
            email
            phone
          }
          phone
          email
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 250) {
            nodes {
              title
              originalTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }`,
    {
      variables: {
        first: 100,
      },
    },
  );

  const responseJson = await rawResponse.json();

  return { orders: responseJson.data.orders };
};

export default function Index() {
  const { orders } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  return (
    <Page
      title="Remix App"
      primaryAction={{
        content: "Create New Order",
        onAction: () => navigate("/app/create-order"),
      }}
    >
      <Layout>
        {orders?.nodes?.length === 0 ? (
          <Layout.Section>
            <Card>
              <EmptyState
                heading="You haven't placed any orders yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                action={{ content: "Create Order", url: "/create-order" }}
              >
                <p>Create your first order to see it here.</p>
              </EmptyState>
            </Card>
          </Layout.Section>
        ) : (
          <>
            {orders?.nodes?.map((node: any) => (
              <Layout.Section key={node.id}>
                <Card>
                  <Text as="h2" variant="bodyMd">
                    Order {node.name}
                  </Text>
                  <Text as="p">
                    Date: {new Date(node.createdAt).toLocaleString()}
                  </Text>
                </Card>
                <Card>
                  <List>
                    {node.lineItems.nodes.map((node: any) => (
                      <List.Item key={node.id}>
                        {node.title} - $
                        {node.originalTotalSet?.shopMoney?.amount}
                      </List.Item>
                    ))}
                  </List>
                </Card>
              </Layout.Section>
            ))}
          </>
        )}
      </Layout>
    </Page>
  );
}
