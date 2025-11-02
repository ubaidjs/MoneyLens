import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MoneyLens" },
    { name: "description", content: "Welcome to MoneyLens!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
