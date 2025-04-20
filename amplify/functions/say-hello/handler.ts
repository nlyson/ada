import type { Schema } from "../../data/resource"

export const handler = async (event: any): Promise<string> => {
  // arguments typed from `.arguments()`
  console.log("Event: ", event)
  const { name } = event.arguments
  // return typed from `.returns()`
  return `Hello, ${name || "Stranger"}!`
}