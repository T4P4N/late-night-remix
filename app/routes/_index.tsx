import { useLoaderData } from "@remix-run/react";
import { getSession } from "../sessions";
import {
  Page,
  Layout,
  Card,
  EmptyState,
  Button,
  Text,
  List,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import type { LoaderFunction } from "@remix-run/node";
import type { Order } from "~/types";

interface LoaderData {
  orders: Order[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const orders = (session.get("orders") || []) as Order[];

  return { orders };
};

export default function Index() {
  const { orders } = useLoaderData<LoaderData>();
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack align="center">
              <InlineStack align="space-between">
                <Text as="h1" variant="headingMd">
                  Remix App
                </Text>
                {orders.length > 0 && (
                  <Button variant="primary" url="/create-order">
                    Create New Order
                  </Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Layout>
        {orders.length === 0 ? (
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
            {orders.map((order) => (
              <Layout.Section key={order.id}>
                <Card>
                  <Card>
                    <Text as="h2" variant="bodyMd">
                      Order #{order.id.slice(-4)}
                    </Text>
                    <Text as="p">
                      Date: {new Date(order.date).toLocaleString()}
                    </Text>
                  </Card>
                  <Card>
                    <List>
                      {order.items.map((item) => (
                        <List.Item key={item.id}>
                          {item.name} - ${item.price.toFixed(2)}
                        </List.Item>
                      ))}
                    </List>
                  </Card>
                  <Card>
                    <Text variant="headingMd" as="h3">
                      Total: ${order.total.toFixed(2)}
                    </Text>
                  </Card>
                </Card>
              </Layout.Section>
            ))}
          </>
        )}
      </Layout>
    </Page>
  );
}
