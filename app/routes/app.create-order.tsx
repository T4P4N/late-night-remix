import {
  redirect,
  useActionData,
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
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
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { useState } from "react";

interface ActionData {
  error?: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query GetProducts {
      products(first: 20, sortKey: TITLE) {
        edges {
          node {
            id
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const responseJson = await response.json();

  const products = responseJson.data.products.edges.map(({ node }: any) => ({
    id: node.id,
    name: node.title,
    price: parseFloat(node.variants.edges[0]?.node.price || 0),
    variantId: node.variants.edges[0]?.node.id,
  }));

  return { products };
};

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedProductIds = JSON.parse(
    formData.get("selectedProductIds") as string,
  ) as string[];
  const variantMapping = JSON.parse(
    formData.get("variantMapping") as string,
  ) as Record<string, string>;

  if (selectedProductIds.length === 0) {
    return { error: "Please select at least one product" };
  }

  const lineItems = selectedProductIds.map((productId) => ({
    variantId: variantMapping[productId],
    quantity: 1,
  }));

  try {
    const draftOrderResponse = await admin.graphql(`
      mutation CreateDraftOrder {
        draftOrderCreate(
          input: {
            lineItems: [
              ${lineItems
                .map(
                  (item) => `{
                variantId: "${item.variantId}",
                quantity: ${item.quantity}
              }`,
                )
                .join(",")}
            ]
          }
        ) {
          draftOrder {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    const draftOrderJson = await draftOrderResponse.json();

    if (draftOrderJson.data.draftOrderCreate.userErrors.length > 0) {
      return {
        error: draftOrderJson.data.draftOrderCreate.userErrors[0].message,
      };
    }

    const draftOrderId = draftOrderJson.data.draftOrderCreate.draftOrder.id;

    const completeOrderResponse = await admin.graphql(`
      mutation CompleteDraftOrder {
        draftOrderComplete(
          id: "${draftOrderId}"
        ) {
          draftOrder {
            order {
              id
              name
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    const completeOrderJson = await completeOrderResponse.json();

    if (completeOrderJson.data.draftOrderComplete.userErrors.length > 0) {
      return {
        error: completeOrderJson.data.draftOrderComplete.userErrors[0].message,
      };
    }

    return redirect("/app");
  } catch (error) {
    console.error("Order creation error:", error);
    return { error: "Failed to create order" };
  }
};

export default function CreateOrder() {
  const { products } = useLoaderData<{ products: any[] }>();
  const actionData = useActionData<ActionData>();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const fetcher = useFetcher();

  const variantMapping: Record<string, string> = {};
  products.forEach((product) => {
    variantMapping[product.id] = product.variantId;
  });

  const handleSubmit = () => {
    if (selectedProducts.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.append("selectedProductIds", JSON.stringify(selectedProducts));
    formData.append("variantMapping", JSON.stringify(variantMapping));

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page title="Create New Order" backAction={{ url: "/" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="p">Select Products</Text>
            {products.map((product) => (
              <div key={product.id} style={{ marginBottom: "10px" }}>
                <Checkbox
                  id={`product-${product.id}`}
                  name={`product-${product.id}`}
                  onChange={() => {
                    setSelectedProducts((prev) => {
                      if (prev.includes(product.id)) {
                        return prev.filter((p) => p !== product.id);
                      }
                      return [...prev, product.id];
                    });
                  }}
                  checked={selectedProducts.includes(product?.id)}
                  label={`${product.name} - $${product.price.toFixed(2)}`}
                />
              </div>
            ))}

            {(actionData?.error || (fetcher.data as any)?.error) && (
              <Banner tone="critical">
                {actionData?.error || (fetcher.data as any)?.error}
              </Banner>
            )}

            <Card>
              <InlineStack wrap={false} align="end">
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={selectedProducts.length === 0}
                  loading={fetcher.state === "submitting"}
                >
                  Create Order
                </Button>
              </InlineStack>
            </Card>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
