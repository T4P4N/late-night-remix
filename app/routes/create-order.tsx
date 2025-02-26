import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { getSession, commitSession } from "../sessions";
import {
  Page,
  Layout,
  Card,
  Checkbox,
  Button,
  Banner,
  InlineStack,
  Text,
} from "@shopify/polaris";
import type { ActionFunction } from "@remix-run/node";
import type { Product, Order } from "~/types";

const products: Product[] = [
  { id: "1", name: "Burger", price: 5.99 },
  { id: "2", name: "Fries", price: 2.99 },
  { id: "3", name: "Coke", price: 1.99 },
];

interface ActionData {
  error?: string;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const selectedProducts = formData.getAll("products") as string[];

  if (selectedProducts.length === 0) {
    return { error: "Please select at least one product" };
  }

  const orderItems = selectedProducts
    .map((id) => products.find((product) => product.id === id))
    .filter((item): item is Product => item !== undefined);

  const order: Order = {
    id: Date.now().toString(),
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.price, 0),
    date: new Date().toISOString(),
  };

  const session = await getSession(request.headers.get("Cookie"));
  const userOrders = (session.get("orders") || []) as Order[];
  session.set("orders", [...userOrders, order]);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function CreateOrder() {
  const actionData = useActionData<ActionData>();

  return (
    <Page title="Create New Order" backAction={{ url: "/" }}>
      <Layout>
        <Layout.Section>
          <Form method="post">
            <Card>
              <Text as="p">Select Products</Text>
              {products.map((product) => (
                <div key={product.id} style={{ marginBottom: "10px" }}>
                  <Checkbox
                    id={`product-${product.id}`}
                    name="products"
                    value={product.id}
                    label={`${product.name} - $${product.price.toFixed(2)}`}
                  />
                </div>
              ))}

              {actionData?.error && (
                <Banner tone="critical">{actionData.error}</Banner>
              )}

              <Card>
                <InlineStack wrap={false} align="end">
                  <Button submit variant="primary">
                    Create Order
                  </Button>
                </InlineStack>
              </Card>
            </Card>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
