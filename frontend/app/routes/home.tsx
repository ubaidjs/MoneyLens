import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MoneyLens" },
    { name: "description", content: "Welcome to MoneyLens!" },
  ];
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <Welcome />;
}
