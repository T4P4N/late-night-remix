export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  items: Product[];
  total: number;
  date: string;
}
