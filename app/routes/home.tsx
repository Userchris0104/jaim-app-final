import { Navigate } from "react-router";

export function meta() {
  return [
    { title: "JAIM - AI Marketing Assistant" },
    { name: "description", content: "AI-powered marketing for Shopify brands" },
  ];
}

export default function Home() {
  return <Navigate to="/dashboard" replace />;
}
