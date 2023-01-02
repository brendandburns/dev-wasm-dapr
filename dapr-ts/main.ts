// @ts-ignore
import { Console } from "as-wasi/assembly";
import {
  Method,
  RequestBuilder,
  StatusCode,
} from "@brendandburns/wasi-http-ts";
import { JSON } from "json-as";

@JSON
class Order {
  orderId: i32;
}

@JSON
class daprState {
  key: string;
  value: Order;
}

const daprURL = "http://localhost:3500";

export function post(order: Order): boolean {
  const obj: daprState[] = [
    {
      key: `${order.orderId}`,
      value: order,
    } as daprState
  ];
  const body = JSON.stringify(obj);
  const res = new RequestBuilder(`${daprURL}/v1.0/state/statestore`)
    .header("Content-Type", "application/json")
    .method(Method.POST)
    .body(String.UTF8.encode(body))
    .send();

  return res.status < StatusCode.BAD_REQUEST;
}

export function get(orderId: i32): Order {
  const url = `${daprURL}/v1.0/state/statestore/${orderId}`;
  const res = new RequestBuilder(url)
    .method(Method.GET)
    .send();
  
  if (res.status !== StatusCode.OK) {
    throw new Error(`Unexpected HTTP Error: ${res.status}`);
  }
  const body = String.UTF8.decode(res.bodyReadAll().buffer);
  return JSON.parse<Order>(body);
}

export function del(order: Order): boolean {
  const url = `${daprURL}/v1.0/state/statestore/${order.orderId}`;
  const res = new RequestBuilder(url)
    .header("Content-Type", "application/json")
    .body(String.UTF8.encode(""))
    .method(Method.DELETE)
    .send();
  
  return (res.status < StatusCode.BAD_REQUEST)
}

function main(): void {
  const anOrder: Order = {
    orderId: 528
  };

  if (post(anOrder)) {
    Console.log("Placed order.");
  } else {
    Console.log("Order creation failed.");
  }

  const order = get(anOrder.orderId);
  Console.log(`Found order: ${order.orderId}`);

  if (del(anOrder)) {
    Console.log("Deleted order.");
  } else {
    Console.log("Failed to delete order");
  }
};

main();
